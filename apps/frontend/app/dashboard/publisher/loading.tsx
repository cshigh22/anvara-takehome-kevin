export default function PublisherDashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-[--color-border]" />
      </div>
      <div className="py-8 text-center text-[--color-muted]">Loading ad slots...</div>
    </div>
  );
}
