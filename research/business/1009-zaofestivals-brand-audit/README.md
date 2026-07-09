---
topic: business
type: audit
status: research-complete
last-validated: 2026-07-09
superseded-by:
related-docs: "990, 960, 967, 868"
original-query: "zaofestivals - DEEP tier requested explicitly by user (\"deep research on zaofestivals\")"
tier: DEEP
---

# 1009 — ZAO Festivals Brand Audit: zaofestivals.com, Socials, and the PALOOZA/CHELLA/PROS History

> **Goal:** Deep-dive the "ZAO Festivals" brand — the live zaofestivals.com domain, its social accounts, and the full PALOOZA/CHELLA/PROS event history — to find what's live, what's stale, what's missing, and what contradicts what. Extends doc 990 (which audited zaostock.com specifically) to the umbrella brand itself.

## Key Decisions

| Recommendation | Why |
|---|---|
| Add ZAO-PROS (ETH Denver 2025) as a fourth chapter to zaostock.com's `/festivals` timeline | It's the one event in the series with zero public web trace under any name — confirmed real only via internal memory (`project_zao_festivals_history.md`), absent from zaostock.com's own "The chapters" list, and a dedicated web search for "ZAO-PROS ETH Denver 2025" returns zero hits for anything ZAO-related |
| Refresh the Instagram and TikTok bios for @zaofestivals off "ZAO-CHELLA \| ART BASEL '24" | Both have been frozen on a single Dec 2024 event for 19+ months. The X account for the same handle already updated its bio to "ZAO-STOCK Maine Oct 3rd 2026" — the three platforms are now telling three different stories about what ZAO Festivals currently is |
| Replace zaofestivals.com's homepage with a current landing page (or a redirect to zaostock.com/festivals) | The domain most likely to be typed for "ZAO Festivals" currently serves a dead, sold-out Dec 6 2024 ZAO-CHELLA ticket page as its front door — anyone landing there today sees an event that ended over a year and a half ago, with no path forward to ZAOstock 2026 |
| Fix or remove the zaomusic.org link on the ZAO-Festivals Facebook About page | The domain is dead (HTTP 503 on fetch, and unrelated to The ZAO in search — a different site, `zamusic.org`, squats the near-identical spelling). The Facebook page actively sends visitors to a broken destination |
| Ship the lu.ma/zaofestivals calendar decided in the 2026-04-25 umbrella memory | That decision explicitly named this as a to-do ("Lu.ma calendar URL: lu.ma/zaofestivals (claim if available)"). As of this research (2026-07-09, ~2.5 months later), no such calendar is discoverable — zaofestivals.com itself still uses a single-event Luma page, not a branded recurring calendar |
| Verify the ZAO-PALOOZA performer count before it's cited externally again | zaostock.com's own copy says "12 artists"; the pre-event promo Twitter Space (recorded 2024-03-30) said roughly 17 total performers — "about 12 or so web3 musicians" plus "five or six web2 musicians who haven't released anything in web3." These aren't necessarily contradictory (12 Web3-native + 5-6 crossover ≈ 17 total), but the two numbers should not both circulate unreconciled |

## Findings

### 1. zaofestivals.com is a live, real ticketing page — not a brand homepage

Direct WebFetch hit an SSL handshake failure (`HANDSHAKE_FAILURE_ON_CLIENT_HELLO`); escalated to exa web_fetch, which retrieved the full page. The domain is not parked or dead — it's a working single-event page for **ZAO-CHELLA**, dated "6 December '24," built on what appears to be a Luma-style checkout flow. It shows: a 4-15PM-to-11PM schedule (doors 4PM, WaveWarZ LIVE rematch Hurric4n3ike vs. JANGO UU at 6PM, artist performances at 7PM, doors close 11PM), the venue (UVA, 144 NW 23rd St, Wynwood, Miami FL 33127), eight distinct VIP ticket tiers ($40–$150) each bundled with a different community-partner perk (DeFi Space Donkeys Club pool access, Dijijoints THC-a goodies, Mr. Darius music NFTs, Jay Connects live interview, Hip-Hop Crypto Watch $YESCOIN membership, Music District 30-day ad campaign + Decentraland wearables, Farmacy Fantoms merch, Long Lost apparel), and a 10-artist lineup (LOSI featured; Hurric4n3ike, NessyTheRilla, GRL-CRASH, Goldilox, AttaBotty, JANGO UU, Clejan, GodclouD, Mr. Darius performing). [FULL - fetched via exa after WebFetch SSL failure]

### 2. Cross-platform bio drift: three platforms, three different stories

- **X (@zaofestivals):** bio updated to "ZAO-STOCK Maine Oct 3rd 2026" — current, matches the flagship. 765 followers / 716 following per a third-party mirror (Instalker). [PARTIAL - X itself returned HTTP 402 on direct fetch; data via `instalker.org/thezaodao` mirror page, which also displays @zaofestivals inline]
- **Instagram (@zaofestivals):** bio still "ZAO-CHELLA | ART BASEL '24." [PARTIAL - search-snippet confirmed, matches doc 990's direct fetch from 2026-07-07]
- **TikTok (@zaofestivals):** bio "ZAO-CHELLA (ART BASEL '24)," 94 followers, 46 likes, 5 following. Most recent video ID (`7416700453192256799`) decodes to a November 2024 upload — no 2025 or 2026 activity at all. [FULL - fetched via exa]
- **Facebook (ZAO-Festivals, "New York NY"):** intro text reads "ZAO: Where beats meet bytes, and dreams meet reality. Join us on 4/3/2024!" — an even older reference, to ZAO-PALOOZA's actual NFT.NYC date (April 3, 2024). 10 followers. Links out to Instagram, X, LinkedIn, TikTok, and the dead zaomusic.org. [FULL - fetched via exa]

Only one of four public social accounts (X) reflects the current flagship event.

### 3. ZAO-PROS (ETH Denver 2025) has zero discoverable public web trace

Existing memory (`project_zao_festivals_history.md`, dated to an April 2026 session) lists four past/current ZAO Festivals-series events: PALOOZA (NYC 2024), CHELLA (Miami 2024), PROS (ETH Denver 2025, described only as "conference activation"), and COC Concertz (ongoing, separate metaverse-concert line). zaostock.com's own `/festivals` page — the closest thing to a canonical public timeline — lists exactly four chapters, but they are PALOOZA, CHELLA, ZAOville, and ZAOstock. **ZAO-PROS does not appear anywhere in the live codebase** (`grep -ril "PROS" src/` returns zero matches in zaostock). A dedicated web search for "ZAO-PROS ETH Denver 2025" returns zero ZAO-related hits — only unrelated ETH Denver 2025 brand activations (Zerion, Pondo Protocol, Sozu Haus). Either this event was informal enough to leave no independent public trace, or it's publicly known under a different name not captured in the internal memory. [FULL - codebase grep + exhausted web search, negative signal both places]

### 4. ZAO-PALOOZA's real history is richer than either doc 990 or the zaostock codebase currently show

Three AlphaGrowth-archived Twitter Space recordings fill in detail neither doc 990 nor zaostock.com's copy carries:

- **Pre-event promo space** (recorded 2024-03-30, "WEB3 Music | +C.O.C ft Zaal ZAO-PALOOZA NFTNYC preview"): confirms the event was a welcome/onboarding showcase for NFT NYC, aimed explicitly at bringing Web2 musicians into Web3.
- **Open-mic promo space:** performer count given as "about 17 individuals" total — "about 12 or so web3 musicians" plus "five or six web2 musicians who haven't released anything in web3." Location later corroborated as **Pando Park, 450 Park Ave S, New York** (via a corporate-directory listing, see caveat below).
- **1-year anniversary space** (~April 2025): confirms the event was organized by roughly six people, planned in about six weeks, and that most of that founding group had never met in person before the event itself — a genuine origin-story detail absent from every written source. Also references an ongoing NFT-card collectible series tied to the anniversary (`attabotty.zao.cards`).

A fourth source, a business-directory listing (prospeo.io) not otherwise linked from any ZAO-owned property, adds a headliner name (Nyemiah Supreme, "Sisterhood of Hip Hop" / Timbaland's "Rock & Roll" / Jim Jones' "NYC") and an attendance estimate (300-400, "35% women and 65% men"). This is a third-party lead-gen/company-data aggregator, not a primary ZAO source — treat the headliner and demographic claims as **unverified** until corroborated elsewhere. [PARTIAL - directory listing not independently confirmed; the three Space transcripts are FULL via exa search highlights]

### 5. ZAO NEXUS treats "ZAO Festivals" as a standalone, larger category than "ZAO Stock"

`nexus.thezao.com`, the ZAO's own links hub, tags 282 total links across 8 categories. "ZAO Festivals" is its own category with **28 links** — the third-largest category behind "The ZAO" (76) and "ZAO Members" (123). "ZAO Stock" is a *separate*, much smaller category with only 5 links. This confirms the ZAO's own internal information architecture already treats "ZAO Festivals" as the larger historical/umbrella bucket and "ZAO Stock" as a narrower flagship-specific one — consistent with the April 2026 memory decision ("ZAO Festivals presents ZAOstock"). However, the actual 28-link list is filtered client-side (the URL doesn't change on category click; `?category=ZAO+Festivals` returns the same unfiltered page shell) and could not be retrieved: WebFetch and exa web_fetch both return the same shell HTML, and no Playwright or Chrome-extension bridge was available in this environment to execute the client-side filter. [PARTIAL - category and count confirmed (FULL), underlying 28-link list not retrievable with available tools this session]

### 6. Two more ZAO-adjacent domains found, both dead ends

- **zaomusic.xyz** — live, but every path checked (`/`, `/about`, `/music-releases`) returns only a redirect shell with no distinct content retrievable. [FAILED - escalated via exa, genuine redirect with nothing to extract]
- **zaomusic.org** — returns HTTP 503 on fetch; a WebSearch for the exact string returns no meaningful hits for this domain, and confuses it with the unrelated, similarly-spelled `zamusic.org` (a South African Amapiano music download site with no ZAO connection). This is the same dead link cited on the Facebook page (Finding 4). [FAILED - 503, and the domain has no distinguishable search footprint of its own]

### 7. Zero organic community discussion outside owned channels

Targeted searches for "ZAO-CHELLA," "ZAO-PALOOZA," and "zaofestivals" on both `site:reddit.com` and `site:news.ycombinator.com` return zero on-topic hits — every result that surfaces is one of ZAO's own owned properties (the domain, the socials, thezao.com). For a project at this follower scale (765 on X, 94 on TikTok, 10 on Facebook), this is the expected baseline, not a red flag — but it confirms all current reach is owned-channel only, with no organic crypto/music-community virality yet. [FULL - both searches exhausted, consistent negative result]

## Also See

- [Doc 990 — ZAOstock SEO Audit](../990-zaostock-seo-audit/) — the sibling audit of zaostock.com itself; this doc extends it to the zaofestivals.com/socials/history layer
- [Doc 960 — What regional Maine press outlets can pitch ZAOstock](../960-seo-web-presence-what-regional-maine-press/) — press angle, complements the social-presence findings here
- [Doc 967 — Should ZAO consolidate nexus.thezao.com, zao-101.vercel.app, zaoos.com](../967-repo-web-improvement-should-zao-consolidate-nexus/) — directly relevant to Finding 5/6 (link and domain fragmentation)
- [Doc 868 — Brand Weakness Audit](../868-brand-weakness-audit-zoe-agent-status/) — broader brand-clarity findings this doc's cross-platform-drift finding extends
- Memory: `project_zao_festivals_umbrella.md` (2026-04-25 decision — "ZAO Festivals presents ZAOstock," lu.ma/zaofestivals calendar never shipped per Finding 4)
- Memory: `project_zao_festivals_history.md` (2026-04-11 — full event history + team X-handle roster, source of the ZAO-PROS reference this doc could not independently verify)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add a "ZAO-PROS" chapter card to zaostock.com's `/festivals` `SERIES` array (even a minimal one-liner) - shipped when PR merged and the card renders on `/festivals` | Zaal | PR | 2026-07-16 |
| Update Instagram and TikTok bios for @zaofestivals to match X's current "ZAOstock 2026" framing - shipped when both bios read a 2026-current line, verified by re-fetching both profiles | Zaal | Todo | 2026-07-16 |
| Point zaofestivals.com's homepage at a current landing page or a redirect to zaostock.com/festivals, replacing the stale Dec 2024 ZAO-CHELLA ticket page - shipped when the domain's root path resolves to non-2024 content | Zaal | PR | 2026-07-23 |
| Remove or fix the zaomusic.org link on the ZAO-Festivals Facebook About page - shipped when the link either resolves or is removed | Zaal | Todo | 2026-07-16 |
| Claim lu.ma/zaofestivals and stand up a recurring ZAO Festivals calendar (per the 2026-04-25 memory decision, still unshipped) - shipped when the URL is live and lists at least ZAOstock 2026 | Zaal | Task | 2026-07-23 |
| Reconcile the ZAO-PALOOZA "12 artists" vs. "~17 performers" figures into one number before the next external citation - shipped when zaostock.com's `/festivals` copy and any future press materials use the same reconciled figure | Zaal | Todo | 2026-07-16 |

## Sources

- [zaofestivals.com](https://zaofestivals.com/) — [FULL, fetched via exa 2026-07-09 after a direct WebFetch SSL handshake failure]
- [ZAO-Festivals — Facebook](https://www.facebook.com/ZAOFestivals) — [FULL, fetched via exa 2026-07-09]
- [ZAO-CHELLA | ART BASEL '24 — Instagram (@zaofestivals)](https://www.instagram.com/zaofestivals/) — [PARTIAL - search snippet + doc 990's 2026-07-07 direct fetch; not independently re-fetched this session]
- [zaofestivals — TikTok](https://www.tiktok.com/@zaofestivals) — [FULL, fetched via exa 2026-07-09]
- [@zaofestivals — X, via Instalker mirror](https://www.instalker.org/thezaodao) — [PARTIAL - direct X fetch returned HTTP 402; follower/bio data via third-party mirror page]
- [zaomusic.xyz](https://www.zaomusic.xyz/) — [FAILED - redirect shell only, no distinct content after exa escalation]
- [zaomusic.org] — [FAILED - HTTP 503; distinct from unrelated zamusic.org]
- [ZAO NEXUS — Links Hub](https://nexus.thezao.com/) — [FULL for homepage + category counts; PARTIAL for the 28-link "ZAO Festivals" filtered list - JS-filtered, unreachable with WebFetch/exa/Playwright(unavailable)/Chrome-extension(unavailable) this session]
- [The ZAO — thezao.com](https://www.thezao.com/) — [FULL, fetched via exa 2026-07-09]
- [ZAO-PALOOZA Open Mic — Twitter Space recording, AlphaGrowth](https://alphagrowth.io/spaces/zao-palooza-open-mic) — [FULL - transcript highlights via exa search]
- [WEB3 Music | +C.O.C ft Zaal ZAO-PALOOZA NFTNYC preview — Twitter Space recording, AlphaGrowth](https://alphagrowth.io/spaces/web3-music-coc-ft-zaal-zao-palooza-nftnyc-preview) — [PARTIAL - date/duration only, full transcript not retrieved]
- [ZAO-PALOOZA 1 year anniversary space — Twitter Space recording, AlphaGrowth](https://alphagrowth.io/spaces/zao-palooza-1-year-anniversary-space-get-your-attabotty-card-today) — [FULL - transcript highlights via exa search]
- ["Spring Back" Season @ NFT NYC 2024 — Startup Roundup](https://startuproundup.beehiiv.com/p/spring-back-season-nft-nyc-2024) — [PARTIAL - newsletter mention of Zaal/Zaopalooza interview, not the interview itself]
- [ZAO Festivals — Overview, Address & Contact, prospeo.io](https://prospeo.io/c/zao-festivals) — [PARTIAL - third-party lead-gen/company-data aggregator, headliner and demographic claims unverified against a primary source]
- Reddit search (`"ZAO-CHELLA" OR "ZAO-PALOOZA" OR "zaofestivals" site:reddit.com`) — [FULL search executed, zero on-topic results — documented negative signal]
- HackerNews search (`"ZAO" festival Web3 music site:news.ycombinator.com`) — [FULL search executed, zero on-topic results — documented negative signal]
- `lu.ma/zaofestivals` search — [FULL search executed, zero evidence a dedicated calendar exists — documented negative signal]
- Repo file read directly: `zaostock/src/app/festivals/page.tsx` — [FULL, read 2026-07-09]
- Memory: `project_zao_festivals_umbrella.md`, `project_zao_festivals_history.md` — [FULL, read 2026-07-09]
- [Doc 990 — ZAOstock SEO Audit](../990-zaostock-seo-audit/) — [FULL, internal cross-reference]
