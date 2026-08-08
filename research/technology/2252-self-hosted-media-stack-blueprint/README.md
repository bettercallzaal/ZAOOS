# 2252 - ZAO self-hosted media stack blueprint (fleet briefs, Aug 6-8 2026)

Nine fleet-relay research briefs preserved and assembled into one architecture. Continues doc 2238 (first ten briefs + YouTube-constraints addendum). Everything below was researched with sources in-session; this doc records conclusions and the assembled design. Center of gravity: desktop-h2ov6da (GTX 1660 NVENC, always-on per the doc-2238 hardening briefs, Z: archive) + optional $6 VPS.

## The assembled architecture (the punchline first)

```
CONTRIBUTION                    HUB (desktop-h2ov6da)                DISTRIBUTION
guest browser --WHIP/vdo.ninja->                                  -> Restream -> Twitch/YT/X (live shows)
venue cam/phone --SRT (Larix)-->  MediaMTX (NSSM service)         -> Owncast @ thezao.xyz/tv (live, no 12h wall)
OBS local --------RTMP local--->    | recording tap -> Z:\archive  -> YouTube segmented ~11.5h blocks (ZNN)
ffplayout (Z:\channel loop) ---->   |                              -> PeerTube tube.thezao.com (VOD archive)
                                  overlays: React browser sources + SPX-GC panel (live) / burned-in (24/7)
AI: local whisper+7B (private) | Ollama cloud $20 flat (bulk) | Claude (voice/agents/judgment)
```

Every component is $0 OSS; total new spend if fully built: ~$6 VPS + ~$10-15/mo object storage + existing $20 Ollama Pro if adopted.

## 1. AI routing - the cheap-AI cost ladder after the 6GB ceiling

- Ollama Cloud ($20/mo Pro, GPU-time session buckets, levels 1-4 burn rates) inserts a flat-rate "capable open model" rung that used to require hardware. Ladder: local 1660 (free/private: whisper STT + 7B tagging) -> Ollama Cloud flat (bulk text: chaptering drafts, summaries, clip scoring) -> OpenRouter (experiments; 50 req/day free, ZDR opt-in, prompt sampling by default) -> Claude Haiku $1/$5 -> Sonnet 5 $3/$15 (intro $2/$10 to Aug 31) -> Opus 5 $5/$25. Batch API -50% and prompt-cache reads ~0.1x beat any provider switch for bulk.
- Routing: STT always local; one-off transcript backfills = Claude Haiku Batch + cached prompt; recurring bulk = Ollama cloud; brand voice/socials = Sonnet 5 minimum; POIDH eval + agents = Opus/Claude (reliability is the product). ZOE stays Claude.

## 2. Ollama cloud catalog - what beats a local 7B

- Cloud-only frontier OSS (mid-2026 index): kimi-k2.5/2.6 (1T/32B active), glm-5.1/5.2 (744B/40B, MIT), qwen3.5:397b, deepseek-v3.2 (671B), mistral-large-3:675b; coding kimi-k2.7-code, qwen3-coder:480b; mid gpt-oss:120b, gemma4:31b, minimax-m2.x, nemotron-3; light gpt-oss:20b, deepseek-v4-flash.
- Everything beats a 7B on quality; route by quota burn: level-1 models for volume, gpt-oss:120b default bulk, flagship MoE only for whole-transcript-in-one-head reasoning. Local keeps private class + nomic-embed-text for future ZM semantic search.

## 3. Ollama cloud privacy boundary

- What leaves: full prompt payload + account identity + metadata, transiting Ollama AND its GPU hosting partners. Promises (no logging, no training, partner ZDR, "transient" processing) are contractual, not verifiable - treat as trusted-vendor cloud, same class as Anthropic API, never same class as local.
- MUST STAY LOCAL: private 1:1/meeting recordings + transcripts (third parties didn't consent), unreleased music/masters, contracts/finance, community PII, credentials. Fine for cloud: anything already published (ZM transcripts, titles, catalogs). Operational rule: ROUTE BY SOURCE FOLDER - masters/, meetings/, finance/ never get cloud calls; public ZM content goes anywhere.

## 4. Ingest hub - MediaMTX over nginx-rtmp and SRS

- Architectural truth first: a LAN hub does NOT save upload bandwidth (every destination still exits the ISP uplink); only a VPS hub restores Restream's single-upload fan-out (~$70/yr vs $200-500/yr). No self-hosted hub replaces Restream's unified cross-platform chat - that stays the reason to keep paying.
- MediaMTX wins: single Go binary, native Windows/NSSM, RTSP/RTMP/SRT/WebRTC-WHIP/HLS in+out, exec hooks for recording taps + per-destination pushes. SRS = more server than needed; nginx-rtmp = no SRT, unmaintained, legacy only.
- Layered adoption: (now, $0) MediaMTX local tap - OBS pushes localhost, tap records master to Z:\archive, forwards to Restream; (if bill chafes) same config on $6 VPS via SRT contribution; (later) same instance is ZNN's ingest.

## 5. Owncast - the owned live surface

- Single Go binary = your own Twitch page: RTMP in, HLS out on your domain, built-in chat + mod tools, ActivityPub follows (Mastodon users get go-live notifications), admin panel. No 12h archive wall, no reused-content policy, no strike risk.
- Cannot: audience/discovery (a URL, not a network), free bandwidth (each viewer streams from you - S3/CDN segment offload is the designed answer), monetization (x402/USDC tipping is the crypto-native bolt-on candidate), real VOD library (ZM is that), multistream out (MediaMTX's job).
- ZAO fit: thezao.xyz/tv - ZNN loop runs truly 24/7 here while YouTube runs segmented blocks; fed by MediaMTX alongside platform simulcast.

## 6. 24/7 playout - ffplayout, not naive concat, not OBS

- Naive single ffmpeg concat = one corrupt file kills channel, playlist lock fights, PTS discontinuity accumulation. OBS as playout = browser-source memory leaks + GUI session dependency; show tool, not transmitter.
- ffplayout (Rust+FFmpeg): JSON daily playlists editable during playback, folder mode, built-in filler fallback for missing/broken content, two-process design isolating per-file discontinuities. Multi-day endless needs day_start + 24h length config.
- Prep step preventing half the failures: normalize library once at ingest (uniform 1080p/30 H.264 + AAC loudnorm via one overnight NVENC batch) -> playout stream-copies at near-zero CPU.
- Failover both ways: live show starts -> n8n pauses playout (yields to live); live dies -> supervisor repoints output to loop path; network blips -> supervisor restart-with-backoff (bare ffmpeg won't reconnect RTMP).
- Weeks-scale failure catalog: PTS drift, memory growth, log-filled disks, the YouTube 12h wall (restart output leg ~11.5h, schedule in UTC - DST), Windows update reboots (handled by doc-2238 host regime), playlist rot (nightly validation + filler), silent frozen-stream failure (dead-man must probe OUTPUT health, not process existence).
- ZAO build: ffplayout NSSM service reading Z:\channel -> local MediaMTX -> YouTube (segmented) + Owncast (continuous).

## 7. Overlays - browser sources + SPX-GC, skip Singular-style subscriptions

- OBS browser source = embedded Chromium with alpha: an overlay is just a web page. WaveWarZ/ZAO React components ARE the broadcast package (doc 1128's call) - reuse, not build.
- SPX-GC (OSS) = the Singular.live replacement: HTML template playout panel so a non-technical operator (Candy, co-hosts) fires lower thirds/titles without OBS access. NodeCG = framework tier, only when overlays become stateful apps (live battle leaderboards). CasparCG = broadcast overkill. StreamElements = hosted + branded; alerts only.
- Data wiring: overlay pages hold WebSockets; WaveWarZ /stats API -> ticker, n8n -> now-playing, Streamer.bot -> chat events. 24/7 channel burns branding in at ffplayout layer (browser sources are the classic multi-week leak).

## 8. Remote contribution - SRT vs RTMP vs WHIP

- Decide by use: guest face in a conversation = WebRTC/WHIP sub-500ms (vdo.ninja: guest clicks a link, browser is the encoder, lands as OBS browser source - likely the missing tool for remote LTAE/YapZ guests); camera at a stage = SRT (ARQ recovers up to ~25% loss at 1s buffer; Larix on phones, OBS 25+, hardware encoders; set latency ~4x RTT); RTMP only when the device speaks nothing else (TCP stalls on loss).
- MediaMTX accepts all three as publish paths - config, not new software. Tailscale makes NAT moot + encrypts; browser WHIP needs HTTPS (tailscale serve can front it). Industry pattern matches: SRT for contribution, WHIP where interaction matters.

## 9. PeerTube - VOD sovereignty layer

- Federated YouTube (AGPL/Framasoft): channels, ActivityPub follows, P2P-assisted playback, ~500MB RAM base. Three features make it viable for THIS archive: remote transcoding runners (desktop-h2ov6da's NVENC becomes the transcode farm; runners also do AUTO-TRANSCRIPTION - feeds the ZM chapters pipeline), S3 offload (VPS stays small, ~1.5TB archive on B2 at ~$6-10/TB/mo), native YouTube import (yt-dlp; ZM docs/youtube-catalog.md already holds all 738 video IDs = scripted backfill).
- Cannot: discovery, monetization, free bandwidth at scale, zero-cost federation moderation.
- Role: sovereignty backstop, not YouTube replacement - tube.thezao.com kills the single-point-of-platform-failure (one YT strike currently darkens 738 embeds across ZM). ZM integration = one more links[] entry per item + embed-source fallback. ~$20/mo all-in. Sequencing: AFTER the Z: backup track - it's a distribution surface, not the backup.

## Build order (if/when Zaal greenlights)

1. MediaMTX local tap + recording to Z: (an afternoon, $0, immediate archive win)
2. Normalize library batch + ffplayout -> ZNN on YouTube segmented + Owncast page (doc 1128's MVP, upgraded)
3. SPX-GC panel + React overlay pages for live shows
4. vdo.ninja/SRT contribution paths for remote guests
5. PeerTube backfill (post-backup)
6. AI routing adoption is orthogonal - start with the folder-based privacy rule whenever any cloud LLM is wired in.

Related: doc 2238 (first fleet digest + YouTube constraints), doc 1128 (ZNN feasibility - this supersedes its architecture), doc 1560 (backup protocol - still prerequisite for tier 5), zao-media repo docs/future-roadmap.md (auto-ingest/metrics/chaptering - the AI rungs here are their execution layer).
