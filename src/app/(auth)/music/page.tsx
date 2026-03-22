import type { Metadata } from 'next';
import { MusicPage } from '@/components/music/MusicPage';

export const metadata: Metadata = { title: 'Music - ZAO OS' };

export default function MusicPageRoute() {
  return <MusicPage />;
}
