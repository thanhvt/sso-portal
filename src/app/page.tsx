'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra xem có đang đăng xuất không
    const url = new URL(window.location.href);
    const isLogout = url.searchParams.get('logout') === 'true';

    if (isLogout) {
      // Nếu đang đăng xuất, xóa cookie và localStorage
      document.cookie.split(';').forEach(cookie => {
        const [name] = cookie.trim().split('=');
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      });

      localStorage.clear();
      sessionStorage.clear();

      // Chuyển hướng đến trang login với tham số logout=true
      router.push('/login?logout=true');
    } else if (status === 'authenticated') {
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
