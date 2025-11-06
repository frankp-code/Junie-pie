import { Droplets, Droplet, Soup } from 'lucide-react';
import { ActivityType } from '../lib/types';

interface QuickLogProps {
  onQuickLog: (activityType: ActivityType) => void;
}

const quickLogActivities: { type: ActivityType; label: string; icon: React.ReactNode }[] = [
  { type: 'wee', label: 'Wee', icon: <Droplets size={24} /> },
  { type: 'poo', label: 'Poo', icon: <Droplet size={24} /> },
  { type: 'meal', label: 'Meal', icon: <Soup size={24} /> },
];

export const QuickLog = ({ onQuickLog }: QuickLogProps) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">Quick Log</h3>
      <div className="flex justify-around">
        {quickLogActivities.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => onQuickLog(type)}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-pink-600 transition-colors"
          >
            <div className="p-3 bg-gray-100 rounded-full">
              {icon}
            </div>
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
