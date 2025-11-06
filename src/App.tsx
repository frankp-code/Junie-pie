import { useEffect, useState, memo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, Timestamp, writeBatch } from 'firebase/firestore';
import { ActivityForm } from '@/components/ActivityForm';
import { ActivityList } from '@/components/ActivityList';
import { Stats } from '@/components/Stats';
import { Calendar } from '@/components/Calendar';
import { SplashScreen } from '@/components/SplashScreen';
import { ActivityType, PuppyActivity } from '@/lib/types';
import { Plus, List, LayoutDashboard, Calendar as CalendarIcon, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationDialog from '@/components/ConfirmationDialog.tsx';
import Settings from '@/components/Settings';

type NavView = 'timeline' | 'add' | 'stats' | 'calendar' | 'settings';

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

  const handleAddActivity = async (activityTypes: ActivityType[], activityTime: string | string[], notes: string, endTime?: string) => {
    if (activityTypes.includes('med') && Array.isArray(activityTime)) {
        const batch = writeBatch(db);
        activityTime.forEach(time => {
            const newActivityRef = doc(collection(db, 'puppy_activities'));
            const newActivity = {
                activity_type: 'med',
                activity_time: Timestamp.fromDate(new Date(time)),
                notes,
                created_at: Timestamp.now(),
            };
            batch.set(newActivityRef, newActivity);
        });
        await batch.commit();
        await fetchActivities();
        setView('timeline');
        return;
    }

    const ongoingWalk = activities.find(
      (a) => a.activity_type === 'walk' && !a.end_time
    );

    const newActivityTime = new Date(activityTime as string);

    const processActivityAddition = async (nestUnderWalk: boolean = false) => {
      const batch = writeBatch(db);
      let walkDocId: string | undefined = undefined;

      if (ongoingWalk && !nestUnderWalk) {
        const walkRef = doc(db, 'puppy_activities', ongoingWalk.id);
        batch.update(walkRef, { end_time: Timestamp.fromDate(newActivityTime) });
      }
      
      const sortedActivityTypes = [...activityTypes].sort((a, b) => {
        if (a === 'walk') return -1;
        if (b === 'walk') return 1;
        return 0;
      });

      for (const activityType of sortedActivityTypes) {
        const newActivityRef = doc(collection(db, 'puppy_activities'));
        const newActivity: any = {
          activity_type: activityType,
          activity_time: Timestamp.fromDate(newActivityTime),
          notes,
          created_at: Timestamp.now(),
        };

        if ((activityType === 'walk' || activityType === 'sleep') && endTime) {
          newActivity.end_time = Timestamp.fromDate(new Date(endTime));
        }

        if (activityType === 'walk') {
            walkDocId = newActivityRef.id;
        }

        if (nestUnderWalk && ongoingWalk) {
            newActivity.parent_activity_id = ongoingWalk.id;
        } else if (activityType !== 'walk' && walkDocId) {
            newActivity.parent_activity_id = walkDocId;
        }

        batch.set(newActivityRef, newActivity);
      }

      await batch.commit();
      await fetchActivities();
      setView('timeline');
    };

    if (ongoingWalk && activityTypes.every(at => at !== 'sleep')) {
      setConfirmation({
        message: 'An activity is already in progress. Do you want to end the current walk?',
        onConfirm: () => {
          processActivityAddition(false);
          setConfirmation(null);
        },
        onCancel: () => {
          processActivityAddition(true);
          setConfirmation(null);
        },
      });
    } else if (ongoingWalk && activityTypes.includes('sleep')) {
        await processActivityAddition(false);
    }
    else {
      await processActivityAddition();
    }
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
                return <ActivityList 
                          activities={filteredActivities} 
                          onDelete={handleDeleteActivity} 
                          timelineDate={timelineDate}
                          onClearTimelineDate={() => setTimelineDate(null)}
                        />;
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
              case 'settings':
                return <Settings />;
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
        <div className="max-w-md mx-auto px-4 py-4 flex justify-center">
          <div className="flex items-center gap-2">
            <img src="/june.png" alt="June" className="w-10 h-10 rounded-full" />
            <h1 className="text-xl font-bold text-gray-800">The June-bug Diaries 💕</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {renderView()}
      </main>

      {view === 'timeline' && 
        <motion.button 
          initial={{ scale: 0, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0, y: 100 }}
          onClick={() => { setDateForNewActivity(null); setView('add'); }} 
          className="fixed bottom-24 right-8 bg-pink-600 text-white rounded-full p-4 shadow-lg z-20"
        >
            <Plus size={28} />
        </motion.button>
      }

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t z-10 pb-4 pt-2">
        <div className="max-w-md mx-auto flex justify-around relative">
          <NavButton label="Calendar" icon={<CalendarIcon size={24} />} activeView={view} view="calendar" setView={setView} />
          <NavButton label="Timeline" icon={<List size={24} />} activeView={view} view="timeline" setView={setView} />
          <NavButton label="Stats" icon={<LayoutDashboard size={24} />} activeView={view} view="stats" setView={setView} />
          <NavButton label="Settings" icon={<SettingsIcon size={24} />} activeView={view} view="settings" setView={setView} />
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
