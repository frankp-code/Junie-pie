import { useState } from 'react';

const PuppyProfile = () => {
  const [puppyName, setPuppyName] = useState('Junie');
  const [breed, setBreed] = useState('Golden Retriever');
  const [birthday, setBirthday] = useState('2023-06-01');

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
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Breed</label>
          <input 
            type="text" 
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Birthday</label>
          <input 
            type="date" 
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default PuppyProfile;
