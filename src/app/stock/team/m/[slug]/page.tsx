import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMemberBySlug, getPublicMembers } from '@/lib/stock/members';
import { MemberProfileView } from './MemberProfileView';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);
  if (!member) return { title: 'Member not found' };

  return {
    title: `${member.name} | ZAOstock Team`,
    description: member.bio.slice(0, 160) || `${member.name} on the ZAOstock team.`,
    openGraph: {
      title: `${member.name} | ZAOstock Team`,
      description: member.bio.slice(0, 160) || `${member.name} - ZAOstock team`,
      images: member.photo_url ? [member.photo_url] : [],
    },
  };
}

export default async function MemberProfilePage({ params }: Props) {
  const { slug } = await params;
  const member = await getMemberBySlug(slug);
  if (!member) notFound();

  const all = await getPublicMembers();
  const teammates = all.filter((m) => m.id !== member.id).slice(0, 8);

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-12">
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/stock" className="text-xs text-gray-400 hover:text-[#f5a623]">
            &larr; ZAOstock
          </Link>
          <span className="text-xs text-gray-500">The Team</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <MemberProfileView member={member} />

        {teammates.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider px-1">
              More of the crew
            </p>
            <div className="flex flex-wrap gap-2">
              {teammates.map((t) => (
                <Link
                  key={t.id}
                  href={`/stock/team/m/${t.slug}`}
                  className="text-xs bg-[#0d1b2a] border border-white/[0.08] rounded-full px-3 py-1.5 text-gray-300 hover:border-[#f5a623]/30 hover:text-white transition-colors"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-2">
          <p className="text-xs text-[#f5a623] uppercase tracking-wider font-bold">About ZAOstock</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {member.name} is part of the crew building ZAOstock - a community-built outdoor music festival in Ellsworth, Maine on October 3, 2026. Ten artists, one stage, all day at the Franklin Street Parklet. Part of the 9th Annual Art of Ellsworth.
          </p>
          <div className="flex gap-2 pt-2">
            <Link
              href="/stock"
              className="text-xs bg-[#f5a623] hover:bg-[#ffd700] text-black font-bold rounded-lg px-3 py-2 transition-colors"
            >
              Festival info
            </Link>
            <Link
              href="/stock/program"
              className="text-xs bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              Program
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
