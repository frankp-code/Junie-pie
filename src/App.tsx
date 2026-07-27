import { useEffect, useState, memo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, Timestamp, writeBatch } from 'firebase/firestore';
import { ActivityForm } from '@/components/ActivityForm';
import { ActivityList } from '@/components/ActivityList';
import { Stats } from '@/components/Stats';
import { Calendar } from '@/components/Calendar';
import { SplashScreen } from '@/components/SplashScreen';
import { ActivityType, PuppyActivity } from '@/lib/types';
import { Plus, List, LayoutDashboard, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationDialog from '@/components/ConfirmationDialog.tsx';
import Settings from '@/components/Settings';
import PuppyProfile from '@/components/Profile';

type NavView = 'timeline' | 'add' | 'stats' | 'calendar' | 'profile';

const getCookie = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

function App() {
  const [activities, setActivities] = useState<PuppyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<NavView>('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineDate, setTimelineDate] = useState<Date | null>(null);
  const [dateForNewActivity, setDateForNewActivity] = useState<Date | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(getCookie('junebug_authenticated') === 'true');
  const [confirmation, setConfirmation] = useState<{
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActivities();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      
      // Only remind during daytime (8 AM to 8 PM)
      if (now.getHours() < 8 || now.getHours() > 20) return;

      const lastMeal = activities.find(a => a.activity_type === 'meal');
      const lastMed = activities.find(a => a.activity_type === 'med');

      const lastNotifiedMeal = localStorage.getItem('junie_last_notified_meal');
      const lastNotifiedMed = localStorage.getItem('junie_last_notified_med');
      
      const todayString = now.toDateString();

      if (lastMeal) {
        const hoursSinceMeal = (now.getTime() - new Date(lastMeal.activity_time).getTime()) / (1000 * 60 * 60);
        if (hoursSinceMeal > 6 && hoursSinceMeal < 24 && lastNotifiedMeal !== todayString) {
          new Notification('Meal Reminder 🥣', { body: "It's been over 6 hours since Junie's last meal!" });
          localStorage.setItem('junie_last_notified_meal', todayString);
        }
      }

      if (lastMed) {
        const hoursSinceMed = (now.getTime() - new Date(lastMed.activity_time).getTime()) / (1000 * 60 * 60);
        if (hoursSinceMed > 12 && hoursSinceMed < 24 && lastNotifiedMed !== todayString) {
          new Notification('Medication Reminder 💊', { body: "It's been over 12 hours since Junie's last medication!" });
          localStorage.setItem('junie_last_notified_med', todayString);
        }
      }
    };

    const interval = setInterval(checkReminders, 15 * 60 * 1000); // Check every 15 minutes
    const timeout = setTimeout(checkReminders, 5000); // Check 5s after load

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [activities]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const activitiesCollection = collection(db, 'puppy_activities');
      const q = query(activitiesCollection, orderBy('activity_time', 'desc'));
      const querySnapshot = await getDocs(q);
      const activitiesData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          activity_time: data.activity_time.toDate().toISOString(),
          end_time: data.end_time ? data.end_time.toDate().toISOString() : undefined,
          parent_activity_id: data.parent_activity_id || null,
        } as PuppyActivity
      });
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (activityTypes: ActivityType[], activityTime: string | string[], notes: string, endTime?: string, photoUrl?: string) => {
    if (activityTypes.includes('med') && Array.isArray(activityTime)) {
        const batch = writeBatch(db);
        const currentUserName = localStorage.getItem('junebug_user_name') || 'Unknown';
        
        activityTime.forEach(time => {
            const newActivityRef = doc(collection(db, 'puppy_activities'));
            const newActivity: any = {
                activity_type: 'med',
                activity_time: Timestamp.fromDate(new Date(time)),
                notes,
                created_at: Timestamp.now(),
                logged_by: currentUserName,
            };
            if (photoUrl) newActivity.photo_url = photoUrl;
            batch.set(newActivityRef, newActivity);
        });

        await batch.commit();
        await fetchActivities();
        setView('timeline');
        return;
    }

    const newActivityTime = new Date(activityTime as string);
    const batch = writeBatch(db);

    const ongoingWalk = activities.find(a => a.activity_type === 'walk' && !a.end_time);
    const ongoingSleep = activities.find(a => a.activity_type === 'sleep' && !a.end_time);

    // End ongoing sleep if new activity is walk, wee, poo, play or training
    if (ongoingSleep && activityTypes.some(t => ['walk', 'wee', 'poo', 'play', 'training'].includes(t))) {
      const sleepRef = doc(db, 'puppy_activities', ongoingSleep.id);
      batch.update(sleepRef, { end_time: Timestamp.fromDate(newActivityTime) });
    }

    // End ongoing walk if new activity is sleep or another walk
    if (ongoingWalk && activityTypes.some(t => ['sleep', 'walk'].includes(t))) {
      const walkRef = doc(db, 'puppy_activities', ongoingWalk.id);
      batch.update(walkRef, { end_time: Timestamp.fromDate(newActivityTime) });
    }

    // End ongoing sleep if another sleep is added
    if (ongoingSleep && activityTypes.includes('sleep')) {
      const sleepRef = doc(db, 'puppy_activities', ongoingSleep.id);
      batch.update(sleepRef, { end_time: Timestamp.fromDate(newActivityTime) });
    }

    const sortedActivityTypes = [...activityTypes].sort((a, b) => {
      if (a === 'walk') return -1;
      if (b === 'walk') return 1;
      return 0;
    });

    let walkDocId: string | undefined = undefined;
    const currentUserName = localStorage.getItem('junebug_user_name') || 'Unknown';

    for (const activityType of sortedActivityTypes) {
      const newActivityRef = doc(collection(db, 'puppy_activities'));
      const newActivity: any = {
        activity_type: activityType,
        activity_time: Timestamp.fromDate(newActivityTime),
        notes,
        created_at: Timestamp.now(),
        logged_by: currentUserName,
      };

      if (photoUrl) {
          newActivity.photo_url = photoUrl;
      }

      if ((activityType === 'walk' || activityType === 'sleep') && endTime) {
        newActivity.end_time = Timestamp.fromDate(new Date(endTime));
      }

      if (activityType === 'walk') {
          walkDocId = newActivityRef.id;
      }

      if (activityType !== 'walk' && walkDocId) {
          newActivity.parent_activity_id = walkDocId;
      } else if (ongoingWalk && !activityTypes.includes('sleep') && !activityTypes.includes('walk') && (activityType === 'wee' || activityType === 'poo' || activityType === 'play' || activityType === 'training')) {
          newActivity.parent_activity_id = ongoingWalk.id;
      }

      batch.set(newActivityRef, newActivity);
    }

    await batch.commit();
    await fetchActivities();
    setView('timeline');
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      const activityDoc = doc(db, 'puppy_activities', id);
      await deleteDoc(activityDoc);
      await fetchActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };
  
  const handleViewDay = (date: Date) => {
    setTimelineDate(date);
    setView('timeline');
  };

  const handleAddActivityForDate = (date: Date) => {
    setDateForNewActivity(date);
    setView('add');
  };

  const handleAuthentication = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <SplashScreen onAuthenticated={handleAuthentication} />;
  }

  const filteredActivities = timelineDate
  ? activities.filter(a => new Date(a.activity_time).toDateString() === timelineDate.toDateString())
  : activities;

  const renderView = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {(() => {
            switch (view) {
              case 'timeline':
                return (
                  <div className="space-y-6">
                    {!timelineDate && (
                      <div className="bg-white rounded-xl shadow-sm p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Log</h3>
                        <div className="grid grid-cols-4 gap-2">
                          <button onClick={() => handleAddActivity(['wee'], new Date().toISOString(), '')} className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-gray-100 hover:border-pink-300 bg-gray-50 transition-colors">
                            <span className="text-2xl mb-1">💧</span>
                            <span className="text-xs font-medium text-gray-600">Wee</span>
                          </button>
                          <button onClick={() => handleAddActivity(['poo'], new Date().toISOString(), '')} className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-gray-100 hover:border-pink-300 bg-gray-50 transition-colors">
                            <span className="text-2xl mb-1">💩</span>
                            <span className="text-xs font-medium text-gray-600">Poo</span>
                          </button>
                          <button onClick={() => handleAddActivity(['walk'], new Date().toISOString(), '')} className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-gray-100 hover:border-pink-300 bg-gray-50 transition-colors">
                            <span className="text-2xl mb-1">🦮</span>
                            <span className="text-xs font-medium text-gray-600">Walk</span>
                          </button>
                          <button onClick={() => handleAddActivity(['sleep'], new Date().toISOString(), '')} className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-gray-100 hover:border-pink-300 bg-gray-50 transition-colors">
                            <span className="text-2xl mb-1">😴</span>
                            <span className="text-xs font-medium text-gray-600">Sleep</span>
                          </button>
                        </div>
                      </div>
                    )}
                    <ActivityList 
                      activities={filteredActivities} 
                      onDelete={handleDeleteActivity} 
                      timelineDate={timelineDate}
                      onClearTimelineDate={() => setTimelineDate(null)}
                    />
                  </div>
                );
              case 'add':
                return <ActivityForm 
                          onSubmit={handleAddActivity} 
                          onBack={() => {
                            setView(dateForNewActivity ? 'calendar' : 'timeline');
                            setDateForNewActivity(null);
                          }}
                          date={dateForNewActivity}
                        />;
              case 'stats':
                return <Stats activities={activities} />;
              case 'calendar':
                return (
                  <div className="pb-24">
                    <Calendar
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      activityDates={new Set(activities.map(a => new Date(a.activity_time).toDateString()))}
                      onViewDay={handleViewDay}
                      onAddActivityForDate={handleAddActivityForDate}
                    />
                  </div>
                );
              case 'profile':
                return <PuppyProfile />;
              default:
                return <ActivityList 
                          activities={activities} 
                          onDelete={handleDeleteActivity} 
                          timelineDate={null}
                          onClearTimelineDate={() => setTimelineDate(null)}
                        />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  if (loading && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-.center">
        <div className="text-center">
          <p className="text-gray-600">Loading June's diary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setView('profile')}>
            <img src="/june.png" alt="June" className="w-10 h-10 rounded-full border-2 border-pink-100" />
            <h1 className="text-xl font-bold text-gray-800">The June-bug Diaries 💕</h1>
          </div>
          <button onClick={() => setView('calendar')} className={`p-2 rounded-full transition-colors ${view === 'calendar' ? 'bg-pink-100 text-pink-600' : 'text-gray-500 hover:bg-gray-100 hover:text-pink-500'}`}>
            <CalendarIcon size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 pb-24">
        {renderView()}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t z-10 pb-4 pt-2">
        <div className="max-w-md mx-auto flex justify-around items-center relative">
          <NavButton label="Timeline" icon={<List size={24} />} activeView={view} view="timeline" setView={setView} />
          
          <button 
            onClick={() => { setDateForNewActivity(null); setView('add'); }} 
            className={`flex flex-col items-center justify-center w-14 h-14 rounded-full shadow-lg transform -translate-y-6 transition-all hover:scale-105 active:scale-95 ${view === 'add' ? 'bg-pink-700 text-white' : 'bg-pink-500 text-white hover:bg-pink-600'}`}
          >
            <Plus size={32} />
          </button>

          <NavButton label="Stats" icon={<LayoutDashboard size={24} />} activeView={view} view="stats" setView={setView} />
        </div>
      </nav>
      {confirmation && (
        <ConfirmationDialog
            message={confirmation.message}
            onConfirm={confirmation.onConfirm}
            onCancel={confirmation.onCancel}
        />
      )}
    </div>
  );
}

type NavButtonProps = {
  label: string;
  icon: React.ReactNode;
  activeView: NavView;
  view: NavView;
  setView: (view: NavView) => void;
};

const NavButton = memo(({ label, icon, activeView, view, setView }: NavButtonProps) => {
  const isActive = activeView === view;
  return (
    <button 
      onClick={() => setView(view)} 
      className={`flex flex-col items-center justify-center h-16 w-20 relative transition-colors duration-300 ${isActive ? 'text-pink-600' : 'text-gray-500 hover:text-pink-500'}`}>
      {isActive && (
        <motion.div
          layoutId="active-nav-highlight"
          className="absolute inset-0 bg-pink-100 rounded-lg"
          style={{ borderRadius: 16 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
      <div className="relative z-10">
        {icon}
      </div>
      <span className="text-xs relative z-10">{label}</span>
    </button>
  );
});

export default App;
