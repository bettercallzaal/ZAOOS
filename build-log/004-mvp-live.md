# Build Log 004 — MVP Live (v1.0.0)

**Date:** 2026-03-12

## What shipped

ZAO OS v1.0.0 is live at zaoos.com. Gated Farcaster chat client for the ZAO music community.

## Working features
- Sign In With Farcaster (SIWF via @farcaster/auth-kit)
- Allowlist gate — 40 members seeded from CSV, checked by FID + wallet address
- Chat room — reads /zao Farcaster channel feed, polls every 8 seconds
- Compose via Warpcast — type message, opens Warpcast compose with /zao channel pre-filled
- Admin panel at /admin — allowlist CRUD, CSV upload, hidden messages
- Not-allowed page — directs non-members to post in /zao and tag @zaal
- Mobile-first dark UI with ZAO branding (navy + gold)

## What's deferred
- Direct posting (requires managed signer — blocked by mnemonic/SIWN flow)
- Thread/reply view
- Real-time updates (currently polling, upgrade to Hub gRPC later)

## Technical notes
- SIWN (@neynar/react) was attempted but the package is archived (Dec 2024) and got stuck on "Give Access" step
- Custom popup flow to app.neynar.com also got stuck at same step
- Root cause likely: authorized origins config or Neynar plan limitations for signer sponsorship
- Pragmatic decision: ship with Warpcast compose deep link, add direct posting in v1.1

## Stack
- Next.js 16.1.6, TypeScript, Tailwind CSS v4
- @farcaster/auth-kit for SIWF
- Neynar API for channel feed
- Supabase (PostgreSQL) for allowlist + hidden messages
- iron-session for encrypted cookies
- Vercel for deployment
