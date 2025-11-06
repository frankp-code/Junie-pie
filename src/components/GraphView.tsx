import { ArrowLeft } from 'lucide-react';

interface GraphViewProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export function GraphView({ title, onBack, children }: GraphViewProps) {
  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-xl font-bold text-gray-800 ml-2">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}
