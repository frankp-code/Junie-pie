import { PuppyActivity } from '../lib/supabase';

interface WeeklySummaryProps {
  activities: PuppyActivity[];
}

export function WeeklySummary({ activities }: WeeklySummaryProps) {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const weekActivities = activities.filter((activity) => {
    const activityDate = new Date(activity.activity_time);
    return activityDate >= startOfWeek;
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDayData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      const dayActivities = weekActivities.filter((activity) => {
        const activityDate = new Date(activity.activity_time);
        return activityDate >= date && activityDate < nextDay;
      });

      const counts = {
        meal: 0,
        wee: 0,
        poo: 0,
        walk: 0,
        naps: 0,
      };

      dayActivities.forEach((activity) => {
        if (activity.activity_type === 'meal') counts.meal++;
        if (activity.activity_type === 'wee') counts.wee++;
        if (activity.activity_type === 'poo') counts.poo++;
        if (activity.activity_type === 'walk') counts.walk++;
      });

      const sortedActivities = [...dayActivities].sort(
        (a, b) => new Date(a.activity_time).getTime() - new Date(b.activity_time).getTime()
      );

      let napMinutes = 0;
      for (let j = 0; j < sortedActivities.length; j++) {
        const activity = sortedActivities[j];
        if (activity.activity_type === 'sleep') {
          const sleepTime = new Date(activity.activity_time);
          const sleepHour = sleepTime.getHours();

          if (sleepHour >= 8 && sleepHour < 21) {
            let wakeActivity = null;
            for (let k = j + 1; k < sortedActivities.length; k++) {
              if (sortedActivities[k].activity_type === 'wake') {
                wakeActivity = sortedActivities[k];
                break;
              }
              if (sortedActivities[k].activity_type === 'sleep') break;
            }

            if (wakeActivity) {
              const wakeTime = new Date(wakeActivity.activity_time);
              const wakeHour = wakeTime.getHours();

              if (wakeHour >= 8 && wakeHour < 21) {
                const durationMs = wakeTime.getTime() - sleepTime.getTime();
                napMinutes += Math.floor(durationMs / (1000 * 60));
              } else if (wakeHour >= 21) {
                const endOfNapWindow = new Date(sleepTime);
                endOfNapWindow.setHours(21, 0, 0, 0);
                const durationMs = endOfNapWindow.getTime() - sleepTime.getTime();
                napMinutes += Math.floor(durationMs / (1000 * 60));
              }
            }
          }
        }
      }

      days.push({
        date,
        dayName: dayNames[date.getDay()],
        dateNum: date.getDate(),
        counts,
        napMinutes,
        totalActivities: dayActivities.length,
      });
    }
    return days;
  };

  const weekData = getDayData();
  const maxActivities = Math.max(...weekData.map(d => d.totalActivities), 1);
  const maxNapMinutes = Math.max(...weekData.map(d => d.napMinutes), 1);

  if (weekActivities.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Weekly Summary</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Daily Activity Count</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {weekData.map((day, idx) => {
              const heightPercent = (day.totalActivities / maxActivities) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end items-center h-36">
                    {day.totalActivities > 0 && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-gray-700">
                          {day.totalActivities}
                        </span>
                        <div
                          className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all"
                          style={{ height: `${Math.max(heightPercent, 10)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-600">{day.dayName}</div>
                    <div className="text-xs text-gray-400">{day.dateNum}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Nap Time (8am-9pm)</h3>
          <div className="flex items-end justify-between gap-2 h-48">
            {weekData.map((day, idx) => {
              const heightPercent = (day.napMinutes / maxNapMinutes) * 100;
              const hours = Math.floor(day.napMinutes / 60);
              const mins = day.napMinutes % 60;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end items-center h-36">
                    {day.napMinutes > 0 && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-semibold text-gray-700">
                          {hours > 0 ? `${hours}h ` : ''}{mins}m
                        </span>
                        <div
                          className="w-full bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all"
                          style={{ height: `${Math.max(heightPercent, 10)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-medium text-gray-600">{day.dayName}</div>
                    <div className="text-xs text-gray-400">{day.dateNum}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Activity Breakdown</h3>
          <div className="grid grid-cols-7 gap-2">
            {weekData.map((day, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-2">
                <div className="text-center mb-2">
                  <div className="text-xs font-medium text-gray-600">{day.dayName}</div>
                  <div className="text-xs text-gray-400">{day.dateNum}</div>
                </div>
                <div className="space-y-1">
                  {day.counts.meal > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span>🍖</span>
                      <span className="font-medium">{day.counts.meal}</span>
                    </div>
                  )}
                  {day.counts.wee > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span>💧</span>
                      <span className="font-medium">{day.counts.wee}</span>
                    </div>
                  )}
                  {day.counts.poo > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span>💩</span>
                      <span className="font-medium">{day.counts.poo}</span>
                    </div>
                  )}
                  {day.counts.walk > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span>🦮</span>
                      <span className="font-medium">{day.counts.walk}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
