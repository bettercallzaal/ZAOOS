# Project Structure & Organization

> How to structure ZAO OS for iterative development

## Decision: Single Next.js App (Not Monorepo)

**Why:** One person building. Monorepos solve multi-team coordination problems you don't have. Every successful indie Farcaster client started as a single app.

**When to reconsider:** If you later add a standalone Frames server, separate indexer, or shared component library.

---

## Recommended Directory Structure

```
zao-os/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Route group — gated pages
│   │   │   ├── chat/               # Channel chat UI
│   │   │   ├── feed/               # Music feed (Layer 6)
│   │   │   ├── profile/            # ZID profile page
│   │   │   ├── settings/           # User settings
│   │   │   └── layout.tsx          # Auth-required layout wrapper
│   │   ├── api/                    # API routes
│   │   │   ├── auth/               # SIWF verify, session management
│   │   │   ├── gate/               # Gate checks, invite redemption
│   │   │   ├── cast/               # Post casts, fetch feeds
│   │   │   ├── music/              # Music API proxying
│   │   │   ├── respect/            # Respect actions
│   │   │   └── zid/                # ZID CRUD
│   │   ├── invite/                 # Invite code entry page
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Landing / login
│   ├── components/
│   │   ├── ui/                     # Generic (buttons, cards, modals, inputs)
│   │   ├── chat/                   # Chat messages, thread view, input
│   │   ├── music/                  # Audio player, track card, player bar
│   │   ├── profile/                # ZID display, reputation badges
│   │   └── gate/                   # Login button, invite form
│   ├── lib/
│   │   ├── farcaster/              # Neynar SDK wrappers, hub client
│   │   ├── music/                  # Audius, Sound.xyz, Spotify clients
│   │   ├── gates/                  # Composable gate system
│   │   ├── respect/                # Respect token logic
│   │   ├── zid/                    # ZID schema, creation, queries
│   │   ├── auth/                   # Session management, SIWF helpers
│   │   └── db/                     # Prisma client, query helpers
│   ├── hooks/                      # React hooks (useAuth, useChat, usePlayer)
│   └── types/                      # TypeScript types
├── prisma/
│   └── schema.prisma               # Database schema
├── public/                          # Static assets
├── .env.local                       # API keys (gitignored)
├── next.config.js
├── tailwind.config.ts
├── package.json
└── tsconfig.json
```

---

## Task Management: GitHub Projects

**Why GitHub Projects:**
- Tasks live where your code lives — zero context switching
- Kanban view: `Ideas | Backlog | Up Next | Building | Done`
- Free for public repos
- Draft items for quick thoughts without full issues
- Issues auto-close when PRs merge

**Not recommended:** Jira (enterprise nightmare), Notion (too general), Linear (overkill for solo)

### Board Setup
- **Columns:** `Ideas | Backlog | Up Next | Building | Done`
- **Labels:** `mvp`, `music`, `identity`, `respect`, `gating`, `chat`, `onchain`, `research`
- **Custom fields:** `Layer` (MVP, 2-9 matching roadmap)

### Workflow
1. Pick top item from "Up Next" → move to "Building"
2. Build, commit, push
3. Move to "Done" (or close issue)
4. If new ideas come up → add to "Ideas" (don't context-switch)
5. Weekly: review "Ideas", promote best to "Backlog", move 2-3 to "Up Next"

---

## Key Patterns from Successful Farcaster Clients

| Client | Stack | Key Lesson |
|--------|-------|------------|
| **Supercast** | Next.js, solo dev | Shipped MVP with just a better feed, iterated from there |
| **Farcord** | Next.js, Neynar API | Discord-like channel UI for Farcaster — very close to our chat MVP |
| **Kiwi News** | Next.js, focused scope | HN-style Farcaster client — proves niche clients work |

**Common pattern:**
1. Single Next.js app
2. Neynar SDK as primary data layer (don't run your own hub)
3. Ship the core experience first, add features iteratively
4. PostgreSQL for app-specific data beyond Farcaster

---

## Environment Variables Needed (MVP)

```env
# Farcaster
NEYNAR_API_KEY=            # Neynar API key (free tier: 300 req/min)
NEXT_PUBLIC_SIWF_DOMAIN=   # Your domain for SIWF

# Database
DATABASE_URL=              # PostgreSQL connection string

# Session
SESSION_SECRET=            # For signing session cookies

# Optional (Phase 2+)
AUDIUS_APP_NAME=           # Audius API app name
SOUND_XYZ_API_KEY=         # Sound.xyz API key
ALCHEMY_API_KEY=           # For on-chain reads (NFT gates, Hats)
```

---

## Key Takeaways

- **Single app, not monorepo.** Extract later if needed.
- **Feature folders** under `lib/` and `components/` — easy to find things.
- **Route groups** `(auth)/` for gated pages — clean separation.
- **GitHub Projects kanban** for task tracking — simple, free, lives with code.
- **Ship the MVP (gate + chat) first.** Everything else layers on top.
