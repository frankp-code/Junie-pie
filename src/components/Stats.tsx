import { useMemo, useState, useEffect } from 'react';
import { PuppyActivity, WeightEntry } from '../lib/types';
import { ActivityFrequencyChart, ActivityTrendChart, ActivityDurationChart, WeightChart } from './charts';
import { processActivityFrequency, processActivityTrend, processActivityDuration } from '../lib/statsUtils';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface StatsProps {
  activities: PuppyActivity[];
}

export function Stats({ activities }: StatsProps) {
  const frequencyData = useMemo(() => processActivityFrequency(activities), [activities]);
  const trendData = useMemo(() => processActivityTrend(activities), [activities]);
  const durationData = useMemo(() => processActivityDuration(activities), [activities]);
  
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
      labels: weights.map(w => new Date(w.date).toLocaleDateString()),
      datasets: [
        {
          label: 'Weight (kg)',
          data: weights.map(w => w.weight_kg),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
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
    <div className="space-y-8">
      <div className="flex justify-end">
        <button onClick={handleExport} className="bg-pink-100 text-pink-700 px-4 py-2 rounded-lg font-semibold hover:bg-pink-200 transition-colors">
          Export to CSV
        </button>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Activity Frequency</h2>
        <ActivityFrequencyChart data={frequencyData} />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Activity Trend</h2>
        <ActivityTrendChart data={trendData} />
      </div>
      {durationData.labels.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Activity Durations</h2>
          <ActivityDurationChart data={durationData} />
        </div>
      )}
      {weights.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Weight Growth</h2>
          <WeightChart data={weightDataChart} />
        </div>
      )}
    </div>
  );
}
