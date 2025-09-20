'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // 1. Import the Next.js Image component
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/app/firebase';
import { signOut } from 'firebase/auth';
import NotificationBell from './NotificationBell';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Navbar() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const MobileLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="block text-white hover:text-blue-400 py-2 text-lg">
      {children}
    </Link>
  );

  return (
    <nav className="bg-gray-800 p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* --- 2. UPDATED LOGO AREA --- */}
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/logo.png" // Path to your logo in the 'public' folder
            alt="EG ESPORTS Logo"
            width={40} // Sets the image width
            height={40} // Sets the image height
            className="object-contain" // Ensures image scales properly
          />
          <span className="text-white text-2xl font-bold">EG ESPORTS</span>
        </Link>
        {/* --- END OF UPDATED LOGO AREA --- */}

        {/* --- DESKTOP MENU --- */}
        <div className="hidden md:flex items-center space-x-4">
          {loading ? ( <div className="text-white">Loading...</div> ) 
          : user ? (
            <>
              <Link href="/my-teams" className="text-white hover:text-blue-400">My Teams</Link>
              <Link href="/invitations" className="text-white hover:text-blue-400">My Invitations</Link>
              <Link href="/matches" className="text-white hover:text-blue-400">My Matches</Link>
              <div className="flex items-center space-x-4 ml-4">
                <NotificationBell />
                <Link href={`/profile/${user.uid}`} className="text-white hover:text-blue-400">My Profile</Link>
                <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Logout</button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white hover:text-blue-400">Login</Link>
              <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Sign Up</Link>
            </>
          )}
        </div>

        {/* --- MOBILE MENU BUTTON --- */}
        <div className="md:hidden flex items-center">
          {user && <NotificationBell />}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="ml-4 text-white focus:outline-none">
            {isMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
          </button>
        </div>
      </div>

      {/* --- MOBILE MENU DROPDOWN --- */}
      {isMenuOpen && (
        <div className="md:hidden mt-4">
           {user ? (
            <div className="flex flex-col items-start space-y-2">
              <MobileLink href="/my-teams">My Teams</MobileLink>
              <MobileLink href="/invitations">My Invitations</MobileLink>
              <MobileLink href="/matches">My Matches</MobileLink>
              <MobileLink href={`/profile/${user.uid}`}>My Profile</MobileLink>
              <button onClick={handleLogout} className="w-full text-left bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded mt-2 text-lg">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-start space-y-2">
              <MobileLink href="/login">Login</MobileLink>
              <MobileLink href="/signup">Sign Up</MobileLink>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
