'use client';

import { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';

async function keycloakSessionLogout() {
  try {
    await fetch(`/api/logout`, { method: 'GET' });
  } catch (error) {
    console.log(error);
  }
}

export default function Header() {
  const { data: session } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await keycloakSessionLogout();
    signOut({ callbackUrl: '/' });
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-md py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center">
          <div className="relative h-10 w-10 mr-3">
            <Image 
              src="/images/logo.png" 
              alt="VSS Logo" 
              fill
              className="object-contain"
            />
          </div>
          <h1 className={`font-bold transition-all duration-300 ${
            isScrolled ? 'text-xl text-gray-800' : 'text-2xl gradient-text'
          }`}>
            VSS Portal
          </h1>
        </div>

        {session?.user && (
          <div className="relative">
            <button 
              className="flex items-center space-x-2 focus:outline-none"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="hidden md:block text-right">
                <p className={`font-medium ${isScrolled ? 'text-gray-800' : 'text-gray-700'}`}>
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500">
                  {session.user.email}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-medium">
                {session.user.name?.charAt(0) || 'U'}
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 animate-fade-in">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
