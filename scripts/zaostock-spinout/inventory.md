# ZAOstock spinout - inventory

> Source of truth for what moves to `zaostock` repo. Cross off as confirmed working in the new repo. **Nothing gets deleted from ZAOOS until cutover (Phase 4) is verified live.**

## Files to copy

### App routes (`src/app/stock/**` -> new repo `src/app/**`, drop the `/stock/` prefix)

```
src/app/stock/page.tsx                           -> src/app/page.tsx
src/app/stock/PublicTeamGrid.tsx                 -> src/app/PublicTeamGrid.tsx
src/app/stock/RSVPForm.tsx                       -> src/app/RSVPForm.tsx
src/app/stock/apply/                             -> src/app/apply/
src/app/stock/artist/[slug]/                     -> src/app/artist/[slug]/
src/app/stock/circles/                           -> src/app/circles/
src/app/stock/cypher/                            -> src/app/cypher/
src/app/stock/onepagers/                         -> src/app/onepagers/
src/app/stock/program/                           -> src/app/program/
src/app/stock/sponsor/                           -> src/app/sponsor/
src/app/stock/suggest/                           -> src/app/suggest/
src/app/stock/team/                              -> src/app/team/
src/app/stock/llms.txt/                          -> src/app/llms.txt/
```

### API routes (`src/app/api/stock/**` -> `src/app/api/**`)

24 routes total - all under `src/app/api/stock/` move to `src/app/api/` in the new repo.

### Lib (`src/lib/stock/**` -> `src/lib/**`)

```
src/lib/stock/artists.ts        -> src/lib/artists.ts
src/lib/stock/log-activity.ts   -> src/lib/log-activity.ts
src/lib/stock/members.ts        -> src/lib/members.ts
src/lib/stock/onepagers.ts      -> src/lib/onepagers.ts
```

### Auth

```
src/lib/auth/stock-team-session.ts   -> src/lib/auth/session.ts (rename)
```

## Shared infra to inline (clone, no deps)

These are the only things ZAOstock pulls from non-stock paths in ZAOOS. Per the Monorepo-as-Lab rule (no shared libs between repos), each of these gets copied into the new repo:

```
@/components/events/CountdownTimer  -> src/components/CountdownTimer.tsx
@/lib/env                           -> src/lib/env.ts (trim to only zaostock vars)
@/lib/db/supabase                   -> src/lib/db/supabase.ts
@/lib/logger                        -> src/lib/logger.ts
```

## Database tables to migrate

18 tables. All `stock_*`. Schema export at `schema-export.sql`, data export plan in `migration-checklist.md`.

```
stock_activity_log
stock_artists
stock_attachments
stock_budget_entries
stock_circle_members
stock_circles
stock_comments
stock_contact_log
stock_goals
stock_meeting_notes
stock_onepager_activity
stock_onepagers
stock_sponsors
stock_suggestions
stock_team_members
stock_timeline
stock_todos
stock_volunteers
```

In the new Supabase project, drop the `stock_` prefix on all tables (since the whole DB is ZAOstock):

```
stock_activity_log    -> activity_log
stock_artists         -> artists
... etc
```

This requires updating every `from('stock_xxx')` call in the migrated code. ~150 call sites. Mechanical find-replace.

## Bot (`bot/`)

**Stays in ZAOOS for now.** Phase 5 migration. The bot's only DB connection is Supabase URL + service role key, so we just point its `.env` at the new ZAOstock Supabase project once Phase 3 lands. Code stays put until we&rsquo;re ready to move it.

## Scripts

```
scripts/stock-add-stilo-eve-bacon-eduard.ts
scripts/stock-missing-tables-migration.sql
scripts/stock-team-skills-feed-migration.sql
scripts/stock-team-status-text-migration.sql
scripts/stock-team-tuesday-apr28-agenda.sql
scripts/stock-archive/                         (full archive folder)
```

These move to `scripts/` in the new repo, dropping the `stock-` prefix where it doesn&rsquo;t add clarity.

## Env vars needed in new repo

```
NEXT_PUBLIC_SUPABASE_URL          # NEW - point at zaostock supabase project
NEXT_PUBLIC_SUPABASE_ANON_KEY     # NEW
SUPABASE_SERVICE_ROLE_KEY         # NEW
SESSION_SECRET                     # NEW (regenerate, do not reuse)
NEXT_PUBLIC_APP_URL               # https://zaostock.com
```

The bot stays on the OLD ZAOOS env file until Phase 5, but its Supabase URL gets repointed to the NEW project after Phase 3.

## Public profile pic / image hosts

ZAOstock uses external image URLs (X profile images, postimages.org, etc). No image storage to migrate. **Photo URL pattern stays the same.**

## What does NOT move

- `research/` - stays in ZAOOS forever (institutional memory across all products)
- `community.config.ts` - ZAOOS-specific, doesn&rsquo;t apply to zaostock
- The Farcaster client routes (`src/app/(auth)`, `src/app/(public)`, etc) - ZAOOS-only
- Agent stack (`src/lib/agents/`, ZOE, Hermes) - stays in lab
- The bot (`bot/`) - stays for now, Phase 5 migration

## Audit when migration is &ldquo;done&rdquo;

Before deleting from ZAOOS, every one of these must be true on `zaostock.com`:

- [ ] Login flow works (4-letter codes from old DB still valid)
- [ ] Bio editor saves to NEW Supabase
- [ ] Public profile (`/team/m/<slug>`) renders for at least 5 known members
- [ ] Team directory loads with all members + scope filter works
- [ ] Activity feed pulls from NEW Supabase
- [ ] Onboarding checklist shows correct state
- [ ] All 24 API routes return 200
- [ ] Onepagers (overview + roddy + circle-checklists) render
- [ ] Telegram bot can read + write to the NEW Supabase project
- [ ] Email/social links from teammate profiles still resolve
- [ ] No 404s when crawling the site

Only after that 11-item checklist, run the deletion:

```
rm -rf src/app/stock src/app/api/stock src/lib/stock src/lib/auth/stock-team-session.ts
```

Plus add the redirect middleware (see `migration-checklist.md` Phase 4).
