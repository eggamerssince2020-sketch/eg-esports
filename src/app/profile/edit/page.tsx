// src/app/profile/edit/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { firestore, storage } from '@/app/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [gamertag, setGamertag] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch current user data to pre-fill the form
  useEffect(() => {
    if (!user) {
      router.push('/login'); // Protect the route
      return;
    }

    const fetchUserData = async () => {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setGamertag(data.gamertag);
        setBio(data.bio || '');
      }
    };
    fetchUserData();
  }, [user, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePicFile(e.target.files[0]);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      let newProfilePicUrl = null;

      // 2. If a new profile picture is selected, upload it to Firebase Storage
      if (profilePicFile) {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        await uploadBytes(storageRef, profilePicFile);
        newProfilePicUrl = await getDownloadURL(storageRef);
      }

      // 3. Prepare the data to be updated in Firestore
      const updatedData: any = { gamertag, bio };
      if (newProfilePicUrl) {
        updatedData.profilePictureUrl = newProfilePicUrl;
      }

      // 4. Update the user's document in Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, updatedData);
      
      router.push(`/profile/${user.uid}`); // Redirect to profile page
    } catch (err) {
      console.error("Error updating profile: ", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 mt-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Your Profile</h1>
      <form onSubmit={handleSaveChanges} className="bg-gray-800 p-8 rounded-lg">
        <div className="mb-4">
          <label htmlFor="gamertag" className="block font-bold mb-2">Gamertag</label>
          <input type="text" id="gamertag" value={gamertag} onChange={(e) => setGamertag(e.target.value)} className="w-full p-2 bg-gray-700 rounded"/>
        </div>
        <div className="mb-4">
          <label htmlFor="bio" className="block font-bold mb-2">Bio</label>
          <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-2 bg-gray-700 rounded h-32"/>
        </div>
        <div className="mb-6">
          <label htmlFor="profilePic" className="block font-bold mb-2">Profile Picture</label>
          <input type="file" id="profilePic" onChange={handleFileChange} accept="image/*" className="w-full p-2 bg-gray-700 rounded"/>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

