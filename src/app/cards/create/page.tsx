import type { Metadata } from 'next';
import { CardBuilderLoader } from '@/components/cards/CardBuilderLoader';

// Public on purpose: outside the (auth) group so artists who are not ZAO members can
// make a card. It saves nothing on a server, so it needs no session.
export const metadata: Metadata = {
  title: 'ZAO Card Builder',
  description: 'Make your ZAO trading card. It stays on your device until you export it.',
};

export default function CardBuilderPage() {
  return <CardBuilderLoader />;
}
