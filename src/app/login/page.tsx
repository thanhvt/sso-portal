'use client';

import { signIn } from 'next-auth/react';
import { useEffect } from 'react';
import Image from 'next/image';

export default function LoginPage() {
  useEffect(() => {
    // Tự động chuyển hướng đến trang đăng nhập Keycloak
    signIn('keycloak');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl animate-fade-in">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="relative w-24 h-24 animate-pulse-slow">
              <Image
                src="/images/logo.png"
                alt="VSS Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 gradient-text">
            VSS Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Đang chuyển hướng đến trang đăng nhập...
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-t-2 border-b-2 border-primary-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
