import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getAdSlots } from '@/lib/api';
import { getUserRole } from '@/lib/auth-helpers';
import { CreateAdSlotButton } from './components/create-ad-slot-button';
import { AdSlotList } from './components/ad-slot-list';

export default async function PublisherDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  // Verify user has 'publisher' role (from Prisma Publisher record linked to this user)
  const roleData = await getUserRole(session.user.id);
  if (roleData.role !== 'publisher') {
    if (roleData.role === 'sponsor') {
      redirect('/dashboard/sponsor');
    }
    redirect('/');
  }

  let adSlots: Awaited<ReturnType<typeof getAdSlots>> = [];
  let error: string | null = null;
  if (roleData.publisherId) {
    try {
      const cookie = (await headers()).get('cookie') ?? '';
      adSlots = await getAdSlots(roleData.publisherId, { cookie });
    } catch {
      error = 'Failed to load ad slots';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Ad Slots</h1>
        <CreateAdSlotButton />
      </div>

      <AdSlotList adSlots={adSlots} error={error} />
    </div>
  );
}
