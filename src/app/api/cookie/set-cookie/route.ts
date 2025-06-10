import { NextRequest, NextResponse } from 'next/server';
import { corsMiddleware } from '@/middleware/cors';

/**
 * Handler chính để thiết lập cookie auth_token
 * @param req Request object
 * @returns Response xác nhận cookie đã được thiết lập
 */
async function setCookieHandler(req: NextRequest): Promise<NextResponse> {
  try {
    const { token } = await req.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Tạo response với cookie
    const response = NextResponse.json(
      { success: true, message: 'Cookie set successfully' },
      { status: 200 }
    );
    
    // Thiết lập cookie với các tùy chọn bảo mật
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
    });
    
    return response;
  } catch (error) {
    console.error('Error setting cookie:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to set cookie' },
      { status: 500 }
    );
  }
}

// Sử dụng middleware CORS cho POST method
export async function POST(req: NextRequest) {
  return corsMiddleware(req, setCookieHandler);
}

// Xử lý OPTIONS request (preflight) sử dụng middleware CORS
export async function OPTIONS(req: NextRequest) {
  return corsMiddleware(req, async () => new NextResponse(null, { status: 204 }));
}
