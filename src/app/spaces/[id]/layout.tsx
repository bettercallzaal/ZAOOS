import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Room ${id} — ZAO OS Spaces`,
    description:
      'Join this live audio room on ZAO OS. Listen, speak, and connect with the ZAO music community in real time.',
    openGraph: {
      title: `Room ${id} — ZAO OS Spaces`,
      description:
        'Join this live audio room on ZAO OS. Listen, speak, and connect with the ZAO music community.',
      url: `https://zaoos.com/spaces/${id}`,
    },
  };
}

export default function SpacesRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
