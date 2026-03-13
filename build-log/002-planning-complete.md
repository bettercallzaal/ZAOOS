# Build Log 002 — Planning Phase Complete

**Date:** 2026-03-12

## What We Did

Locked down every decision needed to start building. Asked the hard questions, got clear answers, and documented everything.

### Questions Answered
- **Signer flow:** Neynar managed signers (no Ed25519 key management)
- **Bidirectional chat:** Yes — ZAO OS messages show on Farcaster, Farcaster messages show in ZAO OS
- **Non-Farcaster users:** Neynar FID registration (create Farcaster account in-app)
- **Allowlist:** 40 members, CSV with names + wallet addresses
- **Private keys:** NEVER use personal wallet keys. Generate dedicated app signing wallet.
- **Admin panel:** Yes, in MVP. Manage allowlist + hide messages.
- **Mobile-first:** Everything designed for phones first, enhanced for desktop
- **Build in public:** Git commits + narrative entries in build-log/ folder

### Infrastructure Set Up
- Supabase project: Created
- Neynar API key: Available
- Vercel: Connected to GitHub repo
- App FID: 19640
- Domain: zaoos.com
- Allowlist CSV: 40 ZAO community members

### Security Decision
The app needs a wallet to sign EIP-712 requests for Neynar managed signers. Rather than using a personal wallet (security risk), we'll auto-generate a fresh keypair at project init. Private key goes in .env.local (gitignored) with an encrypted backup file.

### What's Next
Initialize the Next.js project and start writing code. The MVP spec is locked at research/15-mvp-spec/README.md with:
- Every page defined
- Every API route listed
- Database schema ready
- File structure mapped
- UI layout sketched
- Brand colors set

### Project Stats
- 17 research folders
- 21 markdown documents
- 7 memory entries
- 40 community members ready to onboard
- 0 lines of application code (yet)

Time to build.

---

*Building ZAO OS in public. Follow the journey.*
