'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/app/firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import Link from 'next/link';

interface Team {
  id: string;
  teamName: string;
  teamTag: string;
  captainId: string;
  captainGamertag: string;
}

export default function MyTeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserTeams = async () => {
      setLoading(true);
      setError(''); // Reset error on fetch
      try {
        const teamsRef = collection(firestore, 'teams');
        const q = query(teamsRef, where('members', 'array-contains', user.uid));
        
        const querySnapshot = await getDocs(q);
        const userTeams = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Team));
        
        setTeams(userTeams);
      } catch (err) {
        console.error("Error fetching user's teams:", err);
        setError("Failed to load your teams. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserTeams();
  }, [user]);

  // --- NEW FUNCTION: Handle Leaving a Team ---
  const handleLeaveTeam = async (teamId: string) => {
    if (!user || !window.confirm("Are you sure you want to leave this team?")) return;

    try {
      const teamDocRef = doc(firestore, 'teams', teamId);
      // Atomically remove the user's UID from the members array
      await updateDoc(teamDocRef, {
        members: arrayRemove(user.uid)
      });
      // Update the UI instantly by filtering out the left team
      setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
    } catch (err) {
      console.error("Error leaving team:", err);
      setError("Failed to leave team. Please try again.");
    }
  };

  // --- NEW FUNCTION: Handle Deleting a Team (Captain Only) ---
  const handleDeleteTeam = async (teamId: string) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY DELETE this team? This action cannot be undone.")) return;

    try {
      const teamDocRef = doc(firestore, 'teams', teamId);
      await deleteDoc(teamDocRef); // Deletes the entire team document
      // Update the UI instantly
      setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
    } catch (err) {
      console.error("Error deleting team:", err);
      setError("Failed to delete team. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading your teams...</div>;
  }

  if (!user) {
    return <div className="text-center mt-10">Please log in to see your teams.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">My Teams</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {teams.length > 0 ? (
        <div className="space-y-4">
          {teams.map(team => {
            const isCaptain = user.uid === team.captainId;
            return (
              <div key={team.id} className="bg-gray-800 p-5 rounded-lg shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Team Info */}
                  <Link href={`/teams/${team.id}`} className="flex-grow">
                    <h2 className="text-2xl font-bold text-blue-400 hover:underline">
                      <span className="text-gray-400">[{team.teamTag}]</span> {team.teamName}
                    </h2>
                    <p className="text-gray-400 mt-1">Led by {team.captainGamertag}</p>
                  </Link>

                  {/* Action Buttons */}
                  <div className="flex-shrink-0">
                    {isCaptain ? (
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded transition-colors"
                      >
                        Delete Team
                      </button>
                    ) : (
                      <button
                        onClick={() => handleLeaveTeam(team.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-3 rounded transition-colors"
                      >
                        Leave Team
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <p className="text-lg">You are not part of any teams yet.</p>
          <Link href="/teams/create" className="text-blue-400 hover:underline mt-2 inline-block">
            Why not create one?
          </Link>
        </div>
      )}
    </div>
  );
}
