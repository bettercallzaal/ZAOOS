import { redirect } from 'next/navigation';

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
