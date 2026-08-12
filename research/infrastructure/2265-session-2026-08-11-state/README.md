---
topic: infrastructure
type: incident-postmortem
status: research-complete
last-validated: 2026-08-11
related-docs: "2258, 2255, 2247"
original-query: "Can u push all context to repo and then compact - preserve this session's verified state and errors before the context window is compacted"
tier: STANDARD
---

# 2265 - Session state, 2026-08-11: what shipped, what is verified, what I got wrong

> **Goal:** Carry this session's facts into the repo so the next session does not
> re-derive them, and record the errors so they are not repeated.

## Key decisions locked today

| Decision | Detail |
|---|---|
| **Season 1 voting is retired** | The month-two ballot gauged opinion; it was never how finalists are chosen. `data/vote-candidates.json` status `closed`, `/vote` 307s to `/leaderboard`, no tallies render anywhere |
| **Six finalists, three winners** | Two per track picked by Zaal. Three win, one per track. Never stated on the site before today |
| **The prize is 500 USDC, split six ways** | Nothing else. The site had promised "top 8 share, top 16 get $ZABAL" - impossible with 6 finalists and 15 entrants |
| **Points are awarded MANUALLY** | Zaal taps `/award`. Never build automatic accrual - see `feedback_points_are_awarded_manually` |
| **Stale grill cards nag MORE, not less** | Zaal: "we need to clear old ones so always send them, keep reminding, the older the more frequent." Do NOT expire them |
| **No submission is a "draft"** | Each entry is where that person is at. The shaming framing is cut everywhere |

## Verified facts - do NOT re-derive these

**The agent bus** (`~/.zao/private/zao-bus-server.js` on the VPS)
- It is **HTTPS**, `https.createServer`, self-signed cert at `~/.zao/private/zao-bus-cert.pem`,
  bound `127.0.0.1:8790`. The runbook saying `BUS_URL=http://...` is **WRONG** and produces
  "Empty reply from server", which reads as a dead service. Use `curl -k https://`.
- `/bus/health` requires auth (returns `{"error":"Unauthorized"}`), so it is useless as a probe.
- Partners: zao, jim, brandon, sam. **Total messages: one**, `zao -> zao`, a self-test.
  There is no swarm traffic to watch (task #74).

**ZOE's Claude auth**
- `~/.claude/.credentials.json` on the VPS carries an `expiresAt` of **2026-08-08T07:51 UTC**.
  Expired three and a half days ago. There is **no ANTHROPIC_API_KEY** in `zao.env`, so ZOE runs
  entirely on that OAuth session. Fix is interactive: `ssh vps`, `claude`, `/login`.
- Both ZOE paths 401 - `decompose` (the bus) and `concierge` (replies). Every reply since Friday
  got "Got it" and then silently failed. Nothing alerted anyone for 3.5 days.

**The machines**
| Node | Tailnet | State |
|---|---|---|
| macbook-air-3 | 100.81.77.87 | **sshd OFF (0 listeners on 22)**, sleeps, holds ALL 8 tmux lanes |
| ansuz (Pi) | 100.117.191.11 | up |
| desktop-h2ov6da | 100.72.152.63 | up |
| srv1073120 | 100.121.237.35 | **UNIDENTIFIED - find out what this is** |
| VPS srv1537940 | **NOT in tailnet** | 31.97.148.88, runs ZOE + the bus |

The always-on box is unreachable privately; the sleeping laptop is on the tailnet but refuses
connections. That inversion is the root of the "can't reach anything from Blink" problem.

**Vendor lock-in, ranked by "is the only copy inside the vendor"**
1. **Upstash KV** - was the emergency. Now exported nightly (PRs #615/#617/#618). Needs the
   `ADMIN_KEY` repo secret, which Zaal set.
2. **Paragraph** - 366 editions, alpha API, OAuth-bound. Same treatment would work.
3. Vercel / Supabase / Neynar - rentable, data is portable.
4. Anthropic - plan around the cap, not the exit.

**Claude account switch** - lost on switch: every `claude_ai_*` connector (Gmail, Calendar,
Drive, Slack, Linear, Notion, Dropbox, Canva, Calendly) plus **Paragraph**. Survives: Supabase,
Serena, context7, Playwright, Dune, grep, Exa, GitHub.

**Counts as of tonight**: 30 real projects (the 2 QA fixtures are now filtered), 15 on the
points board, **32 recordings** (not 33 - see below), 55 keys in the KV backup.

## Errors I made, so they are not repeated

1. **Trusted a `count` field over the array it described.** `recordings/index.json` carried
   `count: 33` while holding 32. That wrong number reached a published newsletter, the thread
   and the kit. `edition-facts.sh` now counts the list and warns on disagreement.
2. **Ran a Python script with `bash`.** `~/bin/zao-fetch-reddit.sh` is Python. It returned 0
   bytes, I concluded Reddit was IP-blocked, and researched the wrong project for an hour.
3. **`git add -A` twice**, sweeping unrelated files into PRs; then a `reset --hard` deleted
   `AUGUST-LANE-BRIEF.md` after I had said it would survive. Recovered from the commit.
4. **Committed to the wrong branch** - `ws/research-poidh-propagation`, the branch behind an
   open PR - because `git checkout -b` failed silently and I did not check.
5. **Declared a lane's prompt failed** after checking the pane 3 seconds in. It had landed.
6. **A programmatic conflict resolution silently dropped a feature.** Resolving `zao-tracker`
   took "theirs" for every block, but the block whose HEAD side was empty did not match the
   pattern, dropping `REPO_SLUG="$repo"`. Zero conflict markers, clean `bash -n`, and `--repo`
   would have silently done nothing. Caught only by tracing the flag end to end.

The through-line: **a green check is not evidence.** Count the thing, do not read the label.

## Also fixed tonight

`.claude/settings.json` used `$PROJECT_DIR`, which Claude Code does not set. Six occurrences,
all resolving empty. The unconditional Bash hook therefore ran `python3 "/scripts/..."`, failed,
and **blocked every Bash call in this repo**. The other five hooks - commit linter, branch
guard, typecheck guard, eslint auto-format, worksession check - had been failing silently for
who knows how long. Now `$CLAUDE_PROJECT_DIR`. The pipeline guard it gates caught two real
`$?`-after-pipeline bugs within minutes of coming back.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| `ssh vps` then `claude` then `/login` - revives ZOE, the grill and the bus | @Zaal | Task | 2026-08-12 |
| Award Dee a point at `/award` - first real test, and it creates `points:tally` | @Zaal | Task | 2026-08-12 |
| Merge zaal-dotfiles#17 (conflicts resolved, MERGEABLE) | @Zaal | PR | 2026-08-12 |
| Post the thread, X post and 14 DMs - written, URL filled in | @Zaal | Outreach | 2026-08-12 |
| Make the pinned TG message surface a ZOE 401 instead of a grill count | @Zaal | PR | 2026-08-14 |
| Grill: remove buttons once answered; older cards nag more often (#91) | @Zaal | PR | 2026-08-14 |
| Verify T3 Code, try `npx t3 connect` on the VPS (#90) | @Zaal | Research | 2026-08-14 |
| Identify `srv1073120` on the tailnet | @Zaal | Task | 2026-08-15 |
| Fix `zao-vault-log` - logs "0 shipped items" on a 20-PR day, or delete the cron | @Zaal | PR | 2026-08-15 |
| Verify `zao-spend` cost arithmetic - reports ~10x the token maths | @Zaal | PR | 2026-08-15 |

## Sources

- 24 PRs merged in `ZAODEVZ/zabalgames` on 2026-08-11 (#598-#619).
- Live reads of `/api/points`, `/api/submissions?feed=projects`, `/recordings/index.json`,
  `/data/vote-candidates.json`, and the KV export, all 2026-08-11.
- `~/.zao/handoffs/2026-08-11-research-brief.md` and `2026-08-11-mac-independence.md` - the
  two lane briefs, carrying the same facts to the `zaoresearch` and `alwayson` lanes.
