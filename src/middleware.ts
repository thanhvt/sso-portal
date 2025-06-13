import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware cho Next.js để xử lý việc chuyển hướng khi token hết hạn
export default withAuth(
  function middleware(request: NextRequest) {
    // Nếu đường dẫn hiện tại đã là /login hoặc các đường dẫn liên quan đến auth, cho phép đi tiếp
    if (
      request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/api/auth')
    ) {
      return NextResponse.next();
    }
    
    // Token đã được kiểm tra trong callbacks.authorized
    // Nếu code đến được đây, có nghĩa là token hợp lệ
    return NextResponse.next();
  },
  {
    callbacks: {
      // Kiểm tra xem middleware có được kích hoạt hay không
      authorized: ({ req, token }) => {
        // Nếu không có token, không cho phép truy cập (chuyển về login)
        if (!token) return false;
        
        // Kiểm tra xem token có lỗi không
        if (token.error) {
          // In log lỗi để debug
          console.log(`Phát hiện lỗi token: ${token.error}, sẽ chuyển hướng về trang đăng nhập`);
          
          // Các lỗi liên quan đến refresh token không hợp lệ
          if (
            token.error === 'RefreshTokenInactive' ||
            token.error === 'RefreshTokenExpired' ||
            token.error === 'InvalidRefreshToken' ||
            token.error === 'RefreshAccessTokenError' ||
            token.error === 'TokenErrorException'
          ) {
            // Khi trả về false, NextAuth sẽ tự động redirect về trang signIn
            // với callbackUrl là URL hiện tại
            return false;
          }
        }
        
        // Token hợp lệ
        return true;
      },
    },
    pages: {
      // Đảm bảo NextAuth biết trang đăng nhập để redirect khi cần
      signIn: '/login',
    },
  }
);

// Cấu hình các đường dẫn sẽ được áp dụng middleware
// Bao gồm tất cả đường dẫn trừ các public routes
export const config = {
  matcher: [
    // Áp dụng cho tất cả các đường dẫn ngoại trừ những đường dẫn sau:
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
