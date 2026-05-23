import { Metadata } from 'next';
import { ZabalDemoClient } from './ZabalDemoClient';

export const metadata: Metadata = {
  title: 'ZABAL Demo - Click-through (no data persisted)',
  description:
    'Fully interactive ZABAL voting demo with mock data. No Supabase, no Farcaster auth required.',
};

/**
 * Self-contained demo of the ZABAL rollup. Everything is mock + client-side:
 * no Supabase, no API calls, no Farcaster auth. Use to click through the
 * whole flow on a Vercel preview before the real migration is applied.
 *
 * The real surfaces are /zabal and /zabal/spotlight.
 */
export default function ZabalDemoPage() {
  return <ZabalDemoClient />;
}
