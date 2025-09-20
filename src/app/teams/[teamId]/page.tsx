'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { firestore } from '@/app/firebase';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import InviteMember from '@/components/InviteMember'; // Import the new component

// Define types for our data
interface Team {
  teamName: string;
  teamTag: string;
  captainId: string;
  captainGamertag: string;
  members: string[]; // Array of user UIDs
}

interface MemberProfile {
  uid: string;
  gamertag: string;
}

export default function TeamProfilePage({ params }: { params: Promise<{ teamId: string }> }) {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { teamId } = use(params);

  useEffect(() => {
    if (!teamId) return;

    const fetchTeamAndMembers = async () => {
      setLoading(true);
      
      // 1. Fetch the team data
      const teamDocRef = doc(firestore, 'teams', teamId);
      const teamDocSnap = await getDoc(teamDocRef);

      if (!teamDocSnap.exists()) {
        setLoading(false);
        return;
      }
      
      const teamData = teamDocSnap.data() as Team;
      setTeam(teamData);

      // 2. Fetch the profiles of the members
      if (teamData.members && teamData.members.length > 0) {
        const membersQuery = query(collection(firestore, 'users'), where('uid', 'in', teamData.members));
        const membersSnapshot = await getDocs(membersQuery);
        const membersData = membersSnapshot.docs.map(doc => doc.data() as MemberProfile);
        setMembers(membersData);
      }
      
      setLoading(false);
    };

    fetchTeamAndMembers();
  }, [teamId]);

  if (loading) {
    return <div className="text-center mt-10">Loading Team Profile...</div>;
  }

  if (!team) {
    return <div className="text-center mt-10 text-red-500">Team not found.</div>;
  }

  const isCaptain = user && user.uid === team.captainId;

  return (
    <div className="container mx-auto p-4 mt-10 max-w-4xl">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="text-gray-400">[{team.teamTag}]</span> {team.teamName}
        </h1>
        <p className="text-lg text-gray-400 mb-8">
          Led by <Link href={`/profile/${team.captainId}`} className="text-blue-400 hover:underline">{team.captainGamertag}</Link>
        </p>

        <h2 className="text-3xl font-semibold border-b border-gray-600 pb-2 mb-4">Roster</h2>
        <ul className="space-y-3">
          {members.map((member) => (
            <li key={member.uid} className="bg-gray-700 p-3 rounded-md">
              <Link href={`/profile/${member.uid}`} className="text-lg text-blue-300 hover:underline">
                {member.gamertag} {member.uid === team.captainId && <span className="text-yellow-400 text-sm ml-2">(Captain)</span>}
              </Link>
            </li>
          ))}
        </ul>

        {/* --- THIS IS THE NEWLY ADDED PART --- */}
        {/* Conditionally render the InviteMember component only for the team captain */}
        {isCaptain && (
          <InviteMember 
            teamId={teamId} 
            teamName={team.teamName}
            currentMembers={team.members}
          />
        )}
      </div>
    </div>
  );
}
