'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, firestore } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function SignUpPage() {
  const [gamertag, setGamertag] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!gamertag || !email || !password) {
      setError('Please fill out all fields.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        gamertag: gamertag,
        email: email,
        createdAt: new Date(),
        profilePictureUrl: null, 
        bio: '',
      });
      
      router.push('/');

    } catch (err) {
      const error = err as { code?: string };
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('This email address is already in use.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters long.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        default:
          setError('Failed to create an account. Please try again.');
          break;
      }
      console.error("Error signing up:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Your EG ESPORTS Account</h1>
        <form onSubmit={handleSignUp}>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor="gamertag">Gamertag</label>
            <input id="gamertag" type="text" value={gamertag} onChange={(e) => setGamertag(e.target.value)} className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="mb-6 relative">
            <label className="block text-sm font-bold mb-2" htmlFor="password">Password</label>
            <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white" style={{ top: '2.1rem', transform: 'translateY(-50%)' }} >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showPassword ? ( <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-7-11-7a17.58 17.58 0 014-5.17m5.75-2.58a10.025 10.025 0 015.75 2.58" /> ) : ( <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> )}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none">Sign Up</button>
        </form>
      </div>
    </div>
  );
}
