import type { Metadata } from 'next';
import { OSHome } from '@/components/os/OSHome';

export const metadata: Metadata = {
  title: 'ZAO OS',
  description: 'Your personal operating system for The ZAO community',
};

export default function OSPage() {
  return <OSHome />;
}
