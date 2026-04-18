# 427 — UVR (Underground Violet Rave) & Jadyn Violet — Brand Brief for Discord Intro Bot

> **Status:** Research complete
> **Date:** 2026-04-17
> **Goal:** Brand profile + asset inventory for forking the ZAO Fractal `/intro` bot into a UVR-branded Discord bot at `/Users/zaalpanthaki/Documents/UVRintroBot/`.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Primary brand color | USE deep violet `#7A3FBF` (UVR signature). Pair with near-black `#0B0014` for dark-mode embeds. Reason: brand is "Underground **Violet** Rave" — purple/violet is the entire identity per Raver Realm site (dark mode default). |
| Embed accent (`discord.Embed` color) | USE `0x7A3FBF` (violet) instead of Fractal's `0x57F287` (green). One-line swap on `cogs/intro.py:224`. |
| Community page URL pattern | USE `https://raverrealm.xyz/raver/<slug>` IF a member directory exists; otherwise SKIP the community-page field entirely (do not invent). Confirm with Jadyn before shipping. |
| Member terminology | USE "Raver" not "member". Embed title: `"Raver Intro: <display_name>"`. Footer: `"Underground Violet Rave • raverrealm.xyz"`. Reason: community self-identifies as "Ravers" — see Raver Realm FAQ. |
| Intros channel ID | NEW env var `UVR_INTROS_CHANNEL_ID` (do not reuse `INTROS_CHANNEL_ID` from Fractal). Get the snowflake from Jadyn / UVR Discord (2,401 members). |
| Wallet field | KEEP the wallet abbreviation block (`cogs/intro.py:235-240`) — UVR is NFT-native (Raver Realm 1,800 supply, Violet Token, UVR Orbs/POAPs). High value for this audience. |
| Supabase table name | RENAME `discord_intros` → `uvr_intros` to keep ZAO Fractal and UVR data isolated in the same Supabase project, OR use a separate Supabase project. |
| Optional brand flair | ADD a violet orb emoji `🟣` or custom UVR Orb emoji to the embed title. Reason: "Orbs" are the community's POAP/utility token language. |
| Bot persona/voice | USE counter-culture, music-first, terse. Avoid corporate. Reason: brand mission = "counter culture and expression". |

## UVR Brand Profile

### Founder
- **Jadyn Violet** — artist, musician, NFT illustrator. Hand-draws every Raver in **Paint.NET + Wacom tablet**. Produces all music (with OADEVOUR, brace, others).
- Twitch: `twitch.tv/jadynviolet` (365-day streaming challenge per ZAO docs).
- Sound.xyz: released "The Stern Mystic" + first drop "Good Always Turns Evil" (1.75 ETH raised).
- Linktree: `linktr.ee/jadynviolet`.

### UVR (Underground Violet Rave)
- **Founded:** 2021.
- **Live events:** 7–8 raves across 6–7 US cities (Brooklyn, LA, Miami, Cincinnati, etc.). Listed as "Active" associated community in ZAO whitepaper.
- **Discord:** ~2,401 members (per public listing). Token-gated UVR channel for podcasts/shows.
- **Daily ritual:** UVR Twitter Spaces — Music NFTs + POAP discussion.
- **Mission:** "Seductively introduces web3 to the local underground scene." Onboarding + education + exposure.
- **Tagline (Raver Realm):** "The Music Collectors PFP."

### Lore Glossary (use these terms in the bot)
| Term | Meaning |
|------|---------|
| **Raver** | A community member / a hand-drawn PFP NFT. |
| **Realm** | Counter-culture philosophy each Raver embodies. |
| **RaverDex** | Character collection / directory system. |
| **UVR** | Underground Violet Rave — the brand + the live event series. |
| **Orb** | POAP collectible giving utility/access to UVR members. |
| **Violet Token** | Top-tier access token (free-mint tier on Raver Realm). |
| **Violet** | Jadyn's debut studio album — the 9 Raver songs roll up to it. |

### Visual Aesthetic
- **Mode:** Dark by default, light alternate exists (`raverrealm.xyz/home-light`).
- **Palette:** Deep violet/purple primary, near-black background, hand-drawn character art with vibrant accents.
- **Typography:** Web inspection needed (not extracted — site uses standard web stack). Safe default: bold sans for headings, mono for wallet snippets in embed.

## Comparison: Brand Swap from Fractal → UVR

| Element | Fractal (current) | UVR (target) | File:Line |
|--------|-------------------|--------------|-----------|
| Embed color | `0x57F287` (green) | `0x7A3FBF` (violet) | `cogs/intro.py:224` |
| Embed title | `"Introduction: {name}"` | `"Raver Intro: {name}"` | `cogs/intro.py:223` |
| Community URL | `thezao.com/community/<slug>` | `raverrealm.xyz/raver/<slug>` *(verify exists)* | `cogs/intro.py:220, 230` |
| Footer | `"ZAO Fractal • zao.frapps.xyz"` | `"Underground Violet Rave • raverrealm.xyz"` | `cogs/intro.py:251` |
| Channel ID const | `INTROS_CHANNEL_ID` | `UVR_INTROS_CHANNEL_ID` | `config/config.py` + `cogs/intro.py:22, 184, 244, 281` |
| Supabase table | `discord_intros` | `uvr_intros` | `cogs/intro.py:94, 113, 125, 131` |
| Admin role check | `is_supreme_admin` (ZAO role) | UVR-equivalent role — likely "Founder" or "UVR Admin" — confirm w/ Jadyn | `cogs/intro.py:274` |
| Wallet lookup | `bot.wallet_registry` (ZAO) | KEEP same pattern; populate UVR wallet registry separately. | `cogs/intro.py:236-240` |

## ZAO Ecosystem Integration

UVR is an "Associated Community" in ZAO per:
- `research/_archive/047-zao-community-ecosystem/README.md`
- `research/_archive/048-zao-ecosystem-deep-dive/README.md`
- `research/community/050-the-zao-complete-guide/README.md`
- `research/community/051-zao-whitepaper-2026/drafts/draft-4.0–4.4.md`

The intro bot lives at `/Users/zaalpanthaki/Documents/UVRintroBot/` (currently empty — only `.claude/`). Source to fork: `/Users/zaalpanthaki/Documents/fractalbotapril2026/cogs/intro.py` (319 lines). Strip Fractal-specific cogs (`hats.py`, `proposals.py`, `snapshot.py` etc.) unless UVR wants Hats/governance — likely SKIP for v1.

## Open Questions for Jadyn (resolve before code)

1. UVR Discord guild ID + #intros channel snowflake?
2. Does `raverrealm.xyz/raver/<slug>` exist or should the community-page field be dropped?
3. Admin role name in UVR Discord (replaces "Supreme Admin")?
4. Reuse ZAO Supabase or new UVR Supabase project?
5. Wallet registry — pull from Raver Realm holder list, or build fresh?

## Sources

- [Raver Realm — Home](https://raverrealm.xyz/)
- [Raver Realm — FAQ](https://raverrealm.xyz/faq/)
- [Underground Violet Rave on Twitter/X (@projectuvr)](https://www.sotwe.com/projectuvr)
- [Jadyn Violet on X (@jadynviolet)](https://x.com/jadynviolet)
- [Jadyn Violet — Sound.xyz "The Stern Mystic"](https://www.sound.xyz/jadynviolet/the-stern-mystic)
- [Jadyn Violet on Twitch](https://www.twitch.tv/jadynviolet)
- [Jadyn Violet Linktree](https://linktr.ee/jadynviolet)
- [UVR — Luma event listing](https://lu.ma/hgenj6yc)
- [Raver Realm GitHub (NicoAcosta/violet — Genesis Collection)](https://github.com/NicoAcosta/violet)
- [Resident Advisor — UVR Miami 2023](https://ra.co/events/1805374)
- [Invest in Music — The Stern Mystic deep dive](https://investinmusic.mirror.xyz/a6ANWRPo7y7lKfOAeAYh6sU3B-dF_2hSIkKAuif2Y0I)
- ZAO whitepaper draft (local): `research/community/051-zao-whitepaper-2026/drafts/draft-4.4.md`
- ZAO ecosystem deep dive (local): `research/_archive/048-zao-ecosystem-deep-dive/README.md`
