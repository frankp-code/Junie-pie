import { Trash2, PawPrint } from 'lucide-react';
import { PuppyActivity } from '../lib/types';

interface ActivityListProps {
  activities: PuppyActivity[];
  onDelete: (id: string) => Promise<void>;
  timelineDate?: Date | null;
  onClearTimelineDate?: () => void;
}

const activityConfig: Record<string, { emoji: string; label: string; color: string; }> = {
  meal: { emoji: '🍖', label: 'Meal', color: 'bg-yellow-100 text-yellow-800' },
  wee: { emoji: '💧', label: 'Wee', color: 'bg-blue-100 text-blue-800' },
  poo: { emoji: '💩', label: 'Poo', color: 'bg-amber-100 text-amber-800' },
  walk: { emoji: '🦮', label: 'Walk', color: 'bg-green-100 text-green-800' },
  play: { emoji: '🎾', label: 'Play', color: 'bg-indigo-100 text-indigo-800' },
  sleep: { emoji: '😴', label: 'Sleep', color: 'bg-purple-100 text-purple-800' },
  wake: { emoji: '☀️', label: 'Wake', color: 'bg-orange-100 text-orange-800' },
  training: { emoji: '🎓', label: 'Training', color: 'bg-pink-100 text-pink-800' },
  other: { emoji: '📝', label: 'Other', color: 'bg-gray-100 text-gray-800' },
};

export function ActivityList({ activities, onDelete, timelineDate, onClearTimelineDate }: ActivityListProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
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
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  };

  const groupActivitiesByDay = () => {
    return activities.reduce((acc, activity) => {
      const date = new Date(activity.activity_time).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, PuppyActivity[]>);
  };

  const groupedActivities = groupActivitiesByDay();
  const sortedDays = Object.keys(groupedActivities).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (activities.length === 0) {
    return (
      <div className="text-center py-16">
        <PawPrint className="mx-auto text-gray-300 w-16 h-16" />
        <h3 className="mt-4 text-lg font-medium text-gray-700">
          {timelineDate ? `No activities for ${timelineDate.toLocaleDateString()}` : 'No activities yet'}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {timelineDate ? 'Select another day in the calendar.' : "Add your first activity using the '+' button below."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {timelineDate && onClearTimelineDate && (
        <div className="flex justify-between items-center bg-blue-100 p-3 rounded-lg">
          <h2 className="font-bold text-blue-800">
            Showing activities for {timelineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </h2>
          <button onClick={onClearTimelineDate} className="text-sm font-semibold text-blue-600 hover:underline">
            Show All
          </button>
        </div>
      )}
      {sortedDays.map(day => (
        <div key={day}>
          {!timelineDate && <h2 className="font-bold text-gray-800 text-lg mb-3">{formatDate(day)}</h2>}
          <div className="flow-root">
            <ul className="-mb-8">
              {groupedActivities[day].map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== groupedActivities[day].length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${activityConfig[activity.activity_type]?.color || activityConfig.other.color}`}>
                          {activityConfig[activity.activity_type]?.emoji || activityConfig.other.emoji}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activityConfig[activity.activity_type]?.label || activityConfig.other.label} at{" "}
                            <time dateTime={activity.activity_time}>{formatTime(activity.activity_time)}</time>
                          </p>
                          {activity.notes && <p className="text-sm text-gray-700 mt-1">{activity.notes}</p>}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <button onClick={() => onDelete(activity.id)} className="text-gray-400 hover:text-red-500 p-1">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
