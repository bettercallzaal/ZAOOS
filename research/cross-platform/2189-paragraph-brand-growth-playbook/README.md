---
topic: cross-platform
type: guide
status: research-complete
last-validated: 2026-08-03
related-docs: "606, 2158, 2187"
original-query: "deep /zao-research on Paragraph - find the best ways to use it to grow our brands"
tier: DEEP
---

# 2189 - Paragraph brand-growth playbook for ZAO

> **Goal:** How ZAO should use Paragraph (its newsletter platform) to actually grow its brands.
> Grounded in real fetches + FIRSTHAND use of Paragraph's AI editor (tested 2026-08-03 on the
> live thezao Day 215 draft).

## What Paragraph is (grounded)

Paragraph (paragraph.com, formerly paragraph.xyz) is a **web3-native newsletter + publishing
platform** - it acquired Mirror.xyz in 2024 and is now the dominant onchain writing platform.
Unlike Substack/Beehiiv, it is crypto-native by default:

- **Collectible / mintable posts** - a post (written OR audio) can be minted/collected as an
  NFT: collectible essays, time-limited NFTs. Readers don't just read - they COLLECT.
- **Token-gating** - gate content behind holding an NFT or ERC-20 (bring your own, or mint one
  on-platform for 0 gas on Polygon/Base). Gate premium issues by holding a token.
- **NFT subscriptions + XMTP** - wallet-based subscribers, not just emails.
- **Farcaster-native** - Farcaster discussions display on posts automatically; cross-posts to
  Farcaster. This is the key one for ZAO (Farcaster is ZAO's beachhead - Farcaster-Eats-First).
- **Integrations** - Superfluid (streaming payments), Unlock (memberships), Coinvise, Clubs.link,
  Unstoppable Domains, ShareMint (referral growth).
- **Airdrops** - airdrop a collectible/token to your subscriber wallets.

## Firsthand: Paragraph's AI editor is a real newsletter agent (tested)

Observed directly on Zaal's live `thezao` "Year of the ZABAL - Day 215" draft (2026-08-03):
the Paragraph AI chat ("Ask anything...") is a capable, iterative newsletter agent. In one
session Zaal used it to: create the draft to strict voice rules (all-lowercase, zero commas,
open with "zm", exact signature), embed three YouTube stream recaps as rich cards, polish +
professionalize, REMOVE repeated slogans, add a Fractal Luma embed + a mindful-moment image,
and add a "we're live on Twitch" card. It **remembered a rule** he gave it ("rotate catchphrases
so it is not the same read each time"), and it proactively suggested sharper daily-issue elements
(one takeaway per stream, a Finals metrics line, collaborator @handles, a next-live signal).
A test prompt (add tonight's ZM Day 1 recap) ran 7 steps in 37s and captured the song, the
Don't Sweat the Small Stuff passage, and all 5 ZABAL submissions correctly, in his voice.

**Takeaway:** ZAO already has a working newsletter agent inside Paragraph. Do not replace it -
scale it.

## Why Paragraph is a near-perfect ZAO fit

Every ZAO thesis maps onto a Paragraph feature:
- **Artist/creator ownership** -> collectible posts = readers own a piece; the newsletter itself
  becomes an ownable artifact, not rented Substack real estate.
- **Farcaster-Eats-First** -> native Farcaster cross-post + threaded discussion.
- **Respect / Sparkz / artist tokens** -> token-gating turns those tokens into keys to premium
  content, driving real demand + rewarding holders.
- **Decentralized impact network** -> onchain publishing is the medium matching the message.

## The growth playbook (ranked by leverage)

### 1. Per-brand newsletters, one AI, one operator [P0]
Run a Paragraph publication PER brand (The ZAO, ZABAL Gamez, WaveWarZ, Sparkz, ZAOstock) - each
its own audience + voice. The cheap loop for each brand drafts the recap -> the Paragraph AI turns
it into that brand's newsletter in that brand's voice -> Zaal approves + publishes. This is the
cheap-fleet -> premium-escalation pattern (doc 2188) applied to content: loops feed recaps, the
Paragraph agent drafts, Zaal is the one approval gate.

### 2. Make issues COLLECTIBLE (the ZAO-native move) [P0]
Turn each newsletter issue into a collectible post. Readers mint the issue -> they become onchain
supporters, not passive emails, and it embodies artist-ownership. A "Year of the ZABAL - Day N"
series of collectible daily issues is a growing onchain artifact + a light monetization rail (0%
of the artist-ownership ethos is compromised because the reader OWNS it).

### 3. Farcaster as the growth engine [P0]
Every issue auto-cross-posts to Farcaster (/zao, /zabal). Discussion threads back-link to the
post. Since ZAO is "in the cabal" on Farcaster, this is the highest-ROI discovery channel - email
for depth, Farcaster for growth (the 2026 consensus: social for discovery, email for monetization).

### 4. Token-gating tied to Respect / Sparkz [P1]
Gate a premium tier or a special issue behind holding Respect (or a Sparkz creator token). This
gives the tokens a concrete utility (a key), rewards holders, and drives demand - straight out of
the Sparkz "utility today, not promises" framing.

### 5. Depth over size [P1]
ZAO's small, deeply engaged community (Farcaster-native, ~188 members) is exactly the 2026 winning
model: 10k engaged beats 100k passive. Optimize for the engaged core - collectors, Respect holders,
builders - not raw subscriber count.

### 6. Sharpen the daily issue (Paragraph's own advice) [P1]
Adopt the four elements Paragraph suggested: one concrete takeaway per stream/segment, a Finals
metrics line (X projects submitted, Y days left), collaborator @handles, and a "going live at Xpm"
next signal. Rotate catchphrases (already a saved rule) so it is not the same read daily.

## The one gap (build it OSS, do not buy it)

Paragraph nails the newsletter. It does NOT do video -> short clips or full multi-platform social.
Per doc 2187's grounded research, that is the distribution gap. ZAO's move: the 42-min stream ->
mlx-whisper transcript (have it) -> clip extraction + `/socials` (have it) -> post everywhere, and
the recap -> the Paragraph agent -> the newsletter. Do not buy Castmagic; ZAO already owns the pieces.

## Also See

- Doc 2187 (agent-operator + content pipeline), Doc 2188 (cheap-fleet escalation)
- `feedback_oss_first_no_platforms`, `project_farcaster_eats`, `project_zabalnewsletterbuilder`

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Make the daily ZABAL issue a COLLECTIBLE post + cross-post to Farcaster | Zaal | Paragraph config | 2026-08-05 |
| Stand up a per-brand Paragraph publication for WaveWarZ + Sparkz | Zaal | Paragraph setup | 2026-08-12 |
| Wire the cheap brand loops to draft recaps that feed the Paragraph AI | Zaal | build | 2026-08-17 |
| Pilot token-gating one premium issue behind Respect | Zaal | Paragraph config (gated) | 2026-08-24 |

## Sources

- [A Review of Paragraph.xyz](https://paragraph.com/@web3review/a-review-of-paragraphxyz) [FULL] - collectible/mint posts, token-gating, XMTP subs, integrations
- [Paragraph.xyz vs Mirror.xyz](https://paragraph.com/@teleyinex.eth/paragraph-vs-mirror-web3-publishing) [PARTIAL] - token-gating specifics, 0-gas mint on Polygon
- [Mirror sells to Paragraph (CoinDesk, 2024)](https://www.coindesk.com/tech/2024/05/02/web3-publishing-platform-mirror-sells-to-paragraph-pivots-to-social-app-kiosk) [PARTIAL] - Paragraph now the dominant onchain publisher
- FIRSTHAND: Paragraph AI editor on the live thezao Day 215 draft, 2026-08-03 [FULL - direct browser observation]
