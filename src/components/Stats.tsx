import { useMemo } from 'react';
import { PuppyActivity } from '../lib/types';
import { ActivityFrequencyChart, ActivityTrendChart } from './charts';

interface StatsProps {
  activities: PuppyActivity[];
}

const processActivityFrequency = (activities: PuppyActivity[]) => {
  const activityCounts = activities.reduce((acc, activity) => {
    acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const labels = Object.keys(activityCounts);
  const data = Object.values(activityCounts);

  return {
    labels,
    datasets: [
      {
        label: 'Activity Count',
        data,
        backgroundColor: 'rgba(244, 114, 182, 0.6)',
      },
    ],
  };
};

const processActivityTrend = (activities: PuppyActivity[]) => {
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const activitiesByDay = last7Days.map(day => {
    return activities.filter(a => a.activity_time.startsWith(day)).length;
  });

  return {
    labels: last7Days,
    datasets: [
      {
        label: 'Activities',
        data: activitiesByDay,
        borderColor: 'rgb(244, 114, 182)',
        backgroundColor: 'rgba(244, 114, 182, 0.5)',
      },
    ],
  };
};

export function Stats({ activities }: StatsProps) {
  const frequencyData = useMemo(() => processActivityFrequency(activities), [activities]);
  const trendData = useMemo(() => processActivityTrend(activities), [activities]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold mb-4">Activity Frequency</h2>
        <ActivityFrequencyChart data={frequencyData} />
      </div>
      <div>
        <h2 className="text-xl font-bold mb-4">Activity Trend</h2>
        <ActivityTrendChart data={trendData} />
      </div>
    </div>
  );
}
