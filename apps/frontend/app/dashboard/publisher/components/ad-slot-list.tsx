import type { AdSlot } from '@/lib/types';
import { AdSlotCard } from './ad-slot-card';

interface AdSlotListProps {
  adSlots: AdSlot[];
  error: string | null;
}

export function AdSlotList({ adSlots, error }: AdSlotListProps) {
  if (error) {
    return <div className="rounded border border-red-200 bg-red-50 p-4 text-red-600">{error}</div>;
  }

  if (adSlots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[--color-border] p-8 text-center text-[--color-muted]">
        No ad slots yet. Create your first ad slot to start earning.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {adSlots.map((slot) => (
        <AdSlotCard key={slot.id} adSlot={slot} />
      ))}
    </div>
  );
}
