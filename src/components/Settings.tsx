import PuppyProfile from "./Profile";

interface SettingsProps {
  theme: string;
  setTheme: (theme: string) => void;
}

const Settings = ({ theme, setTheme }: SettingsProps) => {

  return (
    <div className="space-y-8">
      <PuppyProfile />
      <div className="p-4 rounded-lg bg-white shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Theme</h2>
        <div className="flex justify-around p-2 bg-gray-100 rounded-lg">
          <button 
            onClick={() => setTheme('light')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'light' ? 'bg-pink-600 text-white shadow-md' : 'bg-transparent text-gray-700'}`}>
              Light
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-pink-600 text-white shadow-md' : 'bg-transparent text-gray-700'}`}>
              Dark
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
