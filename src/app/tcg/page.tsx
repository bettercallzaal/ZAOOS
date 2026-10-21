import type { Metadata } from 'next';
import TcgDropClient from './TcgDropClient';

export const metadata: Metadata = {
  title: 'ZAO TCG Card',
  description:
    'Buy the BetterCallZaal song on WaveZ Station and get the first ZAO TCG Card, made by Cannon Jones.',
};

export default function TcgPage() {
  return <TcgDropClient />;
}
