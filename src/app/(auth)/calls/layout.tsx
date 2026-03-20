import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calls — The ZAO',
  description: 'Voice and video rooms for fractal calls and community hangouts',
};

export default function CallsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
