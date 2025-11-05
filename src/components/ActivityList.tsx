import { Trash2, PawPrint } from 'lucide-react';
import { PuppyActivity } from '../lib/types';
import { useSwipeable } from 'react-swipeable';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';

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

const calculateDuration = (start: string, end: string): string => {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const duration = (endTime - startTime) / (1000 * 60);
    if (duration < 1) return '< 1 min';
    if (duration < 60) return `${Math.round(duration)} min`;
    const hours = Math.floor(duration / 60);
    const minutes = Math.round(duration % 60);
    return `${hours}h ${minutes}m`;
};

const ActivityItem = ({ activity, onDelete }: { activity: PuppyActivity & { isEndEvent?: boolean, parentDuration?: string }, onDelete: (id: string) => void }) => {
    const [showDelete, setShowDelete] = useState(false);

    const handlers = useSwipeable({
        onSwipedLeft: () => !activity.isEndEvent && setShowDelete(true),
        onSwipedRight: () => setShowDelete(false),
        trackMouse: true,
        preventScrollOnSwipe: true,
    });

    const config = activityConfig[activity.activity_type] || activityConfig.other;
    const isDurationStart = (activity.activity_type === 'walk' || activity.activity_type === 'sleep') && !activity.isEndEvent;

    const handleDelete = () => {
        setShowDelete(false);
        setTimeout(() => {
            onDelete(activity.id);
        }, 300); // allow for animation
    };

    return (
        <li className="relative pb-8" {...handlers}>
             <AnimatePresence>
                {showDelete && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="absolute inset-y-0 right-0 flex items-center"
                    >
                        <button
                            onClick={handleDelete}
                            className="bg-red-500 text-white h-full px-6 flex items-center justify-center"
                        >
                            <Trash2 size={20} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            <motion.div 
                className="relative bg-pink-50"
                animate={{ x: showDelete ? '-80px' : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <div className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                <div className="relative flex space-x-3">
                    <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-pink-50 ${config.color}`}>
                            {config.emoji}
                        </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                            <p className="text-sm text-gray-500">
                                {activity.isEndEvent ? `${config.label} ended` : config.label} at{" "}
                                <time dateTime={activity.activity_time}>{formatTime(activity.activity_time)}</time>
                                {isDurationStart && activity.parentDuration && (
                                    <span className="ml-2 text-xs font-semibold">({activity.parentDuration})</span>
                                )}
                            </p>
                            {!activity.isEndEvent && activity.notes && <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{activity.notes}</p>}
                        </div>
                    </div>
                </div>
            </motion.div>
        </li>
    );
};

const DayBreak = ({ date }: { date: string }) => (
    <div className="py-4">
        <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center">
                <span className="bg-pink-50 px-3 text-sm font-medium text-gray-500">{formatDate(date)}</span>
            </div>
        </div>
    </div>
);


export function ActivityList({ activities, onDelete, timelineDate, onClearTimelineDate }: ActivityListProps) {
    
    const processedActivities = useMemo(() => {
        const expanded = activities.flatMap(activity => {
            if ((activity.activity_type === 'walk' || activity.activity_type === 'sleep') && activity.end_time) {
                const duration = calculateDuration(activity.activity_time, activity.end_time);
                const startEvent = { ...activity, parentDuration: duration };
                const endEvent = {
                    ...activity,
                    id: `${activity.id}-end`,
                    activity_time: activity.end_time,
                    isEndEvent: true,
                    notes: '',
                };
                return [startEvent, endEvent];
            }
            return [activity];
        });

        return expanded.sort((a, b) => new Date(b.activity_time).getTime() - new Date(a.activity_time).getTime());
    }, [activities]);

    const groupedActivities = useMemo(() => {
        return processedActivities.reduce((acc, activity) => {
            const date = new Date(activity.activity_time).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(activity);
            return acc;
        }, {} as Record<string, PuppyActivity[]>);
    }, [processedActivities]);

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
        <div className="space-y-2 pb-24">
            {timelineDate && onClearTimelineDate && (
                <div className="flex justify-between items-center bg-blue-100 p-3 rounded-lg mb-4">
                    <h2 className="font-bold text-blue-800">
                        Showing activities for {timelineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </h2>
                    <button onClick={onClearTimelineDate} className="text-sm font-semibold text-blue-600 hover:underline">
                        Show All
                    </button>
                </div>
            )}
            
            {sortedDays.map((day, dayIndex) => (
                <div key={day}>
                    {!timelineDate && <DayBreak date={day} />}
                    <div className="flow-root">
                        <ul className="-mb-8">
                            <AnimatePresence initial={false}>
                                {groupedActivities[day].map((activity) => (
                                    <ActivityItem 
                                        key={activity.id}
                                        activity={activity} 
                                        onDelete={onDelete} 
                                    />
                                ))}
                            </AnimatePresence>
                        </ul>
                    </div>
                </div>
            ))}
        </div>
    );
}
