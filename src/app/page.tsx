// src/app/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import CreateChallengeModal from '@/components/CreateChallengeModal';
import { firestore } from './firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';

interface Challenge {
  id: string;
  creatorId: string;
  creatorGamertag: string;
  game: string;
  type: string;
  status: 'open' | 'accepted' | 'completed';
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth(); // Get user and authentication loading state
  const [showModal, setShowModal] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengesLoading, setChallengesLoading] = useState(true);

  // THIS IS THE KEY CHANGE
  // This useEffect now depends on 'user' and 'authLoading'.
  // It will only run AFTER firebase has confirmed the user's login status.
  useEffect(() => {
    // If auth is still loading, do nothing.
    if (authLoading) return;

    // If there is no user, there's nothing to listen to.
    // Set loading to false and show the logged-out view.
    if (!user) {
      setChallenges([]);
      setChallengesLoading(false);
      return;
    }
    
    // If we get here, we have a logged-in user. It is now safe to attach the listener.
    const q = query(collection(firestore, 'challenges'), where('status', '==', 'open'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const challengesData: Challenge[] = [];
      querySnapshot.forEach((doc) => {
        challengesData.push({ id: doc.id, ...doc.data() } as Challenge);
      });
      setChallenges(challengesData);
      setChallengesLoading(false);
    });

    // Cleanup function will be returned and called when the component unmounts
    // or when the user logs out (causing this useEffect to re-run).
    return () => unsubscribe();

  }, [user, authLoading]); // Dependency array is crucial

  const handleAcceptChallenge = async (challengeId: string) => {
    // ... (This function remains the same as before)
    if (!user) {
      alert("You must be logged in to accept a challenge.");
      return;
    }

    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge?.creatorId === user.uid) {
      alert("You cannot accept your own challenge.");
      return;
    }

    try {
      const challengeRef = doc(firestore, 'challenges', challengeId);
      const accepterDoc = await getDoc(doc(firestore, 'users', user.uid));
      const accepterGamertag = accepterDoc.exists() ? accepterDoc.data().gamertag : "Challenger";

      await updateDoc(challengeRef, {
        status: 'accepted',
        accepterId: user.uid,
        accepterGamertag: accepterGamertag,
      });

      alert(`Challenge accepted! Get ready to play against ${challenge?.creatorGamertag}.`);

    } catch (error) {
      console.error("Error accepting challenge: ", error);
      alert("Failed to accept the challenge. Please try again.");
    }
  };

  // UI to show while authentication is being checked
  if (authLoading) {
    return <div className="text-center mt-10">Authenticating...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Live Challenge Board</h1>
        {user && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            + Create Challenge
          </button>
        )}
      </div>

      {showModal && <CreateChallengeModal onClose={() => setShowModal(false)} />}

      {/* Conditional rendering based on login state */}
      {!user ? (
        <div className="text-center bg-gray-800 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Welcome to EG ESPORTS!</h2>
          <p>Please log in or sign up to view and accept challenges.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challengesLoading ? (
            <p>Loading challenges...</p>
          ) : challenges.length > 0 ? (
            challenges.map((challenge) => (
              <div key={challenge.id} className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-blue-400">{challenge.game}</h3>
                  <p className="text-gray-300">{challenge.type}</p>
                  <p className="text-sm text-gray-400 mt-2">Posted by: {challenge.creatorGamertag}</p>
                </div>
                <button
                  onClick={() => handleAcceptChallenge(challenge.id)}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Accept Challenge
                </button>
              </div>
            ))
          ) : (
            <p>No open challenges right now. Why not create one?</p>
          )}
        </div>
      )}
    </div>
  );
}
