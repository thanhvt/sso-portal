import { NextRequest, NextResponse } from 'next/server';
import { corsMiddleware } from '@/middleware/cors';
import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * Hàm chính để xác thực token từ cookie
 * @param req Request object
 * @returns Response với kết quả xác thực token
 */
async function validateTokenHandler(req: NextRequest): Promise<NextResponse> {
  try {
    // Log request headers for debugging
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    console.log('Request cookies:', JSON.stringify(req.cookies.getAll()));
    
    // Lấy token từ cookie
    const authToken = req.cookies.get('auth_token')?.value;
    console.log('Auth token from cookie:', authToken ? `${authToken.substring(0, 15)}...` : 'None');
    
    if (!authToken) {
      return NextResponse.json(
        { 
          valid: false, 
          message: 'No token found in cookie' 
        }, 
        { status: 401 }
      );
    }
    
    try {
      // Xác thực token sử dụng jsonwebtoken
      // Trong môi trường thực tế, nên sử dụng SECRET từ biến môi trường
      // hoặc xác thực trực tiếp với Keycloak/Auth server
      const decoded = jwt.verify(authToken, process.env.JWT_SECRET || 'your-fallback-secret-key', {
        // Trong trường hợp dev/demo, có thể bỏ qua xác thực chữ ký
        ignoreExpiration: process.env.NODE_ENV === 'development',
      }) as JwtPayload & {
        sub: string;
        name?: string;
        preferred_username?: string;
        email?: string;
        realm_access?: { roles: string[] };
      };
      
      console.log('Token decoded successfully');
      
      // Trả về thông tin người dùng đã được decode từ token
      return NextResponse.json(
        { 
          valid: true, 
          user: {
            sub: decoded.sub,
            name: decoded.name || decoded.preferred_username || '',
            email: decoded.email || '',
            roles: decoded.realm_access?.roles || []
          }
        }, 
        { status: 200 }
      );
    } catch (tokenError) {
      console.error('Token validation error:', tokenError);
      
      return NextResponse.json(
        { 
          valid: false, 
          message: 'Invalid token',
          details: tokenError instanceof Error ? tokenError.message : 'Unknown error'
        }, 
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Validate token error:', error);
    
    return NextResponse.json(
      { 
        valid: false, 
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Sử dụng middleware CORS cho GET method
export function GET(req: NextRequest) {
  return corsMiddleware(req, validateTokenHandler);
}

// Xử lý OPTIONS request (preflight) sử dụng middleware CORS
export function OPTIONS(req: NextRequest) {
  return corsMiddleware(req, async () => new NextResponse(null, { status: 204 }));
}
