import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ActivityType } from '../lib/supabase';

interface ActivityFormProps {
  onSubmit: (activityType: ActivityType, activityTime: string, notes: string) => Promise<void>;
}

const activityOptions: { value: ActivityType; label: string; emoji: string }[] = [
  { value: 'meal', label: 'Meal', emoji: '🍖' },
  { value: 'wee', label: 'Wee', emoji: '💧' },
  { value: 'poo', label: 'Poo', emoji: '💩' },
  { value: 'walk', label: 'Walk', emoji: '🦮' },
  { value: 'play', label: 'Playtime', emoji: '🎾' },
  { value: 'sleep', label: 'Sleep', emoji: '😴' },
  { value: 'wake', label: 'Wake', emoji: '☀️' },
  { value: 'training', label: 'Training', emoji: '🎓' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

export function ActivityForm({ onSubmit }: ActivityFormProps) {
  const [activityType, setActivityType] = useState<ActivityType>('meal');
  const [activityTime, setActivityTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activityType === 'other' && notes.trim() === '') {
      alert('Please enter a note when selecting "Other"');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(activityType, activityTime, notes);
      setNotes('');
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setActivityTime(now.toISOString().slice(0, 16));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Log Activity</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Activity Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {activityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setActivityType(option.value)}
              className={`p-3 rounded-lg border-2 transition-all ${
                activityType === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{option.emoji}</div>
              <div className="text-xs font-medium">{option.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="activityTime" className="block text-sm font-medium text-gray-700 mb-2">
          Time
        </label>
        <input
          type="datetime-local"
          id="activityTime"
          value={activityTime}
          onChange={(e) => setActivityTime(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          {activityType === 'other' ? 'Description' : 'Notes'} {activityType === 'other' && <span className="text-red-500">*</span>}
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={activityType === 'other' ? 'Please describe the activity...' : 'Add any additional details...'}
          rows={3}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent resize-none ${
            activityType === 'other' && notes.trim() === ''
              ? 'border-red-300 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          required={activityType === 'other'}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Plus size={20} />
        {isSubmitting ? 'Logging...' : 'Log Activity'}
      </button>
    </form>
  );
}
