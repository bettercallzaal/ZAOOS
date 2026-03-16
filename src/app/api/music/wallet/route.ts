import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';

/**
 * GET — Discover music NFTs owned or created by a wallet address
 * Query: ?address=0x... (ETH address)
 * Queries Sound.xyz and Zora for music-related NFTs
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

  const tracks: {
    title: string;
    artist: string;
    artworkUrl: string | null;
    audioUrl: string | null;
    platform: string;
    url: string;
    mintedAt: string | null;
    role: 'creator' | 'collector';
  }[] = [];

  // Query Sound.xyz for releases by this wallet
  try {
    const soundRes = await fetch('https://api.sound.xyz/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query ArtistReleases($address: String!) {
            publicAddress(address: $address) {
              user {
                artist {
                  releases(pagination: { limit: 20, offset: 0 }) {
                    edges {
                      node {
                        title
                        coverImage { url }
                        track { normalizedAudioUrl }
                        webappUri
                        createdAt
                        artist { name }
                      }
                    }
                  }
                }
              }
              nftsOwned(
                pagination: { limit: 20, offset: 0 }
                filter: { onlyMusicNfts: true }
              ) {
                edges {
                  node {
                    release {
                      title
                      coverImage { url }
                      track { normalizedAudioUrl }
                      webappUri
                      artist { name }
                    }
                    createdAt
                  }
                }
              }
            }
          }
        `,
        variables: { address: address.toLowerCase() },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (soundRes.ok) {
      const data = await soundRes.json();
      const pa = data?.data?.publicAddress;

      // Artist releases
      const releases = pa?.user?.artist?.releases?.edges || [];
      for (const edge of releases) {
        const r = edge.node;
        if (!r) continue;
        tracks.push({
          title: r.title || 'Untitled',
          artist: r.artist?.name || 'Unknown',
          artworkUrl: r.coverImage?.url || null,
          audioUrl: r.track?.normalizedAudioUrl || null,
          platform: 'Sound.xyz',
          url: r.webappUri ? `https://www.sound.xyz${r.webappUri}` : '',
          mintedAt: r.createdAt || null,
          role: 'creator',
        });
      }

      // Collected NFTs
      const collected = pa?.nftsOwned?.edges || [];
      for (const edge of collected) {
        const n = edge.node;
        const r = n?.release;
        if (!r) continue;
        // Avoid duplicates with releases
        if (tracks.some((t) => t.title === r.title && t.artist === r.artist?.name)) continue;
        tracks.push({
          title: r.title || 'Untitled',
          artist: r.artist?.name || 'Unknown',
          artworkUrl: r.coverImage?.url || null,
          audioUrl: r.track?.normalizedAudioUrl || null,
          platform: 'Sound.xyz',
          url: r.webappUri ? `https://www.sound.xyz${r.webappUri}` : '',
          mintedAt: n.createdAt || null,
          role: 'collector',
        });
      }
    }
  } catch (err) {
    console.error('Sound.xyz query failed:', err);
  }

  // Query Zora for music/audio NFTs (using their public API)
  try {
    const zoraRes = await fetch('https://api.zora.co/discover/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerAddresses: [address.toLowerCase()],
        chains: ['ETHEREUM', 'OPTIMISM', 'BASE', 'ZORA'],
        mediaType: 'AUDIO',
        limit: 20,
        offset: 0,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (zoraRes.ok) {
      const data = await zoraRes.json();
      for (const token of data?.results || []) {
        const name = token.name || token.metadata?.name || 'Untitled';
        // Avoid Sound.xyz duplicates
        if (tracks.some((t) => t.title === name)) continue;
        tracks.push({
          title: name,
          artist: token.metadata?.artist || token.creator?.username || 'Unknown',
          artworkUrl: token.image?.url || token.metadata?.image || null,
          audioUrl: token.metadata?.animation_url || null,
          platform: 'Zora',
          url: token.marketUrl || `https://zora.co/collect/${token.chain?.toLowerCase() || 'eth'}:${token.address}/${token.tokenId}`,
          mintedAt: token.mintedAt || null,
          role: token.creator?.address?.toLowerCase() === address.toLowerCase() ? 'creator' : 'collector',
        });
      }
    }
  } catch (err) {
    console.error('Zora query failed:', err);
  }

  // Sort: creators first, then by date
  tracks.sort((a, b) => {
    if (a.role !== b.role) return a.role === 'creator' ? -1 : 1;
    if (a.mintedAt && b.mintedAt) return new Date(b.mintedAt).getTime() - new Date(a.mintedAt).getTime();
    return 0;
  });

  return NextResponse.json({ tracks, address });
}
