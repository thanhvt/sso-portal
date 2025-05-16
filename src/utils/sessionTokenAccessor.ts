import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';

export async function getAccessToken() {
  const session = await getServerSession(authOptions);
  if (session) {
    const accessTokenDecrypted = session.access_token || '';
    return accessTokenDecrypted;
  }
  return null;
}

export async function getIdToken() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.warn('No session found when trying to get id_token');
      return null;
    }

    // Kiểm tra xem session có chứa id_token không
    if (!session.id_token) {
      console.warn('Session does not contain id_token', {
        sessionKeys: Object.keys(session),
        sessionHasUser: !!session.user
      });

      // Nếu không có id_token trong session, trả về null
      return null;
    }

    const idTokenDecrypted = session.id_token;
    console.log('Successfully retrieved id_token');

    return idTokenDecrypted;
  } catch (error) {
    console.error('Error getting id_token:', error);
    return null;
  }
}
