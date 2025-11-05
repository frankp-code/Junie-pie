import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, orderBy, query, Timestamp } from 'firebase/firestore';
import { ActivityForm } from '@/components/ActivityForm';
import { ActivityList } from '@/components/ActivityList';
import { Stats } from '@/components/Stats';
import { Calendar } from '@/components/Calendar';
import { ActivityType, PuppyActivity } from '@/lib/types';
import { Plus, List, LayoutDashboard, Calendar as CalendarIcon } from 'lucide-react';

type NavView = 'timeline' | 'add' | 'stats' | 'calendar';

const getCookie = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

const setCookie = (name: string, value: string, days: number) => {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
};

function App() {
  const [activities, setActivities] = useState<PuppyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<NavView>('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineDate, setTimelineDate] = useState<Date | null>(null);
  const [dateForNewActivity, setDateForNewActivity] = useState<Date | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(getCookie('junebug_authenticated') === 'true');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const activitiesCollection = collection(db, 'puppy_activities');
      const q = query(activitiesCollection, orderBy('activity_time', 'desc'));
      const querySnapshot = await getDocs(q);
      const activitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        activity_time: doc.data().activity_time.toDate().toISOString(),
      })) as PuppyActivity[];
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddActivity = async (activityType: ActivityType, activityTime: string, notes: string) => {
    const activitiesCollection = collection(db, 'puppy_activities');
    const lastActivity = activities.length > 0 ? activities[0] : null;

    const newActivity = {
      activity_type: activityType,
      activity_time: Timestamp.fromDate(new Date(activityTime)),
      notes,
      created_at: Timestamp.now(),
    };
    try {
      await addDoc(activitiesCollection, newActivity);

      if (lastActivity && lastActivity.activity_type === 'sleep' && activityType !== 'sleep') {
        const wakeActivity = {
          activity_type: 'wake',
          activity_time: Timestamp.fromDate(new Date(activityTime)),
          notes: 'Auto-logged',
          created_at: Timestamp.now(),
        };
        await addDoc(activitiesCollection, wakeActivity);
      }

      await fetchActivities();
      setView('timeline');
    } catch (error) {
      console.error('Error adding activity:', error);
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

  const promptForPasscode = (callback: () => void) => {
    if (isAuthenticated) {
      callback();
      return;
    }
    const passcode = window.prompt("Please enter the passcode to add an activity:");
    if (passcode === "junebugwibble") {
      setCookie('junebug_authenticated', 'true', 365);
      setIsAuthenticated(true);
      callback();
    } else if (passcode !== null) {
      alert("Incorrect passcode.");
    }
  };

  const handleAddActivityForDate = (date: Date) => {
    promptForPasscode(() => {
      setDateForNewActivity(date);
      setView('add');
    });
  };

  const filteredActivities = timelineDate
  ? activities.filter(a => new Date(a.activity_time).toDateString() === timelineDate.toDateString())
  : activities;

  const renderView = () => {
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
      default:
        return <ActivityList activities={activities} onDelete={handleDeleteActivity} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
        <button onClick={() => promptForPasscode(() => { setDateForNewActivity(null); setView('add'); })} className="fixed bottom-24 right-8 bg-pink-600 text-white rounded-full p-4 shadow-lg z-20">
            <Plus size={28} />
        </button>
      }

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t z-10 pb-4 pt-2">
        <div className="max-w-md mx-auto flex justify-around">
          <NavButton label="Timeline" icon={<List size={24} />} activeView={view} view="timeline" setView={setView} />
          <NavButton label="Stats" icon={<LayoutDashboard size={24} />} activeView={view} view="stats" setView={setView} />
          <NavButton label="Calendar" icon={<CalendarIcon size={24} />} activeView={view} view="calendar" setView={setView} />
        </div>
      </nav>
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

const NavButton = ({ label, icon, activeView, view, setView }: NavButtonProps) => (
  <button onClick={() => setView(view)} className={`flex flex-col items-center justify-center h-16 w-20 ${activeView === view ? 'text-pink-600' : 'text-gray-500'}`}>
    {icon}
    <span className="text-xs">{label}</span>
  </button>
);

export default App;
