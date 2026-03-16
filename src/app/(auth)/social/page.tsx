import type { Metadata } from 'next';
import { SocialPage } from '@/components/social/SocialPage';

export const metadata: Metadata = { title: 'Social - ZAO OS' };

export default function Social() {
  return <SocialPage />;
}
