// src/app/signup/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, firestore } from '../firebase'; // Our initialized firebase
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function SignUpPage() {
  const [gamertag, setGamertag] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      // 1. Create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Create a corresponding user document in Firestore
      // This is where we'll store profile data like gamertag, bio, etc.
      await setDoc(doc(firestore, 'users', user.uid), {
        uid: user.uid,
        gamertag: gamertag,
        email: email,
        createdAt: new Date(),
        // Add default profile fields here later
        profilePictureUrl: null, 
        bio: '',
      });

      // 3. Redirect to homepage on success
      router.push('/');

    } catch (error: any) {
      // Handle Firebase errors (e.g., email-already-in-use)
      setError(error.message);
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
            <input 
              id="gamertag"
              type="text" 
              value={gamertag}
              onChange={(e) => setGamertag(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-bold mb-2" htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
