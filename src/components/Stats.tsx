import { useState, useMemo } from 'react';
import { PuppyActivity } from '../lib/types';
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, differenceInMinutes, format } from 'date-fns';
import { ActivityFrequencyChart, ActivityTrendChart } from './charts';

interface StatsProps {
  activities: PuppyActivity[];
}

type TimeRange = 'day' | 'week' | 'month';

const StatCard = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);

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

const processActivityTrend = (activities: PuppyActivity[], timeRange: TimeRange) => {
  let labels: string[];
  let startDate: Date;
  const now = new Date();

  if (timeRange === 'day') {
    labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    startDate = startOfDay(now);
  } else if (timeRange === 'week') {
    labels = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i);
      return format(d, 'EEE');
    });
    startDate = startOfWeek(now);
  } else { // month
    const daysInMonth = endOfMonth(now).getDate();
    labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
    startDate = startOfMonth(now);
  }

  const activitiesByTimeUnit = labels.map((label, i) => {
    return activities.filter(a => {
        const activityDate = new Date(a.activity_time);
        if (timeRange === 'day') {
            return activityDate.getHours() === i;
        }
        if (timeRange === 'week') {
            const dayOfWeek = format(activityDate, 'EEE');
            return dayOfWeek === label;
        }
        if (timeRange === 'month') {
            return activityDate.getDate() === (i + 1)
        }
    }).length;
  });

  return {
    labels,
    datasets: [
      {
        label: 'Activities',
        data: activitiesByTimeUnit,
        borderColor: 'rgb(244, 114, 182)',
        backgroundColor: 'rgba(244, 114, 182, 0.5)',
      },
    ],
  };
};

export function Stats({ activities }: StatsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('day');

  const filteredActivities = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    switch (timeRange) {
      case 'day':
        start = startOfDay(now);
        end = endOfDay(now);
        break;
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
    }

    return activities.filter(a => {
      const activityDate = new Date(a.activity_time);
      return activityDate >= start && activityDate <= end;
    });
  }, [activities, timeRange]);

  const { totalNaps, totalWalks } = useMemo(() => {
    let napMinutes = 0;
    let walkMinutes = 0;

    filteredActivities.forEach(a => {
      if (a.activity_type === 'sleep' && a.end_time) {
        const start = new Date(a.activity_time);
        const end = new Date(a.end_time);
        // check it's a daytime nap
        if (start.getHours() >= 7 && start.getHours() <= 21) {
          napMinutes += differenceInMinutes(end, start);
        }
      }
      if (a.activity_type === 'walk' && a.end_time) {
        walkMinutes += differenceInMinutes(new Date(a.end_time), new Date(a.activity_time));
      }
    });

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours > 0 ? `${hours}h ` : ''}${mins}m`;
    }

    return {
      totalNaps: formatDuration(napMinutes),
      totalWalks: formatDuration(walkMinutes),
    };
  }, [filteredActivities]);
  
  const frequencyData = useMemo(() => processActivityFrequency(filteredActivities), [filteredActivities]);
  const trendData = useMemo(() => processActivityTrend(filteredActivities, timeRange), [filteredActivities, timeRange]);

  return (
    <div>
      <div className="flex justify-center mb-6">
        <div className="flex items-center bg-gray-200 rounded-lg p-1">
          <button onClick={() => setTimeRange('day')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === 'day' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600'}`}>Day</button>
          <button onClick={() => setTimeRange('week')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === 'week' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600'}`}>Week</button>
          <button onClick={() => setTimeRange('month')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${timeRange === 'month' ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-600'}`}>Month</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard label="Total Naps" value={totalNaps} />
        <StatCard label="Total Walks" value={totalWalks} />
      </div>

      <div className="space-y-8">
        <div className="p-4 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-bold mb-4">Activity Frequency</h2>
            <ActivityFrequencyChart data={frequencyData} />
        </div>
        <div className="p-4 rounded-lg bg-white shadow-sm">
            <h2 className="text-xl font-bold mb-4">Activity Trend</h2>
            <ActivityTrendChart data={trendData} />
        </div>
      </div>
    </div>
  );
}
