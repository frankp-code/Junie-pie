import { PuppyActivity, ActivityType } from '../lib/types';
import { Trash2, Edit3, Clock, ChevronDown, ChevronRight, Dog } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityListProps {
  activities: PuppyActivity[];
  onDelete: (id: string) => void;
  timelineDate: Date | null;
  onClearTimelineDate: () => void;
}

const activityIcons: { [key in ActivityType | 'other']: { icon: string; color: string } } = {
  meal: { icon: '🥣', color: 'bg-red-100' },
  wee: { icon: '💧', color: 'bg-blue-100' },
  poo: { icon: '💩', color: 'bg-yellow-200' },
  walk: { icon: '🦮', color: 'bg-green-100' },
  play: { icon: '🎾', color: 'bg-indigo-100' },
  sleep: { icon: '😴', color: 'bg-purple-100' },
  training: { icon: '🎓', color: 'bg-orange-100' },
  other: { icon: '📝', color: 'bg-gray-100' },
  chew: { icon: '🦴', color: 'bg-amber-100' },
  med: { icon: '💊', color: 'bg-rose-100' },
};

const ActivityItem = ({ activity, nested, onDelete }: { activity: PuppyActivity, nested: boolean, onDelete: (id: string) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { icon, color } = activityIcons[activity.activity_type] || activityIcons.other;

  const startTime = new Date(activity.activity_time).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  let endTime: string | null = null;
  if (activity.end_time) {
    endTime = new Date(activity.end_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
  }

  let duration: string | null = null;
  if (activity.end_time) {
    const durationMs = new Date(activity.end_time).getTime() - new Date(activity.activity_time).getTime();
    const totalMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    duration = `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  }

  return (
    <div className={`rounded-lg p-3 ${nested ? `ml-6 border-l-2 border-gray-200` : ''} `}>
        <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${color}`}>
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center">
                    <span className="font-bold capitalize text-gray-800">
                        {activity.activity_type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500 font-medium">{startTime}</span>
                </div>
                
                {(duration || endTime) && (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <Clock size={12}/>
                        <span>
                            {endTime && `${startTime} - ${endTime}`}
                            {duration && <span className="font-semibold"> ({duration})</span>}
                        </span>
                    </div>
                )}

                {activity.notes && <p className="text-sm text-gray-600 mt-1">{activity.notes}</p>}
            </div>
            <button onClick={() => onDelete(activity.id)} className="text-gray-400 hover:text-red-500 p-1">
                <Trash2 size={16} />
            </button>
        </div>
    </div>
  );
};

const WalkActivityItem = ({ activity, children, onDelete }: { activity: PuppyActivity, children: React.ReactNode, onDelete: (id: string) => void }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const { icon, color } = activityIcons[activity.activity_type] || activityIcons.other;

    const startTime = new Date(activity.activity_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    let endTime: string | null = null;
    if (activity.end_time) {
        endTime = new Date(activity.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    let duration: string | null = null;
    if (activity.end_time) {
        const durationMs = new Date(activity.end_time).getTime() - new Date(activity.activity_time).getTime();
        const totalMinutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        duration = `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
    }

    return (
        <div className="rounded-lg p-3 bg-white shadow-sm">
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${color}`}>
                    {icon}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <span className="font-bold capitalize text-gray-800">
                            {activity.activity_type.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500 font-medium">{startTime}</span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <Clock size={12}/>
                        <span>
                            {endTime ? `${startTime} - ${endTime}` : 'In progress...'}
                            {duration && <span className="font-semibold"> ({duration})</span>}
                        </span>
                    </div>

                    {activity.notes && <p className="text-sm text-gray-600 mt-1">{activity.notes}</p>}
                </div>
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-400 hover:text-gray-600 p-1">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: '1rem' }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


export function ActivityList({ activities, onDelete, timelineDate, onClearTimelineDate }: ActivityListProps) {
  if (activities.length === 0) {
    return (
        <div className="text-center py-12 px-4 bg-white rounded-lg shadow-sm">
            <Dog size={48} className="mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-800">No activities logged yet</h3>
            <p className="mt-1 text-sm text-gray-500">
                {timelineDate ? `No activities on ${timelineDate.toLocaleDateString()}.` : 'Click the \'+\' button to add a new activity.'}
            </p>
            {timelineDate && 
                <button onClick={onClearTimelineDate} className="mt-4 px-4 py-2 text-sm font-medium text-pink-600 bg-pink-100 rounded-lg">
                    Back to full timeline
                </button>
            }
        </div>
    );
  }

  const activitiesByDay: { [key: string]: PuppyActivity[] } = {};
  activities.forEach(activity => {
    const day = new Date(activity.activity_time).toDateString();
    if (!activitiesByDay[day]) {
      activitiesByDay[day] = [];
    }
    activitiesByDay[day].push(activity);
  });

  const topLevelActivities = activities.filter(a => !a.parent_activity_id);
  const nestedActivities = activities.filter(a => a.parent_activity_id);

  const renderableDays = timelineDate
  ? [new Date(timelineDate).toDateString()]
  : Object.keys(activitiesByDay).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  return (
    <div>
        {timelineDate && 
            <div className="flex justify-between items-center pb-4">
                <h2 className="text-lg font-bold text-gray-800">{new Date(timelineDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                <button onClick={onClearTimelineDate} className="text-sm text-pink-600 font-medium">
                    View all
                </button>
            </div>
        }
        <div className="space-y-4">
        {renderableDays.map(day => {
            const dayActivities = (activitiesByDay[day] || [])
                .filter(a => !a.parent_activity_id)
                .sort((a,b) => new Date(b.activity_time).getTime() - new Date(a.activity_time).getTime());
            
            if (dayActivities.length === 0) return null;

            return (
                <div key={day}>
                    {!timelineDate && 
                        <h2 className="font-bold text-gray-700 pb-2 mb-2 border-b-2 border-gray-100">
                            {new Date(day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h2>
                    }
                    <div className="space-y-3">
                        {dayActivities.map(activity => {
                            if (activity.activity_type === 'walk') {
                                const children = nestedActivities
                                    .filter(na => na.parent_activity_id === activity.id)
                                    .sort((a,b) => new Date(b.activity_time).getTime() - new Date(a.activity_time).getTime());
                                return (
                                    <WalkActivityItem key={activity.id} activity={activity} onDelete={onDelete}>
                                        {children.length > 0 ? (
                                            <div className="space-y-2">
                                                {children.map(child => <ActivityItem key={child.id} activity={child} nested={true} onDelete={onDelete}/>)}
                                            </div>
                                        ) : (
                                            <div className="text-center text-sm text-gray-500 py-3">No other activities on this walk.</div>
                                        )}
                                    </WalkActivityItem>
                                );
                            } else {
                                return <ActivityItem key={activity.id} activity={activity} nested={false} onDelete={onDelete} />;
                            }
                        })}
                    </div>
                </div>
            );
        })}
        </div>
    </div>
  );
}
