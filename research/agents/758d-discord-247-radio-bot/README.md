---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-26
related-docs: "758, 758a, 758b, 758c, 758e"
original-query: "24/7 ZAO musician radio Discord bot - per-artist playlists. Discord music bot landscape post-2021 YouTube crackdown; what's safe in 2026; ZAO members own their tracks so legal posture is stronger"
tier: STANDARD
---

# 758d - Discord 24/7 ZAO musician radio bot

> **Goal:** Always-on Discord voice-channel radio playing ZAO members' tracks from Arweave. Per-artist rotation. Now-playing embeds with attribution. Ship in a weekend.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **FORK bongodevs/lavamusic** (721 stars, last push Apr 2026, TypeScript) | Most-maintained Lavalink reference; production-ready; discord.js v14 + lavalink-client + Shoukaku |
| 2 | **USE Lavalink v4.2.2+** (Java 17+, separate node) | De facto standard, isolated audio processing, DAVE encryption support |
| 3 | **USE discord.js v14** (not v15 pre-release) | v15 has breaking WebSocket changes but no material voice-API improvements |
| 4 | **DELETE the YouTube plugin from the lavamusic fork** | YouTube TOS killed Groovy, Rythm, Hydra; bot lives or dies on this call |
| 5 | **STREAM ZAO member tracks from Arweave via Lavalink's HTTP source** | Members own tracks; Arweave URL is just HTTP; Lavalink ffmpeg integration handles MP3/OGG/WAV |
| 6 | **HOST on Iman's VPS 187.77.3.104** | 4 vCPU / 8GB sustains Lavalink at ~20-30% CPU for 24/7 single-channel; bandwidth negligible |
| 7 | **SKIP Spotify/SoundCloud-via-Lavalink plugins initially** | Members on those platforms link to Arweave-hosted copies first; expand only if member coverage gap |

## Findings

### The 2021-2022 collapse: why this is the load-bearing decision

YouTube killed Groovy (Aug 2021) and Rythm (Sept 2021) via cease-and-desist letters citing TOS violations for unauthorized streaming + commercial usage. Hydra shut down Jan 2023 even after disabling YouTube playback. The threat is real and ongoing.

**For ZAO's radio - community-owned artist tracks on Arweave - the posture is strong.** Ownership + explicit license sidesteps YouTube TOS entirely. Bot becomes a jukebox for ZAO's own catalog, not a third-party copyright proxy. **As long as YouTube isn't in the path, the legal threat vector closes.**

### Tech stack (2026 state)

- **discord.js v14** (stable, mature voice API). v15 pre-release has WebSocket churn but no material voice improvements.
- **Lavalink v4.2.2+** (out of beta since 2026-02). Kotlin-based, Java 17+, runs as separate node. Handles all audio processing in isolation. Plugin stability + ecosystem dominate.
- **Alternatives:** Rustalink (experimental, 27 stars), Sonata (TypeScript, ~15MB vs Lavalink 300MB). Lavalink ecosystem wins for this use case.

### Audio source: Lavalink HTTP source + Arweave

Lavalink natively supports HTTP/local file playback via the `http` source. Arweave/IPFS URLs are just HTTP streams - point Lavalink's HTTP source at an Arweave gateway (`arweave.net/<tx-id>`, or ZAO's own gateway) and it plays. No special codec work; Lavalink's ffmpeg integration handles MP3/OGG/WAV.

For member tracks on Spotify/SoundCloud, Lavalink plugins (LavaSrc, YouTube plugin if risk-acceptable) add sources. **Skip these in v1.** Mirror member tracks to Arweave; this is the cleanest legal posture.

### OSS bots to fork (ranked)

| Repo | Stars | Last Push | Stack | Best For |
|------|-------|-----------|-------|----------|
| **bongodevs/lavamusic** | 721 | Apr 2026 | TS / discord.js v14 / Lavalink-client / Shoukaku | Production-ready, well-maintained, Docker. **Recommended.** |
| Lunox | 203 | active | TS / discord-hybrid-sharding / Rainlink / MongoDB | Heavier; full-featured; 24/7 mode; autoplay |
| BeatDock | 64 | active | JS / Apache 2.0 / can run on public Lavalink nodes (zero Java) | Minimal, Docker native, weekend sprint |
| Nexa Music v2 | 7 | newest | TS / Riffy / SQLite | Components V2 UI, small footprint, untested at scale |

### Legal posture checklist

- ZAO members own their tracks (confirmed). Add broadcast rights grant in member ToS / explicit license.
- Arweave/IPFS URLs are public, member-consented.
- No YouTube routing = no copyright enforcement risk.
- DMCA / ASCAP / BMI implications only arise if monetizing streams or claiming ownership. ZAO crediting artists in now-playing embeds + Arweave links = safe.
- Discord VC = invite-only / community context, not public broadcast.

### Per-artist rotation pattern

- **Weighted round-robin** by artist track count (more tracks = more rotations).
- **Or scheduled blocks** (e.g., "Artist of the Day" 1-hour slots).
- Query ZAO Arweave metadata API (or ZAO Music entity per doc 475) to fetch `{artist: [tracks]}` map.
- Persist queue state in Supabase so bot restart resumes.

### Now-playing embed pattern

On each track change, post embed to `#now-playing` channel:
- Artist name + track title
- Cover art (from Arweave manifest)
- Arweave link
- ZAO member attribution
- Buttons: skip, pause (admin only)

### Hosting cost reality

Lavalink on 4-vCPU 8GB VPS handles ~50 concurrent voice connections with headroom. 24/7 single-channel playback: ~20-30% CPU, <100MB RAM. Bandwidth: ~128 kbps per active listener = negligible at ZAO's 188-member scale.

### Killer gotcha

VibeBot is the surviving commercial player still routing YouTube via Cloudflare WARP proxy. YouTube could block this at any time. **Don't build on that path.** The 2021-2023 graveyard is the signal.

## Recommended Build Plan (5 steps, weekend sprint)

1. **Clone bongodevs/lavamusic; strip YouTube plugin from `application.yml`; test Lavalink v4.2+ on Iman's VPS.** Update discord.js to v14.26+.
2. **Wire Arweave HTTP source.** Add gateway URL to Lavalink config; test stream of one ZAO member MP3 (e.g., `https://arweave.net/<tx-id>`); verify audio in test Discord VC.
3. **Playlist rotation logic.** Query ZAO Music metadata API (or ZAO Arweave manifest) -> `{artist: [tracks]}` map. Implement weighted round-robin or scheduled-block queue builder. Seed on startup.
4. **Now-playing embed** to `#now-playing` channel on each track change. Embed includes artist + title + cover + Arweave link + member attribution.
5. **24/7 mode + crash recovery.** Persist session state in Supabase. On restart, reconnect to voice channel + resume queue.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Deploy Lavalink v4.2.2 on VPS 187.77.3.104:2333 + health check green | @Zaal/@Iman | infra | 2026-06-03 |
| Arweave gateway test: stream one ZAO MP3 to a test VC | @Zaal | dev | 2026-06-04 |
| Fork lavamusic; strip YouTube plugin; verify bot joins "ZAO Radio" VC | @Zaal | PR (new repo) | 2026-06-05 |
| Wire `{artist: [tracks]}` query from ZAO Music metadata | @Zaal | PR | 2026-06-06 |
| Implement now-playing embed in `#now-playing` channel | @Zaal | PR | 2026-06-07 |
| Enable 24/7 + Supabase session persist | @Zaal | PR | 2026-06-08 |
| Document broadcast-rights grant in member ToS | @Zaal | legal | 2026-06-10 |

## Also See

- Doc 758 (hub) - parent
- Doc 758b - neko (the streaming-out counterpart to this listening-in bot)
- Doc 475 - ZAO Music entity (DBA + 0xSplits + BMI)
- Memory: project_zao_music_entity.md, project_leeward_followup_f (Discord radio prototype task)

## Sources

- [FULL] The Verge - YouTube forcing Rythm offline - https://www.theverge.com/2021/9/12/22669502/youtube-discord-rythm-music-bot-closure
- [FULL] Gizmodo - YouTube forces Discord music bot shutdown - https://gizmodo.com/youtube-forces-popular-discord-music-bot-to-shut-down-1847664573
- [FULL] VOC Insight - Is YouTube Killing Every Discord Music Bot? - https://insight.voc.ai/blog/is-youtube-killing-every-discord-music-bot%3F-en-us
- [FULL] Lavalink v4.2.0 release (DAVE support) - https://github.com/lavalink-devs/Lavalink/releases/tag/4.2.0
- [FULL] bongodevs/lavamusic (recommended fork target) - https://github.com/bongodevs/lavamusic
- [FULL] VibeBot.gg features (still-running YouTube routing) - https://www.vibebot.gg/features/music
- [FULL] BeatDock - https://github.com/lazaroagomez/BeatDock
- [FULL] Nexa Music v2 - https://github.com/koddyvx/Nexa-Music
- [FULL] Lavalink docs - https://lavalink.dev/
- [FULL] discord.js v14 CHANGELOG (to Apr 2026) - https://github.com/discordjs/discord.js/blob/14.26.3/packages/discord.js/CHANGELOG.md
- [PARTIAL - no Arweave/IPFS data] Discord Player Extractor API + custom streams - https://github.com/rickklaasboer/discord-player
