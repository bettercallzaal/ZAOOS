import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Library — ZAO OS',
  description: 'Submit and browse community links, topics, and research resources',
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
