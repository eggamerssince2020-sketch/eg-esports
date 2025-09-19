'use client';

import { useEffect, useState, use } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/app/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

// Define a type for our user profile data
type UserProfile = {
  uid: string;
  gamertag: string;
  email: string;
  bio: string;
  profilePictureUrl: string | null;
};

// The props type now expects params to be a Promise
export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { user } = useAuth(); // Correctly destructure 'user'
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Use React's 'use' hook to resolve the params promise
  const { userId } = use(params);

  useEffect(() => {
    const fetchProfile = async () => {
      // Now, userId is a string we can use directly
      const userDocRef = doc(firestore, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setProfile(userDocSnap.data() as UserProfile);
      } else {
        console.log("No such user!");
      }
      setLoading(false);
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]); // The dependency is the resolved 'userId' string

  if (loading) {
    return <div className="text-center mt-10">Loading Profile...</div>;
  }

  if (!profile) {
    return <div className="text-center mt-10">User not found.</div>;
  }

  // Use the corrected 'user' variable
  const isOwnProfile = user && user.uid === profile.uid;

  return (
    <div className="container mx-auto p-4 mt-10">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-2xl mx-auto">
        <div className="flex items-center space-x-6">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500">
            <Image
              src={profile.profilePictureUrl || '/default-avatar.png'} // Assumes you have a default avatar in /public
              alt={`${profile.gamertag}'s profile picture`}
              layout="fill"
              objectFit="cover"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold">{profile.gamertag}</h1>
            <p className="text-gray-400">{profile.email}</p>
          </div>
        </div>
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2">Bio</h2>
          <p className="text-gray-300">{profile.bio || 'This player has not set a bio yet.'}</p>
        </div>
        {isOwnProfile && (
          <div className="mt-8 text-right">
            <Link href="/profile/edit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Edit Profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
