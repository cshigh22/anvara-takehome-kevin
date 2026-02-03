import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getCampaigns } from '@/lib/api';
import { getUserRole } from '@/lib/auth-helpers';
import { CampaignList } from './components/campaign-list';

export default async function SponsorDashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  // Verify user has 'sponsor' role (from Prisma Sponsor record linked to this user)
  const roleData = await getUserRole(session.user.id);
  if (roleData.role !== 'sponsor') {
    redirect('/');
  }

  let campaigns: Awaited<ReturnType<typeof getCampaigns>> = [];
  let error: string | null = null;
  if (roleData.sponsorId) {
    try {
      campaigns = await getCampaigns(roleData.sponsorId);
    } catch {
      error = 'Failed to load campaigns';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Campaigns</h1>
        {/* TODO: Add CreateCampaignButton here */}
      </div>

      <CampaignList campaigns={campaigns} error={error} />
    </div>
  );
}
