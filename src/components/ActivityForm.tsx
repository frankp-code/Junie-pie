import { useEffect, useState } from 'react';
import { ActivityType } from '../lib/types';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MultiDatePicker } from './MultiDatePicker';

interface ActivityFormProps {
  onSubmit: (activityTypes: ActivityType[], activityTime: string | string[], notes: string, endTime?: string) => Promise<void>;
  onBack: () => void;
  date: Date | null;
}

const activityOptions: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'meal', label: 'Meal', emoji: '🥣' },
  { value: 'walk', label: 'Walk', emoji: '🦮' },
  { value: 'play', label: 'Play', emoji: '🎾' },
  { value: 'training', label: 'Training', emoji: '🎓' },
  { value: 'sleep', label: 'Sleep', emoji: '😴' },
  { value: 'chew', label: 'Chew', emoji: '🦴' },
  { value: 'med', label: 'Med', emoji: '💊' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

const toiletActivityOptions: { value: ActivityType; label: string; emoji: string }[] = [
    { value: 'wee', label: 'Wee', emoji: '💧' },
    { value: 'poo', label: 'Poo', emoji: '💩' },
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
  const [medDates, setMedDates] = useState<Date[]>([]);
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isToiletMenuOpen, setIsToiletMenuOpen] = useState(false);
  const [notesError, setNotesError] = useState(false);

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
      if (activityType === 'med') {
          return prev.includes('med') ? [] : ['med'];
      }
      if (activityType === 'sleep') {
        return prev.includes('sleep') ? [] : ['sleep'];
      }
      if (prev.includes('sleep') || prev.includes('med')) {
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
    if (activityTypes.includes('med') && medDates.length === 0) {
        alert('Please select at least one date for the \'Med\' activity.');
        return;
    }
    if ((activityTypes.includes('other') || activityTypes.includes('med')) && notes.trim() === '') {
      setNotesError(true);
      return;
    }
    setIsSubmitting(true);
    try {
        let endTime: string | undefined = undefined;
        if (isDurationActivitySelected && duration) {
            const startTime = new Date(activityTime);
            const endTimeDate = new Date(startTime.getTime() + duration * 60000);
            endTime = endTimeDate.toISOString();
        }

        const timeToSubmit = activityTypes.includes('med') 
            ? medDates.map(d => {
                const date = new Date(d);
                date.setHours(0, 0, 0, 0);
                return date.toISOString();
            }) 
            : activityTime;

        await onSubmit(activityTypes, timeToSubmit, notes, endTime);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDurationActivitySelected = activityTypes.includes('walk') || activityTypes.includes('sleep');
  const isMedActivitySelected = activityTypes.includes('med');

  return (
    <div>
        <AnimatePresence>
            {isToiletMenuOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setIsToiletMenuOpen(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-xl p-6"
                    >
                        <div className="flex justify-center gap-4">
                            {toiletActivityOptions.map(option => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        handleActivityTypeToggle(option.value);
                                        setIsToiletMenuOpen(false);
                                    }}
                                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all text-center w-24 h-24 ${
                                        activityTypes.includes(option.value)
                                        ? 'border-pink-500 bg-pink-50'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                                >
                                    <span className="text-4xl">{option.emoji}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

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

        <form id="activity-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Activity Type (select one or more)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    <button
                        type="button"
                        onClick={() => setIsToiletMenuOpen(true)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all text-center ${(
                            activityTypes.includes('wee') || activityTypes.includes('poo'))
                            ? 'border-pink-500 bg-pink-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                        <span className="text-2xl">🚽</span>
                        <span className="text-xs font-medium text-gray-800 mt-1">Toilet</span>
                    </button>
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

            <AnimatePresence>
                {isMedActivitySelected && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        <MultiDatePicker selectedDates={medDates} onDateChange={setMedDates} />
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
            {!isMedActivitySelected && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    <div>
                        <label htmlFor="activityTime" className="text-sm font-medium text-gray-700 mb-1 block">Start Time</label>
                        <input
                            type="datetime-local"
                            id="activityTime"
                            value={activityTime}
                            onChange={(e) => setActivityTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-pink-500 focus:border-transparent bg-white text-center"
                            required={!isMedActivitySelected}
                        />
                    </div>
                    {isDurationActivitySelected && (
                        <div>
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
                        </div>
                    )}
                </motion.div>
            )}
            </AnimatePresence>

            <div>
                <label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => {
                        setNotes(e.target.value);
                        if (notesError) setNotesError(false);
                    }}
                    placeholder={(activityTypes.includes('other') || activityTypes.includes('med')) ? 'A description is required...' : 'Optional notes...'}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:border-transparent resize-none bg-white ${
                        notesError
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-pink-500'
                    }`}
                />
            </div>
        </form>
    </div>
  );
}
