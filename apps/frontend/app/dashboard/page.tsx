import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getUserRole } from '@/lib/auth-helpers';

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  const roleData = await getUserRole(session.user.id);

  if (roleData.role === 'sponsor') {
    redirect('/dashboard/sponsor');
  }
  if (roleData.role === 'publisher') {
    redirect('/dashboard/publisher');
  }

  redirect('/');
}
