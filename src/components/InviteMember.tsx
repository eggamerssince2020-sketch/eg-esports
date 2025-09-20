'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/app/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface InviteMemberProps {
  teamId: string;
  teamName: string;
  currentMembers: string[];
}

export default function InviteMember({ teamId, teamName, currentMembers }: InviteMemberProps) {
  const { user } = useAuth();
  const [inviteeGamertag, setInviteeGamertag] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!user || !inviteeGamertag) {
      setError('Please enter a gamertag.');
      setLoading(false);
      return;
    }

    try {
      // 1. Find the user to invite by their gamertag
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('gamertag', '==', inviteeGamertag));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("No player found with that gamertag.");
      }

      const inviteeDoc = querySnapshot.docs[0];
      const inviteeId = inviteeDoc.id;

      // 2. Check if the player is already in the team
      if (currentMembers.includes(inviteeId)) {
        throw new Error("This player is already on your team.");
      }

      // 3. Create the invitation document
      await addDoc(collection(firestore, 'invitations'), {
        teamId: teamId,
        teamName: teamName,
        fromUserId: user.uid,
        toUserId: inviteeId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      // Create a notification for the invited player
      const notificationRef = collection(firestore, 'users', inviteeId, 'notifications');
      await addDoc(notificationRef, {
        message: `You have been invited to join the team: ${teamName}`,
        link: '/invitations',
        read: false,
        createdAt: serverTimestamp(),
      });

      setSuccess(`Invitation sent to ${inviteeGamertag}!`);
      setInviteeGamertag('');

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 border-t border-gray-600 pt-6">
      <h3 className="text-2xl font-semibold mb-4">Invite a New Member</h3>
      <form onSubmit={handleInvite}>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={inviteeGamertag}
            onChange={(e) => setInviteeGamertag(e.target.value)}
            placeholder="Enter player's gamertag"
            className="flex-grow p-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
          <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-500">
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-2">{success}</p>}
      </form>
    </div>
  );
}
