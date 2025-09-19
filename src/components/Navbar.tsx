'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/app/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <nav className="bg-gray-800 p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-2xl font-bold">
          EG ESPORTS
        </Link>
        <div className="flex items-center space-x-4">
          {loading ? (
            <div className="text-white">Loading...</div>
          ) : user ? (
            <>
              {/* --- THIS IS THE NEW LINK --- */}
              <Link href="/matches" className="text-white hover:text-blue-400">
                My Matches
              </Link>
              <Link href={`/profile/${user.uid}`} className="text-white hover:text-blue-400">
                My Profile
              </Link>
              <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white hover:text-blue-400">Login</Link>
              <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
