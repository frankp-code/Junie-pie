import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface SplashScreenProps {
  onAuthenticated: () => void;
}

export function SplashScreen({ onAuthenticated }: SplashScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === 'junebugwibble') {
      const date = new Date();
      date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
      const expires = `expires=${date.toUTCString()}`;
      document.cookie = `junebug_authenticated=true;${expires};path=/`;
      onAuthenticated();
    } else {
      setError(true);
      setPasscode('');
    }
  };

  return (
    <div className="min-h-screen bg-pink-50 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <img src="/june.png" alt="June" className="w-24 h-24 rounded-full mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800">The June-bug Diaries 💕</h1>
        <p className="text-gray-600">Please enter the passcode to continue.</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-xs">
        <div className="relative">
          <input
            type={showPasscode ? 'text' : 'password'}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className={`w-full px-4 py-2 text-center border rounded-lg focus:ring-1 focus:border-transparent ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-pink-500'}`}
            placeholder="Enter passcode"
          />
          <button
            type="button"
            onClick={() => setShowPasscode(!showPasscode)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-gray-700"
          >
            {showPasscode ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm text-center mt-2">Incorrect passcode. Please try again.</p>}
        <button type="submit" className="w-full mt-4 bg-pink-600 text-white rounded-lg py-2 font-semibold hover:bg-pink-700">
          Unlock
        </button>
      </form>
    </div>
  );
}
