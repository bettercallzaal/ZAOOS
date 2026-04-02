# NFT Gallery on Member Profiles

> **Date:** March 28, 2026
> **Goal:** Show all NFTs a member holds on their profile page with filtering

## Design

### API Route: `src/app/api/members/nfts/route.ts`
- Reuse existing Alchemy NFT v3 API (ALCHEMY_API_KEY already in env)
- Scan ETH, Base, Optimism chains (same as music/wallet route)
- Remove music-only filter — return ALL NFTs with images
- Accept `?address=0x...` query param
- Return: name, collection, image, chain, contractAddress, tokenId, marketplace URL
- 5-minute cache header
- Auth required (session check)

### Component: `src/components/members/NFTGallery.tsx`
- Lazy-loaded via `next/dynamic` on profile page
- Fetches NFTs using member's wallet address(es)
- Responsive grid: 3 cols mobile, 4 cols sm, 5 cols md
- Each NFT card: thumbnail (square), name, collection name, chain badge (ETH/Base/OP)
- ZOUNZ NFTs get gold border (match `0xCB80Ef04DA68667c9a4450013BDD69269842c883`)
- Click opens NFT on OpenSea/Zora
- Loading skeleton while fetching

### Filters
- **Chain filter:** All / Ethereum / Base / Optimism (pill buttons)
- **Collection filter:** dropdown of unique collection names found
- **ZOUNZ only:** quick toggle to show only ZOUNZ NFTs
- Filter state managed locally (useState)

### Profile Page Integration
- Add between Reputation Signals and Fractal History sections
- Only render if member has a wallet address
- Show count in section header: "NFTs (42)"

## Files to Create/Edit
1. CREATE `src/app/api/members/nfts/route.ts`
2. CREATE `src/components/members/NFTGallery.tsx`
3. EDIT `src/app/members/[username]/page.tsx` — add dynamic import + render
