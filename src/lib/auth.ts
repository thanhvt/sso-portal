import { jwtDecode, type JwtPayload as OriginalJwtPayload } from 'jwt-decode';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';

interface RealmAccess {
  roles: string[];
}

interface JwtPayload extends OriginalJwtPayload {
  // Đã kế thừa các trường cơ bản từ OriginalJwtPayload
  auth_time?: number;
  jti?: string;
  iss?: string;
  aud?: string;
  sub?: string;
  typ?: string;
  azp?: string;
  session_state?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  email_verified?: boolean;
  preferred_username?: string;
  realm_access?: RealmAccess;
}

interface Token extends JWT {
  access_token?: string;
  id_token?: string;
  expires_at?: number;
  refresh_token?: string;
  decoded?: JwtPayload;
  error?: string;
}

interface Account {
  access_token?: string;
  id_token?: string;
  expires_at?: number;
  refresh_token?: string;
}

async function refreshAccessToken(token: Token): Promise<Token> {
  try {
    console.log('Bắt đầu refresh token...');
    const resp = await fetch(`${process.env.REFRESH_TOKEN_URL}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.FRONTEND_CLIENT_ID || '',
        client_secret: process.env.FRONTEND_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token || '',
      }),
      method: 'POST',
    });

    const refreshToken = await resp.json();

    if (!resp.ok) {
      // Xử lý lỗi chi tiết hơn
      console.error('Lỗi khi refresh token:', {
        status: resp.status,
        statusText: resp.statusText,
        error: refreshToken
      });
      throw new Error(`Refresh token thất bại: ${resp.status} ${resp.statusText}`);
    }

    console.log('Refresh token thành công ' + refreshToken.expires_in + ' giây');
    return {
      ...token,
      access_token: refreshToken.access_token,
      decoded: jwtDecode<JwtPayload>(refreshToken.access_token),
      id_token: refreshToken.id_token,
      expires_at: Math.floor(Date.now() / 1000) + refreshToken.expires_in,
      refresh_token: refreshToken.refresh_token,
    };
  } catch (error) {
    console.error('Lỗi trong quá trình refresh token:', error);
    throw error;
  }
}

const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    KeycloakProvider({
      clientId: process.env.FRONTEND_CLIENT_ID || '',
      clientSecret: process.env.FRONTEND_CLIENT_SECRET || '',
      issuer: process.env.AUTH_ISSUER || '',
      // Thêm các tùy chọn để debug
      authorization: {
        params: {
          scope: 'openid email profile',
          redirect_uri: process.env.NEXTAUTH_CALLBACK_URL || `${process.env.NEXTAUTH_URL}/api/auth/callback/keycloak`,
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }: { token: Token; account: Account | null }) {
      console.log('JWT callback được gọi', { hasAccount: !!account, hasToken: !!token });
      const nowTimeStamp = Math.floor(Date.now() / 1000);
      const updatedToken = { ...token };

      if (account) {
        console.log('Xử lý JWT khi đăng nhập mới, account có access_token:', !!account.access_token);
        // Đây là lúc đăng nhập ban đầu, lưu toàn bộ thông tin token
        updatedToken.decoded = jwtDecode<JwtPayload>(
          account.access_token as string,
        );
        updatedToken.access_token = account.access_token;
        updatedToken.id_token = account.id_token;
        updatedToken.expires_at = account.expires_at;
        updatedToken.refresh_token = account.refresh_token;
        console.log('Token expires_at:', updatedToken.expires_at, '(timestamp)'); 
        
        // Hiển thị thời gian hết hạn token chi tiết khi đăng nhập thành công
        const expiryDate = new Date(updatedToken.expires_at! * 1000);
        console.log('Đăng nhập thành công, token được lưu trữ đến ' + 
          expiryDate.toLocaleString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          }));
        return updatedToken;
      }

      // Kiểm tra token còn hạn hay không
      if (
        typeof updatedToken.expires_at === 'number' &&
        nowTimeStamp < updatedToken.expires_at
      ) {
        // Kiểm tra xem token có gần hết hạn không (còn 5 phút)
        // Nếu còn ít thời gian, chủ động refresh token
        const timeRemaining = updatedToken.expires_at - nowTimeStamp;
        const refreshThreshold = 300; // 5 phút
        
        if (timeRemaining < refreshThreshold) {
          console.log(`Token sẽ hết hạn trong ${timeRemaining} giây. Thực hiện refresh chủ động...`);
          try {
            const refreshedToken = await refreshAccessToken(updatedToken as Token);
            console.log('Token đã được refresh chủ động.');
            return refreshedToken;
          } catch (error) {
            console.warn('Không thể refresh token chủ động:', error);
            // Vẫn trả về token hiện tại vì nó chưa hết hạn
            return updatedToken;
          }
        }
        
        return updatedToken;
      }

      console.log('Token đã hết hạn. Đang refresh...');
      try {
        const refreshedToken = await refreshAccessToken(updatedToken as Token);
        console.log('Token đã được refresh thành công.');
        return refreshedToken;
      } catch (error) {
        console.error('Lỗi khi refresh access token:', error);
        // Phân loại lỗi cụ thể
        let errorType = 'RefreshAccessTokenError';
        
        if (error instanceof Error) {
          // Xử lý đặc biệt cho trường hợp refresh token hết hạn hoặc không còn hiệu lực
          if (error.message.includes('Token is not active') || 
              error.message.includes('invalid_grant')) {
            console.log('Phát hiện refresh token không còn hiệu lực, người dùng cần đăng nhập lại');
            errorType = 'RefreshTokenInactive';
            // Có thể thêm các hành động khác ở đây, ví dụ cấu hình để NextAuth redirect về trang đăng nhập
          } else if (error.message.includes('401')) {
            errorType = 'RefreshTokenExpired';
          } else if (error.message.includes('400')) {
            errorType = 'InvalidRefreshToken';
          } else if (error.message.includes('timeout')) {
            errorType = 'RefreshTokenNetworkError';
          }
        }
        
        return { ...updatedToken, error: errorType };
      }
    },
    async session({ session, token }: { session: any; token: Token }) {
      const updatedSession = { ...session };
      updatedSession.access_token = token.access_token || '';
      updatedSession.id_token = token.id_token || '';
      updatedSession.roles = token.decoded?.realm_access?.roles || [];
      updatedSession.error = token.error;
      return updatedSession;
    },
  },
  pages: {
    signIn: '/login',
    error: '/error',
    signOut: '/api/auth/signout',
  },
  
  // Cấu hình các sự kiện
  events: {
    async signOut() {
      console.log('Đã thực hiện signOut');
    },
  },
  session: {
    strategy: 'jwt',
  },
  // Cấu hình URL
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true, // Luôn true khi sameSite là 'none'
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        sameSite: 'none',
        path: '/',
        secure: true, // Luôn true khi sameSite là 'none'
      }
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true, // Luôn true khi sameSite là 'none'
      }
    }
  },
};

export default authOptions;
