// src/app/teams/create/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/app/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export default function CreateTeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [teamName, setTeamName] = useState('');
  const [teamTag, setTeamTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create a team.");
      return;
    }
    if (!teamName || !teamTag) {
      setError("Please fill out both team name and team tag.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Fetch the creator's gamertag to store on the team document
      const userDocSnap = await getDoc(doc(firestore, 'users', user.uid));
      if (!userDocSnap.exists()) {
        throw new Error("User profile not found.");
      }
      const captainGamertag = userDocSnap.data().gamertag;

      // Add the new team document to the 'teams' collection
      const teamDocRef = await addDoc(collection(firestore, 'teams'), {
        teamName,
        teamTag,
        captainId: user.uid,
        captainGamertag,
        members: [user.uid], // The creator is the first member
        createdAt: serverTimestamp(),
      });
      
      // Redirect to the newly created team's profile page
      router.push(`/teams/${teamDocRef.id}`);

    } catch (err) {
      console.error("Error creating team: ", err);
      setError("Failed to create team. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 mt-10 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center">Create Your Team</h1>
      <form onSubmit={handleCreateTeam} className="bg-gray-800 p-8 rounded-lg shadow-xl">
        <div className="mb-4">
          <label htmlFor="teamName" className="block text-white font-bold mb-2">Team Name</label>
          <input
            id="teamName"
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g., Envy Gaming"
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="teamTag" className="block text-white font-bold mb-2">Team Tag</label>
          <input
            id="teamTag"
            type="text"
            value={teamTag}
            onChange={(e) => setTeamTag(e.target.value)}
            placeholder="e.g., Envy"
            maxLength={5}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none disabled:bg-gray-500">
          {loading ? 'Creating Team...' : 'Create Team'}
        </button>
      </form>
    </div>
  );
}
