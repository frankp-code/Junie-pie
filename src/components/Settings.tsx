import PuppyProfile from './Profile';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { version } from '../../package.json';
import { useState } from 'react';

const Settings = () => {
  const [feedback, setFeedback] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'feedback'), {
        version,
        feedback,
        createdAt: serverTimestamp()
      });
      setMsg('Thank you for your feedback!');
      setFeedback('');
    } catch (error) {
      console.error('Error submitting feedback', error);
      setMsg('Oops! Something went wrong.');
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <PuppyProfile />
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
    </div>
  );
};

export default Settings;
