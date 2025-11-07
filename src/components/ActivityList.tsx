import { useMemo } from 'react';
import { PuppyActivity } from '../lib/types';
import { format, isToday, differenceInMinutes } from 'date-fns';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityListProps {
  activities: PuppyActivity[];
  onDelete: (id: string) => void;
  timelineDate: Date | null;
  onClearTimelineDate: () => void;
}

const activityEmoji: { [key: string]: string } = {
  meal: '🥣',
  walk: '🦮',
  wee: '💧',
  poo: '💩',
  sleep: '😴',
  play: '🎾',
  training: '🎓',
  chew: '🦴',
  med: '💊',
  vet: '⚕️',
  wake: '🌅',
  other: '📝',
};

const groupActivitiesByDate = (activities: PuppyActivity[]) => {
  const mainActivities = activities.filter(a => !a.parent_activity_id);
  return mainActivities.reduce((acc, activity) => {
    const date = format(new Date(activity.activity_time), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as { [key: string]: PuppyActivity[] });
};

export function ActivityList({ activities, onDelete, timelineDate, onClearTimelineDate }: ActivityListProps) {

  const groupedActivities = useMemo(() => groupActivitiesByDate(activities), [activities]);
  const sortedDates = useMemo(() => Object.keys(groupedActivities).sort((a, b) => new Date(b).getTime() - new Date(a).getTime()), [groupedActivities]);

  const getSubActivities = (parentId: string) => {
    return activities
      .filter(a => a.parent_activity_id === parentId)
      .sort((a, b) => new Date(a.activity_time).getTime() - new Date(b.activity_time).getTime());
  };

  const renderDateHeader = (date: string) => {
    const d = new Date(date);
    d.setUTCHours(12,0,0,0);
    if (isToday(d)) {
      return 'Today';
    } 
    return format(d, 'eeee, d MMMM');
  };

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No activities logged yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {timelineDate && (
        <div className="flex justify-end">
          <button 
            onClick={onClearTimelineDate} 
            className="text-sm text-pink-600 hover:underline">
            Back to full timeline
          </button>
        </div>
      )}
      {sortedDates.map((date, index) => (
        <motion.div 
          key={date}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <h2 className="font-bold text-lg text-gray-700 mb-2">{renderDateHeader(date)}</h2>
          <div className="space-y-3">
            {groupedActivities[date].map(activity => (
              <ActivityItem key={activity.id} activity={activity} onDelete={onDelete} subActivities={getSubActivities(activity.id)} />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const ActivityItem = ({ activity, onDelete, subActivities }: { activity: PuppyActivity, onDelete: (id: string) => void, subActivities: PuppyActivity[] }) => {

  const formatTime = (time: string) => format(new Date(time), 'h:mm a');

  const renderDuration = (start: string, end?: string) => {
    if (!end) {
      return <span className="text-xs text-yellow-600 animate-pulse">Ongoing</span>;
    }
    const duration = differenceInMinutes(new Date(end), new Date(start));
    if (duration < 1) return null;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    let formatted = '';
    if (hours > 0) formatted += `${hours}h `;
    if (minutes > 0) formatted += `${minutes}m`;
    return <span className="text-xs text-gray-500">({formatted.trim()})</span>;
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="bg-white p-3 rounded-lg shadow-sm flex items-start gap-4 relative group">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-pink-100 rounded-full text-xl">
            {activityEmoji[activity.activity_type]}
        </div>
        <div className="flex-grow">
            <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800">
                  {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                </p>
                <p className="text-sm text-gray-600">
                    {formatTime(activity.activity_time)}
                    {activity.activity_type === 'sleep' || activity.activity_type === 'walk' ? <span className="ml-2">{renderDuration(activity.activity_time, activity.end_time)}</span> : null}
                </p>
            </div>
            {activity.notes && <p className="text-sm text-gray-600 mt-1">{activity.notes}</p>}
            {subActivities.length > 0 && (
              <div className="mt-2 space-x-2">
                {subActivities.map(sub => (
                  <span key={sub.id} className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {activityEmoji[sub.activity_type]}
                    <span>{formatTime(sub.activity_time)}</span>
                  </span>
                ))}
              </div>
            )}
        </div>
        <button onClick={() => onDelete(activity.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 size={16} />
        </button>
    </motion.div>
  );
};