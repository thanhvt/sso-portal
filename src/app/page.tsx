'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-secondary-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-2xl shadow-xl animate-fade-in">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 gradient-text">
            VSS Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Đang kiểm tra trạng thái đăng nhập...
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
