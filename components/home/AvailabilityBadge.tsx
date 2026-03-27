import { createServerClient } from '@/lib/supabase/server';

type AvailabilityStatus = 'available' | 'limited' | 'unavailable';

const STATUS_CONFIG: Record<AvailabilityStatus, { color: string; label: string; dot: string }> = {
  available: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', label: 'Available for new projects', dot: 'bg-green-500' },
  limited: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400', label: 'Limited availability', dot: 'bg-yellow-500' },
  unavailable: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400', label: 'Fully booked', dot: 'bg-red-500' },
};

export async function AvailabilityBadge() {
  let status: AvailabilityStatus = 'available';

  try {
    const supabase = createServerClient();
    const { data } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'availability_status')
      .single();

    if (data?.value) {
      const raw = typeof data.value === 'string' ? data.value : String(data.value);
      if (raw === 'available' || raw === 'limited' || raw === 'unavailable') {
        status = raw;
      }
    }
  } catch {
    // Fall back to default
  }

  const config = STATUS_CONFIG[status];

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${config.color}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}
