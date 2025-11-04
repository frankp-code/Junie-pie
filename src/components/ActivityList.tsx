import { Trash2, Moon, ArrowUpDown } from 'lucide-react';
import { PuppyActivity } from '../lib/supabase';
import { getSleepDurationForActivity } from '../lib/sleepUtils';

interface ActivityListProps {
  activities: PuppyActivity[];
  allActivities: PuppyActivity[];
  selectedDate: Date;
  timelineOrder: 'asc' | 'desc';
  onTimelineOrderChange: (order: 'asc' | 'desc') => void;
  onDelete: (id: string) => Promise<void>;
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
  meal: 'Meal',
  wee: 'Wee',
  poo: 'Poo',
  walk: 'Walk',
  play: 'Playtime',
  sleep: 'Sleep',
  wake: 'Wake',
  training: 'Training',
  other: 'Other',
};

export function ActivityList({ activities, allActivities, selectedDate, timelineOrder, onTimelineOrderChange, onDelete }: ActivityListProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const selectedDateStr = selectedDate.toDateString();
  const filteredByDate = activities.filter((activity) => {
    const activityDate = new Date(activity.activity_time);
    return activityDate.toDateString() === selectedDateStr;
  });

  const sortedActivities = [...filteredByDate].sort((a, b) => {
    const timeA = new Date(a.activity_time).getTime();
    const timeB = new Date(b.activity_time).getTime();
    return timelineOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const groupedActivities = sortedActivities.reduce((groups, activity) => {
    const date = new Date(activity.activity_time).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, PuppyActivity[]>);

  const toggleOrder = () => {
    onTimelineOrderChange(timelineOrder === 'desc' ? 'asc' : 'desc');
  };

  if (sortedActivities.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-500">No activities logged for this date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          Showing {sortedActivities.length} {sortedActivities.length === 1 ? 'activity' : 'activities'} for {formatDate(sortedActivities[0].activity_time)}
        </span>
        <button
          onClick={toggleOrder}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
        >
          <ArrowUpDown size={16} />
          {timelineOrder === 'desc' ? 'Newest First' : 'Oldest First'}
        </button>
      </div>
      {Object.entries(groupedActivities).map(([date, dayActivities]) => (
        <div key={date} className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">
            {formatDate(dayActivities[0].activity_time)}
          </h3>
          <div className="relative">
            <div className="absolute left-[27px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-blue-300 to-blue-200"></div>

            <div className="space-y-4">
              {dayActivities.map((activity, index) => (
                <div key={activity.id} className="relative flex items-start gap-4 pl-2">
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-14 h-14 bg-white border-2 border-blue-400 rounded-full flex items-center justify-center text-2xl shadow-sm">
                      {activityEmojis[activity.activity_type]}
                    </div>
                  </div>

                  <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">
                            {activityLabels[activity.activity_type]}
                          </span>
                          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {formatTime(activity.activity_time)}
                          </span>
                          {(() => {
                            const sleepDuration = getSleepDurationForActivity(activity, allActivities);
                            if (sleepDuration) {
                              return (
                                <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Moon size={14} />
                                  {sleepDuration.duration}
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>
                        {activity.notes && (
                          <p className="text-sm text-gray-600 mt-2">{activity.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onDelete(activity.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors p-2"
                        aria-label="Delete activity"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
