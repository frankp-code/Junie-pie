import { PuppyActivity } from '../lib/supabase';

interface DailySummaryProps {
  activities: PuppyActivity[];
}

const activityEmojis: Record<string, string> = {
  meal: '🍖',
  wee: '💧',
  poo: '💩',
  walk: '🦮',
  play: '🎾',
  sleep: '😴',
  wake: '☀️',
  training: '🎓',
  other: '📝',
};

const activityLabels: Record<string, string> = {
  meal: 'Meals',
  wee: 'Wees',
  poo: 'Poos',
  walk: 'Walks',
  play: 'Playtime',
  sleep: 'Sleeps',
  wake: 'Wakes',
  training: 'Training',
  other: 'Other',
};

export function DailySummary({ activities }: DailySummaryProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.activity_time);
    activityDate.setHours(0, 0, 0, 0);
    return activityDate.getTime() === today.getTime();
  });

  const activityCounts = todayActivities.reduce((counts, activity) => {
    counts[activity.activity_type] = (counts[activity.activity_type] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const calculateNapMinutes = () => {
    const sortedActivities = [...todayActivities].sort(
      (a, b) => new Date(a.activity_time).getTime() - new Date(b.activity_time).getTime()
    );

    let totalNapMinutes = 0;

    for (let i = 0; i < sortedActivities.length; i++) {
      const activity = sortedActivities[i];

      if (activity.activity_type === 'sleep') {
        const sleepTime = new Date(activity.activity_time);
        const sleepHour = sleepTime.getHours();

        if (sleepHour >= 8 && sleepHour < 21) {
          let wakeActivity = null;

          for (let j = i + 1; j < sortedActivities.length; j++) {
            if (sortedActivities[j].activity_type === 'wake') {
              wakeActivity = sortedActivities[j];
              break;
            }
            if (sortedActivities[j].activity_type === 'sleep') {
              break;
            }
          }

          if (wakeActivity) {
            const wakeTime = new Date(wakeActivity.activity_time);
            const wakeHour = wakeTime.getHours();

            if (wakeHour >= 8 && wakeHour < 21) {
              const durationMs = wakeTime.getTime() - sleepTime.getTime();
              const minutes = Math.floor(durationMs / (1000 * 60));
              totalNapMinutes += minutes;
            } else if (wakeHour >= 21) {
              const endOfNapWindow = new Date(sleepTime);
              endOfNapWindow.setHours(21, 0, 0, 0);
              const durationMs = endOfNapWindow.getTime() - sleepTime.getTime();
              const minutes = Math.floor(durationMs / (1000 * 60));
              totalNapMinutes += minutes;
            }
          } else {
            const now = new Date();
            const endOfNapWindow = new Date(sleepTime);
            endOfNapWindow.setHours(21, 0, 0, 0);
            const endTime = now < endOfNapWindow ? now : endOfNapWindow;

            if (endTime > sleepTime) {
              const durationMs = endTime.getTime() - sleepTime.getTime();
              const minutes = Math.floor(durationMs / (1000 * 60));
              totalNapMinutes += minutes;
            }
          }
        }
      }
    }

    return totalNapMinutes;
  };

  const napMinutes = calculateNapMinutes();
  const napHours = Math.floor(napMinutes / 60);
  const napRemainingMinutes = napMinutes % 60;

  if (todayActivities.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
      <h2 className="text-2xl font-bold mb-4">Today's Summary</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(activityCounts).map(([type, count]) => (
          <div key={type} className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-3xl mb-2">{activityEmojis[type]}</div>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-sm opacity-90">{activityLabels[type]}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
        <p className="text-sm opacity-90">
          Total activities today: <span className="font-bold text-lg">{todayActivities.length}</span>
        </p>
        {napMinutes > 0 && (
          <p className="text-sm opacity-90">
            Nap time (8am-9pm): <span className="font-bold text-lg">
              {napHours > 0 ? `${napHours}h ` : ''}{napRemainingMinutes}m
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
