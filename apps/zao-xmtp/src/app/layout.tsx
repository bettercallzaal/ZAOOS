import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ZAO XMTP',
  description: 'Private messages between ZAO Respect holders, on XMTP.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a1628] text-slate-200 antialiased">{children}</body>
    </html>
  );
}
