import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

interface MusicNFT {
  title: string;
  artist: string;
  artworkUrl: string | null;
  audioUrl: string | null;
  platform: string;
  url: string;
  mintedAt: string | null;
  role: 'creator' | 'collector';
  chain: string | null;
  contractAddress: string | null;
  tokenId: string | null;
}

/**
 * GET — Discover music NFTs owned by a wallet address
 * Primary: Alchemy NFT API (reliable, multi-chain)
 * Fallback: Sound.xyz GraphQL + Zora discover API (legacy)
 */
export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const address = req.nextUrl.searchParams.get('address');
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Valid ETH address required' }, { status: 400 });
  }

  let tracks: MusicNFT[] = [];
  let source = 'none';

  // ── Primary: Alchemy NFT API ──────────────────────────────────
  if (process.env.ALCHEMY_API_KEY) {
    try {
      tracks = await fetchAlchemyNFTs(address, process.env.ALCHEMY_API_KEY);
      source = 'alchemy';
    } catch (err) {
      logger.error('[music/wallet] Alchemy NFT API failed, falling back:', err);
    }
  }

  // ── Fallback: Sound.xyz + Zora direct ─────────────────────────
  if (tracks.length === 0) {
    // Sound.xyz shut down Jan 16, 2026. Only Zora fallback remains.
    const zoraResult = await fetchZora(address).catch(() => [] as MusicNFT[]);
    tracks.push(...zoraResult);
    if (tracks.length > 0) source = 'legacy';
  }

  // Sort: creators first, then by date
  tracks.sort((a, b) => {
    if (a.role !== b.role) return a.role === 'creator' ? -1 : 1;
    if (a.mintedAt && b.mintedAt) return new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime();
    return 0;
  });

  return NextResponse.json({ tracks, address, source }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  });
}

// ── Alchemy NFT API ─────────────────────────────────────────────

const AUDIO_MIME_TYPES = ['audio/', 'application/ogg'];
const MUSIC_CONTRACTS = [
  '0x7e1a7720b2904ac974e12166080ae2a6b5ab6dd6', // Sound.xyz Protocol v2
  '0xbe8f3dfce2fcbb6dd08a7e8109b4e2b066b9d5d1', // Sound.xyz Edition
];

async function fetchAlchemyNFTs(address: string, apiKey: string): Promise<MusicNFT[]> {
  const chains = [
    { name: 'eth', url: `https://eth-mainnet.g.alchemy.com/nft/v3/${apiKey}` },
    { name: 'optimism', url: `https://opt-mainnet.g.alchemy.com/nft/v3/${apiKey}` },
    { name: 'base', url: `https://base-mainnet.g.alchemy.com/nft/v3/${apiKey}` },
  ];

  const results: MusicNFT[] = [];

  for (const chain of chains) {
    try {
      const url = `${chain.url}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=50`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;

      const data = await res.json();

      for (const nft of data.ownedNfts || []) {
        const meta = nft.raw?.metadata || nft.metadata || {};
        const contractAddr = (nft.contract?.address || '').toLowerCase();

        // Filter for music/audio NFTs
        const isAudio = meta.animation_url && AUDIO_MIME_TYPES.some(m =>
          (nft.raw?.metadata?.mimeType || '').startsWith(m) ||
          (meta.animation_url || '').match(/\.(mp3|wav|flac|ogg|aac|m4a)(\?|$)/i)
        );
        const isMusicContract = MUSIC_CONTRACTS.includes(contractAddr);
        const hasMusicTag = (meta.tags || []).some((t: string) => ['music', 'audio', 'song'].includes(t?.toLowerCase()));
        const hasAudioProp = !!meta.audio_url || !!meta.losslessAudio;

        if (!isAudio && !isMusicContract && !hasMusicTag && !hasAudioProp) continue;

        const title = meta.name || nft.name || nft.title || 'Untitled';
        const artist = meta.artist || meta.artist_name || nft.contract?.name || 'Unknown';
        const artworkUrl = meta.image || nft.image?.cachedUrl || nft.image?.thumbnailUrl || null;
        const audioUrl = meta.animation_url || meta.audio_url || meta.losslessAudio || null;

        // Determine platform from contract
        let platform = 'NFT';
        if (isMusicContract || contractAddr.includes('sound')) platform = 'Sound.xyz';
        else if (nft.contract?.name?.toLowerCase().includes('zora') || contractAddr.includes('zora')) platform = 'Zora';

        // Build URL
        let nftUrl = '';
        if (platform === 'Sound.xyz') {
          nftUrl = `https://www.sound.xyz/collect/${contractAddr}/${nft.tokenId}`;
        } else if (platform === 'Zora') {
          nftUrl = `https://zora.co/collect/${chain.name}:${contractAddr}/${nft.tokenId}`;
        } else {
          nftUrl = `https://opensea.io/assets/${chain.name}/${contractAddr}/${nft.tokenId}`;
        }

        results.push({
          title,
          artist,
          artworkUrl,
          audioUrl,
          platform,
          url: nftUrl,
          mintedAt: nft.mint?.timestamp || meta.created_at || null,
          role: 'collector', // Alchemy doesn't distinguish creator vs collector easily
          chain: chain.name,
          contractAddress: contractAddr,
          tokenId: nft.tokenId || null,
        });
      }
    } catch (err) {
      logger.error(`[alchemy-nft] ${chain.name} failed:`, err);
    }
  }

  return results;
}

// Sound.xyz shut down January 16, 2026. Vault.fm has no public API.
// Sound.xyz NFTs are still on-chain and detected via Alchemy NFT scan.

// ── Zora fallback ───────────────────────────────────────────────

async function fetchZora(address: string): Promise<MusicNFT[]> {
  const tracks: MusicNFT[] = [];

  const zoraRes = await fetch('https://api.zora.co/discover/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ownerAddresses: [address.toLowerCase()],
      chains: ['ETHEREUM', 'OPTIMISM', 'BASE', 'ZORA'],
      mediaType: 'AUDIO',
      limit: 20, offset: 0,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!zoraRes.ok) return tracks;
  const data = await zoraRes.json();

  for (const token of data?.results || []) {
    const name = token.name || token.metadata?.name || 'Untitled';
    tracks.push({
      title: name,
      artist: token.metadata?.artist || token.creator?.username || 'Unknown',
      artworkUrl: token.image?.url || token.metadata?.image || null,
      audioUrl: token.metadata?.animation_url || null,
      platform: 'Zora',
      url: token.marketUrl || `https://zora.co/collect/${token.chain?.toLowerCase() || 'eth'}:${token.address}/${token.tokenId}`,
      mintedAt: token.mintedAt || null,
      role: token.creator?.address?.toLowerCase() === address.toLowerCase() ? 'creator' : 'collector',
      chain: token.chain?.toLowerCase() || null,
      contractAddress: token.address || null,
      tokenId: token.tokenId || null,
    });
  }

  return tracks;
}
