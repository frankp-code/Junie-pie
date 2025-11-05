import { useEffect, useState } from 'react';
import { ActivityType } from '../lib/types';
import { ArrowLeft } from 'lucide-react';

interface ActivityFormProps {
  onSubmit: (activityType: ActivityType, activityTime: string, notes: string) => Promise<void>;
  onBack: () => void;
  date: Date | null;
}

const activityOptions: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'wee', label: 'Wee', emoji: '💧' },
  { value: 'poo', label: 'Poo', emoji: '💩' },
  { value: 'meal', label: 'Meal', emoji: '🍖' },
  { value: 'walk', label: 'Walk', emoji: '🦮' },
  { value: 'play', label: 'Play', emoji: '🎾' },
  { value: 'training', label: 'Training', emoji: '🎓' },
  { value: 'sleep', label: 'Sleep', emoji: '😴' },
  { value: 'wake', label: 'Wake', emoji: '☀️' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

export function ActivityForm({ onSubmit, onBack, date }: ActivityFormProps) {
  const [activityType, setActivityType] = useState<ActivityType>('wee');
  const [activityTime, setActivityTime] = useState(() => {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setMinutes(targetDate.getMinutes() - targetDate.getTimezoneOffset());
    if (!date) {
        // If it's a new activity for today, set it to the current time.
        return targetDate.toISOString().slice(0, 16);
    }
    // If it's for a past date, set it to the beginning of that day.
    targetDate.setHours(9, 0, 0, 0);
    return targetDate.toISOString().slice(0, 16);
  });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activityType === 'other' && notes.trim() === '') {
      alert('Please enter a description for the "Other" activity.');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(activityType, activityTime, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <label className="text-sm font-medium text-gray-700 mb-2 block">Activity Type</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {activityOptions.map((option) => (
                        <button
                        key={option.value}
                        type="button"
                        onClick={() => setActivityType(option.value)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all text-center ${
                            activityType === option.value
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

            <div>
                <label htmlFor="activityTime" className="text-sm font-medium text-gray-700 mb-1 block">Time</label>
                <input
                    type="datetime-local"
                    id="activityTime"
                    value={activityTime}
                    onChange={(e) => setActivityTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-pink-500 focus:border-transparent bg-white text-center"
                    required
                />
            </div>

            <div>
                <label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={activityType === 'other' ? 'A description is required...' : 'Optional notes...'}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:border-transparent resize-none bg-white ${
                        activityType === 'other' && isSubmitting
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-pink-500'
                    }`}
                    required={activityType === 'other'}
                />
            </div>
        </form>
    </div>
  );
}
