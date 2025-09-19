import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EG ESPORTS",
  description: "Connect, Challenge, Compete",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* The body will have a dark background and white text by default */}
      <body className={`${inter.className} bg-gray-900 text-white`}>
        {/* 
          The AuthProvider wraps everything. This makes the user's authentication
          state (logged in or not) available to all components inside it.
        */}
        <AuthProvider>
          {/* 
            The Navbar is placed here so it appears on every single page of our site.
            It's inside AuthProvider so it can know whether to show "Login" or "Logout".
          */}
          <Navbar />

          {/* 
            The 'children' prop is where Next.js will render the specific page
            the user is currently visiting (e.g., the homepage, a profile page, etc.).
            We wrap it in a 'main' tag for semantic HTML.
          */}
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          
        </AuthProvider>
      </body>
    </html>
  );
}
