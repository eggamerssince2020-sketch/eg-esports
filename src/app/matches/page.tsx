// src/app/matches/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/app/firebase';
// 'Query' import is removed as it was unused
import { collection, query, where, getDocs } from 'firebase/firestore'; 
import Link from 'next/link';

interface Match {
  id: string;
  creatorGamertag: string;
  accepterGamertag?: string;
  game: string;
  type: string;
  status: 'accepted' | 'completed';
}

export default function MyMatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) {
      if (!authLoading) setLoading(false);
      return;
    }

    const fetchMatches = async () => {
      setLoading(true);
      try {
        const createdQuery = query(
          collection(firestore, 'challenges'),
          where('status', '==', 'accepted'),
          where('creatorId', '==', user.uid)
        );
        const acceptedQuery = query(
          collection(firestore, 'challenges'),
          where('status', '==', 'accepted'),
          where('accepterId', '==', user.uid)
        );

        const [createdSnapshot, acceptedSnapshot] = await Promise.all([
          getDocs(createdQuery),
          getDocs(acceptedQuery),
        ]);

        const matchesData: Match[] = [];
        const matchIds = new Set<string>();

        createdSnapshot.forEach((doc) => {
          if (!matchIds.has(doc.id)) {
            matchesData.push({ id: doc.id, ...doc.data() } as Match);
            matchIds.add(doc.id);
          }
        });

        acceptedSnapshot.forEach((doc) => {
          if (!matchIds.has(doc.id)) {
            matchesData.push({ id: doc.id, ...doc.data() } as Match);
            matchIds.add(doc.id);
          }
        });
        setMatches(matchesData);
      } catch (error) { // The 'any' type is removed here
        console.error("Failed to fetch matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [user, authLoading]);

  // ... (rest of the component remains the same)
  if (loading) {
    return <div className="text-center mt-10">Loading your matches...</div>;
  }

  if (!user) {
    return <div className="text-center mt-10">Please log in to see your matches.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">My Ongoing Matches</h1>
      {matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => (
            <div key={match.id} className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-blue-400">{match.game}</h3>
              <p className="mt-2">
                {match.creatorGamertag} vs {match.accepterGamertag}
              </p>
              <p className="text-gray-400 text-sm">{match.type}</p>
              <Link href={`/matches/${match.id}`} className="block mt-4 text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Go to Match Lobby
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p>You have no ongoing matches. Go accept a challenge!</p>
      )}
    </div>
  );
}
