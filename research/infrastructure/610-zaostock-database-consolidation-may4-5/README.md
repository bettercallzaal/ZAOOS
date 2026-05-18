---
topic: infrastructure
type: incident-postmortem
status: research-complete
last-validated: 2026-05-05
related-docs: 502, 547, 564, 609
tier: DEEP
---

# 610 - ZAOstock Database Consolidation: Two Supabase Projects to One (May 4-5 2026)

> **Goal:** Document the foundational database architecture for ZAOstock, the May 4-5 consolidation from two parallel Supabase projects into one, and the design decisions (active-flag gate, partner concept, /charter command) that emerged from the work.

## Key Decisions

| # | Decision | Rationale | Status |
|---|----------|-----------|--------|
| 1 | **ZAO STOCK Supabase project (`yjrlaxpjusmrfylumban`) is canonical** for ZAOstock data going forward | Website + dashboard already point here; bot was on the wrong project | LOCKED 2026-05-04 |
| 2 | Bot tables get **unprefixed** (`stock_circles` -> `circles` etc) | Removes physical schema collision with website tables that share intent | LOCKED 2026-05-05 |
| 3 | Old bot project (`efsxtoxvigqowjhgcbiz`) keeps `agent_events` only (zoe-dashboard); drop all `stock_*` tables after verification window | Single non-bot consumer (zoe.zaoos.com) reads `agent_events`, all other tables stale | PENDING (drop SQL ready) |
| 4 | **5 broken bot commands removed**: `/propose`, `/object`, `/consent`, `/buddy`, `/respect` | Backing tables never existed in either DB; commands would crash on use | SHIPPED 2026-05-05 |
| 5 | **`/charter` command added** to bot | Posts circle responsibility into the right Telegram topic and pins it; auto-detects slug from topic name | SHIPPED 2026-05-05 (deploy pending env swap) |
| 6 | **`active=false` is an intentional hard lock**, not a display gate | Filters both `/api/team/login` AND bot `auth.ts` lookups; only Zaal flips manually after profile complete | CONFIRMED 2026-05-05 |
| 7 | New track value `partner` added to `sponsors` table CHECK | Distinguishes time-donating partners (Web3Metal) from money-paying sponsors | SHIPPED 2026-05-05 |
| 8 | Supabase MCP server installed at project scope | Removes the need to paste service-role keys per-session | SHIPPED 2026-05-05 |

## Context: How We Ended Up With Two Projects

ZAOstock was originally one of several apps inside the ZAO OS monorepo (`/Users/zaalpanthaki/Documents/ZAO OS V1/`). The Telegram bot at `bot/` shipped against a Supabase project shared with the rest of ZAO OS workloads (`efsxtoxvigqowjhgcbiz` - hosts `agent_events` for `zoe-dashboard` at zoe.zaoos.com). To avoid colliding with other ZAO-OS-side tables, every ZAOstock table on that project was prefixed `stock_*`.

When ZAOstock spun out to `zaostock.com` (per [doc 609](../../events/609-zaostock-cobuild-six-circles-may4/) Decision #1), it got its own Supabase project (`yjrlaxpjusmrfylumban`) for the website. The website used unprefixed names (`circles`, `team_members`, etc.) since this project was ZAOstock-only. Initial seed: a `pg_dump` from the old project was restored into the new one, with prefixes stripped.

**Result:** two parallel installations of the same logical schema. Website wrote to ZAO STOCK. Bot wrote to ZAO OS. They drifted independently.

## The Two-Project State (Pre-Consolidation)

Audited 2026-05-04 22:00 EST via REST + service-role key on each project. Row counts on the 14 collision tables:

| Table | ZAO OS (`stock_*`) | ZAO STOCK (unprefixed) | Drift |
|---|---|---|---|
| team_members | 27 | 27 | 0 (names identical) |
| circles | 8 | 8 | slug-set differs (see below) |
| circle_members | 29 | 28 | +1 ZAO OS (livestream had 2, ZAO STOCK had merch=1) |
| artists | 9 | 9 | 0 |
| sponsors | 18 | 18 | 0 |
| onepagers | 3 | 3 | 0 |
| onepager_activity | 6 | 6 | 0 |
| todos | 21 | 21 | counts match, **statuses diverged**: ZAO OS had 9 done / 7 todo / 5 in_progress; ZAO STOCK had 2 done / 18 todo / 1 in_progress |
| timeline | 60 | 60 | 0 (all 60 still `pending` - no one ever marks done) |
| meeting_notes | 4 | 4 | 0 |
| activity_log | 2 | 2 | 0 |
| contact_log | 1 | 1 | 0 |
| volunteers | 0 | 0 | 0 |
| suggestions | 0 | 0 | 0 |
| bot_chats | 5 | 3 | +2 ZAO OS (private DMs added since seed) |

**Slug divergence on `circles`:**
- ZAO OS had: `finance, host, livestream, marketing, media, music, ops, partners`
- ZAO STOCK had: `finance, host, marketing, media, **merch**, music, ops, partners`
- Bot's `livestream` (added later via TG `/join`) never made it to website. Website's `merch` (seeded earlier) never made it to bot.

**Bot DB also had 5 phantom tables in CODE that never existed in either DB:**
`stock_proposals`, `stock_proposal_objections`, `stock_qa_log`, `stock_respect_events`, `stock_buddy_pairings`. Spec [doc 502](../../governance/502-zaostock-circles-v1-spec/) defined consent-based governance; the SQL migration was never applied. Anyone running `/propose`, `/object`, `/consent`, `/buddy`, or `/respect` on the live bot would hit a Postgres "relation does not exist" error.

## ZAO STOCK Schema Map (Post-Consolidation, 22 Tables)

Verified via `mcp__supabase__list_tables` 2026-05-05 morning EST.

| Table | Bot? | Website? | Row Count | Notes |
|---|---|---|---|---|
| **team_members** | yes | yes | 27 | 8 active, 19 inactive (profile gate) |
| **circles** | yes | yes | **6** | post-consolidation: finance, host, livestream, marketing, music, ops |
| **circle_members** | yes | yes | 29 | livestream now 2 (Zaal + Thy Revolution) |
| artists | yes | yes | 9 | wishlist + confirmed |
| sponsors | yes | yes | 19 | 16 lead, 2 ecosystem committed, 1 partner committed (new track) |
| onepagers | yes | yes | 3 | sponsor / partner / venue briefs |
| onepager_activity | yes | yes | 6 | activity log per onepager |
| todos | yes | yes | 21 | bot reads/writes via `/do` and `/mytodos` |
| timeline | yes | yes | 60 | all status=pending; bot reads but no easy "mark done" UX |
| meeting_notes | yes | yes | 4 | bot writes via `/note` |
| activity_log | yes | yes | 2 | bot logs writes here |
| contact_log | yes | yes | 1 | bot writes via `/do` for contact attempts |
| volunteers | yes | yes | 0 | empty - reflects 27/27 rate of empty volunteer column |
| suggestions | yes | yes | 0 | bot writes via `/zsfb` |
| bot_chats | yes | website-only-display | 6 | TG chat registry; bot writes on first message |
| bot_topics | website-only | yes | 0 | per-topic seed for forum mode |
| bot_noteworthy | website-only | yes | 0 | flagged messages; future feature |
| budget | website-only | yes | 0 | empty; future feature |
| budget_entries | website-only | yes | 15 | early budget data, website-managed |
| goals | website-only | yes | 8 | OKR-style team goals, website-managed |
| milestones | website-only | yes | 0 | empty; future feature |
| rsvps | website-only | yes | 0 | event RSVP system, future feature |

## What We Executed

### Migration SQL (one transaction on ZAO STOCK)

Ran via Supabase SQL Editor 2026-05-04 evening. All 5 verify SELECTs returned expected counts.

```sql
BEGIN;
-- 1. Add livestream circle (Zaal as initial coordinator)
INSERT INTO circles (slug, name, description, coordinator_member_id)
SELECT 'livestream', 'Livestream', '<full-sentence description>',
       (SELECT id FROM team_members WHERE name = 'Zaal' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM circles WHERE slug = 'livestream');

-- 2. Add Zaal + Shawn to livestream
INSERT INTO circle_members (circle_id, member_id)
SELECT (SELECT id FROM circles WHERE slug='livestream'), tm.id
FROM team_members tm WHERE tm.name IN ('Zaal','Shawn')
  AND NOT EXISTS (SELECT 1 FROM circle_members WHERE ...);

-- 3-4. Drop dead-circle memberships, then dead circles
DELETE FROM circle_members WHERE circle_id IN (SELECT id FROM circles WHERE slug IN ('media','merch','partners'));
DELETE FROM circles WHERE slug IN ('media','merch','partners');

-- 5. Rewrite descriptions for the 6 final circles (full-sentence "responsible for" form)
UPDATE circles SET description = '...' WHERE slug = 'finance';
-- ... 5 more UPDATE statements

-- 6. Port 3 missing bot_chats rows (private DMs added since seed)
INSERT INTO bot_chats (...) VALUES (...) ON CONFLICT (chat_id) DO NOTHING;
COMMIT;
```

Followed up 2026-05-05 morning with role-update transaction:

```sql
BEGIN;
UPDATE team_members SET active=true, scope='livestream', role='lead' WHERE name='Thy Revolution';
DELETE FROM circle_members WHERE circle_id=(livestream) AND member_id=(Shawn);
INSERT INTO circle_members SELECT (livestream), (Thy Revolution) ON CONFLICT DO NOTHING;
UPDATE circles SET coordinator_member_id=(Thy Revolution) WHERE slug='livestream';
INSERT INTO sponsors (name, track, status, contact_name, why_them, notes)
  SELECT 'Web3Metal', 'partner', 'committed', 'Shawn', '...', '...'
  WHERE NOT EXISTS (SELECT 1 FROM sponsors WHERE name='Web3Metal');
COMMIT;
```

Plus the `partner` track required a CHECK extension applied via `apply_migration`:

```sql
ALTER TABLE sponsors DROP CONSTRAINT IF EXISTS sponsors_track_check;
ALTER TABLE sponsors ADD CONSTRAINT sponsors_track_check
  CHECK (track = ANY (ARRAY['local'::text, 'virtual'::text, 'ecosystem'::text, 'partner'::text]));
```

### Bot Code Refactor

Files touched in `/Users/zaalpanthaki/Documents/ZAO OS V1/bot/src/`:

| File | Change |
|---|---|
| `circles.ts` | CIRCLE_SLUGS const fixed to 6 real slugs; 5 broken commands deleted (cmdPropose / cmdProposals / cmdObject / cmdConsent / cmdBuddy / cmdRespect, lines 330-667 of pre-edit version); new `cmdCharter` function added (~76 lines) |
| `index.ts` | Imports + bot.command bindings for 6 stale commands removed; `/charter` wired up |
| `auth.ts` | Initial pass removed `.neq('active', false)` from finder fns - **REVERTED 2026-05-05** after Zaal confirmed active is intentional hard lock (see Section: Active Flag Design) |
| `actions.ts`, `activity.ts`, `auth.ts`, `capture.ts`, `digest.ts`, `group.ts`, `onepagers.ts`, `regen.ts`, `status.ts`, `zsfb.ts` | Mass rename: every `from('stock_*')` -> `from('*')` via sed; embedded select refs `owner:stock_team_members!owner_id(name)` also renamed |

20 distinct `stock_*` table refs across 13 files reduced to 0 (excluding 2 harmless string labels in `regen.ts` and `hermes/critic.ts` comments). `npx tsc --noEmit` clean after edits.

### `/charter` Command Spec

Run inside any forum topic in ZAO Festivals (`-1003960864140`):

```
/charter           -> auto-detects slug from topic name
/charter <slug>    -> explicit
```

Bot:
1. Reads description from `circles` table for matched slug
2. Posts as Markdown into current `message_thread_id`
3. `pinChatMessage` with `disable_notification: true`
4. Replies to admin "Posted + pinned charter for X"
5. Falls back gracefully if Pin permission missing

Replaces the previously-planned manual copy-paste of 6 descriptions per [doc 609 Action Bridge row 1](../../events/609-zaostock-cobuild-six-circles-may4/#action-bridge).

## Active Flag Design (Important)

`active` on `team_members` is **NOT a display gate** - it's a hard lockout that blocks both website login and bot auth.

**Where it gates:**

```typescript
// /api/team/login/route.ts:35
.from('team_members').select(...).neq('active', false)  // login blocked

// bot/src/auth.ts:24, 37 (post-revert)
.from('team_members').select(...).eq('telegram_id', X).neq('active', false)  // bot auth blocked
.from('team_members').select(...).eq('telegram_username', n).neq('active', false)
```

**Where it auto-flips:** nowhere. `/api/team/profile/route.ts` (PATCH bio/links/photo) does NOT touch `active`. `cmdRegenSelf` writes `active: true` on regen, but reaching `cmdRegenSelf` requires `findMember*` to succeed, which requires `active = true` first. **Chicken-and-egg.**

**Design intent (per Zaal 2026-05-05):** active flips manually when a member's profile is complete (bio + scope + photo). This is a Zaal-controlled approval gate. 19 of 27 members are currently locked out.

**Currently active (8):** Bacon, Cheeka, DCoop, Eduard, Iman Afrikah, Shawn, Tom Fellenz, Zaal.
**Currently inactive (19):** Adam, AttaBotty, Candy, Craig G, DaNici, DFresh, Eve, FailOften, GeekMyth, Hurric4n3Ike, Jake, Jango, Maceo, Ohnahji B (just promoted), Stilo World, Swarthy Hatter, Thy Revolution (just promoted), Tyler Stambaugh, ZAOstock Bot.

**Implication:** the 17 inactive members can't be reached by the bot at all, and can't log in to fill out the bio that would unlock them. Zaal's manual flip is the only path.

**This caused the Ohnahji B issue.** Ohnahji tried `/regen` in TG, bot returned "Not on the roster yet. Ping Zaal to link your account." because the active filter rejected him. Resolution: manual SQL hash-write + flip to active (see `Ohnahji B Resolution` below).

## Ohnahji B Resolution (Worked Example)

**Symptom:** Ohnahji B reported `/regen` not working.

**Investigation:**
- Bot `auth.ts:resolveMember` cascades: `findMemberByTelegramId` -> `findMemberByUsername` -> null
- Both finders filter `.neq('active', false)`
- `team_members` row for Ohnahji B: `active=false`, `telegram_id=null`, `telegram_username='ohnahjib'`
- Bot returned null -> `requireMember` replied "Not on the roster yet"
- Compounding: even if found, the OLD bot was writing the regen hash to the OLD project (`efsxt`), but the website reads ZAO STOCK. So the new code wouldn't have worked at login anyway.

**Fix (2026-05-05):**
1. Generated 4-letter code `KHVZ` locally with the same scrypt params as `bot/src/regen.ts:hashPassword`:
   ```js
   const salt = randomBytes(16).toString('hex');
   const hash = scryptSync('KHVZ', salt, 64).toString('hex');
   // password_hash = `${salt}:${hash}` (161 chars total)
   ```
2. Direct SQL via MCP:
   ```sql
   UPDATE team_members
   SET password_hash = 'd56b8a88...:7bd07f17...', active = true
   WHERE name = 'Ohnahji B';
   ```
3. DM Ohnahji `KHVZ`. He logs in at `zaostock.com/team`. Working immediately because the website reads ZAO STOCK directly, no bot in the auth path.

**Why this fix is OK despite the active=true gate:** Zaal explicitly approved promoting Ohnahji to active, which equates to manual gate flip. Same pattern Zaal uses for any other member ready for full access.

## VPS Deploy Mechanism (Fragile)

`zaostock-bot.service` runs on `zaal@31.97.148.88` from `~/zaostock-bot/`. **This directory is NOT a git repo.** No upstream remote, no version tracking, no rollback story.

Code arrives via manual `rsync` from local laptop:
```bash
rsync -av --delete --exclude=node_modules --exclude=.env --exclude=.env.\* \
  --exclude=.npmrc \
  /Users/zaalpanthaki/Documents/ZAO\ OS\ V1/bot/src/ \
  zaal@31.97.148.88:~/zaostock-bot/src/
```

User systemd unit: `~/.config/systemd/user/zaostock-bot.service`
- WorkingDirectory: `~/zaostock-bot`
- ExecStart: `/usr/bin/env npm run start` (which runs `tsx src/index.ts`)
- EnvironmentFile: `~/zaostock-bot/.env`

`zao-devz-stack.service` runs from the SAME directory but ExecStart points at `tsx src/devz/index.ts` (a different bot). They share `.env`. So an env swap affects both.

**Risks:**
- Two laptops editing -> last-rsync wins, no conflict resolution
- VPS-side hot fixes don't propagate back to git history
- No CI guard: a bad rsync ships untyped code

**Mitigation pending:** make `~/zaostock-bot` a git worktree of the (eventual) `zaostock` repo and turn deploy into `git pull && systemctl --user restart zaostock-bot`.

## Supabase MCP Setup (2026-05-05)

Until 2026-05-05 morning, every database mutation required either:
- Pasting SQL into the Supabase web SQL Editor manually, or
- Pasting `SUPABASE_URL` + service-role key into a `.env` so a script could run

Both are friction. The MCP install removes both:

```bash
# 1. Add server (project-scope so it lives in zaostock repo .mcp.json)
claude mcp add --scope project --transport http supabase \
  "https://mcp.supabase.com/mcp?project_ref=yjrlaxpjusmrfylumban"

# 2. Authenticate (one-time, OAuth flow)
claude /mcp   # then select supabase -> Authenticate
```

This wrote `/Users/zaalpanthaki/Documents/zaostock/.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=yjrlaxpjusmrfylumban"
    }
  }
}
```

After auth, 21 tools became available: `mcp__supabase__execute_sql`, `mcp__supabase__apply_migration`, `mcp__supabase__list_tables`, `mcp__supabase__get_project_url`, `mcp__supabase__get_logs`, `mcp__supabase__get_advisors`, etc.

**Important constraint:** MCP cannot expose the `service_role` key (security boundary). Bot env swap on VPS still requires Zaal to paste it once.

## Still Blocked

| # | Item | Owner | Blocker |
|---|------|-------|---------|
| 1 | Bot env swap on VPS (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` -> ZAO STOCK) | Zaal | Needs service-role key paste |
| 2 | Restart `zaostock-bot.service` after env swap | Zaal | Depends on #1 |
| 3 | `/charter` rollout into 6 TG topics | Zaal | Depends on #2 |
| 4 | Drop `stock_*` tables on `efsxtoxvigqowjhgcbiz` | Zaal | Verification window after #3 |
| 5 | `backup-supabase.sh` cron entry on VPS | Zaal | Documented but never scheduled (`crontab -e` add line) |
| 6 | Replace 4 stale ZAOOS clones on VPS (`~/zao-os`, `~/code/ZAOOS`, `~/openclaw-workspace/ZAOOS`, `~/.worktrees/ZAOOS`) | Zaal | Cleanup, low priority |
| 7 | Move `~/zaostock-bot` to a git worktree | Future session | Should pair with bot move into zaostock repo |
| 8 | `scripts/team-codes.mjs` TEAM list update (15 hardcoded -> 27 in DB) | Future session | Script-only, no DB impact |

## Anti-Patterns to Avoid

1. **Two parallel projects via dump/restore -> assume they stay in sync.** They don't. Even with identical schemas, bot-side and website-side writes drift the moment users start using both surfaces.

2. **Prefix tables to avoid collision with future apps.** Long-term, the prefix becomes an artifact that has to be ripped out (this consolidation). If a workload genuinely needs isolation, give it its own Supabase project with no prefix at all.

3. **Define commands in code without applying the schema.** `/propose`, `/object`, `/consent`, `/buddy`, `/respect` all referenced tables that never existed. Every bot deploy carried 5 latent crashes. Post-mortem rule: if a command's tables aren't in any migration, the command shouldn't be in the registered command list.

4. **Use `active` as both display gate AND lock without an unlock UX.** 19 of 27 members are functionally locked out with no self-serve recovery. Either:
   - Add a profile-completion API that auto-flips, or
   - Build an explicit "request access" path that surfaces to Zaal, or
   - Document that `active` requires Zaal to flip manually after offboarding the member through some other channel.
   - This is the lowest-impact ZAOstock UX problem to solve next.

5. **VPS dir not in git.** Every fix that lives only on VPS is a future debugging surprise. The MD5-matching audit on 2026-05-04 was lucky; the real check should be `git diff` against the deployed commit.

## Also See

- [Doc 502](../../governance/502-zaostock-circles-v1-spec/) - Original circles v1 spec, defined the 5 tables that never got created
- [Doc 547](../../community/547-cassie-validation-zaostock-strategy/) - Cassie strategy validation
- [Doc 564](../../infrastructure/564-supabase-mcp-setup-claude-code/) - Supabase MCP setup background (if exists, otherwise this is the first doc)
- [Doc 609](../../events/609-zaostock-cobuild-six-circles-may4/) - Mon May 4 cobuild meeting that locked the 6-circle decision

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Paste ZAO STOCK service-role key for VPS env swap | Zaal | secret share | This session if possible, else Tuesday meeting |
| Backup `~/zaostock-bot/.env`, swap `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, restart service | Claude (after #1) | VPS ssh | Same session as #1 |
| Run `/charter` in each of the 6 TG topics in ZAO Festivals | Zaal | TG admin | Within 30min of bot restart |
| Run drop SQL on `efsxtoxvigqowjhgcbiz` to drop 15 `stock_*` tables (keep `agent_events`) | Zaal | Supabase SQL Editor | After 24hr verification window |
| Add `backup-supabase.sh` to VPS crontab (`0 2 * * *`) | Zaal | crontab -e | This week |
| Move `~/zaostock-bot` to git worktree of zaostock repo | Future session | repo move + systemd path edit | Next sprint |
| DM 17 inactive members to drive bio completion -> Zaal flips active | Zaal | manual messaging | Ongoing |
| Build profile-completion auto-flip OR public "request access" UX | Future session | Next.js + bot work | Q3 2026 |
| Update `scripts/team-codes.mjs` TEAM list from 15 to 27 active | Future session | code edit | Next sprint |
| Update `project_zao_stock_team.md` memory file (currently shows old 8-team April 10 structure) | Future session | memory rewrite | Same day as roster decisions are final |

## Sources

- [Doc 502 - ZAOstock Circles v1 Spec](../../governance/502-zaostock-circles-v1-spec/) (internal, defines unimplemented governance tables)
- [Doc 609 - Mon May 4 cobuild meeting transcript](../../events/609-zaostock-cobuild-six-circles-may4/) (internal, locked the 6-circle decision)
- Live SQL audits via Supabase REST API + MCP, 2026-05-04 22:00 EST through 2026-05-05 morning EST
- VPS `journalctl --user -u zaostock-bot` log inspection (zaal@31.97.148.88), 2026-05-04
- `bot/src/circles.ts`, `bot/src/auth.ts`, `bot/src/regen.ts`, `bot/src/index.ts` (post-consolidation)
- `src/app/api/team/login/route.ts`, `src/app/api/team/profile/route.ts` (zaostock website)
- Supabase MCP server: https://supabase.com/docs/guides/getting-started/mcp (verified 2026-05-05)
- grammY framework patterns for forum topics + `pinChatMessage`: https://grammy.dev/ (verified 2026-05-05)
