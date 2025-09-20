// src/components/NotificationBell.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/app/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { FiBell } from 'react-icons/fi';

interface Notification {
  id: string;
  message: string;
  link: string;
  read: boolean;
  createdAt: { seconds: number };
}

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // Real-time listener for unread notifications
    const notificationsRef = collection(firestore, 'users', user.uid, 'notifications');
    const q = query(notificationsRef, where('read', '==', false), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const unreadNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      setNotifications(unreadNotifs);
    });

    return () => unsubscribe();
  }, [user]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user) return;
    const notifRef = doc(firestore, 'users', user.uid, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
    setIsOpen(false); // Close dropdown after interaction
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative focus:outline-none">
        <FiBell className="text-white h-6 w-6" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 justify-center items-center text-xs text-white">
              {notifications.length}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-gray-700">
            <h3 className="font-semibold text-white">Notifications</h3>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <li key={notif.id}>
                  <Link 
                    href={notif.link} 
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="block p-3 hover:bg-gray-700"
                  >
                    <p className="text-sm text-white">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.createdAt.seconds * 1000).toLocaleString()}
                    </p>
                  </Link>
                </li>
              ))
            ) : (
              <li className="p-4 text-center text-gray-400">You have no new notifications.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
