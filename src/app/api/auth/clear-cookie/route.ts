import { NextRequest, NextResponse } from 'next/server';
import { corsMiddleware } from '@/middleware/cors';

/**
 * Handler chính để xóa cookie auth_token
 * @param req Request object
 * @returns Response xác nhận cookie đã xóa
 */
async function clearCookieHandler(req: NextRequest): Promise<NextResponse> {
  try {
    console.log('Clearing auth cookie');
    
    // Tạo response
    const response = NextResponse.json(
      { success: true, message: 'Cookie đã được xóa' },
      { status: 200 }
    );

    // Xóa cookie bằng cách thiết lập expires về quá khứ
    response.cookies.set({
      name: 'auth_token',
      value: '',
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0), // Xóa ngay lập tức bằng cách đặt thời gian hết hạn về quá khứ
    });
    
    console.log('Auth cookie cleared successfully');
    return response;
  } catch (error) {
    console.error('Error clearing cookie:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Sử dụng middleware CORS cho POST method
export function POST(req: NextRequest) {
  return corsMiddleware(req, clearCookieHandler);
}

// Xử lý OPTIONS request (preflight) sử dụng middleware CORS
export function OPTIONS(req: NextRequest) {
  return corsMiddleware(req, async () => new NextResponse(null, { status: 204 }));
}
