---
topic: business
type: decision
status: research-complete
last-validated: 2026-05-22
related-docs: 624, 649, 626, 665, 707
tier: STANDARD
---

# 708 — ZABAL Hub: zaoos.com/zabal as the canonical ZABAL landing page

> **Goal:** Page architecture + section spec to grow `zaoos.com/zabal` from a voting app into the canonical ZABAL landing page - the umbrella hub over BCZ, The ZAO, WaveWarZ, ZAO Festivals, incubated projects, and the $ZABAL token. One page: identity + live weekly vote + token + ecosystem portals + about + socials.

> **Trigger:** 2026-05-22 - Zaal: "this should be the main landing page within all that I'm doing." Closes the loop on the session's first ask ("update the website" -> a hub linking all ZABAL things). The voting rollup (Docs 665, 707) shipped the interactive core; this doc specs the hub around it.

> **Supersedes part of Doc 624:** Doc 624 (2026-05-07) planned the ZABAL umbrella page to live at `bettercallzaal.com/nexus.html`. That static page has since 308-redirected away. NEW canonical decision: the ZABAL umbrella hub is `zaoos.com/zabal` - because it already has live voting (a weekly reason to return) that a static link page never will. `bettercallzaal.com/nexus.html` is retired; ZAONEXUS stays as the separate ZAO-community resource directory.

## Key Decisions / Recommendations

| # | Decision | Recommendation |
|---|----------|----------------|
| 1 | **Canonical ZABAL hub URL** | `zaoos.com/zabal`. Not a new domain, not bettercallzaal.com/nexus. The voting loop makes it a destination, not a link dump. zabal.art 301-redirects here (closes the long-deferred task). |
| 2 | **Above the fold = identity + live vote** | The weekly vote is the hook - it is the one thing that makes people return. Hero states what ZABAL is in one line, then the 4-mode vote is immediately visible. Do NOT bury voting below a marketing wall. |
| 3 | **Page = one scroll, sectioned** | Single page, 7 sections, anchored top-nav. Mirrors the proven 14-section `nexus.html` umbrella structure (Doc 624) but compressed - link-in-bio era is dead; 2026 hubs are one focused scroll, not an endless link wall. |
| 4 | **$ZABAL token gets a real panel, not a footer link** | Token is the umbrella's economic core. Dedicated section: what $ZABAL is, hold/get CTA -> Empire Builder, the live $ZABAL Empire leaderboard (`songjam.space/zabal`), vote-power explainer (holding/activity -> power). |
| 5 | **Ecosystem = portal card grid** | 6-8 cards, not a list. Each card = one ZABAL-universe surface with icon, name, one-line, badge. Revives the old `index.html` portals pattern, expanded. |
| 6 | **Keep Spotlight + Leaderboard as their own routes** | `/zabal/spotlight` + the leaderboard stay distinct; the hub links to them with summary cards. Do not cram everything literally onto one route - hub = launchpad. |
| 7 | **Socials = compact footer strip** | All-brand social row (BCZ, The ZAO, ZAO Festivals, WaveWarZ). Icons, not a table. |
| 8 | **Per-route miniapp embed** | Apply Doc 707 P0 fix - the hub needs its own `fc:miniapp` embed so a shared `zaoos.com/zabal` link opens the hub, not `/miniapp`. Hub + embed fix ship together. |

## Part 1 — Why a hub, not a link page

Link-in-bio (Linktree/Beacons era) was a flat list of outbound links. 2026 creator/ecosystem hubs do three things a list cannot:

1. **Give a reason to return** - a live, changing element (here: the weekly vote + leaderboard). A static link list is visited once.
2. **State identity above the fold** - one line on what the thing IS, before any links.
3. **Rank by intent, not catalog everything** - 6-8 portals chosen for what matters, not 40 links. ZAONEXUS already exists for the exhaustive 200+ link directory; the ZABAL hub is curated, not complete.

The ZABAL hub has a structural advantage almost no creator hub has: a native interactive loop (voting) lives ON the landing page. Lead with it.

## Part 2 — Page architecture (zaoos.com/zabal)

Single page, anchored top-nav (`Vote / Token / Ecosystem / Spotlight / About`). Sections top to bottom:

### Section 1 — Hero (above the fold)
- ZABAL wordmark (gold gradient, existing treatment)
- One-line identity: *"ZABAL is the umbrella over everything Zaal builds - The ZAO, WaveWarZ, ZAO Festivals, and the $ZABAL economy. Vote weekly on where it goes."*
- Immediately below: the live weekly-vote cards (Section 2) - no scroll needed to vote.

### Section 2 — Weekly Vote (exists)
- The 4-mode focus vote (Music / Governance / Events / Build). Already built.
- Vote-power badge, week timer, live % bars.

### Section 3 — $ZABAL Token panel (NEW)
- What $ZABAL is: the umbrella's token, on Base (launched Jan 1 2026).
- Primary CTA: "Hold $ZABAL" -> Empire Builder.
- Embedded/linked **$ZABAL Empire leaderboard** -> `songjam.space/zabal`.
- Vote-power explainer: holdings + /zao activity + Neynar score -> your weekly vote weight (ties Section 2 to the token).

### Section 4 — Ecosystem portals grid (NEW)
6-8 cards. Recommended set:

| Card | Links to | One-liner |
|------|----------|-----------|
| The ZAO | `thezao.com` | The artist org - 190 members on Base |
| ZAO Festivals | `zaofestivals.com` | ZAOstock, ZAO-PALOOZA, ZAO CHELLA |
| WaveWarZ | `wavewarz.com` | Onchain music battles |
| ZAO OS | `zaoos.com` | The community operating system |
| BCZ YapZ | `bczyapz.com` | The podcast |
| ZAO Nexus | `thezao.com/nexus` | The full ecosystem link directory |
| COC Concertz | (repo/site) | Virtual concert promotion |
| Empire Builder | `empirebuilder.world` | Where $ZABAL lives |

### Section 5 — Member Spotlight summary (NEW card -> existing route)
- Current week's spotlight winner / nominee count, "Nominate -> /zabal/spotlight".

### Section 6 — Leaderboard summary (exists, condense)
- Top 5 voters inline + "Full leaderboard" link.

### Section 7 — About ZABAL + Socials footer (NEW)
- Two-line "About ZABAL": the four-layer brand model (ZABAL > BCZ + The ZAO + incubated projects), plainly stated (per Doc 649).
- Socials strip: BCZ, The ZAO, ZAO Festivals, WaveWarZ - X / Farcaster / Discord / Paragraph icons.

## Part 3 — Information hierarchy rationale

| Position | Section | Why here |
|----------|---------|----------|
| Above fold | Identity + Vote | The hook. Voting is the return-reason; identity is the orientation. |
| Mid | $ZABAL Token | Second-strongest intent - people who voted want to know the economy. |
| Mid | Ecosystem portals | Discovery - "what else is here." After they have engaged, not before. |
| Lower | Spotlight + Leaderboard | Social proof + community depth. |
| Footer | About + Socials | Reference. People who want the full story scroll for it. |

## Part 4 — The complete ZABAL link map (verified 2026-05-22)

| Brand | Surface | URL |
|-------|---------|-----|
| ZABAL | Hub (this page) | `zaoos.com/zabal` |
| ZABAL | Member Spotlight | `zaoos.com/zabal/spotlight` |
| ZABAL | $ZABAL Empire leaderboard | `songjam.space/zabal` |
| ZABAL | Empire Builder | `empirebuilder.world` |
| The ZAO | Site | `thezao.com` |
| The ZAO | Nexus directory | `thezao.com/nexus` |
| The ZAO | $ZAO token | `thezao.com/zao-token` |
| The ZAO | Calendar | `thezao.com/calendar` / `zaofractals.lu.ma` |
| The ZAO | Leaderboard | `thezao.com/zao-leaderboard` |
| ZAO OS | App | `zaoos.com` |
| ZAO Festivals | Site | `zaofestivals.com` |
| WaveWarZ | Site | `wavewarz.com` |
| BCZ | Site | `bettercallzaal.com` |
| BCZ YapZ | Podcast | `bczyapz.com` |
| Socials - BCZ | X / Farcaster / YouTube / Twitch / Paragraph / Discord | `x.com/BetterCallZaal`, `warpcast.com/bettercallzaal`, `youtube.com/@BetterCallZaal`, `twitch.tv/BetterCallZaal`, `paragraph.xyz/@bettercallzaal`, `discord.gg/bettercallzaal` |
| Socials - The ZAO | X / Farcaster / Telegram / Discord | `x.com/TheZAODAO`, `warpcast.com/~/channel/thezao`, `t.me/thezaodao`, `discord.gg/thezao` |
| Socials - ZAO Festivals | X / Instagram / TikTok | `x.com/ZAOFestivals`, `instagram.com/ZAOFestivals`, `tiktok.com/@ZAOFestivals` |
| Socials - WaveWarZ | X / Farcaster / Twitch / YouTube | `x.com/WaveWarZ`, `warpcast.com/~/channel/wavewarz`, `twitch.tv/WaveWarZ`, `youtube.com/@WaveWarZ` |

## Specific Numbers

| Metric | Value |
|--------|-------|
| Current `/zabal` sections | 3 (vote, leaderboard, spotlight-link) |
| Proposed hub sections | 7 |
| Ecosystem portal cards | 6-8 |
| Old nexus.html section count (proven umbrella) | 14 (Doc 624) |
| ZAONEXUS curated links | 200+ |
| $ZABAL launch | Jan 1 2026, Base |
| The ZAO members | ~190 |
| ZAO Festivals brands | 3 (ZAOstock, ZAO-PALOOZA, ZAO CHELLA) |
| Routes kept separate | 2 (`/zabal/spotlight`, leaderboard) |

## Comparison — hub URL options

| Option | Verdict | Why |
|--------|---------|-----|
| `zaoos.com/zabal` (this doc) | **CHOSEN** | Live voting already there; weekly return-reason; rollup shipped here |
| `bettercallzaal.com/nexus.html` (Doc 624's old plan) | SUPERSEDED | Static, no interactivity, already redirected away |
| New standalone domain | SKIP | Splits effort; the app + hub belong together |
| `zabal.art` (legacy) | 301 -> `zaoos.com/zabal` | Closes the deferred zabal.art decision; keeps the brand URL alive as a redirect |

## Also See

- [Doc 624 - Nexus Portal Canon](../../community/624-nexus-portal-canon-may7/) - the hub strategy this updates
- [Doc 649 - Zaal Build Profile](../../identity/649-zaal-build-profile-ecosystem-survey/) - the four-layer brand model
- [Doc 665 - ZABAL haatz voting rollup](../../infrastructure/665-zabal-haatz-voting-rollup-decision/) - the voting core
- [Doc 707 - ZABAL mini app conformance](../../farcaster/707-zabal-miniapp-conformance/) - the per-route embed fix the hub needs

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Build Section 3 ($ZABAL token panel) on `/zabal` | @Zaal / Claude | Code PR | This week |
| Build Section 4 (ecosystem portals grid) | @Zaal / Claude | Code PR | This week |
| Build Section 7 (About ZABAL + socials footer) | @Zaal / Claude | Code PR | This week |
| Add anchored top-nav (Vote/Token/Ecosystem/Spotlight/About) | @Zaal / Claude | Code PR | Same PR |
| Apply Doc 707 per-route `fc:miniapp` embed for the hub | @Zaal / Claude | Code PR | Same PR |
| 301-redirect `zabal.art` -> `zaoos.com/zabal` (closes deferred decision) | @Zaal | DNS | This week |
| Confirm COC Concertz canonical URL for the portal card | @Zaal | Verify | Before build |
| Re-validate the link map | @Zaal | Doc update | 2026-06-22 |
