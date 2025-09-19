// src/components/CreateChallengeModal.tsx

'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/app/firebase';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';

// Define the props for our modal, including a function to close it
interface CreateChallengeModalProps {
  onClose: () => void;
}

export default function CreateChallengeModal({ onClose }: CreateChallengeModalProps) {
  const { user } = useAuth();
  const [game, setGame] = useState('');
  const [challengeType, setChallengeType] = useState('1v1'); // Default to 1v1
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to create a challenge.");
      return;
    }
    if (!game) {
      setError("Please specify the game for the challenge.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Fetch the creator's gamertag to store in the challenge document
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const gamertag = userDocSnap.exists() ? userDocSnap.data().gamertag : "Unknown Player";

      // Add a new document to the 'challenges' collection
      await addDoc(collection(firestore, 'challenges'), {
        creatorId: user.uid,
        creatorGamertag: gamertag,
        game: game,
        type: challengeType,
        status: 'open', // 'open', 'accepted', 'completed'
        createdAt: serverTimestamp(),
      });
      
      onClose(); // Close the modal on success
    } catch (err) {
      console.error("Error creating challenge: ", err);
      setError("Failed to create challenge. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Create a New Challenge</h2>
        <form onSubmit={handleCreateChallenge}>
          <div className="mb-4">
            <label htmlFor="game" className="block font-bold mb-2">Game</label>
            <input 
              id="game"
              type="text"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              placeholder="e.g., Valorant, League of Legends"
              className="w-full p-2 bg-gray-700 rounded"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="challengeType" className="block font-bold mb-2">Challenge Type</label>
            <select
              id="challengeType"
              value={challengeType}
              onChange={(e) => setChallengeType(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded"
            >
              <option value="1v1">1v1 Duel</option>
              <option value="2v2">2v2</option>
              <option value="5v5 Team">5v5 Team</option>
            </select>
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">
              {loading ? 'Posting...' : 'Post Challenge'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
