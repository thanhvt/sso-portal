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
  const session = await getServerSession(authOptions);
  if (session) {
    const idTokenDecrypted = session.id_token || '';
    return idTokenDecrypted;
  }
  return null;
}
