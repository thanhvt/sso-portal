'use client';

import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(true); // Tình trạng redirect
  const [redirectMessage, setRedirectMessage] = useState<string>("Đang chuyển hướng đến trang đăng nhập...");

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

    // Kiểm tra URL
    const url = new URL(window.location.href);
    const callbackUrl = url.searchParams.get('callbackUrl');
    const errorParam = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');
    const fromLogout = url.searchParams.get('logout') === 'true';

    // Xử lý lỗi xác thực
    if (errorParam) {
      console.error('Authentication error:', errorParam, errorDescription);
      
      // Danh sách lỗi liên quan đến token hết hạn hoặc không hợp lệ
      const tokenExpiredErrors = [
        'RefreshTokenExpired', 
        'RefreshTokenInactive', 
        'InvalidRefreshToken',
        'RefreshAccessTokenError', 
        'TokenErrorException'
      ];
      
      // Nếu là lỗi token hết hạn, tự động đăng nhập lại
      if (tokenExpiredErrors.includes(errorParam)) {
        console.log('Phát hiện lỗi token hết hạn, tự động điều hướng đến Keycloak...');
        setIsRedirecting(true);
        setRedirectMessage('Phát hiện token hết hạn. Đang chuyển đến trang đăng nhập...');
        
        // Ngắn trễ để tránh nháy màn hình
        setTimeout(() => {
          signIn('keycloak', { callbackUrl: callbackUrl || '/' });
        }, 500);
        return;
      }
      if (errorParam === 'OAuthCallback') {
        setError('Vui lòng thử lại sau.');
        setIsLoading(false);
        setIsRedirecting(false);
        return;
      }
      
      // Các lỗi khác hiển thị thông báo
      setError(errorDescription || errorParam);
      setIsLoading(false);
      setIsRedirecting(false);
      return;
    }
    
    // Nếu đến từ đăng xuất, xóa session trước khi đăng nhập lại
    if (fromLogout) {
      clearSession();
    }

    // Kiểm tra nếu đến từ token refresh error
    const fromTokenError = errorParam === 'RefreshTokenInactive' || 
                           errorParam === 'RefreshTokenExpired'  || 
                           errorParam === 'InvalidRefreshToken' || 
                           errorParam === 'RefreshAccessTokenError';
    
    // Đảm bảo callbackUrl có giá trị
    const finalCallbackUrl = callbackUrl || '/dashboard';
    
    // Tự động chuyển hướng đến Keycloak ngay sau khi component mount
    // Thời gian delay tùy thuộc vào nguồn redirect
    const delay = 300; // Hầu như ngay lập tức nếu không phải từ logout
    
    const redirectTimer = setTimeout(() => {
      console.log('Đang chuyển hướng đến Keycloak đăng nhập...', {
        fromLogout,
        fromTokenError,
        callbackUrl: finalCallbackUrl
      });
      
      signIn('keycloak', {
        callbackUrl: finalCallbackUrl,
        redirect: true
      });
    }, delay);

    return () => clearTimeout(redirectTimer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center">
            {/* Logo with error fallback */}
            <img
              src="/logo.svg"
              alt="VSS Logo"
              className="h-24 mb-4"
              onError={(e) => {
                e.currentTarget.src = '/logo-placeholder.png';
                console.error('Logo image failed to load');
              }}
            />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">VSS Portal</h2>
          
          {error ? (
            <p className="mt-2 text-red-500">{error}</p>
          ) : isRedirecting ? (
            <div className="mt-4">
              <p className="text-blue-600">{redirectMessage}</p>
              <div className="mt-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-gray-600">
              {isLoading ? 'Đang chuyển hướng đến trang đăng nhập...' : 'Đang xử lý đăng nhập...'}
            </p>
          )}
        </div>

        {isLoading && !error && !isRedirecting && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {!isLoading && !error && !isRedirecting && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-center">
              <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Đi đến Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
