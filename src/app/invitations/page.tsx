'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/app/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  runTransaction, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';

// Updated interface to include fromUserId for notifications
interface Invitation {
  id: string;
  teamId: string;
  teamName: string;
  fromUserId: string; 
}

export default function MyInvitationsPage() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const invitationsQuery = query(
      collection(firestore, 'invitations'),
      where('toUserId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(invitationsQuery, (snapshot) => {
      const invitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation));
      setInvitations(invitesData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching invitations:", err);
      setError("Could not load invitations.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleResponse = async (invitation: Invitation, accepted: boolean) => {
    if (!user) return;
    
    const invitationRef = doc(firestore, 'invitations', invitation.id);
    
    try {
      if (accepted) {
        // Use a transaction to ensure both operations succeed or fail together
        await runTransaction(firestore, async (transaction) => {
          const teamRef = doc(firestore, 'teams', invitation.teamId);
          // 1. Update the invitation status
          transaction.update(invitationRef, { status: 'accepted' });
          // 2. Add the user to the team's members array
          transaction.update(teamRef, { members: arrayUnion(user.uid) });
        });

        // --- START: CREATE NOTIFICATION FOR THE CAPTAIN ---
        const captainNotificationRef = collection(firestore, 'users', invitation.fromUserId, 'notifications');
        await addDoc(captainNotificationRef, {
          message: `'${user.displayName || 'A new player'}' has joined your team: ${invitation.teamName}.`,
          link: `/teams/${invitation.teamId}`,
          read: false,
          createdAt: serverTimestamp(),
        });
        // --- END: CREATE NOTIFICATION FOR THE CAPTAIN ---

      } else {
        // If declined, just update the invitation status
        await updateDoc(invitationRef, { status: 'declined' });
      }
      
      // Remove the processed invitation from the UI instantly
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));

    } catch (err) {
      console.error("Error responding to invitation:", err);
      setError("Failed to process your response. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading invitations...</div>;
  }

  if (!user) {
    return <div className="text-center mt-10">Please log in to view your invitations.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">My Team Invitations</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {invitations.length > 0 ? (
        <div className="space-y-4">
          {invitations.map((invite) => (
            <div key={invite.id} className="bg-gray-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
              <p>
                You have been invited to join the team:{' '}
                <Link href={`/teams/${invite.teamId}`} className="font-bold text-blue-400 hover:underline">
                  {invite.teamName}
                </Link>
              </p>
              <div className="flex gap-2 flex-shrink-0">
                <button 
                  onClick={() => handleResponse(invite, true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Accept
                </button>
                <button 
                  onClick={() => handleResponse(invite, false)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>You have no pending invitations.</p>
      )}
    </div>
  );
}
