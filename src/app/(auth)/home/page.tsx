import type { Metadata } from 'next';
import { HomePage } from '@/components/home/HomePage';

export const metadata: Metadata = { title: 'Home - ZAO OS' };

export default function HomePageRoute() {
  return <HomePage />;
}
