import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getIdToken } from '@/utils/sessionTokenAccessor';

export async function GET() {
  try {
    console.log('Starting logout process in API...');
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log('No active session to logout');
      return NextResponse.json({
        status: 200,
        message: 'No active session to logout'
      });
    }

    // Lấy id_token từ session
    const idToken = await getIdToken();

    // Kiểm tra xem idToken có tồn tại không
    if (!idToken) {
      console.error('Error: id_token is missing in the session');

      // Nếu không có id_token, vẫn chuyển hướng về trang login
      return NextResponse.json({
        status: 200,
        message: 'Session logged out locally, but could not log out from Keycloak due to missing id_token',
        redirectUrl: `${process.env.NEXTAUTH_URL}/login?logout=true`
      });
    }

    // Sử dụng post_logout_redirect_uri thay vì redirect_uri để tương thích với Keycloak
    const logoutRedirectUrl = process.env.POST_LOGOUT_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/login?logout=true`;
    const url = `${process.env.END_SESSION_URL}?id_token_hint=${idToken}&post_logout_redirect_uri=${encodeURIComponent(logoutRedirectUrl)}`;

    console.log('Keycloak Logout URL:', url);

    try {
      // Gọi endpoint đăng xuất của Keycloak
      const response = await fetch(url, { method: 'GET' });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Keycloak logout failed:', errorText);
        return NextResponse.json({
          status: response.status,
          message: `Failed to logout from Keycloak: ${errorText}`,
          redirectUrl: `${process.env.NEXTAUTH_URL}/login?logout=true`
        });
      }

      console.log('Keycloak logout successful');
      return NextResponse.json({
        status: 200,
        message: 'Logged out successfully',
        redirectUrl: `${process.env.NEXTAUTH_URL}/login?logout=true`
      });
    } catch (error) {
      console.error('Logout error:', error);
      return NextResponse.json({
        status: 500,
        message: `Error during logout process: ${error}`,
        redirectUrl: `${process.env.NEXTAUTH_URL}/login?logout=true`
      });
    }
  } catch (error) {
    console.error('Unexpected error during logout:', error);
    return NextResponse.json({
      status: 500,
      message: `Unexpected error during logout: ${error}`,
      redirectUrl: `${process.env.NEXTAUTH_URL}/login?logout=true`
    });
  }
}
