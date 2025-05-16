import { jwtDecode } from 'jwt-decode';
import type { NextAuthOptions } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import KeycloakProvider from 'next-auth/providers/keycloak';

interface RealmAccess {
  roles: string[];
}

interface JwtPayload {
  exp?: number;
  iat?: number;
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

  if (!resp.ok) throw refreshToken;

  return {
    ...token,
    access_token: refreshToken.access_token,
    decoded: jwtDecode<JwtPayload>(refreshToken.access_token),
    id_token: refreshToken.id_token,
    expires_at: Math.floor(Date.now() / 1000) + refreshToken.expires_in,
    refresh_token: refreshToken.refresh_token,
  };
}

const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    KeycloakProvider({
      clientId: process.env.FRONTEND_CLIENT_ID || '',
      clientSecret: process.env.FRONTEND_CLIENT_SECRET || '',
      issuer: process.env.AUTH_ISSUER || '',
    }),
  ],
  callbacks: {
    async jwt({ token, account }: { token: Token; account: Account | null }) {
      const nowTimeStamp = Math.floor(Date.now() / 1000);
      const updatedToken = { ...token };

      if (account) {
        updatedToken.decoded = jwtDecode<JwtPayload>(
          account.access_token as string,
        );
        updatedToken.access_token = account.access_token;
        updatedToken.id_token = account.id_token;
        updatedToken.expires_at = account.expires_at;
        updatedToken.refresh_token = account.refresh_token;
        return updatedToken;
      }

      if (
        typeof updatedToken.expires_at === 'number' &&
        nowTimeStamp < updatedToken.expires_at
      ) {
        return updatedToken;
      }

      console.log('Token has expired. Will refresh...');
      try {
        const refreshedToken = await refreshAccessToken(updatedToken as Token);
        console.log('Token is refreshed.');
        return refreshedToken;
      } catch (error) {
        console.error('Error refreshing access token', error);
        return { ...updatedToken, error: 'RefreshAccessTokenError' };
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
  },
  session: {
    strategy: 'jwt',
  },
  // Cấu hình URL
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

export default authOptions;
