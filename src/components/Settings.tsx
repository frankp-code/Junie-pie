import { useState } from 'react';
import PuppyProfile from './Profile';

const Settings = () => {
  const [theme, setTheme] = useState('junie');

  const handleThemeChange = (event) => {
    setTheme(event.target.value);
    // Later, we will add logic here to apply the theme to the app
  };

  return (
    <div className="p-4">
      <PuppyProfile />
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Theme</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Select Theme</label>
            <select 
              value={theme} 
              onChange={handleThemeChange} 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
            >
              <option value="junie">Junie</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
