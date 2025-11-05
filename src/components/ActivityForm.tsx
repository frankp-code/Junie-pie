import { useEffect, useState } from 'react';
import { ActivityType } from '../lib/types';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityFormProps {
  onSubmit: (activityType: ActivityType, activityTime: string, notes: string, endTime?: string) => Promise<void>;
  onBack: () => void;
  date: Date | null;
}

const activityOptions: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'wee', label: 'Wee', emoji: '💧' },
  { value: 'poo', label: 'Poo', emoji: '💩' },
  { value: 'meal', label: 'Meal', emoji: '🥣' },
  { value: 'walk', label: 'Walk', emoji: '🦮' },
  { value: 'play', label: 'Play', emoji: '🎾' },
  { value: 'training', label: 'Training', emoji: '🎓' },
  { value: 'sleep', label: 'Sleep', emoji: '😴' },
  { value: 'chew', label: 'Chew', emoji: '🦴' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

const durationOptions = Array.from({ length: 60 }, (_, i) => {
  const totalMinutes = (i + 1) * 10;
  return { value: totalMinutes, label: `${totalMinutes} min` };
});

export function ActivityForm({ onSubmit, onBack, date }: ActivityFormProps) {
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [activityTime, setActivityTime] = useState(() => {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
    if (!date) {
        return targetDate.toISOString().slice(0, 16);
    }
    targetDate.setHours(9, 0, 0, 0);
    return targetDate.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
    if (date) {
        targetDate.setHours(9, 0, 0, 0);
    }
    setActivityTime(targetDate.toISOString().slice(0, 16));
  }, [date]);

  useEffect(() => {
    const isDurationActivitySelected = activityTypes.includes('walk') || activityTypes.includes('sleep');
    if (!isDurationActivitySelected) {
        setDuration(undefined);
    }
  }, [activityTypes]);

  const handleActivityTypeToggle = (activityType: ActivityType) => {
    setActivityTypes(prev => {
      if (activityType === 'sleep') {
        return prev.includes('sleep') ? [] : ['sleep'];
      }
      if (prev.includes('sleep')) {
        return [activityType];
      }
      return prev.includes(activityType)
        ? prev.filter(item => item !== activityType)
        : [...prev, activityType];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activityTypes.length === 0) {
      alert('Please select at least one activity type.');
      return;
    }
    if (activityTypes.includes('other') && notes.trim() === '') {
      alert('Please enter a description for the \'Other\' activity.');
      return;
    }
    setIsSubmitting(true);
    try {
      for (const activityType of activityTypes) {
        let endTime: string | undefined = undefined;
        if ((activityType === 'walk' || activityType === 'sleep') && duration) {
            const startTime = new Date(activityTime);
            const endTimeDate = new Date(startTime.getTime() + duration * 60000);
            endTime = endTimeDate.toISOString();
        }
        await onSubmit(activityType, activityTime, notes, endTime);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDurationActivitySelected = activityTypes.includes('walk') || activityTypes.includes('sleep');

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Add New Activity</h1>
            <button
                type="submit"
                form="activity-form"
                disabled={isSubmitting}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg font-semibold text-sm hover:bg-pink-700 disabled:bg-pink-400"
            >
                {isSubmitting ? 'Adding...' : 'Add'}
            </button>
        </div>

        <form id="activity-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Activity Type (select one or more)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {activityOptions.map((option) => (
                        <button
                        key={option.value}
                        type="button"
                        onClick={() => handleActivityTypeToggle(option.value)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all text-center ${
                            activityTypes.includes(option.value)
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        >
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="text-xs font-medium text-gray-800 mt-1">{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="activityTime" className="text-sm font-medium text-gray-700 mb-1 block">Start Time</label>
                  <input
                      type="datetime-local"
                      id="activityTime"
                      value={activityTime}
                      onChange={(e) => setActivityTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-pink-500 focus:border-transparent bg-white text-center"
                      required
                  />
              </div>
              <AnimatePresence>
                {isDurationActivitySelected && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <label htmlFor="duration" className="text-sm font-medium text-gray-700 mb-1 block">Duration (optional)</label>
                        <select
                            id="duration"
                            value={duration || ''}
                            onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-pink-500 focus:border-transparent bg-white text-center"
                        >
                            <option value="">No duration</option>
                            {durationOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
                <label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={activityTypes.includes('other') ? 'A description is required...' : 'Optional notes...'}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:border-transparent resize-none bg-white ${
                        activityTypes.includes('other') && isSubmitting
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-pink-500'
                    }`}
                    required={activityTypes.includes('other')}
                />
            </div>
        </form>
    </div>
  );
}
