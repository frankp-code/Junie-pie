import { PuppyActivity, ActivityType } from './types';

// Helper to get last 7 days array
const getLast7Days = (anchorDate: Date = new Date()) => {
  return [...Array(7)].map((_, i) => {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();
};

export const getTodayStats = (activities: PuppyActivity[]) => {
  const todayStr = new Date().toDateString();
  const todayActivities = activities.filter(a => new Date(a.activity_time).toDateString() === todayStr);

  let walkDurationMs = 0;
  let sleepDurationMs = 0;
  let weeCount = 0;
  let pooCount = 0;

  todayActivities.forEach(activity => {
    if (activity.activity_type === 'wee') weeCount++;
    if (activity.activity_type === 'poo') pooCount++;

    if (activity.end_time) {
      const duration = new Date(activity.end_time).getTime() - new Date(activity.activity_time).getTime();
      if (activity.activity_type === 'walk') walkDurationMs += duration;
      if (activity.activity_type === 'sleep') sleepDurationMs += duration;
    }
  });

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return {
    walkTime: formatDuration(walkDurationMs),
    sleepTime: formatDuration(sleepDurationMs),
    pottyCount: `${weeCount} Wees, ${pooCount} Poos`
  };
};

export const processActivityDistribution = (activities: PuppyActivity[]) => {
  const last7DaysStr = getLast7Days();
  
  const recentActivities = activities.filter(a => {
    const day = a.activity_time.split('T')[0];
    return last7DaysStr.includes(day);
  });

  const counts: { [key: string]: number } = {};
  recentActivities.forEach(a => {
    const type = a.activity_type.charAt(0).toUpperCase() + a.activity_type.slice(1);
    counts[type] = (counts[type] || 0) + 1;
  });

  const backgroundColors = [
    'rgba(244, 114, 182, 0.8)', // pink
    'rgba(96, 165, 250, 0.8)', // blue
    'rgba(52, 211, 153, 0.8)', // green
    'rgba(167, 139, 250, 0.8)', // purple
    'rgba(251, 191, 36, 0.8)', // yellow
    'rgba(251, 146, 60, 0.8)', // orange
    'rgba(156, 163, 175, 0.8)', // gray
  ];

  return {
    labels: Object.keys(counts),
    datasets: [
      {
        data: Object.values(counts),
        backgroundColor: backgroundColors.slice(0, Object.keys(counts).length),
        borderWidth: 0,
      },
    ],
  };
};

export const processDailySleepWalk = (activities: PuppyActivity[]) => {
  const last7Days = getLast7Days();
  
  const walkData = last7Days.map(day => {
    const dayActivities = activities.filter(a => a.activity_time.startsWith(day) && a.activity_type === 'walk' && a.end_time);
    const totalMs = dayActivities.reduce((acc, a) => acc + (new Date(a.end_time!).getTime() - new Date(a.activity_time).getTime()), 0);
    return Math.round(totalMs / 60000 / 60 * 10) / 10; // Hours with 1 decimal
  });

  const sleepData = last7Days.map(day => {
    const dayActivities = activities.filter(a => a.activity_time.startsWith(day) && a.activity_type === 'sleep' && a.end_time);
    const totalMs = dayActivities.reduce((acc, a) => acc + (new Date(a.end_time!).getTime() - new Date(a.activity_time).getTime()), 0);
    return Math.round(totalMs / 60000 / 60 * 10) / 10;
  });

  // Shorten labels for display e.g. "Mon", "Tue"
  const shortLabels = last7Days.map(day => new Date(day).toLocaleDateString('en-US', { weekday: 'short' }));

  return {
    labels: shortLabels,
    datasets: [
      {
        label: 'Sleep (hrs)',
        data: sleepData,
        backgroundColor: 'rgba(167, 139, 250, 0.7)',
        borderRadius: 4,
      },
      {
        label: 'Walk (hrs)',
        data: walkData,
        backgroundColor: 'rgba(52, 211, 153, 0.7)',
        borderRadius: 4,
      },
    ],
  };
};

export const processPottyTrend = (activities: PuppyActivity[]) => {
  const last7Days = getLast7Days();
  
  const weeData = last7Days.map(day => {
    return activities.filter(a => a.activity_time.startsWith(day) && a.activity_type === 'wee').length;
  });

  const pooData = last7Days.map(day => {
    return activities.filter(a => a.activity_time.startsWith(day) && a.activity_type === 'poo').length;
  });

  const shortLabels = last7Days.map(day => new Date(day).toLocaleDateString('en-US', { weekday: 'short' }));

  return {
    labels: shortLabels,
    datasets: [
      {
        label: 'Wee',
        data: weeData,
        backgroundColor: 'rgba(96, 165, 250, 0.7)', // blue
      },
      {
        label: 'Poo',
        data: pooData,
        backgroundColor: 'rgba(251, 191, 36, 0.7)', // yellow
      },
    ],
  };
};
