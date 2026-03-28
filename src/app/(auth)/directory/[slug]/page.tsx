import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ');
  return {
    title: `${name} — ZAO Directory`,
    description: `View ${name}'s profile in the ZAO community directory`,
  };
}

// Individual directory profiles now live at /members/[username]
// Try to redirect by slug → username mapping
export default async function DirectorySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/members/${slug}`);
}
