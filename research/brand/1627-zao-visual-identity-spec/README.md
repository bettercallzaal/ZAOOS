# 1627 — ZAO Visual Identity Spec (Jul 2026)

**Type:** BRAND-REFERENCE  
**Topic:** Brand  
**Status:** ACTIVE — Reference for ZAOstock flyers, press kits, ZOE post graphics, ZABAL materials, and all ZAO-branded collateral. Update when the visual identity is deliberately changed. Zaal owns all final approval on brand-adjacent design; ZOE uses this doc to brief designers (e.g., Iman for PizzaDAO/Zambia flyers — doc 1593).

---

## Core Brand Identity

### Name Usage

| Context | Correct form |
|---|---|
| Full name | ZAO (ZTalent Artist Organization) |
| Short name | ZAO |
| Platform name | WaveWarZ (one word, capital W and W and Z) |
| Program name | ZABAL (all caps, ZAO-Based Artist Learning) |
| Festival name | ZAOstock |
| Event series | Concerts on Chain (COC) |
| AI agent | ZOE |

**Do not use:** The ZAO, ZAO DAO, ZAO Music DAO (use "ZAO" or "ZAO, the music DAO"), "WaveWarz" (wrong capitalization — it's WaveWarZ)

### Tagline

**Primary:** "Music battles. Everyone gets paid."  
**Secondary (one-stat):** "1,245 battles. Every artist earns."  
**URL-friendly slug:** wavewarz.info / zao.community (confirm with Zaal)

---

## Color Palette

**Primary colors:**

| Color | Hex | Usage |
|---|---|---|
| ZAO Black | `#0A0A0A` | Primary background, text on light |
| ZAO White | `#F5F5F5` | Primary text on dark, light backgrounds |
| ZAO Gold | `#FFD700` | Accent — highlights, CTAs, on-chain moments |
| WaveWarZ Blue | `#0047FF` | WaveWarZ-specific branding, battle live states |
| Battle Red | `#FF2D2D` | Conflict/live states, urgent CTAs |

**Secondary colors:**

| Color | Hex | Usage |
|---|---|---|
| Chain Gray | `#2A2A2A` | Card backgrounds, secondary dark |
| Earn Green | `#00CC66` | Payout confirmed, loser-earns moments |
| Solana Purple | `#9945FF` | Solana-specific context (when referencing on-chain) |
| Optimism Red | `#FF0420` | Governance/Optimism-specific context |

**Gradient (signature):**  
`linear-gradient(135deg, #0047FF 0%, #9945FF 50%, #FFD700 100%)`  
Usage: Hero banners, ZAOstock event materials, major announcement graphics

---

## Typography

**Primary font:** Space Grotesk (Google Fonts — free)  
- Headings: Space Grotesk Bold (700)
- Body: Space Grotesk Regular (400)
- Monospace/stats: JetBrains Mono (for addresses, tx hashes, code blocks)

**Alternative (if Space Grotesk unavailable):** Inter  
**Fallback stack:** `'Space Grotesk', 'Inter', system-ui, sans-serif`

### Type Scale (Event Materials)

| Role | Size | Weight | Case |
|---|---|---|---|
| Event headline | 64-96px | Bold | ALL CAPS |
| Sub-headline | 32-48px | Bold | Title Case |
| Body copy | 16-18px | Regular | Sentence case |
| Stats/callout | 48-72px | Bold | As written |
| Stat labels | 14px | Regular | ALL CAPS |
| On-chain addresses | 14px | Monospace | lowercase |

---

## Logo Usage

**ZAO logo files:** Stored at [location TBD — Zaal confirms media vault path; doc 1560 covers backup]

**Minimum clear space:** Equal to the height of the "Z" in ZAO on all sides  
**Minimum size:** 40px height for digital; 0.5 inch for print  
**Background:** Use dark logo on light backgrounds; light logo on dark backgrounds  
**Do not:** Stretch, rotate, recolor, or add effects to the logo

### WaveWarZ Logo

WaveWarZ has its own mark separate from ZAO. Used for:
- wavewarz.info UI
- OBS overlay (wavewarz-overlay repo)
- Battle-specific materials

When combining both in one piece (e.g., ZAOstock flyer), ZAO is the parent brand; WaveWarZ is the product brand beneath it.

---

## ZAOstock 2026 Event Design Guidelines

ZAOstock Oct 3, 2026 has its own visual identity that extends the ZAO base:

**ZAOstock palette:** ZAO Black + ZAO Gold + Earn Green + the signature gradient  
**Vibe:** New England outdoors meets on-chain underground. Autumn in Maine meets crypto-native community.  
**Photography reference:** Earthy greens and oranges (Maine autumn) contrasted with bold digital graphic elements (battle scorecards, tx hashes printed on flyers)

**ZAOstock headline treatment:**  
```
ZAOSTOCK 2026
OCT 3 | ELLSWORTH, MAINE
MUSIC BATTLES. ON-CHAIN. LIVE.
```

**Required elements on all ZAOstock materials:**
- Date: October 3, 2026
- Location: Ellsworth, Maine  
- WaveWarZ mention: "WaveWarZ MAIN Battle"
- Charity mention: "Charity Battle — 100% on-chain payout"
- URL: wavewarz.info (or dedicated ZAOstock Eventbrite URL)

---

## Social Media Templates

### X Post Graphics

**Battle result post template:**
- Background: ZAO Black
- Headline: "[WINNER] WINS" in ZAO Gold, large
- Sub: "[loser] earned [X] SOL. Automatic. On-chain."
- Bottom: WaveWarZ wordmark + wavewarz.info
- Accent: Earn Green for the payout number

**Stats milestone template:**
- Background: Signature gradient
- Headline: "[N] BATTLES" large white
- Sub stat: "[X] SOL to artists. Everyone earns."
- Bottom: ZAO wordmark

### Farcaster Cast Frame Template

For Mini App frame embeds (doc 1480):
- Background: ZAO Black
- Live vote split: visual bar (WaveWarZ Blue for Artist A / Battle Red for Artist B)
- CTA: "Vote now" in ZAO Gold
- Status: "LIVE" in flashing Battle Red

---

## Africa Battle Week Visual Identity

Sep 22-26 event has its own visual extension:

**Palette addition:** Add warm saffron (`#FF9500`) to represent West/East African color traditions  
**Headline treatment:**  
```
AFRICA BATTLE WEEK
SEP 22-26 | WAVEWARZ
```
**Flag/map graphic:** Africa continent silhouette as a subtle background element (white, 10% opacity)

---

## Brand Voice

The brand voice is consistent across all ZAO-branded materials:

| Trait | What it sounds like |
|---|---|
| Direct | "The loser gets paid. Full stop." |
| On-chain native | "TX hash, not press release." |
| Community-first | "ZOR holders chose the charity." |
| Anti-hype | No promises about price, TVL, or returns |
| Human | "Artists in Ellsworth, Maine. On-chain." |

**Words to avoid:** "revolutionary," "disruptive," "the future of music" (cliché), "hodl," "to the moon" (crypto-bro)

**Words to use:** "automatic," "on-chain," "transparent," "community," "artists earn," "even the loser"

---

## Iman Design Brief Template

When briefing Iman (or any designer) for ZAO materials:

```
Designer brief: [project name]

Brand: ZAO (ZTalent Artist Organization)
Platform: WaveWarZ — music battle prediction market on Solana
Primary audience: [audience for this specific piece]

Colors: ZAO Black #0A0A0A, ZAO White #F5F5F5, ZAO Gold #FFD700, [accent colors]
Font: Space Grotesk Bold + Regular
Gradient: linear-gradient(135deg, #0047FF, #9945FF, #FFD700) — optional for hero

Copy:
- Headline: [text]
- Sub: [text]
- CTA: [text]
- URL: [link]

Required elements: [logos, dates, addresses]
Format: [dimensions, web vs print]

Vibe: Underground + on-chain. Not corporate. Think "crypto community event poster."
Reference: [any comparable designs]
```

---

## Related Docs

- 1483 — ZAO Press Kit (media-ready brand assets package)
- 1593 — ZAO × PizzaDAO Zambia Flyer Brief (Iman design brief — uses this doc as reference)
- 1614 — ZAO North Star Narrative Spec (brand voice and messaging)
- 1560 — ZAO Media Vault Backup Protocol (where logo/brand files are stored)
- 1602 — ZAOstock Insurance + Permit Tracker (Oct 3 event context for ZAOstock materials)
