# ZAO OS Master Roadmap — March 2026

> Reference document for implementation planning across sessions. Each sprint gets its own detailed plan when ready to execute.

**Source:** Cross-referenced from 55 research documents + full codebase audit (March 17, 2026)

---

## Current State Summary

### Built & Working
- Farcaster chat (3 channels, cross-posting, scheduling, mentions)
- XMTP encrypted DMs + group chats
- Music players (6 platforms), queue, radio, song submission
- Governance proposals, voting, comments (respect-weighted)
- Respect leaderboard (on-chain Optimism queries)
- Social graph (followers/following with sorting)
- Admin panel (users, ZID assignment, allowlist, CSV import, moderation)
- Notification system (bell, dropdown, realtime, mark read)
- Push notifications (Farcaster Mini App)
- Auth (SIWF + wallet signature)

### Scaffolded / Partial
- ZID system (admin tool works, not on user-facing profiles beyond ProfileCard)
- Settings page (profile display, missing preferences)
- Tools page (2/4 built, AI Agent + Taste Profile are stubs)
- Notification triggers (not all actions create notifications)

### Not Built
- Gamification (streaks, badges, tiers)
- Music approval/curation queue
- AI agent
- Hats Protocol integration
- Safe treasury
- Cross-platform publishing (beyond Farcaster channels)
- Analytics
- Full-text search
- Automated moderation

---

## Sprint Roadmap

### Sprint 1 — Quick Wins (1-2 days)
**Plan:** `docs/superpowers/plans/2026-03-17-sprint-1-quick-wins.md`
1. PostHog analytics (~10 lines)
2. ZID badge in ProfileDrawer
3. Missing notification triggers (votes, comments, member joins)

### Sprint 2 — Respect Activation (keystone feature)
**Dependencies:** None
**Estimated effort:** 1-2 weeks

- Off-chain Respect ledger in PostgreSQL (sync from on-chain balances)
- Connect Respect balances to governance vote weight
- Tier system: Newcomer (0) → Member (100) → Curator (500) → Elder (2000) → Legend (10000)
- Tier badges displayed on profiles and in chat
- 2% weekly decay mechanism (off-chain first)

**Why this is the keystone:** Hats roles, gamification, referral rewards, curation rewards, and incubator proposals ALL depend on Respect being active in the app.

### Sprint 3 — Engagement & Retention
**Dependencies:** Sprint 2 (Respect must be live for rewards)
**Estimated effort:** 1-2 weeks

- Engagement streaks: daily activity tracking, flame icon, bonus Respect (7-day = 5, 30-day = 25, 1 freeze/week)
- OG Badge: permanent badge for founding 40, never mintable again
- Track of the Day: community-curated daily highlight, curator + artist earn Respect
- Progress bar: "3 posts to Curator status"

### Sprint 4 — Moderation & Search
**Dependencies:** Sprint 2 (Respect for weighted flagging)
**Estimated effort:** 1-2 weeks

- Basic moderation: Neynar score filtering (<0.3 auto-flag), community report button, 3 flags auto-hides
- Moderator review queue (Respect-weighted flagging)
- Supabase full-text search (tsvector/tsquery + GIN index)
- Music approval queue: add pending/approved status to song submissions, admin/curator review

### Sprint 5 — Hats & Treasury (Q3 2026)
**Dependencies:** Sprint 2 (Respect must be live for eligibility modules)
**Estimated effort:** 2-3 weeks

- Deploy hat tree on Optimism via Hats Anchor App (app.hatsprotocol.xyz)
  - Top Hat → Safe multisig
  - Council (top Respect earners), Curator, Artist, Moderator, Developer
  - ERC-20 eligibility for $ZAO OG Respect
  - ERC-1155 eligibility for $ZOR
- Create 3-of-5 Safe multisig on Optimism
- Attach Hats Signer Gate v2 (role-controlled treasury signing)
- Enable self-service claiming via claim.hatsprotocol.xyz
- Evaluate Decent DAO as potential all-in-one alternative
- Connect Guild.xyz or Collab.Land for channel gating by hat ownership
- Query hat ownership from ZAO OS via subgraph for UI permissions

### Sprint 6 — AI Agent (Q4 2026)
**Dependencies:** XMTP (built), Neynar webhooks (built), Respect (Sprint 2)
**Estimated effort:** 3-4 weeks

- Separate `zao-agent` repo using ElizaOS framework
- Dedicated agent Farcaster account with managed signer
- Dedicated agent wallet for XMTP signing
- Deploy to Railway (~$5-10/mo)
- Phase 1: Welcome DMs to new members, FAQ responses, community announcements
- Phase 2: Music taste memory (pgvector), personalized recommendations
- Phase 3: Curation scoring, social taste matching

### Sprint 7 — Distribution (2027)
**Dependencies:** Core platform stable
**Estimated effort:** Ongoing

- Cross-platform publishing: Lens (SDK), Bluesky (@atproto/api), Nostr (NDK), Hive (@hiveio/dhive)
- Ayrshare integration for X/Twitter, Mastodon, Threads ($49-99/mo)
- WaveWarZ on Farcaster as a Mini App
- Sync licensing collective: pre-cleared community catalog for indie sync agencies
- ZAO Stock as flagship recurring annual festival

---

## Key Research References

| Sprint | Key Docs |
|--------|----------|
| Sprint 2 (Respect) | Doc 4 (Respect Tokens), Doc 50 (Complete Guide §8) |
| Sprint 3 (Engagement) | Doc 32 (Onboarding/Growth), Doc 50 (§21 Future Dev) |
| Sprint 4 (Moderation) | Doc 32 (Moderation section), Doc 40 (Audit Guide) |
| Sprint 5 (Hats) | Doc 7 (Hats Protocol), Doc 55 (Anchor App), Doc 31 (Governance) |
| Sprint 6 (AI Agent) | Doc 24 (AI Agent Plan), Doc 26 (Hindsight Memory), Doc 8 (AI Memory) |
| Sprint 7 (Distribution) | Doc 28 (Cross-Platform), Doc 36 (Lens), Doc 37 (Bridges) |

---

## Decision Points

These need user input before planning can proceed:

1. **Decent DAO vs custom Hats stack** — Decent DAO bundles Hats + Safe + fractal subDAOs. Faster but less flexible. Decide before Sprint 5.
2. **ElizaOS vs custom agent** — ElizaOS has ecosystem support but adds dependency. Custom agent is more work but fully controlled. Decide before Sprint 6.
3. **Ayrshare vs custom cross-posting** — $49-99/mo but handles X/Twitter OAuth complexity. Custom is free but more maintenance. Decide before Sprint 7.
4. **Off-chain vs on-chain Respect** — Sprint 2 starts off-chain (PostgreSQL). When to migrate to on-chain attestations (EAS)? Can defer.
5. **Privy integration** — Adding email/Google/Apple login alongside SIWF for non-crypto users. When to prioritize? Research says immediate but depends on growth goals.
