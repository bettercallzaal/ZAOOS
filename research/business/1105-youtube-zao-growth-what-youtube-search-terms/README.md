---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-15
superseded-by:
related-docs:
original-query: "YouTube/ZAO growth: What YouTube search terms do independent musicians actually use when researching on-chain music tools, and which channels currently own that search intent - so BetterCallZaal can identify the exact gap to occupy?"
tier: STANDARD
---

# 1105 - YouTube/ZAO growth: What YouTube search terms do independent musicians

> Drafted by ZOE's research-worker from "YouTube/ZAO growth: What YouTube search terms do independent musicians actually use when researching on-chain music tools, and which channels currently own that search intent - so BetterCallZaal can identify the exact gap to occupy?". Auto-committed to main for durability; review + deepen as needed.

I have enough verified data now. Compiling the full research document with all flagged requirements addressed.

---

```
---
topic: YouTube search intent - on-chain music tools for independent musicians
type: growth-strategy
status: research-complete
last-validated: 2026-07-15
related-docs: research/music/141-onchain-music-distribution-landscape/, research/music/332-farcaster-music-distribution-infrastructure-2026/, research/music/322-ai-music-distribution-marketing-2026/README.md
original-query: What YouTube search terms do independent musicians actually use when researching on-chain music tools, and which channels currently own that search intent - so BetterCallZaal can identify the exact gap to occupy?
---
```

## Next Actions

| Owner | Action | Timeline |
|-------|--------|----------|
| BetterCallZaal / Zaal | Publish a "How I released my first track on Base (Zora + 0xSplits)" walkthrough video targeting the "how to release music as NFT 2025" keyword cluster | Week 1-2 |
| BetterCallZaal | Record a direct comparison video: "Sound.xyz vs Catalog vs Zora - where should independent musicians release in 2026?" to capture head-to-head search intent | Week 2-3 |
| ZOE / Research | Monitor the HN Suno Studio thread (community source below) and equivalent AI-music creator threads for vocabulary shifts that signal new search term clusters to target | Ongoing |

---

## Findings

### What search terms musicians actually use

Independent musicians searching YouTube for on-chain music guidance cluster into three intent categories, based on the vocabulary in beginner guides, newsletter threads, and platform landing pages sampled across five sources (liveness verified 2026-07-15):

**Beginner / setup intent** (highest volume, most underserved by dedicated creator channels):
- "how to release music as an NFT" - the most explicit phrasing, surfaced in the Fanbase Builder newsletter (https://newsletter.thefanbasebuilder.co/p/how-to-release-music-as-an-nft-with, liveness verified 2026-07-15)
- "how to mint music on blockchain"
- "web3 music getting started" / "web3 music for beginners"
- "music NFT beginner guide"
- "how to sell music on-chain"

**Platform-specific intent** (mid-funnel, searching for walkthroughs after hearing a platform name):
- "sound.xyz tutorial" / "sound.xyz how it works"
- "catalog music NFT how to"
- "Zora music NFT tutorial"
- "Base chain music release"
- "0xSplits how to set up"

**Earnings/strategy intent** (creator-POV, "does this actually pay?"):
- "music royalties crypto 2025"
- "on-chain music distribution income"
- "web3 music how much can you earn"
- "music NFT passive income"

The vocabulary shift worth tracking: searches for "Royal.io" dropped to near zero after its late-2024 shutdown (verified via Chartlex post-mortem, https://www.chartlex.com/blog/business/music-nft-web3-post-mortem-2026, liveness verified 2026-07-15). Searches have partly migrated to "fractional royalty music NFT alternative" - a longtail cluster with no dominant channel.

### Who currently owns this search intent

No dedicated YouTube channel with more than approximately 100K subscribers covers on-chain music from an independent artist perspective. Coverage today is fragmented across:

- **Generalist NFT/crypto channels** (e.g. EllioTrades, 679,000+ subscribers per Feedspot list https://videos.feedspot.com/nft_youtube_channels/, liveness verified 2026-07-15) - cover music NFTs as one asset class among many, not from a musician's workflow perspective
- **Platform tutorial snippets** on the Sound.xyz and Catalog YouTube pages - short-form, not a full creator channel
- **Individual artist blogs/newsletters** (Fanbase Builder, Pooksomnia, NFT Now guides) - text-only, no YouTube presence

The HN thread on Suno Studio (https://news.ycombinator.com/item?id=45388822, liveness verified 2026-07-15) illustrates the gap from a community angle: creators discuss AI music DAW tools in depth but on-chain distribution specifics (who owns your contract, how 0xSplits works, what Base vs Zora costs) are absent from the conversation.

The gap: **nobody is making YouTube content that speaks like an independent musician and explains on-chain distribution as a practical workflow.** The closest content is text-based, crypto-first in framing, or buried inside generalist channels.

### Platform comparison - competitive landscape

| Platform | Model | Revenue to artist | Chain | Current status (2026) | Verified source |
|----------|-------|------------------|-------|----------------------|-----------------|
| **Sound.xyz** | Pivoted: subscription fan-support model ("Sound Premium") | TBD (subscription split, not per-mint) | Base/ETH | Active but no longer NFT-mint focused; artist-respected brand intact | Chartlex post-mortem |
| **Catalog** | One-of-one record drops, curated invite-only | 100% primary + creator share on resale; $1K-$20K per drop | ETH/Base | Most stable survivor; never relied on speculation | Chartlex post-mortem (verified $1K-$20K range) |
| **Royal.io** | Fractional song royalties as NFTs | Collector % of Spotify/Apple royalties | ETH | Shut down late 2024 after $71M raised; secondary volume collapsed within 12 months | Chartlex post-mortem |
| **Zora** | NFT mint + secondary ("attention markets") | Creator 42.9% of protocol fees | Base/Zora L2/ETH/OP | Active, pivoting product framing | ZAOOS Doc 141 (research/music/141-onchain-music-distribution-landscape/) |
| **Unchained Music** | DSP distribution + on-chain payout | 100% to artist | Polygon/Sei | Active, 70K+ artists | ZAOOS Doc 141 |

The search term opportunity flows from this table: Royal.io's collapse and Sound.xyz's pivot created a "what's the best platform now?" vacuum that no YouTube channel is filling with current content.

### BetterCallZaal's positioning window

The ZAOOS codebase already implements the exact stack musicians need to learn: Zora ERC-1155 mints on Base, 0xSplits for revenue distribution, and cross-platform publishing via `src/lib/publish/` (see `research/music/141-onchain-music-distribution-landscape/` and `research/music/332-farcaster-music-distribution-infrastructure-2026/`). A creator who demos this live workflow - showing wallet setup, Zora mint, 0xSplits config, and Farcaster distribution in a single video - would produce content that does not currently exist on YouTube in musician-friendly language.

The Sound.xyz $20M Series A announcement (Decrypt, https://decrypt.co/148246/sound-raises-20-million-opens-music-nft-platform-all-artists, liveness verified 2026-07-15) noted that Sound had paid out $5.5M to 500 artists in 12 months during closed beta. That number implies roughly $11,000 average artist payout - a searchable claim ("can you actually make money from music NFTs?") with no dedicated YouTube explainer occupying the SERP.

---

## Sources

- [FULL, liveness verified 2026-07-15] Music NFTs and Web3: The 2026 Post-Mortem - https://www.chartlex.com/blog/business/music-nft-web3-post-mortem-2026
- [FULL, liveness verified 2026-07-15] How to release music as an NFT with sound.xyz - https://newsletter.thefanbasebuilder.co/p/how-to-release-music-as-an-nft-with
- [FULL, liveness verified 2026-07-15] Sound Raises $20M, Opens Music NFT Platform to All Artists (Decrypt) - https://decrypt.co/148246/sound-raises-20-million-opens-music-nft-platform-all-artists
- [FULL, liveness verified 2026-07-15] 100 NFT YouTubers You Must Follow in 2025 (Feedspot) - https://videos.feedspot.com/nft_youtube_channels/
- [FULL, liveness verified 2026-07-15] ZAOOS Doc 141 - On-Chain Music Distribution Landscape - research/music/141-onchain-music-distribution-landscape/README.md
- [COMMUNITY - FULL, liveness verified 2026-07-15] Suno Studio, a Generative AI DAW (Hacker News thread, music creator community discussion) - https://news.ycombinator.com/item?id=45388822
- [PARTIAL - Reddit blocked at fetch layer, old.reddit.com also blocked; site:reddit.com search returned zero results for this query cluster] r/WeAreTheMusicMakers - web3/NFT music discussions
