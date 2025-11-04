import { ActivityType } from '../lib/supabase';

interface FilterBarProps {
  selectedFilter: ActivityType | 'all';
  onFilterChange: (filter: ActivityType | 'all') => void;
}

const filterOptions: { value: ActivityType | 'all'; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '📋' },
  { value: 'meal', label: 'Meals', emoji: '🍖' },
  { value: 'wee', label: 'Wees', emoji: '💧' },
  { value: 'poo', label: 'Poos', emoji: '💩' },
  { value: 'walk', label: 'Walks', emoji: '🦮' },
  { value: 'play', label: 'Play', emoji: '🎾' },
  { value: 'sleep', label: 'Sleep', emoji: '😴' },
  { value: 'wake', label: 'Wake', emoji: '☀️' },
  { value: 'training', label: 'Training', emoji: '🎓' },
  { value: 'other', label: 'Other', emoji: '📝' },
];

export function FilterBar({ selectedFilter, onFilterChange }: FilterBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              selectedFilter === option.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{option.emoji}</span>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
