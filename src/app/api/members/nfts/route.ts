import { NextRequest, NextResponse } from 'next/server';
import { getSessionData } from '@/lib/auth/session';

export interface NFTItem {
  name: string;
  collection: string;
  imageUrl: string | null;
  chain: 'eth' | 'base' | 'optimism';
  contractAddress: string;
  tokenId: string;
  url: string;
  isZounz: boolean;
}

const ZOUNZ_TOKEN = '0xcb80ef04da68667c9a4450013bdd69269842c883';

const CHAINS = [
  { name: 'eth' as const, url: (key: string) => `https://eth-mainnet.g.alchemy.com/nft/v3/${key}` },
  { name: 'base' as const, url: (key: string) => `https://base-mainnet.g.alchemy.com/nft/v3/${key}` },
  { name: 'optimism' as const, url: (key: string) => `https://opt-mainnet.g.alchemy.com/nft/v3/${key}` },
];

export async function GET(req: NextRequest) {
  const session = await getSessionData();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const address = req.nextUrl.searchParams.get('address');
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Valid ETH address required' }, { status: 400 });
  }

  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NFT service not configured' }, { status: 503 });
  }

  const results = await Promise.allSettled(
    CHAINS.map(chain => fetchNFTsForChain(address, chain.name, chain.url(apiKey)))
  );

  const nfts: NFTItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      nfts.push(...result.value);
    }
  }

  // Sort: ZOUNZ first, then by collection name
  nfts.sort((a, b) => {
    if (a.isZounz !== b.isZounz) return a.isZounz ? -1 : 1;
    return a.collection.localeCompare(b.collection);
  });

  return NextResponse.json({ nfts, address, count: nfts.length }, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  });
}

async function fetchNFTsForChain(
  address: string,
  chain: 'eth' | 'base' | 'optimism',
  baseUrl: string
): Promise<NFTItem[]> {
  const url = `${baseUrl}/getNFTsForOwner?owner=${address}&withMetadata=true&pageSize=50&excludeFilters[]=SPAM`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];

  const data = await res.json();
  const items: NFTItem[] = [];

  for (const nft of data.ownedNfts || []) {
    const meta = nft.raw?.metadata || nft.metadata || {};
    const contractAddr = (nft.contract?.address || '').toLowerCase();
    const imageUrl = nft.image?.cachedUrl || nft.image?.thumbnailUrl || meta.image || null;

    // Skip NFTs without images
    if (!imageUrl) continue;

    const name = meta.name || nft.name || nft.title || `#${nft.tokenId || '?'}`;
    const collection = nft.contract?.name || nft.contract?.openSeaMetadata?.collectionName || 'Unknown';
    const isZounz = contractAddr === ZOUNZ_TOKEN;

    // Build marketplace URL
    let nftUrl: string;
    if (contractAddr.includes('zora') || nft.contract?.name?.toLowerCase().includes('zora')) {
      nftUrl = `https://zora.co/collect/${chain}:${contractAddr}/${nft.tokenId}`;
    } else {
      nftUrl = `https://opensea.io/assets/${chain === 'eth' ? 'ethereum' : chain}/${contractAddr}/${nft.tokenId}`;
    }

    items.push({
      name,
      collection,
      imageUrl,
      chain,
      contractAddress: contractAddr,
      tokenId: nft.tokenId || '0',
      url: nftUrl,
      isZounz,
    });
  }

  return items;
}
