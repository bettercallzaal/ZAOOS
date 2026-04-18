# 427.02 — Jadyn Violet Deep Dive

> **Status:** Research complete
> **Date:** 2026-04-17
> **Supplements:** `427-uvr-jadyn-violet-brand-intro-bot/README.md`
> **Goal:** Biographical, musical, and community-building detail on Jadyn Violet for the UVRintroBot `/about` command and any future UVR collaborations.

---

## Key Facts

| Field | Value |
|-------|-------|
| **Real identity** | First-generation Indian American |
| **From** | Manassas, Virginia |
| **Age at early press** | 23 (per Archiv3 + Word To Your Mama Ep 167). Likely ~25–26 in April 2026. |
| **Education (prior)** | Rutgers business school — nearly perfect SAT, dropped out 3rd semester |
| **Years making music** | 6+ (per Medium bio) |
| **Father** | Career singer (direct influence) |
| **Early inspiration** | Michael Jackson |
| **Genre** | Alternative hip-hop; blends pop, rap, electronic |
| **Production** | OADEVOUR, brace, Jadyn Violet |
| **Spotify artist** | `3EzhvtRgIkIPK0VYNv1ooV` |
| **Apple Music** | `artist/jadyn-violet/1488149647` |
| **Twitch account created** | May 8, 2020 (account age; NOT when daily streaming started) |
| **Daily Twitch streaming since** | **January 2025** (per Jadyn — confirmed by user 2026-04-17) |
| **Twitch rank** | Top 0.69% globally, top 0.69% English (#46,051 global, #21,518 English) |
| **Weekly Twitch hours** | ~65 (TwitchTracker) |
| **IG followers** | ~18K |
| **Discord members** | ~2,401 |

## UVR Timeline

| Date | Event |
|------|-------|
| **2021** | Underground Violet Rave founded |
| **April 5, 2022** | Violet Token mint — 0.04 ETH, 11-day window, via `jadynviolet.xyz`. Top tier (60 tokens) = Jadyn goes full-time. |
| **Dec 2, 2022** | "Open Borders x UVR" at Purple Bodega, Miami (Eventbrite) |
| **2023** | UVR Miami at Secret Warehouse (Resident Advisor) |
| **Ongoing** | Daily UVR Twitter/X Spaces — 10+ months consecutive run (mid-2023 → present at time of research) |
| **Pre-"Violet"** | First Sound.xyz drop "Good Always Turns Evil" — 1.75 ETH raised |
| **Release: "The Stern Mystic"** | Sound.xyz track (`sound.xyz/jadynviolet/the-stern-mystic`). Mirror post by Invest in Music. |
| **Genesis Collection** | "Violet" — see GitHub `NicoAcosta/violet` (NFT contract) |
| **Raver Realm mint** | October 23 (year unclear in sources — likely 2024 or 2025). 1,800 supply. Tiered pricing: Free (Violet Token + top 10 UVR Orb + Jadyn 1/1s), 0.02 ETH (select prior holders), 0.025 ETH (UVR Orb + allowlist), 0.03 ETH (public). |
| **Upcoming** | TwitchCon UVR meetup (per IG reel `instagram.com/reel/DPW-P2TgZvN`) |

## Cities Toured (Confirmed)

Brooklyn, NYC, Los Angeles, Miami, Denver, Cincinnati.
Known venues: Purple Bodega (Miami), Town Hall Collaborative (Denver), Secret Warehouse (Miami).

## The 9 Ravers (Track Names)

Each Raver = one song = one Realm (genre):

1. Comeback Kid
2. Rockstar Shit
3. Dancing Damsel
4. Toxic Queen
5. Only Fans
6. Disha
7. Lone Wolf
8. Champagne Poet
9. Miss Influence

Rolls up to debut album *Violet*.

## Jadyn's Own Words (Quote Bank)

> "I want people to feel what I feel, I want people to see things through my eyes when they listen to my music."

> "I could accomplish great things in whatever I fully set my mind to, and because that happens to not be school does not mean I had given up on life."

> "Creating Art for me is the idea of being able to translate the emotions and feelings that you feel within your chest."

> "Your only obstacle in life is often yourself." (Word To Your Mama Ep 167)

Aspirational side-quest: **own a Taco Bell franchise** (podcast, half-joking but repeatedly mentioned).

## Streaming Schedule Conflict (Resolved)

Sources give conflicting times:
- IG reel (DFKCquBu6oZ): "streaming every day @ 10PM"
- X post 1945499024993185930: "every single day at 4pm est"
- X post 1970889993766994375: "Live on Twitch at 7PM EST"

Interpretation: time varies; the consistent fact is **daily**. For the `/about` embed, state "streams every single day" without a fixed hour — safer and accurate.

## Ecosystem / Peers

- **Jadyn Violet's community shape** — value-first daily Spaces, token-gated podcasts, live raves bridging web2 + web3. Closest analog in ZAO: Stilo (150+ weekly VR concerts since 2007) + Mr. Darius (Sound.xyz + web3 + Wave).
- **ZAO classification** — UVR = "Associated Community" per ZAO whitepaper Draft 4.4.
- **Raver Realm supply** — 1,800 (ZAO doc) vs. minted 679 (per ZAO Stock snapshot in whitepaper).

## Brand Voice Cues (for UVR bot copy)

- **Ethos:** counter culture, authenticity, emotional truth, "make music in my bedroom" honesty.
- **Tone:** hustle + vulnerability. Founder-voice ("gunna happen one day" bedroom bio).
- **Avoid:** corporate jargon, overhype, emoji clutter. Jadyn's own copy leans plain and direct.
- **Use:** "Raver" (community member), "Realm" (genre/world), "Orb" (POAP), "Violet Token" (genesis), "UVR" (umbrella).

## Implications for UVRintroBot

1. **`/about`** — lead with founder story (Indian American, Manassas, Rutgers dropout, bedroom music) because that's the hook that differentiates Jadyn from generic web3 music acts.
2. **Streaming plug** — always link Twitch; daily = the brand signal. Don't state an hour (changes).
3. **Album/Track name-drops** — listing the 9 Raver names makes the embed feel like a fan knows them.
4. **No emojis** — Jadyn's own copy is emoji-light. Match his voice.
5. **Future commands to consider:**
   - `/raver <1-9>` — look up a specific Raver character + song.
   - `/spaces` — link to today's UVR X Space.
   - `/live` — ping Twitch API, show if Jadyn is currently streaming.

## Sources (New for this supplement)

- [ARCHIV3 — Jadyn Violet profile](https://archiv3.xyz/articles/jadyn-violet-is-molding-the-framework-for-future-musicians-using-web3)
- [Jadyn Violet Medium — About](https://medium.com/@Jadynviolet/about)
- [Violet Token Launch Details (Medium, 2022)](https://medium.com/@Jadynviolet/violet-token-launch-details-e10b0634d30)
- [Word To Your Mama — Ep 167: Jadyn Violet](https://www.wordtoyourmama.com/episodes/167)
- [Raver Realm — About](https://raverrealm.xyz/about/)
- [Raver Realm — Rewards](https://raverrealm.xyz/rewards/)
- [TwitchTracker — jadynviolet](https://twitchtracker.com/jadynviolet)
- [Jadyn Violet — Spotify](https://open.spotify.com/artist/3EzhvtRgIkIPK0VYNv1ooV)
- [Jadyn Violet — Apple Music](https://music.apple.com/us/artist/jadyn-violet/1488149647)
- [Jadyn Violet — SoundCloud](https://soundcloud.com/jadynviolet)
- [Open Borders x UVR Miami (Eventbrite, 2022)](https://www.eventbrite.com/e/open-borders-x-underground-violet-rave-tickets-469955849597)
- [UVR TwitchCon IG reel](https://www.instagram.com/reel/DPW-P2TgZvN/)
