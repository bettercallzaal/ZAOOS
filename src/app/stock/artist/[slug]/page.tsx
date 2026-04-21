import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArtistBySlug, verifyClaimToken } from '@/lib/stock/artists';
import { ArtistProfileView } from './ArtistProfileView';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return { title: 'Artist not found' };

  return {
    title: `${artist.name} | ZAOstock Artist`,
    description: artist.bio.slice(0, 160) || `${artist.name} at ZAOstock, Oct 3 2026 in Ellsworth Maine.`,
    openGraph: {
      title: `${artist.name} | ZAOstock`,
      description: artist.bio.slice(0, 160) || `${artist.name} - ${artist.genre || 'music'}`,
      images: artist.photo_url ? [artist.photo_url] : [],
    },
  };
}

export default async function ArtistProfilePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { token } = await searchParams;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const canEdit = token ? Boolean(await verifyClaimToken(slug, token)) : false;

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-12">
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/stock" className="text-xs text-gray-400 hover:text-[#f5a623]">
            &larr; ZAOstock
          </Link>
          <span className="text-xs text-gray-500">Artist</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <ArtistProfileView artist={artist} canEdit={canEdit} token={token || ''} />

        <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-2">
          <p className="text-xs text-[#f5a623] uppercase tracking-wider font-bold">About ZAOstock</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {artist.name} is on the ZAOstock roster for Oct 3, 2026 at the Franklin Street Parklet in Ellsworth, Maine. Community-built outdoor music festival, part of the 9th Annual Art of Ellsworth. Ten artists, one stage, live cypher, WaveWarZ bracket. Run by The ZAO.
          </p>
          <div className="flex gap-2 pt-1">
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
            <Link
              href="/stock/cypher"
              className="text-xs bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              Cypher signup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
