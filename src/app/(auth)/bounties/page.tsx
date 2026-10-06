import type { Metadata } from 'next';
import { BountiesHub } from '@/components/bounties/BountiesHub';

export const metadata: Metadata = {
  title: 'POIDH Bounties | The ZAO',
  description: 'Proof of Ink DAO video, creative, and code bounties on Base for The ZAO community.',
};

export default function BountiesPage() {
  return <BountiesHub />;
}
