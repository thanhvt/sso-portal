import { NextRequest, NextResponse } from 'next/server';

/**
 * Kiểm tra chính xác origin từ request
 * @param origin Origin từ request headers
 * @param allowedOrigins Danh sách origins cho phép
 * @returns boolean
 */
export function isAllowedOrigin(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return false;
  
  // Kiểm tra chính xác từng origin được cho phép
  return allowedOrigins.some(allowed => {
    // Kiểm tra exact match
    if (allowed === origin) return true;
    
    // Hoặc kiểm tra subdomain nếu cần (dành cho production)
    if (allowed.startsWith('*.')) {
      const domain = allowed.substring(2); // Bỏ '*.'
      return origin.endsWith('.' + domain) && !origin.includes('..'); // Tránh các subdomain attack
    }
    
    return false;
  });
}

/**
 * Lấy danh sách origins cho phép từ biến môi trường
 * @returns Array các origins được phép
 */
export function getAllowedOrigins(): string[] {
  const allowedOriginsString = process.env.ALLOWED_ORIGINS || '';
  const allowedOrigins = allowedOriginsString.split(',').filter(origin => origin.trim() !== '');
  
  // Thêm origins cho môi trường development nếu cần
  // if (process.env.NODE_ENV === 'development' && allowedOrigins.length === 0) {
  //   allowedOrigins.push(
  //     'http://localhost:3000', 
  //     'http://localhost:3001',
  //     'http://localhost:3004',
  //     'http://localhost:3005',
  //     'http://localhost:3008'
  //   );
  // }
  
  return allowedOrigins;
}

/**
 * Middleware CORS cho Next.js API routes
 * @param req Request object
 * @param handler Request handler function
 * @returns Response với CORS headers
 */
export async function corsMiddleware(
  req: NextRequest, 
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const origin = req.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();
  
  // Kiểm tra nếu origin được cho phép
  const isAllowed = isAllowedOrigin(origin, allowedOrigins);
  
  // Log các origin bị từ chối
  if (origin && !isAllowed) {
    console.warn(`CORS rejected origin: ${origin}`);
  }
  
  // Xử lý OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    const preflightResponse = new NextResponse(null, { status: 204 });
    
    if (isAllowed && origin) {
      preflightResponse.headers.set('Access-Control-Allow-Origin', origin);
      preflightResponse.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      preflightResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      preflightResponse.headers.set('Access-Control-Allow-Credentials', 'true');
      preflightResponse.headers.set('Access-Control-Max-Age', '86400'); // 24 giờ
    }
    
    return preflightResponse;
  }
  
  // Xử lý request
  try {
    const response = await handler(req);
    
    // Thêm CORS headers vào response
    if (isAllowed && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return response;
  } catch (error) {
    console.error('API Error:', error);
    
    // Tạo error response
    const errorResponse = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    
    // Thêm CORS headers vào error response
    if (isAllowed && origin) {
      errorResponse.headers.set('Access-Control-Allow-Origin', origin);
      errorResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    
    return errorResponse;
  }
}
