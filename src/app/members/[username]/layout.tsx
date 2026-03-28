import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const displayName = decodeURIComponent(username);

  return {
    title: `${displayName} — ZAO OS Member`,
    description: `View ${displayName}'s profile on ZAO OS. Part of the decentralized music community building onchain together.`,
    openGraph: {
      title: `${displayName} — ZAO OS Member`,
      description: `View ${displayName}'s profile on ZAO OS.`,
      url: `https://zaoos.com/members/${username}`,
    },
  };
}

export default function MemberProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
