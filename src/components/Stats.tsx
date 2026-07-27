import { useMemo } from 'react';
import { PuppyActivity } from '../lib/types';
import { ActivityFrequencyChart, ActivityTrendChart, ActivityDurationChart } from './charts';

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

const processActivityDuration = (activities: PuppyActivity[]) => {
  const durationStats = activities.reduce((acc, activity) => {
    if (activity.end_time) {
      const durationMs = new Date(activity.end_time).getTime() - new Date(activity.activity_time).getTime();
      const minutes = durationMs / (1000 * 60);
      if (minutes > 0 && minutes < 1440) {
        if (!acc[activity.activity_type]) {
          acc[activity.activity_type] = { total: 0, count: 0 };
        }
        acc[activity.activity_type].total += minutes;
        acc[activity.activity_type].count += 1;
      }
    }
    return acc;
  }, {} as { [key: string]: { total: number; count: number } });

  const labels = Object.keys(durationStats);
  const data = labels.map(label => Math.round(durationStats[label].total / durationStats[label].count));

  return {
    labels,
    datasets: [
      {
        label: 'Avg Duration (mins)',
        data,
        backgroundColor: 'rgba(167, 139, 250, 0.6)',
      },
    ],
  };
};

export function Stats({ activities }: StatsProps) {
  const frequencyData = useMemo(() => processActivityFrequency(activities), [activities]);
  const trendData = useMemo(() => processActivityTrend(activities), [activities]);
  const durationData = useMemo(() => processActivityDuration(activities), [activities]);

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
      {durationData.labels.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Activity Durations</h2>
          <ActivityDurationChart data={durationData} />
        </div>
      )}
    </div>
  );
}
