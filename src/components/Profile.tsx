import { useState } from 'react';
import { Edit, Save } from 'lucide-react';

const PuppyProfile = () => {
  const [puppyName, setPuppyName] = useState('Junie');
  const [breed, setBreed] = useState('Golden Retriever');
  const [birthday, setBirthday] = useState('2023-06-01');
  const [isEditing, setIsEditing] = useState(false);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    setIsEditing(false);
    // Here you would typically save the updated data
  };

  return (
    <div className="p-4 rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Puppy Profile</h2>
        {!isEditing ? (
          <button onClick={handleEditClick} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-pink-600 bg-pink-100 rounded-lg">
            <Edit size={14} />
            <span>Edit</span>
          </button>
        ) : (
          <button onClick={handleSaveClick} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-pink-600 rounded-lg">
            <Save size={14} />
            <span>Save</span>
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">Name</label>
          <input 
            type="text" 
            value={puppyName}
            onChange={(e) => setPuppyName(e.target.value)}
            readOnly={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm ${!isEditing ? 'bg-gray-100' : ''}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Breed</label>
          <input 
            type="text" 
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            readOnly={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm ${!isEditing ? 'bg-gray-100' : ''}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Birthday</label>
          <input 
            type="date" 
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            readOnly={!isEditing}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm ${!isEditing ? 'bg-gray-100' : ''}`}
          />
        </div>
      </div>
    </div>
  );
};

export default PuppyProfile;
