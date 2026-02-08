import type { ScanResult } from '@/types/scan';

export async function runScan(domain: string): Promise<ScanResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Backend not configured');
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/vendor-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ domain }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Scan failed (${res.status})`);
  }

  return res.json();
}
