import { getServerSession } from 'next-auth';
import Providers from '@/components/Providers';
import authOptions from '@/lib/auth';

export default async function Template({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <Providers session={session}>
      {children}
    </Providers>
  );
}
