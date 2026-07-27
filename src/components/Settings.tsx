import PuppyProfile from './Profile';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { version } from '../../package.json';
import { useState } from 'react';

const Settings = () => {
  const [feedback, setFeedback] = useState('');
  const [msg, setMsg] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'feedback'), {
        version,
        feedback,
        createdAt: serverTimestamp(),
      });
      setMsg('Thank you for your feedback!');
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback', error);
      setMsg('Oops! Something went wrong.');
    }
  };

  const triggerShare = async () => {
    const shareData = {
      title: 'Junie‑pie Diaries',
      text: 'Add Junie‑pie to your Home screen for quick access!',
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.warn('Share cancelled', err);
      }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <PuppyProfile />

      {/* Feedback Section */}
      <div className="mt-8 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">App Version: {version}</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            placeholder="Leave any bug reports or feedback here..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            className="w-full h-32 p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-pink-500"
            required
          />
          <button
            type="submit"
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Submit Feedback
          </button>
        </form>
        {msg && <p className="mt-2 text-sm text-green-600">{msg}</p>}
      </div>

      {/* Home‑Screen Helper */}
      <div className="mt-8 border-t pt-4">
        <h2 className="text-lg font-semibold mb-2">📱 Add to Home Screen (iOS)</h2>
        <p className="text-sm text-gray-600 mb-3">
          Tap the button below – iOS will show the Share sheet where you can choose “Add to Home Screen”. This works on iOS 13+.
        </p>
        <button
          onClick={triggerShare}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M4 6h16M4 18h16"/></svg>
          Add to Home Screen
        </button>
      </div>

      {/* Fallback Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-sm w-full p-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">How to add to Home Screen</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-800">
              <li>Tap the <strong>Share</strong> icon (the square with an upward arrow).</li>
              <li>Scroll the sheet and tap <strong>Add to Home Screen</strong>.</li>
              <li>Confirm the name and tap <strong>Add</strong>.</li>
            </ol>
            <button
              onClick={() => setShowGuide(false)}
              className="mt-4 w-full px-3 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
