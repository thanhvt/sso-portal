'use client';

import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  useEffect(() => {
    // Xóa cookie và localStorage để đảm bảo đăng xuất hoàn toàn
    const clearSession = () => {
      try {
        // Xóa cookie
        document.cookie.split(';').forEach(cookie => {
          const [name] = cookie.trim().split('=');
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        // Xóa localStorage và sessionStorage
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error clearing session:', e);
      }
    };

    // Kiểm tra URL để tránh vòng lặp vô hạn
    const url = new URL(window.location.href);
    const callbackUrl = url.searchParams.get('callbackUrl');
    const errorParam = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    const fromLogout = url.searchParams.get('logout') === 'true';

    if (fromLogout) {
      // Nếu đến từ đăng xuất, xóa session trước khi đăng nhập lại
      clearSession();
      console.log('Session cleared after logout');

      // Hiển thị thông báo đã đăng xuất thành công
      setError(null);
      setIsLoading(false);
      setIsLoggedOut(true);

      // Đợi 2 giây trước khi chuyển hướng đến trang đăng nhập
      setTimeout(() => {
        console.log('Redirecting to Keycloak login after logout...');
        signIn('keycloak', {
          callbackUrl: '/dashboard',
          redirect: true
        });
      }, 2000);

      return;
    }

    if (errorParam) {
      console.error('Authentication error:', errorParam, errorDescription);
      setError(errorDescription || errorParam);
      setIsLoading(false);
    } else if (!callbackUrl?.includes('callback')) {
      // Đợi một chút trước khi chuyển hướng để đảm bảo session đã được xóa
      const redirectTimer = setTimeout(() => {
        console.log('Redirecting to Keycloak login...');
        signIn('keycloak', {
          callbackUrl: '/dashboard',
          redirect: true
        });
      }, fromLogout ? 500 : 0); // Đợi 500ms nếu đến từ đăng xuất

      return () => clearTimeout(redirectTimer);
    } else {
      setIsLoading(false);
    }
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

          {error ? (
            <>
              <div className="mt-4 p-4 bg-red-50 rounded-md">
                <p className="text-red-600 font-medium">Lỗi xác thực</p>
                <p className="text-sm text-red-500">{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => signIn('keycloak', { callbackUrl: '/dashboard' })}
                  className="btn-primary"
                >
                  Thử lại
                </button>
              </div>
            </>
          ) : isLoggedOut ? (
            <>
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <p className="text-green-600 font-medium">Đăng xuất thành công</p>
                <p className="text-sm text-green-500">Bạn sẽ được chuyển hướng đến trang đăng nhập...</p>
              </div>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              {isLoading ? 'Đang chuyển hướng đến trang đăng nhập...' : 'Đang xử lý đăng nhập...'}
            </p>
          )}
        </div>

        {isLoading && !error && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-t-2 border-b-2 border-primary-500 rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-center">
              <Link href="/dashboard" className="btn-primary">
                Đi đến Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
