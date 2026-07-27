import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PuppyProfile = () => {
  const [puppyName, setPuppyName] = useState('Junie');
  const [breed, setBreed] = useState('Golden Retriever');
  const [birthday, setBirthday] = useState('2023-06-01');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'puppy_profile', 'junie');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.puppyName) setPuppyName(data.puppyName);
          if (data.breed) setBreed(data.breed);
          if (data.birthday) setBirthday(data.birthday);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const docRef = doc(db, 'puppy_profile', 'junie');
      await setDoc(docRef, { puppyName, breed, birthday }, { merge: true });
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveMessage('Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Puppy Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input 
            type="text" 
            value={puppyName}
            onChange={(e) => setPuppyName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Breed</label>
          <input 
            type="text" 
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2 border"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Birthday</label>
          <input 
            type="date" 
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2 border"
          />
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full mt-4 bg-pink-600 text-white rounded-lg py-2 font-semibold hover:bg-pink-700 disabled:bg-pink-400"
        >
          {isSaving ? 'Saving...' : 'Save Profile'}
        </button>
        {saveMessage && <p className="text-sm text-center text-green-600 mt-2">{saveMessage}</p>}
      </div>
    </div>
  );
};

export default PuppyProfile;
