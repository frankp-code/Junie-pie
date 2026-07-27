import { useState, useEffect } from 'react';
import { compressImage } from '../lib/imageUtils';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { WeightEntry } from '../lib/types';
import { Trash2, Plus, Camera } from 'lucide-react';

const PuppyProfile = () => {
  const [puppyName, setPuppyName] = useState('Junie');
  const [breed, setBreed] = useState('Golden Retriever');
  const [birthday, setBirthday] = useState('2023-06-01');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('/june.png');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingWeight, setIsAddingWeight] = useState(false);

  const fetchWeights = async () => {
    try {
      const q = query(collection(db, 'puppy_weight'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const weightData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeightEntry));
      setWeights(weightData);
    } catch (error) {
      console.error("Error fetching weights:", error);
    }
  };

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
          if (data.profilePhotoUrl) setProfilePhotoUrl(data.profilePhotoUrl);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
    fetchWeights();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const docRef = doc(db, 'puppy_profile', 'junie');
      await setDoc(docRef, { puppyName, breed, birthday, profilePhotoUrl }, { merge: true });
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveMessage('Failed to save.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploadingPhoto(true);
      try {
        const base64Image = await compressImage(file);
        
        const docRef = doc(db, 'puppy_profile', 'junie');
        await setDoc(docRef, { profilePhotoUrl: base64Image }, { merge: true });
        setProfilePhotoUrl(base64Image);
      } catch (error) {
        console.error("Error uploading photo:", error);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleAddWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || isNaN(Number(newWeight))) return;
    setIsAddingWeight(true);
    try {
      await addDoc(collection(db, 'puppy_weight'), {
        weight_kg: Number(newWeight),
        date: newWeightDate
      });
      setNewWeight('');
      await fetchWeights();
    } catch (error) {
      console.error("Error adding weight:", error);
    } finally {
      setIsAddingWeight(false);
    }
  };

  const handleDeleteWeight = async (id: string) => {
    if (!confirm('Delete this weight entry?')) return;
    try {
      await deleteDoc(doc(db, 'puppy_weight', id));
      await fetchWeights();
    } catch (error) {
      console.error("Error deleting weight:", error);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Puppy Profile</h2>
        
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img src={profilePhotoUrl} alt="Puppy Profile" className="w-32 h-32 rounded-full object-cover border-4 border-pink-100 shadow-sm" />
            <label className="absolute bottom-0 right-0 bg-pink-600 text-white p-2 rounded-full cursor-pointer hover:bg-pink-700 shadow-md transition-colors">
              <Camera size={16} />
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} />
            </label>
          </div>
          {isUploadingPhoto && <p className="text-sm text-pink-600 mt-2 font-medium">Uploading...</p>}
        </div>

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
            className="w-full mt-4 bg-pink-600 text-white rounded-lg py-2 font-semibold hover:bg-pink-700 disabled:bg-pink-400 transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
          {saveMessage && <p className="text-sm text-center text-green-600 mt-2 font-medium">{saveMessage}</p>}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Weight Tracker</h2>
        <form onSubmit={handleAddWeight} className="flex gap-2 mb-6">
          <input 
            type="date" 
            value={newWeightDate}
            onChange={(e) => setNewWeightDate(e.target.value)}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2 border"
            required
          />
          <input 
            type="number" 
            step="0.1"
            placeholder="Weight (kg)"
            value={newWeight}
            onChange={(e) => setNewWeight(e.target.value)}
            className="w-28 rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm p-2 border"
            required
          />
          <button 
            type="submit"
            disabled={isAddingWeight}
            className="bg-pink-600 text-white p-2 rounded-lg hover:bg-pink-700 disabled:bg-pink-400 transition-colors flex items-center justify-center"
          >
            <Plus size={20} />
          </button>
        </form>

        <div className="space-y-2">
          {weights.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No weight entries yet.</p>
          ) : (
            weights.map((w) => (
              <div key={w.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <span className="font-semibold text-gray-800">{w.weight_kg} kg</span>
                  <span className="text-sm text-gray-500 ml-2">{new Date(w.date).toLocaleDateString()}</span>
                </div>
                <button onClick={() => handleDeleteWeight(w.id)} className="text-gray-400 hover:text-red-500 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-8 flex justify-center">
        <button 
          onClick={() => {
            document.cookie = 'junebug_authenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.reload();
          }}
          className="text-red-500 font-semibold hover:text-red-600 px-4 py-2"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default PuppyProfile;
