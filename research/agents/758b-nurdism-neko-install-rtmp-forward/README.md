---
topic: agents
type: guide
status: research-complete
last-validated: 2026-05-26
related-docs: "758, 758a, 758c, 758d, 758e, 752"
original-query: "install + test nurdism/neko (now m1k1o/neko) headless Chrome in Docker, RTMP forward to Restream/Twitch/YT, for 24/7 ZAO musician radio + composite-stream collab with Leeward"
tier: STANDARD
---

# 758b - m1k1o/neko install + RTMP forward (24/7 ZAO radio)

> **Goal:** Stand up a 24/7 always-on headless-browser audio source on VPS 31.97.148.88, native RTMP to Restream/YouTube. Validate by 2026-06-02 for Leeward kickoff.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **USE m1k1o/neko v3.1.0** (chromium image, ghcr.io/m1k1o/neko/chromium:latest) | Original nurdism/neko is archived; m1k1o is canonical active fork as of 2026-05-25 |
| 2 | **USE neko's built-in Broadcast pipeline** (not external ffmpeg/OBS-headless) | v3 includes native GStreamer RTMP; one less moving part |
| 3 | **DEPLOY at 480x360@25 + 2500 kbps** for 24/7 radio | 4-vCPU VPS sustains this comfortably; 720p+ saturates CPU at concurrent viewers |
| 4 | **SET `shm_size: 2gb` + `NEKO_WEBRTC_NAT1TO1=<public IP>`** | The two #1 install failures: Chromium crashes without shm + remote viewers get unreachable address without NAT1TO1 |
| 5 | **SKIP DRM-locked sources** (Spotify Web, Apple Music Web) | EME sandbox blocks audio capture; use YouTube Music / Bandcamp / SoundCloud / self-hosted Plex |
| 6 | **Cloudflare Tunnel for remote access**, NOT auth-via-URL | Credentials in referer headers leak; Cloudflare Access token instead |

## Findings

m1k1o/neko v3.1.0 (released 2026-04-02) is a full Go rewrite. WebRTC via Pion. Decoupled audio/video (still muxed by default). Multi-user room management. Built-in API token system. **Critically: v3 Broadcast module handles RTMP forwarding natively** - original nurdism required ffmpeg external piping. v3 is NOT backward-compatible with v2; env vars renamed (`NEKO_PASSWORD` -> `NEKO_MEMBER_MULTIUSER_USER_PASSWORD`).

### Hardware: 4-vCPU 8GB fits single 720p, comfortable at 480p 24/7

Hostinger KVM 2 (4 vCPU + 8GB RAM) sustains a single 720p@30fps stream to Twitch/YouTube 24/7 with headroom. Real constraint = CPU encoding, not RAM. 8+ concurrent viewers on 4-core saturates CPU and causes audio drift; neko streams one encoded bitstream to all participants (SFU topology), but each UDP connection consumes 30-50 Mbps. For 24/7 music radio (no UI interaction needed), 480x360@25 + 2500 kbps frees CPU and stays well under bandwidth caps.

### Docker Compose (canonical, with comments)

```yaml
version: "3.8"
services:
  neko:
    image: "ghcr.io/m1k1o/neko/chromium:latest"
    restart: "unless-stopped"
    container_name: neko-music-radio
    shm_size: "2gb"               # CRITICAL: Chromium crashes without this
    cap_add:
      - SYS_ADMIN                 # v3.1+ no longer needs NET_ADMIN
    ports:
      - "8080:8080"               # Web UI
      - "52000-52100:52000-52100/udp"  # WebRTC UDP range
    environment:
      NEKO_WEBRTC_NAT1TO1: "31.97.148.88"      # MUST be VPS public IP
      NEKO_WEBRTC_EPR: "52000-52100"
      NEKO_WEBRTC_ICELITE: "true"
      NEKO_DESKTOP_SCREEN: "480x360@25"        # 24/7 radio sizing
      NEKO_CAPTURE_VIDEO_CODEC: "h264"
      NEKO_CAPTURE_VIDEO_BITRATE: "2500"
      NEKO_CAPTURE_AUDIO_DEVICE: "audio_output.monitor"
      NEKO_CAPTURE_AUDIO_CODEC: "opus"
      # --- 24/7 RTMP broadcast ---
      NEKO_CAPTURE_BROADCAST_AUTOSTART: "true"
      NEKO_CAPTURE_BROADCAST_URL: "rtmp://live.restream.io/live/<KEY>"
      NEKO_CAPTURE_BROADCAST_VIDEO_BITRATE: "2500"
      NEKO_CAPTURE_BROADCAST_AUDIO_BITRATE: "128"
      NEKO_CAPTURE_BROADCAST_PRESET: "veryfast"
      # --- Auth ---
      NEKO_MEMBER_MULTIUSER_USER_PASSWORD: "neko"
      NEKO_MEMBER_MULTIUSER_ADMIN_PASSWORD: "admin"
      NEKO_SESSION_CONTROL_PROTECTION: "true"
    volumes:
      - neko-home:/home/neko       # Persist browser profile

volumes:
  neko-home:
```

### Audio sync (the #1 reported gotcha)

Chromium and Firefox introduce 150-300ms inherent A/V jitter because audio + video are muxed into a single WebRTC session (GitHub issue #339). Separate streams would drop latency to 10-20ms but v3 couples them by design. Workaround for music radio: accept 100-150ms (irrelevant for non-interactive listening), and pick players with internal buffering (YouTube Music, SoundCloud, Bandcamp) which masks jitter.

### DRM-locked players: blocked

Spotify Web, Apple Music Web, Amazon Music Unlimited run audio in an EME sandbox. Neko cannot capture. Workaround: YouTube Music, Bandcamp, SoundCloud, Tidal, Deezer Web, or self-hosted Plex/Jellyfin pointing at member tracks.

### Auth + Cloudflare Tunnel

Neko has built-in basic auth (`NEKO_MEMBER_MULTIUSER_*_PASSWORD`). Cloudflare Tunnel (zao-agents) sits in front: tunnel -> `localhost:8080`. **Do not pass credentials via URL query string** (`?usr=&pwd=`) - lands in referer headers. Either leave neko on private IP + use Cloudflare Access in front, or pre-shared token in tunnel config.

### Cost for 24/7 always-on

Hostinger KVM 2 (~$10-15/mo): 15-20% CPU for 480p@25 encode, <500MB RAM. Bandwidth: 2500 kbps + 128 kbps = ~20 GB/month at 100% upstream. Most Hostinger plans give 1-5 TB/month. GPU acceleration unnecessary at 480p.

### Alternatives table

| Option | RTMP Native | A/V Sync | DRM Support | Setup | Best For |
|--------|-------------|----------|-------------|-------|----------|
| **Neko v3** | Yes | 100-150ms | No | Low (compose) | Watch parties, 24/7 radio |
| OBS-headless + Xvfb | Yes (ffmpeg sink) | Better (separate A/V) | No | Medium | Studio-grade tuning |
| ffmpeg + Xvfb + VNC | Yes | Good | No | High | Pure video recording |
| Hyperbeam API | Yes | Excellent | Yes (DRM-aware) | Low | Commercial, not self-hosted |
| Restream Studio | Yes | Fair | No | Very low | Lightweight, limited control |

### Killer gotcha: UDP forwarding + WebRTC connectivity

Most common VPS failure: UDP 52000-52100 not exposed. WebRTC falls back to TCP via TURN (if configured), degrading performance. `NEKO_WEBRTC_NAT1TO1` MUST be set to public IP; without it, Neko advertises internal Docker IP (172.17.0.2) and remote viewers get unreachable. Second-most common: `shm_size: 2gb` missing - Chromium crashes below 1.5GB shared memory.

## Recommended Install Plan (5 steps)

1. **Verify UDP firewall on VPS** - `sudo iptables -L -n | grep 52000`. Ensure UDP 52000-52100 exposed. Test: `nc -u -l -p 52001` on VPS + `timeout 2 nc -u 31.97.148.88 52001` from your machine.
2. **Deploy compose** (template above). Set `NAT1TO1` + `BROADCAST_URL` (Restream/Twitch/YT key) + `AUTOSTART=true`. `docker compose up -d`.
3. **Local access test** - `http://localhost:8080` on VPS, login admin/admin, open YouTube Music or Bandcamp, verify audio plays + broadcast indicator shows "live."
4. **Route via Cloudflare Tunnel** (zao-agents) - add neko service: `neko.zaoos.com` -> `localhost:8080`. Test external access.
5. **72-hour stability soak** - `htop` on VPS, listen on Twitch/YT from a different network. Watch for audio drift + RTMP disconnects.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Verify Hostinger UDP firewall (52000-52100 open inbound) | @Zaal | infra | 2026-05-28 |
| Pull m1k1o/neko:chromium v3.1.0; test compose locally | @Zaal | dev | 2026-05-29 |
| Get RTMP endpoint (Restream/YouTube/Twitch) + set in compose | @Zaal | config | 2026-05-29 |
| Deploy to VPS + 72-hour soak | @Zaal | infra | 2026-06-01 |
| Cloudflare Tunnel route (`neko.zaoos.com`) | @Zaal | infra | 2026-06-02 |
| Prepare curated playlist (Bandcamp / YouTube Music) for always-on | @Zaal | content | 2026-06-02 |
| Leeward kickoff for composite-stream build | @Zaal | meeting | 2026-06-02 |

## Also See

- Doc 758 (hub) - parent
- Doc 752 - Leeward x Zaal WebRTC + Pion + LiveKit handoff (2026-05-25 call source)
- Doc 758d - Discord 24/7 radio bot (the listening-side companion to this streaming-side)
- Memory: project_leewardbound.md, project_741_livekit_endorsed.md

## Sources

- [FULL] m1k1o/neko v3.1.0 release notes - https://github.com/m1k1o/neko/releases/tag/v3.1.0
- [FULL] Audio + Video Capture (Broadcast section) - https://neko.m1k1o.net/docs/v3/configuration/capture
- [FULL] Installation Examples - https://neko.m1k1o.net/docs/v3/installation/examples
- [FULL] Configuration Reference - https://neko.m1k1o.net/docs/v3/configuration
- [FULL] FAQ - https://neko.m1k1o.net/docs/v3/faq
- [PARTIAL - v3 hasn't split A/V] GitHub issue #339 "Reduce latency" - https://github.com/m1k1o/neko/issues/339
- [PARTIAL - v2 era config] GitHub issue #236 "RTMP does not work" - https://github.com/m1k1o/neko/issues/236
- [FULL] VRChat Streaming with Neko (concrete RTMP example) - https://github.com/jameskitt616/vrchat_streaming
- [FULL] Programster blog - Deploying Neko (2025 hardware + perf) - https://blog.programster.org/deploying-neko-a-shared-virtual-browser
- [FULL] Unsubbed.co - Neko (cost breakdown, gotchas, alternatives) - https://unsubbed.co/tools/neko/
- [PARTIAL] m1k1o/neko reference compose - https://github.com/m1k1o/neko/blob/refs/heads/master/docker-compose.yaml
