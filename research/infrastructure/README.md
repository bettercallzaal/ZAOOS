# Infrastructure

> Gating, UI patterns, notifications, frameworks, databases, streaming, mobile strategy, admin, and smart contracts.

| # | Title | Type | Summary |
|---|-------|------|---------|
| 012 | [Gating Access to ZAO OS](./012-gating/) | STANDALONE | Methods for restricting who can use the client |
| 016 | [UI Reference: CG / Commonwealth](./016-ui-reference/) | STANDALONE | UI patterns and reference from the Commonwealth (CG) platform |
| 035 | [Notifications Complete Guide](./035-notifications-complete-guide/) | CANONICAL | Single source of truth for everything notification-related in ZAO OS |
| 041 | [Next.js 16 + React 19 Deep Dive](./041-nextjs16-react19-deep-dive/) | STANDALONE | Advanced patterns, new features, and optimization for ZAO OS's core framework |
| 092 | [Public APIs 2026 Update](./092-public-apis-2026-update/) | STANDALONE | Re-evaluate 1,436 public APIs against what ZAO OS has built |
| 093 | [Missing Infrastructure Gaps](./093-missing-infrastructure-gaps/) | STANDALONE | Testing, CI/CD, monitoring, design system, and PWA gap analysis |
| 098 | [Supabase Database Optimizations](./098-supabase-database-optimizations/) | STANDALONE | Realtime, materialized views, DB functions, RLS audit, Vault, triggers, pooling |
| 116 | [Discord Integration Research](./116-discord-integration-research/) | STANDALONE | Connecting ZAO OS with the Discord bot and Discord API |
| 118 | [Settings Page Redesign](./118-settings-page-redesign/) | STANDALONE | Reorganize settings to unify connections, platforms, and socials |
| 122 | [SongJam Screen Share PR](./122-songjam-screen-share-pr/) | STANDALONE | Adding screen sharing to SongJam's /spaces via Stream Video SDK |
| 129 | [Alchemy APIs Deep Integration](./129-alchemy-apis-deep-integration/) | STANDALONE | Maximize Alchemy free tier — webhooks, transfer history, budget analysis |
| 176 | [Supabase Scaling & Optimization](./176-supabase-scaling-optimization/) | STANDALONE | Realtime, pg_cron, pgvector, Edge Functions, Storage, indexing for 1,000+ members |
| 182 | [Home Screen Dashboard Design](./182-home-screen-dashboard-design/) | STANDALONE | Dashboard design replacing direct-to-chat flow with feature-surfacing home screen |
| 192 | [Multi-Platform Streaming (RTMP)](./192-multiplatform-streaming-rtmp/) | STANDALONE | Stream ZAO OS audio rooms to YouTube, Twitch, and others simultaneously |
| 215 | [OBS + Restream + StreamYard Feature Analysis](./215-obs-restream-streamyard-feature-analysis/) | STANDALONE | Comprehensive feature inventory mapped to what ZAO OS should build |
| 217 | [Audio/Video Quality Optimization](./217-av-quality-optimization-live-streaming/) | STANDALONE | Stream.io settings, adaptive bitrate, WebRTC vs RTMP, noise suppression, DJ audio |
| 218 | [Mobile App Strategy: PWA to Native](./218-mobile-app-strategy-pwa-native/) | STANDALONE | All viable paths for shipping ZAO OS as a mobile app |
| 221 | [Admin Dashboard Best Practices](./221-admin-dashboard-best-practices/) | STANDALONE | Missing admin features benchmarked against Guild.xyz, Coordinape, Collab.Land, Hats |
| 223 | [Smart Contract Development Guide](./223-smart-contract-development-guide/) | STANDALONE | Writing, testing, deploying, and verifying contracts on Base and Optimism |
| 233 | [Spaces & Streaming Full Audit](./233-spaces-streaming-full-audit/) | CANONICAL | Comprehensive audit of 43 components, 11 API routes, 2 audio providers, broadcast system |
| 275 | [Stream Video SDK Dashboard Configuration](./275-stream-video-sdk-dashboard-configuration/) | STANDALONE | Stream.io Video SDK dashboard setup and configuration reference |
| 286 | [Claude Cowork SEO Workflow & ZAO OS SEO Audit](./286-claude-cowork-seo-workflow/) | STANDALONE | @bloggersarvesh Cowork SEO workflow analysis, ZAO OS SEO audit (zero JSON-LD, 1-URL sitemap), music schema.org types, claude-seo skill, implementation plan |
| 319 | [Lightweight 3D Portal Hub](./319-lightweight-3d-portal-hub/) | STANDALONE | CSS 3D + model-viewer (0-180 KB) portal hub, 18+ domains as clickable doors, AI concierge routing, token-gated VIP, works on worst Androids, supersedes Doc 313's heavy R3F stack, 1-week build plan |
| 415 | [Composable OS-Style Architecture](./415-composable-os-architecture/) | CANONICAL | Three-layer OS architecture (Shell + Apps + Core), swappable layouts, Obsidian-inspired app manifest, dynamic imports, widget system, migration from portal to OS |
| 416 | [Native App: TestFlight + Play Store](./416-native-app-testflight-playstore/) | CANONICAL | Capacitor 8 wrapper, TestFlight (10K testers, $99/yr), Play Store internal (100 testers, $25), TWA, static export + API-first, $124 total, 2-3 week timeline |
| 417 | [Agent Tools Remote Access](./417-agent-tools-remote-access/) | CANONICAL | Cloudflare Tunnel + Workers basic auth for all agent dashboards (AO, ZOE, Pixels, Paperclip) accessible from any computer via zaoos.com subdomains |
| 428 | [Unified Agent Portal + ao.zaoos.com + Phone Claude Code](./428-unified-agent-portal-ao-phone-access/) | CANONICAL | Runbook: ao.zaoos.com (Mac tunnel) + claude.zaoos.com (ttyd+tmux on VPS) + portal.zaoos.com (8 tiles). One Cloudflare Worker basic auth (`zaal:qwerty1`, rotate 7 days). Resumes paused portal research. |
| 430 | [Portal Stack Improvements Plan](./430-portal-stack-improvements-plan/) | STANDALONE | What's shipped (doc 428 stack + test-checklist 15-min Telegram pings) + prioritized build list for 10 tracks: Telegram /done replies, session-start /worksession, Cloudflare Access, quick-spawn v2, PWA shortcuts + share target, mobile keyboard toolbar wrapper, observability panel. 7-day build order. |
| 431 | [Portal v2: Universal Nav + Version-Control + Backlog](./431-portal-universal-nav-v2-improvements/) | STANDALONE | Universal nav dock across *.zaoos.com (iframe wrapper path, no Caddy rebuild), `bettercallzaal/zao-portal-infra` repo to fix the "VPS-only config" gap, 12-item backlog (web push, voice input, cost tracker, scheduled spawns, session history, agent templates, offline PWA, backups). |
| 433 | [Portal v3: Todos Brain Dump + Universal Nav + infra/portal](./433-portal-todos-brain-dump-universal-nav/) | CANONICAL | Shipped universal nav dock, portal session history, templates, version-controlled `infra/portal/` repo path, portal.zaoos.com/todos brain-dump UI with filters (status/priority/tag/project/search), bulk-add + spawn-from-todo. 35 todos seeded from prior-session summary. Definitive routing: where to drop each input type. |
