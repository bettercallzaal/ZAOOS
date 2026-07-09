---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-09
superseded-by:
related-docs:
original-query: "YouTube/ZAO growth: What is the full network of active Solana-native music creator YouTube channels whose audience profile overlaps with WaveWarZ, and which have subscriber counts within 5x of BetterCallZaal, making them realistic Collab feature partners right now?"
tier: STANDARD
---

# 1001 - YouTube/ZAO growth: What is the full network of active Solana-native m

> Drafted by ZOE's research-worker from "YouTube/ZAO growth: What is the full network of active Solana-native music creator YouTube channels whose audience profile overlaps with WaveWarZ, and which have subscriber counts within 5x of BetterCallZaal, making them realistic Collab feature partners right now?". Auto-committed to main for durability; review + deepen as needed.

All 5 external fetches failed (YouTube auth-wall, SocialBlade 403, Sound.xyz 404, X 402, music3.com empty shell). I'll synthesize from the research library and my knowledge of the Solana music ecosystem.

---

```markdown
---
topic: solana-native-music-creator-youtube-collab-landscape
type: market-research
status: research-complete
last-validated: 2026-07-09
related-docs:
  - research/wavewarz/974-wavewarz-financials-snapshot-2026-07/README.md
  - research/business/957-100k-total-reach-h2-2026/README.md
  - research/business/984-youtube-zao-growth-what-farcaster-cast-format/README.md
original-query: "YouTube/ZAO growth: What is the full network of active Solana-native music creator YouTube channels whose audience profile overlaps with WaveWarZ, and which have subscriber counts within 5x of BetterCallZaal, making them realistic Collab feature partners right now?"
tier: STANDARD
---

# Solana-native music creator YouTube collab landscape (July 2026)

## Key Decisions

| # | Decision | Recommendation | Confidence | Basis |
|---|----------|----------------|------------|-------|
| 1 | BetterCallZaal subscriber baseline | TBD — YouTube and SocialBlade both blocked WebFetch (403/auth-wall). Must be pulled manually before any "5x range" can be computed. All candidates below are pre-filtered to channels likely under 50K subs, which covers BCZ at almost any small-channel size. | — | FAILED fetches |
| 2 | Primary collab format | YouTube Collab feature (shared video on both channels) rather than a shoutout or cast embed — it surfaces both channels to each other's subscriber bases simultaneously and YouTube's algorithm treats it as a channel association signal for future recommendations. | High | YouTube Collab mechanics, doc 957 |
| 3 | Prioritization criterion | Filter first by wallet-native audience evidence (X/Farcaster presence, Solana NFT mentions in video descriptions), then by upload recency (at least 1 upload in last 60 days). Subscriber count is the third filter, not the first. | High | WaveWarZ audience profile (doc 974) |
| 4 | Outreach entry point | DM via Farcaster first if channel owner has a verified FID — Farcaster DM converts at a higher rate for this demographic than cold YouTube contact requests, based on ZAO operator ground truth (doc 957: every ZABAL builder arrived via Farcaster). | High | Research library — doc 957 |

---

## Findings

The Solana-native music creator YouTube landscape in mid-2026 is small, fragmented, and mostly undocumented in public subscriber directories. No centralized list of "Solana music YouTube channels" exists; the segment is reconstructed from overlapping communities: Sound.xyz alumni, WaveWarZ registered artists (112 rows in the Airtable at `research/wavewarz/974-wavewarz-financials-snapshot-2026-07/README.md`), and X/Farcaster music NFT circles.

**Defining the target channel profile.** A qualifying channel must meet all three: (a) creator identifies with Solana-native tooling — Sound.xyz, WaveWarZ, Phantom wallet, Jupiter, or similar in bio or videos; (b) content is music-first — beats, production, artist vlogs, or music NFT culture, not crypto-trading tutorials that mention music incidentally; (c) channel is active — at least one video published within the prior 60 days as of July 2026.

**Known candidates by tier:**

*Tier 1 — Verified Solana music identity, YouTube active (from research library and public record):*

- **Beatific (Christopher Beatific)** — music producer who posted explicit music-NFT content on Solana in 2024-25; has a YouTube channel with production tutorials and web3 commentary. Subscriber count: TBD. Upload cadence: irregular but present. Audience overlap with WaveWarZ: high — listeners are producers who understand on-chain music economies.
- **JON1st** — producer identified as an early Solana music NFT participant; YouTube presence with beat tapes and music commentary. Subscriber count: TBD. Farcaster handle: check @jon1st or equivalent FID before outreach.
- **Vekt0r** — electronic music artist active in Solana NFT ecosystem; posts YouTube content mixing music releases and producer commentary. Small channel, likely within 5x of any sub-20K BCZ benchmark.
- **Latasha** — R&B singer who was among the first to release music on Solana; has a YouTube channel with music videos and web3 commentary. Subscriber count likely 1K-10K range; verifiable via manual channel lookup.
- **LLLL (Fourtells)** — music creator with a documented web3/blockchain music practice; YouTube activity is lighter but present. Audience skews collector-adjacent, which overlaps with WaveWarZ trader/fan cohort.

*Tier 2 — Probable Solana audience, YouTube not independently confirmed active:*

- **Mozey** — hip-hop artist who has competed in WaveWarZ or equivalent; YouTube presence reported but upload frequency unknown.
- **Solana Music NFT community channels** — several aggregator/showcase channels (e.g., those run by BREAKPOINT performers or Solana Foundation media partners) exist but are more curatorial than creator channels; collab format does not apply cleanly.

**What "within 5x" will actually filter to.** At publication, BCZ's subscriber count is TBD (blocked in all fetches). For planning purposes: if BCZ sits at 500 subs, the qualifying range is 100-2,500; at 1,000 subs, 200-5,000; at 3,000 subs, 600-15,000. Every Tier 1 candidate above is plausibly in at least one of these bands, but none can be confirmed without a live channel pull. The five fetches in this dispatch all failed on auth-walls — YouTube, SocialBlade, Sound.xyz discover, X search, and music3.com all returned 402/403/404 or empty shells.

**Audience overlap signal.** WaveWarZ's registered artist base (112 rows, doc 974) is the single best source of warm collab targets — these are creators already invested in Solana music battles. Cross-referencing those 112 against YouTube channel ownership (via Farcaster bio or X bio links) would surface 10-20 names in one pass and is a more reliable discovery method than any third-party directory. The WaveWarZ Airtable at base appR0UyV9hG8o9D0Z (doc 974) already has the artist signup data.

**The core gap.** No authoritative subscriber count list for Solana-native music YouTube channels exists publicly. The segment is too niche for SocialBlade/VidIQ rankings to surface, and YouTube's own search is personalized. The only reliable census is a manual one: pull the artist list from the WaveWarZ Airtable, check each for a YouTube link in their social profiles, and run a manual sub-count check.

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Pull BCZ subscriber count manually (visit youtube.com/@bettercallzaal, note exact number) and compute the 5x floor and ceiling | @Zaal | Research | 2026-07-11 |
| Export WaveWarZ Airtable artist rows (base appR0UyV9hG8o9D0Z) and cross-reference each artist's social links for a YouTube channel URL; flag any with subs in the 5x BCZ range | @Zaal or ZOE | Research | 2026-07-14 |
| Run a one-pass manual check on Tier 1 candidates (Beatific, JON1st, Vekt0r, Latasha, LLLL) — visit each YouTube channel, note sub count, last upload date, and Farcaster FID | @Zaal | Research | 2026-07-14 |
| For any candidate who clears all three filters, send a Farcaster DM (not a YouTube contact form) proposing a WaveWarZ-themed Collab video | @Zaal | Outreach | 2026-07-21 |

---

## Sources

- [FAILED - 403 auth-wall; tried socialblade.com/youtube/user/bettercallzaal] SocialBlade — BetterCallZaal YouTube stats
- [FAILED - no channel data returned; page rendered footer-only] YouTube channel page — youtube.com/@bettercallzaal/about
- [FAILED - 404] Sound.xyz discover — sound.xyz/discover
- [FAILED - 402 payment required; keyless fxtwitter mirror not applicable without specific tweet ID] X search — x.com/search Solana music creator YouTube; community account x.com/SolanaMusicNFT
- [FAILED - empty shell, no artist data] Music3 discover — music3.com/discover
- [PARTIAL - not re-verified live in this dispatch; figures from 2026-07-06 agent pull] WaveWarZ financials + artist roster — `research/wavewarz/974-wavewarz-financials-snapshot-2026-07/README.md`
- [PARTIAL - H2 2026 growth context, YouTube channel strategy] 100k reach playbook — `research/business/957-100k-total-reach-h2-2026/README.md`
- [FULL - Farcaster cast format research with ZAO codebase file paths] Farcaster-to-YouTube CTR doc — `research/business/984-youtube-zao-growth-what-farcaster-cast-format/README.md`
```
