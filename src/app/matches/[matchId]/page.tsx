'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/app/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import ChatBox from '@/components/ChatBox'; // Import the ChatBox component

interface MatchDetails {
  game: string;
  type: string;
  creatorId: string;
  creatorGamertag: string;
  accepterId: string;
  accepterGamertag: string;
}

export default function MatchLobbyPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const { matchId } = use(params);

  useEffect(() => {
    const fetchMatchDetails = async () => {
      const matchDocRef = doc(firestore, 'challenges', matchId);
      const matchDocSnap = await getDoc(matchDocRef);
      if (matchDocSnap.exists()) {
        setMatch(matchDocSnap.data() as MatchDetails);
      }
      setLoading(false);
    };

    if (matchId) {
      fetchMatchDetails();
    }
  }, [matchId]);

  if (loading) {
    return <div className="text-center mt-10">Loading Match Lobby...</div>;
  }

  if (!match) {
    return <div className="text-center mt-10">Match not found.</div>;
  }
  
  // Basic authorization: ensure the current user is part of this match
  if (user && user.uid !== match.creatorId && user.uid !== match.accepterId) {
    return <div className="text-center mt-10 text-red-500">You do not have access to this lobby.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-2">Match Lobby</h1>
      <p className="text-gray-400 mb-8">Coordinate with your opponent to start the game.</p>
      
      <div className="bg-gray-800 p-8 rounded-lg">
        <h2 className="text-3xl font-bold text-center text-blue-400 mb-6">{match.game} - {match.type}</h2>
        <div className="flex justify-around items-center text-2xl">
          <Link href={`/profile/${match.creatorId}`} className="hover:underline">
            {match.creatorGamertag}
          </Link>
          <span className="text-gray-500 font-bold">VS</span>
          <Link href={`/profile/${match.accepterId}`} className="hover:underline">
            {match.accepterGamertag}
          </Link>
        </div>
        
        {/* The placeholder div is now replaced with the actual ChatBox component */}
        <ChatBox matchId={matchId} />

      </div>
    </div>
  );
}
