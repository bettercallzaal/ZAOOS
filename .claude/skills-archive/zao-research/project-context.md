# ZAO OS Project Context

## What ZAO OS Is

ZAO OS is not a single application. It is the broader software infrastructure ecosystem supporting the ZAO — an impact organization focused on bringing the profit margin, the data, and the IP rights back to independent artists.

The Farcaster client (this repo) is one interface within the ZAO OS ecosystem. It is currently under active development and private testing.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) + React 19.2.3 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 |
| Auth | Sign In With Farcaster (SIWF) + SIWE (wallet) + iron-session 8 |
| Social | Neynar API (Farcaster) + XMTP Browser SDK v7 |
| Mini App | @farcaster/miniapp-sdk + Quick Auth |
| Database | Supabase (PostgreSQL + Realtime + RLS) |
| Validation | Zod 4 |
| Data Fetching | TanStack React Query v5 |
| Music | Audius API, Spotify/SoundCloud/YouTube/Apple Music/Tidal/Bandcamp embeds |
| Blockchain | Wagmi + Viem (Optimism, Base) |
| Wallet | RainbowKit |
| Deployment | Vercel |
| License | MIT |

## What's Built (as of March 2026)

| Feature | Status | Key Files |
|---------|--------|-----------|
| Chat (Farcaster channels) | Built | `src/components/chat/`, `src/app/api/chat/` |
| XMTP encrypted DMs | Built | `src/components/messages/`, `src/contexts/XMTPContext.tsx` |
| Music (6 platforms) | Built | `src/components/music/`, `src/app/api/music/` |
| Governance (proposals/voting) | Built | `src/app/(auth)/governance/`, `src/app/api/proposals/` |
| Respect leaderboard | Built | `src/lib/respect/leaderboard.ts`, `src/app/(auth)/respect/` |
| Social graph | Built | `src/components/social/` |
| Admin panel | Built | `src/app/(auth)/admin/` |
| Auth (SIWF + SIWE) | Built | `src/lib/auth/session.ts`, `src/app/api/auth/` |
| Notifications | Built | `src/lib/notifications.ts`, `src/components/navigation/NotificationBell.tsx` |
| ZID assignment (admin) | Built | `src/components/admin/ZidManager.tsx` |
| Gamification | Not built | — |
| AI agent | Not built | — |
| Hats Protocol | Not built | — |
| Cross-platform publishing | Built (Farcaster + Bluesky + X) | `src/lib/publish/` |
| Snapshot weekly polls | Built | `src/lib/snapshot/`, `src/components/governance/CreateWeeklyPoll.tsx` |
| ZOUNZ on-chain proposals | Built | `src/components/zounz/ZounzProposals.tsx`, `src/lib/zounz/` |

## On-Chain Infrastructure

| Contract | Chain | Address | Status |
|----------|-------|---------|--------|
| OG Respect (ERC-20) | Optimism | `0x34cE89baA7E4a4B00E17F7E4C0cb97105C216957` | Frozen (legacy) |
| ZOR Respect1155 | Optimism | `0x9885CCeEf7E8371Bf8d6f2413723D25917E7445c` | Active (OREC minting) |
| OREC governance | Optimism | `0xcB05F9254765CA521F7698e61E0A6CA6456Be532` | Active (167 txns) |
| $ZABAL | Base | `0xbB48f19B0494Ff7C1fE5Dc2032aeEE14312f0b07` | Active (Clanker) |
| WaveWarZ | Solana | `9TUfEHvk5fN5vogtQyrefgNqzKy2Bqb4nWVhSFUg2fYo` | Active |

## Respect System (ACTUAL — NOT research doc aspirational)

- **Scoring:** Doubled Fibonacci (10, 16, 26, 42, 68, 110) per breakout group of 6
- **No decay.** Respect accumulates permanently.
- **No tiers.** Raw Respect balance only.
- **Distribution:** Via OREC governance contract on Optimism
- **ZAO ornode:** Running at `zao-ornode.frapps.xyz`

## Key Architecture Decisions

- Single Next.js app — extract services later per `research/14`
- Farcaster channel as public chat, XMTP for private encrypted DMs — per `research/13`
- Neynar webhooks (not polling) for real-time casts
- Allowlist gating for MVP
- XMTP uses app-generated burner keys, never personal wallet keys — per `SECURITY.md`
- Mobile-first design, desktop as enhancement
- Wallet required to login (no Privy/email auth)
- ElizaOS chosen for future AI agent
- pgvector in Supabase chosen for agent memory
- Custom cross-platform publishing (no Ayrshare)

## Community

- 100+ active community members
- 40 founding members
- App FID: 19640
- Domain: zaoos.com
- Primary channel: /zao on Farcaster
- Builder: @bettercallzaal

## Important Rules

- Always say "Farcaster" not "Warpcast"
- Never ask for personal wallet keys
- Mobile-first design
- Document every step for build-in-public
- Research docs may contain aspirational designs — always check the code for reality
