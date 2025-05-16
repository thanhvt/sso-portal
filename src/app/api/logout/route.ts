import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { getIdToken } from '@/utils/sessionTokenAccessor';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (session) {
    const idToken = await getIdToken();
    // Sử dụng redirect_uri thay vì post_logout_redirect_uri
    const url = `${process.env.END_SESSION_URL}?id_token_hint=${idToken}&redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL || '')}`;
    console.log('Logout URL:', url);
    try {
      await fetch(url, { method: 'GET' });
    } catch (error) {
      console.error('Logout error:', error);
      return NextResponse.json({ status: 500 });
    }
  }
  return NextResponse.json({ status: 200 });
}
