import { useMemo, useState, useEffect } from 'react';
import { PuppyActivity, WeightEntry } from '../lib/types';
import { ActivityDistributionChart, SleepWalkChart, PottyTrendChart, WeightChart } from './charts';
import { getTodayStats, processActivityDistribution, processDailySleepWalk, processPottyTrend } from '../lib/statsUtils';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface StatsProps {
  activities: PuppyActivity[];
}

export function Stats({ activities }: StatsProps) {
  const todayStats = useMemo(() => getTodayStats(activities), [activities]);
  const distributionData = useMemo(() => processActivityDistribution(activities), [activities]);
  const sleepWalkData = useMemo(() => processDailySleepWalk(activities), [activities]);
  const pottyData = useMemo(() => processPottyTrend(activities), [activities]);
  
  const [weights, setWeights] = useState<WeightEntry[]>([]);

  useEffect(() => {
    const fetchWeights = async () => {
      try {
        const q = query(collection(db, 'puppy_weight'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const weightData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightEntry));
        setWeights(weightData);
      } catch (error) {
        console.error("Error fetching weights:", error);
      }
    };
    fetchWeights();
  }, []);

  const weightDataChart = useMemo(() => {
    return {
      labels: weights.map(w => new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Weight (kg)',
          data: weights.map(w => w.weight_kg),
          borderColor: 'rgb(244, 114, 182)', // pink
          backgroundColor: 'rgba(244, 114, 182, 0.5)',
          fill: true
        },
      ],
    };
  }, [weights]);

  const handleExport = () => {
    const csvRows = [
      ['Date', 'Time', 'Activity Type', 'Duration (mins)', 'Notes', 'Logged By']
    ];

    activities.forEach(activity => {
      const dateObj = new Date(activity.activity_time);
      const date = dateObj.toLocaleDateString();
      const time = dateObj.toLocaleTimeString();
      const type = activity.activity_type;
      
      let duration = '';
      if (activity.end_time) {
        const durationMs = new Date(activity.end_time).getTime() - dateObj.getTime();
        duration = Math.round(durationMs / 60000).toString();
      }
      
      const notes = activity.notes ? `"${activity.notes.replace(/"/g, '""')}"` : '';
      const loggedBy = activity.logged_by || '';
      
      csvRows.push([date, time, type, duration, notes, loggedBy]);
    });

    const csvString = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `junie_activities_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button onClick={handleExport} className="bg-pink-100 text-pink-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-pink-200 transition-colors">
          Export CSV
        </button>
      </div>

      {/* Today's Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-4 text-center border-b-4 border-green-400">
          <div className="text-2xl mb-1">🦮</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Walk Today</div>
          <div className="font-bold text-gray-800">{todayStats.walkTime}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center border-b-4 border-purple-400">
          <div className="text-2xl mb-1">😴</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Sleep Today</div>
          <div className="font-bold text-gray-800">{todayStats.sleepTime}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 text-center border-b-4 border-blue-400">
          <div className="text-2xl mb-1">🚽</div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Potty Today</div>
          <div className="font-bold text-gray-800 text-sm">{todayStats.pottyCount}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-700 mb-4 text-center">Activity Breakdown (Last 7 Days)</h2>
          <div className="relative w-full max-w-[250px] mx-auto">
            <ActivityDistributionChart data={distributionData} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Sleep & Walk Tracker (7 Days)</h2>
          <SleepWalkChart data={sleepWalkData} />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Potty Frequency (7 Days)</h2>
          <PottyTrendChart data={pottyData} />
        </div>

        {weights.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Weight Growth</h2>
            <WeightChart data={weightDataChart} />
          </div>
        )}
      </div>
    </div>
  );
}
