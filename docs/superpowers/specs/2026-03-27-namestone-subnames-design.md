# NameStone ENS Subnames for ZAO Members

**Date:** 2026-03-27
**Status:** Approved
**Parent domain:** `thezao.eth` (already registered)
**Provider:** NameStone (gasless, free API)

## Goal

Give every ZAO member a human-readable on-chain identity like `zaal.thezao.eth` that resolves in all ENS-compatible wallets and dApps.

## Design

### Naming Rules

- Primary format: `username.thezao.eth` (lowercase, alphanumeric + hyphens)
- Conflict resolution: if username is taken, append ZID → `username-42.thezao.eth`
- Members can request name changes via settings; admin approves/denies
- Admin can create, revoke, and manage all subnames

### Components

| # | File | Purpose |
|---|------|---------|
| 1 | `src/lib/ens/namestone.ts` | NameStone API client (create, list, search, delete, update) |
| 2 | `scripts/add-zao-subname-columns.sql` | DB migration: `zao_subname` on users + `subname_requests` table |
| 3 | `/api/admin/ens-subnames/route.ts` | Admin: GET list, POST create/batch, DELETE revoke |
| 4 | `/api/admin/ens-subnames/requests/route.ts` | Admin: GET pending, PATCH approve/deny |
| 5 | `/api/ens/subname-request/route.ts` | Member: POST request name change |
| 6 | `src/components/admin/SubnameManager.tsx` | Admin UI: table of subnames + request queue |
| 7 | Update `ProfileDrawer.tsx` | Display subname prominently |
| 8 | Update `members/[username]/page.tsx` | Display subname in hero |
| 9 | Update `/api/members/[username]/route.ts` | Include `zaoSubname` in response |

### Database

**users table** — add column:
- `zao_subname` TEXT — e.g. `zaal.thezao.eth`

**subname_requests table** — new:
- `id` UUID PK
- `fid` INTEGER NOT NULL
- `current_name` TEXT
- `requested_name` TEXT NOT NULL
- `status` TEXT DEFAULT 'pending' (pending/approved/denied)
- `created_at` TIMESTAMPTZ DEFAULT now()
- `reviewed_at` TIMESTAMPTZ
- `reviewed_by` INTEGER (admin FID)

### NameStone API Client

Base URL: `https://namestone.xyz/api/public_v1`
Auth: `Authorization: YOUR_API_KEY` header

Endpoints used:
- `POST /set-name` — create subname with address + text records
- `GET /get-names?domain=thezao.eth` — list all subnames
- `GET /search-names?domain=thezao.eth&name=query` — search
- `POST /delete-name` — revoke subname

### Auto-Issue Flow

1. Member passes gate check (new user creation)
2. System calls NameStone `set-name` with username + wallet
3. If 409/conflict → retry with `username-{zid}`
4. Store resulting subname in `users.zao_subname`
5. Set text records: url (profile), avatar (PFP), description

### Text Records Per Subname

- `url` → `https://zaoos.com/members/{username}`
- `avatar` → member's PFP URL
- `description` → member's bio or "ZAO Member"

### Error Handling

- NameStone API down → log error, skip subname (member can trigger manually later)
- Duplicate name → auto-append ZID
- Invalid characters → Zod validation (lowercase a-z, 0-9, hyphens, 3-63 chars)
- Member banned → admin revokes via DELETE

### Manual Steps (User)

1. Get NameStone API key at namestone.com (free)
2. Enable thezao.eth in NameStone (admin panel or enable-domain API)
3. Add `NAMESTONE_API_KEY` to `.env.local` and Vercel
4. Run DB migration in Supabase
5. Test with `zaal.thezao.eth`

### Env Vars

- `NAMESTONE_API_KEY` — added to `src/lib/env.ts` as optional server-only var
