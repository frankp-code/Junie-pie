import { useEffect, useState } from 'react';
import { Dog } from 'lucide-react';
import { supabase, ActivityType, PuppyActivity } from './lib/supabase';
import { ActivityForm } from './components/ActivityForm';
import { ActivityList } from './components/ActivityList';
import { DailySummary } from './components/DailySummary';
import { WeeklySummary } from './components/WeeklySummary';
import { FilterBar } from './components/FilterBar';
import { Calendar } from './components/Calendar';

function App() {
  const [activities, setActivities] = useState<PuppyActivity[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<PuppyActivity[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<ActivityType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timelineOrder, setTimelineOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    if (user) {
      fetchActivities();
    }
  }, [user]);

  useEffect(() => {
    let filtered = activities;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter((activity) => activity.activity_type === selectedFilter);
    }

    setFilteredActivities(filtered);
  }, [activities, selectedFilter]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    if (!session?.user) {
      await signInAnonymously();
    }
  };

  const signInAnonymously = async () => {
    const email = `user_${Date.now()}_${Math.random().toString(36).substring(7)}@puppydiary.app`;
    const password = Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
    } else {
      setUser(data.user);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('puppy_activities')
      .select('*')
      .order('activity_time', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
    } else {
      setActivities(data || []);
    }
    setLoading(false);
  };

  const handleAddActivity = async (
    activityType: ActivityType,
    activityTime: string,
    notes: string
  ) => {
    if (!user) return;

    const activitiesToInsert: any[] = [{
      user_id: user.id,
      activity_type: activityType,
      activity_time: activityTime,
      notes,
    }];

    if (activityType !== 'sleep' && activityType !== 'wake') {
      const sortedActivities = [...activities].sort(
        (a, b) => new Date(b.activity_time).getTime() - new Date(a.activity_time).getTime()
      );

      const lastSleepIndex = sortedActivities.findIndex(
        (a) => new Date(a.activity_time) < new Date(activityTime) && a.activity_type === 'sleep'
      );

      if (lastSleepIndex !== -1) {
        const hasWakeAfterSleep = sortedActivities.slice(0, lastSleepIndex).some(
          (a) => a.activity_type === 'wake'
        );

        if (!hasWakeAfterSleep) {
          activitiesToInsert.unshift({
            user_id: user.id,
            activity_type: 'wake',
            activity_time: activityTime,
            notes: 'Auto-logged wake',
          });
        }
      }
    }

    const { error } = await supabase.from('puppy_activities').insert(activitiesToInsert);

    if (error) {
      console.error('Error adding activity:', error);
    } else {
      await fetchActivities();
    }
  };

  const handleDeleteActivity = async (id: string) => {
    const { error } = await supabase
      .from('puppy_activities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting activity:', error);
    } else {
      await fetchActivities();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Dog className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading June's diary...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Dog className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-800">The June-bug Diaries</h1>
          </div>
          <p className="text-gray-600">Things that June does</p>
        </header>

        <div className="space-y-6">
          <div className="space-y-6">
            <FilterBar
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
            <ActivityList
              activities={filteredActivities}
              allActivities={activities}
              selectedDate={selectedDate}
              timelineOrder={timelineOrder}
              onTimelineOrderChange={setTimelineOrder}
              onDelete={handleDeleteActivity}
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <ActivityForm onSubmit={handleAddActivity} />
              <Calendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                activityDates={new Set(
                  activities.map((a) => new Date(a.activity_time).toDateString())
                )}
              />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <DailySummary activities={activities} />
              <WeeklySummary activities={activities} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
