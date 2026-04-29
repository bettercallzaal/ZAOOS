# ZAOstock spinout - migration checklist

> **Safety rule:** Nothing gets deleted from ZAOOS until cutover is verified live on zaostock.com. Every deletion happens AFTER the new repo proves it works.

Source of truth for the ordering. Cross off as you go. Each phase has a gate that must pass before the next phase starts.

## Phase 1 - Infra setup (Zaal)

You do these. I can&rsquo;t.

- [ ] Create empty GitHub repo `bettercallzaal/zaostock` (private to start, flip to public later if you want)
- [ ] Create new Supabase project named `zaostock`
- [ ] Save the Supabase URL + anon key + service role key in `~/Documents/zaostock/.env.local` (NOT in this repo)
- [ ] Create new Vercel project, connect it to the `bettercallzaal/zaostock` repo
- [ ] Point `zaostock.com` DNS at Vercel (A or CNAME per Vercel guidance)
- [ ] Verify the empty repo deploys a Next.js hello-world successfully

**Gate:** `zaostock.com` resolves to a Vercel hello-world page. Don&rsquo;t move to Phase 2 until that&rsquo;s green.

## Phase 2 - Code copy + path strip (me, after Phase 1)

Once the repo URL exists, share it with me. Then I scaffold:

- [ ] Clone the new empty repo locally
- [ ] `npx create-next-app@latest` with the same Next.js 16 + Tailwind v4 + TypeScript stack as ZAOOS
- [ ] Copy files per `inventory.md` paths (drop the `/stock/` prefix everywhere)
- [ ] Inline the 4 shared deps (CountdownTimer, env, supabase, logger)
- [ ] Strip `/stock/` from all internal `Link` href props + redirects
- [ ] Strip the `stock_` prefix from every `from('stock_xxx')` Supabase call (renaming tables in the new DB - see Phase 3)
- [ ] Wire env vars from `.env.example` (point at NEW Supabase project)
- [ ] `npm install` + `npm run typecheck` clean
- [ ] Local smoke: `/team` (login + dashboard), `/onepagers/overview`, `/apply`, `/sponsor`, `/program`

**Gate:** Local dev server runs clean, typecheck passes, no broken imports. Open a PR on the new repo so the diff is reviewable.

## Phase 3 - Database migration (me + Zaal)

- [ ] Generate `schema.sql` from current ZAOOS Supabase (every `stock_*` table CREATE + RLS policies + indexes). Strip the `stock_` prefix in the new schema.
- [ ] Paste schema into NEW zaostock Supabase SQL Editor, run it
- [ ] `pg_dump --data-only` from current ZAOOS Supabase, filtered to `stock_*` tables only
- [ ] Transform dump file: rename tables (`stock_team_members` -> `team_members`, etc) before import
- [ ] Import into NEW Supabase
- [ ] Verify row counts match per table (current snapshot in `row-counts.md`)
- [ ] Spot-check 5 random rows in 3 tables (team_members, todos, sponsors) - same data as old?
- [ ] Update bot `.env` on VPS to point at NEW Supabase URL + service role key
- [ ] Verify bot still works: DM `@ZAOstockTeamBot`, hit `/help`, `/circles`, `/mytodos` - should respond using NEW DB
- [ ] Verify cron jobs still fire (morning digest, etc) and read from NEW DB

**Gate:** Bot reads/writes against the new DB cleanly. Row counts match. Spot checks pass.

## Phase 4 - Deploy + cutover (me + Zaal)

- [ ] Push code to `main` on `bettercallzaal/zaostock`
- [ ] Vercel auto-deploys to `zaostock.com`
- [ ] Run the 11-item audit from `inventory.md` against `zaostock.com`
- [ ] Add a redirect middleware in ZAOOS:

  ```typescript
  // src/middleware.ts in ZAOOS - add to existing middleware
  export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    if (path.startsWith('/stock')) {
      const newPath = path.replace(/^\/stock/, '');
      return NextResponse.redirect(`https://zaostock.com${newPath || '/'}`, 301);
    }
    // ... existing middleware
  }
  ```

- [ ] Deploy ZAOOS with the redirect middleware
- [ ] Test: visit `zaoos.com/stock/team` -> should 301 to `zaostock.com/team`
- [ ] Test: visit `zaoos.com/stock/onepagers/overview` -> should 301 to `zaostock.com/onepagers/overview`
- [ ] Pin the new URL in the ZAOstock TG group + Discord
- [ ] Update `community.config.ts` in ZAOOS to drop the `/stock` nav links

**Gate:** Redirects work, team can use `zaostock.com` for everything, no broken links from old URLs.

**Wait 48 hours.** Watch the redirect logs. If anything is broken, this is the rollback window. Don&rsquo;t skip this.

## Phase 5 - Delete from ZAOOS (me, after 48h confirmation)

After 48 hours of zaostock.com working cleanly with no rollback:

- [ ] Delete `src/app/stock/` from ZAOOS
- [ ] Delete `src/app/api/stock/` from ZAOOS
- [ ] Delete `src/lib/stock/` from ZAOOS
- [ ] Delete `src/lib/auth/stock-team-session.ts` from ZAOOS
- [ ] Update CLAUDE.md to mark ZAOstock as &ldquo;graduated&rdquo;
- [ ] Update README.md to move ZAOstock from &ldquo;in lab&rdquo; to &ldquo;graduated&rdquo;
- [ ] Keep the redirect middleware in ZAOOS forever (or until we sunset zaoos.com itself)
- [ ] Keep `research/` docs about ZAOstock - those stay
- [ ] Keep the bot in ZAOOS (Phase 5 of bot migration is later)

**Gate:** Delete PR merges, ZAOOS routes still work for the Farcaster client, redirect middleware still routes the /stock paths.

## Phase 6 - Bot migration (later, separate project)

Not this week. Plan to do it when:
- The bot has been running on the new Supabase URL for at least 2 weeks without issue
- We have time to do a clean systemd unit migration on the VPS
- Or when the bot itself is ready to graduate from the lab (when it&rsquo;s &ldquo;solid + worth its own brand&rdquo;)

For now: bot lives in ZAOOS, talks to NEW Supabase, does its job.

---

## Rollback plan (if anything goes wrong)

If at any point Phase 4 fails:
1. Pull the redirect middleware from ZAOOS
2. ZAOOS routes serve `/stock/*` again as before
3. Diagnose the issue on `zaostock.com`
4. Try cutover again when fixed

If Phase 3 fails (data migration):
1. Old ZAOOS DB is untouched - everything still works there
2. Drop the new Supabase project, start fresh
3. The new Vercel project doesn&rsquo;t have a working DB but no harm done

If Phase 5 deletion happens prematurely and something&rsquo;s broken:
1. `git revert` the deletion commit
2. Push to ZAOOS, Vercel redeploys
3. Code is back

The only way this goes really wrong is if we delete from ZAOOS *before* zaostock.com is verified. The 48-hour rule prevents that.
