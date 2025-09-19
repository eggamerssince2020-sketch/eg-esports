'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { firestore } from '@/app/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, Timestamp } from 'firebase/firestore';

interface ChatBoxProps {
  matchId: string;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderGamertag: string;
  timestamp: Timestamp;
}

export default function ChatBox({ matchId }: ChatBoxProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const messagesQuery = query(
      collection(firestore, 'challenges', matchId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [matchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newMessage.trim() === '') return;

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      const senderGamertag = userDocSnap.exists() ? userDocSnap.data().gamertag : 'Player';

      await addDoc(collection(firestore, 'challenges', matchId, 'messages'), {
        text: newMessage,
        senderId: user.uid,
        senderGamertag: senderGamertag,
        timestamp: serverTimestamp(),
      });

      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="mt-6 border border-gray-600 rounded-lg p-4 h-96 flex flex-col">
      <div className="flex-grow overflow-y-auto mb-4 pr-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-2 ${msg.senderId === user?.uid ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded-lg ${msg.senderId === user?.uid ? 'bg-blue-600' : 'bg-gray-700'}`}>
              <p className="text-sm font-bold">{msg.senderGamertag}</p>
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex">
        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className="flex-grow p-2 bg-gray-700 rounded-l-lg focus:outline-none" />
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 rounded-r-lg">Send</button>
      </form>
    </div>
  );
}
