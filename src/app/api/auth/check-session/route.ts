/**
 * API endpoint để kiểm tra session hiện tại có hợp lệ không
 * Được gọi từ client-side để phát hiện token hết hạn
 */

import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import authOptions from '@/lib/auth';

export async function GET() {
  try {
    // Lấy session từ server, sẽ tự động kiểm tra token có hợp lệ không
    const session = await getServerSession(authOptions);
    
    // Nếu không có session hoặc có lỗi trong token
    if (!session || !session.user || session.error) {
      return NextResponse.json({ 
        success: false, 
        message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
        error: session?.error || 'Không có session'
      }, { status: 401 });
    }

    // Session hợp lệ
    return NextResponse.json({ 
      success: true, 
      message: 'Session hợp lệ' 
    });
    
  } catch (error) {
    console.error('Lỗi kiểm tra session:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Có lỗi xảy ra khi kiểm tra session',
      error: String(error)
    }, { status: 500 });
  }
}
