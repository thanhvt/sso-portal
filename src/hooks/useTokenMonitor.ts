/**
 * Hook để kiểm tra token định kỳ và chuyển hướng khi token hết hạn
 * Hook này sẽ định kỳ gọi API để kiểm tra tính hợp lệ của token
 */

import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * Hook kiểm tra token định kỳ và thực hiện chuyển hướng nếu cần
 * @param interval - Thời gian giữa các lần kiểm tra (ms), mặc định 30 giây
 * @returns void
 */
export function useTokenMonitor(interval = 30000) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Chỉ kiểm tra nếu đã đăng nhập
    if (status !== 'authenticated' || !session) return;

    // Hàm check token
    const checkToken = async () => {
      try {
        // Gọi API để kiểm tra token
        const response = await fetch('/api/auth/check-session', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        // Nếu token không hợp lệ
        if (!response.ok) {
          console.log('Phiên đăng nhập hết hạn. Bắt đầu quá trình đăng xuất và đăng nhập lại...');
          
          // Lưu trang hiện tại để redirect sau khi đăng nhập lại
          const currentPath = window.location.pathname + window.location.search;
          
          try {
            // 1. Gọi API clear-cookie để xóa cookie auth_token
            try {
              const clearCookieResponse = await fetch('/api/auth/clear-cookie', {
                method: 'POST',
                credentials: 'include', // Quan trọng để đảm bảo cookie được gửi và xóa
              });
              
              if (clearCookieResponse.ok) {
                console.log('Auth cookie xóa thành công');
              }
            } catch (cookieError) {
              console.warn('Lỗi khi xóa auth cookie:', cookieError);
              // Tiếp tục quá trình đăng xuất ngay cả khi xóa cookie thất bại
            }

            // 2. Gọi API logout để lấy id_token_hint và thực hiện đăng xuất từ Keycloak
            const logoutResponse = await fetch('/api/logout', { method: 'GET' });
            const logoutData = await logoutResponse.json();

            console.log('Kết quả API logout:', logoutData);

            // 3. Đăng xuất khỏi NextAuth
            await signOut({ redirect: false });

            // 4. Xóa dữ liệu phiên khác
            localStorage.clear();
            sessionStorage.clear();

            // 5. Chuyển hướng về trang login với tham số error và callbackUrl
            console.log('Chuyển hướng về trang login do token hết hạn');
            window.location.href = `/login?error=RefreshTokenExpired&callbackUrl=${encodeURIComponent(currentPath)}`;
          } catch (error) {
            console.error('Lỗi đăng xuất:', error);
            // Nếu có lỗi, vẫn chuyển về trang login
            window.location.href = `/login?error=RefreshTokenExpired&callbackUrl=${encodeURIComponent(currentPath)}`;
          }
        }
      } catch (error) {
        console.error('Lỗi kiểm tra token:', error);
      }
    };

    // Thiết lập kiểm tra định kỳ
    const tokenCheckInterval = setInterval(checkToken, interval);

    // Dọn dẹp interval khi component unmount
    return () => clearInterval(tokenCheckInterval);
  }, [session, router, interval, status]);
}
