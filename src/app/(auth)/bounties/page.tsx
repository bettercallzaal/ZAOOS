import type { Metadata } from 'next';
import {
  BountiesHub,
  ZAO_BOUNTIES_URL,
  type ZaoBountiesFeed,
} from '@/components/bounties/BountiesHub';

export const metadata: Metadata = {
  title: 'POIDH Bounties | The ZAO',
  description: 'ZAO bounties on poidh, on Base, read from the chain.',
};

export const revalidate = 600;

async function loadFeed(): Promise<ZaoBountiesFeed | null> {
  try {
    const res = await fetch(ZAO_BOUNTIES_URL, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const data = (await res.json()) as ZaoBountiesFeed;
    if (!Array.isArray(data.ours)) return null;
    return { ...data, community: data.community ?? [] };
  } catch {
    return null;
  }
}

export default async function BountiesPage() {
  return <BountiesHub feed={await loadFeed()} />;
}
