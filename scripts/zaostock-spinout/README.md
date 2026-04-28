# ZAOstock spinout - prep folder

Everything needed to migrate ZAOstock from this monorepo to its own home at `zaostock.com`. Per the [Monorepo-as-Lab pattern](../../CLAUDE.md), the code in ZAOOS gets deleted *only after* the new repo is confirmed live + working for 48h.

## Files in here

| File | What |
|---|---|
| `inventory.md` | Full list of files, tables, env vars, and shared deps to copy |
| `migration-checklist.md` | 6-phase migration with safety gates between each |
| `row-counts.md` | Snapshot of current `stock_*` table sizes (for post-migration verification) |
| `export-schema.sh` | Script to dump current `stock_*` table schemas |

## Where we are

| Phase | Owner | Status |
|---|---|---|
| 1 - Infra setup | Zaal | **Pending** - need to create repo, Supabase project, Vercel project, point DNS |
| 2 - Code copy + path strip | Claude | Blocked on Phase 1 |
| 3 - DB migration | Claude + Zaal | Blocked on Phase 1 |
| 4 - Deploy + cutover | Claude + Zaal | Blocked on Phase 1-3 |
| 5 - Delete from ZAOOS | Claude | Blocked on Phase 4 + 48h |
| 6 - Bot migration | Later | Out of scope this week |

## What I&rsquo;m doing while waiting

1. Inventory complete (`inventory.md`)
2. Migration checklist with safety gates (`migration-checklist.md`)
3. Row count baseline captured (`row-counts.md`)
4. Schema export script ready (`export-schema.sh`)

When the repo URL exists, drop it in chat. I clone, scaffold, copy. ~1-2 hours to a working `zaostock.com` Phase-2 build.

## What you need to do

Phase 1 of `migration-checklist.md`. Six checkboxes. Once `zaostock.com` resolves to a Vercel hello-world page, ping me and I take over.
