# Technical Infrastructure

> The stack that runs ZAO OS — Next.js, Supabase, storage, mobile, real-time, and performance.

[Back to Research Index](../README.md)

| # | Topic | Summary |
|---|-------|---------|
| [41](../041-nextjs16-react19-deep-dive/) | **Next.js 16 + React 19** | Turbopack, PPR, React Compiler, useOptimistic, "use cache", streaming SSR, Tailwind v4 |
| [42](../042-supabase-advanced-patterns/) | **Supabase Advanced** | Schema design, RLS, Realtime, Edge Functions, pgvector, pg_cron, migrations |
| [93](../176-supabase-scaling-optimization/) | **Supabase Scaling & Optimization** | Realtime primitives, pg_cron (7 jobs), pgvector, cost projections 100-1,000 members |
| [93](../093-missing-infrastructure-gaps/) | **Missing Infrastructure Gaps** | Testing strategy, CI/CD, error monitoring, design system, PWA support gaps |
| [98](../098-supabase-database-optimizations/) | **Supabase Database Optimizations** | Realtime notifications, materialized views, DB functions, RLS audit, Vault, triggers |
| [33](../033-infrastructure-mobile-storage/) | **Storage, Mobile & Privacy** | R2/IPFS/Arweave costs, PWA→Capacitor→React Native, Semaphore ZK proofs |
| [14](../014-project-structure/) | **Project Structure** | Single Next.js app, route groups, feature folders, GitHub Projects kanban |
| [16](../016-ui-reference/) | **UI Reference** | Discord-style dark theme, navy #0a1628 + gold #f5a623 |
| [213](../213-spaces-streaming-architecture-debug-guide/) | **Spaces & Streaming Architecture** | Full /spaces debug guide — Go Live flow, Stream.io + 100ms + Livepeer, RTMP multistream, SongJam patterns |
| [214](../214-twitch-api-deep-integration/) | **Twitch API Deep Integration** | Comprehensive Twitch Helix API feature map — 100+ endpoints, scopes, chat bridge, polls, clips, EventSub, DJ Program, priority matrix |
| [215](../215-obs-restream-streamyard-feature-analysis/) | **OBS + Restream + StreamYard Feature Analysis** | Complete feature inventory of all 3 platforms, 120+ OBS WebSocket requests, Restream API mapping, gap analysis, 13 buildable features for ZAO OS Spaces, overlay system + OBS bridge + chat aggregation |
| [216](../216-web3-streaming-features-tipping-gating-tickets/) | **Web3 Streaming Features: Tipping, Token Gates, NFT Tickets** | Wallet-to-wallet tipping (ETH/USDC/DEGEN), token-gated rooms (ERC-20/721/1155), NFT tickets via Unlock Protocol, implementation plan with file paths, security considerations |
| [217](../217-av-quality-optimization-live-streaming/) | **AV Quality Optimization** | Stream.io HiFi mode (stereo 128kbps Opus), adaptive bitrate (Simulcast/SVC/Dynascale), WebRTC vs RTMP, Krisp/RNNoise noise suppression, DJ system audio capture (getDisplayMedia), low-latency audio, 5-phase plan |
| [218](../218-mobile-app-strategy-pwa-native/) | **Mobile App Strategy: PWA to Native** | 6 approaches compared (PWA, Capacitor, React Native, Expo, Tauri, TWA). Capacitor recommended — zero rewrite, iOS background audio, App Store. Phased plan: PWA optimize now, Capacitor Q2, RN only if needed |
