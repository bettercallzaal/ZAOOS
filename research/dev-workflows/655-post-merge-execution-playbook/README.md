---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-05-20
original-query: Three PRs merged inbox bridge cron audit ZOE post slate v1 - none changes production until Zaal deploys - specify exactly what to do in what order this week (reconstructed)
related-docs: 422, 547, 652, 653
tier: STANDARD
---

# 655 - Post-Merge Execution Playbook (Week 1 after PRs #530 #531 #533)

> **Goal:** Three PRs merged in one evening: inbox bridge (#530), cron audit (#531), ZOE post slate v1 (#533). None of them changes anything in production until Zaal deploys. This doc says exactly what to do, in what order, this week. **No v2 architecture work.** Per [[feedback_ship_and_use_not_meta]] - use what shipped before designing what's next.

## Recommendations First

| # | Action | Effort | Owner | Why now |
|---|---|---|---|---|
| 1 | **Deploy post slate v1 to VPS** | 1 SSH command | @Zaal | Code is in main but `zoe-bot.service` is running the OLD code from before #533. Until restart, zero new pings fire. |
| 2 | **Kill paperclipai crash-loop** | 1 SSH command | @Zaal | Restart counter was 107,478 at audit time. Every 10s it tries to start + fails. Burns CPU + masks other failures + drowns journalctl. Either disable or actually fix - pick one today. |
| 3 | **Clean the 6 zombie + dead crons from VPS root crontab** | `crontab -e` + delete 9 lines | @Zaal | 5 zaostock May-4 lines + 1 send-coc4 + 3 lines around dead infra. Use the diff in Section "Crontab cleanup diff" below verbatim. |
| 4 | **Set up Gmail filter to forward to `zoe-zao@agentmail.to`** | 5 min Gmail UI | @Zaal | Per Doc 652 PR #530. Once live, every forwarded email is queryable via `/inbox`. Without this step #530's skill patches do nothing useful. |
| 5 | **Seed today's events into `~/.zao/zoe/events/today.txt`** | `echo` + `>>` per event | @Zaal | The event-category drafter reads this file. Empty file = drafter outputs `(skip)` = you lose 1 of 4 categories. Seed 1-3 events to keep the rotation honest. New script `bot/scripts/seed-events.sh` makes this a one-liner. |
| 6 | **Watch `~/.zao/zoe/posts/log.jsonl` for 24h, then 7d** | Tail + skim | @Zaal | Real skip-rate data is the only valid input for v2 tuning. Do not touch `CATEGORY_WEIGHTS` or `PINGS_PER_DAY_DEFAULT` until 7 days of real logs exist. |
| 7 | **DO NOT BUILD any of post slate v2 features this week** | abstain | @Zaal | Calendar MCP wiring, inline buttons, Firefly API, voice-note Whisper, stream transcripts - all parked. Run v1 for a week first. Re-open after retrospective. |

## What changed in main this week

| PR | Status | What it shipped |
|---|---|---|
| #530 | MERGED 2026-05-16 22:00 UTC | `.claude/skills/inbox/SKILL.md` (loosen whitelist), `.claude/skills/morning/SKILL.md` (add inbox count), doc 652 |
| #531 | MERGED 2026-05-16 22:50 UTC | doc 653 cron + bots audit only (no code changes, no infra changes) |
| #533 | MERGED 2026-05-16 22:50 UTC | `bot/src/zoe/posts/*` (7 files), `bot/src/zoe/scheduler.ts` + `index.ts` patches |

**Critical:** PR #533's code lives in main, but `zoe-bot.service` on the VPS is still running the pre-merge binary. The randomized scheduler does not exist in the running process. **Recommendation #1 (the SSH restart) is the actual go-live.**

## Section A - Deploy commands (copy + paste)

### 1. Deploy post slate v1 (Rec #1)

```bash
ssh zaal@31.97.148.88 'cd /home/zaal/zao-os && git pull && cd bot && npm install --omit=dev && systemctl --user restart zoe-bot && sleep 6 && journalctl --user -u zoe-bot.service -n 40 --no-pager | grep -E "\[zoe/posts\]|started"'
```

Expected output lines (post-restart):
```
[zoe/scheduler] started 3 cron tasks + posts scheduler (no quiet hours per Zaal feedback)
[zoe/posts] scheduler started (target 7 pings/day, window 5am-10pm ET)
[zoe/posts] rolled schedule for 2026-05-17: 7 pings
```

If those 3 lines appear, v1 is live. Wait for first ping within the next 30-60 min.

### 2. Kill paperclipai (Rec #2)

Pick one:

**Option A - Disable cleanly (recommended unless paperclip.zaoos.com still serves real traffic):**
```bash
ssh zaal@31.97.148.88 'systemctl --user disable --now paperclipai.service && systemctl --user status paperclipai.service --no-pager | head -5'
```

**Option B - Try one more fix before disable:** investigate why `npx paperclipai run` exits 1 under systemd but exits 0 when run manually. Likely a `TTY` or working-directory issue. If a quick fix surfaces, ship it; otherwise fall back to Option A.

### 3. Crontab cleanup (Rec #3)

```bash
ssh zaal@31.97.148.88 'crontab -e'
```

Delete or comment these 9 lines (full diff in next section):
- the 5 `_send_digest.mjs` lines for May 4
- `send-coc4.sh` line (April 11 annual)
- `nightly-research.sh` line (dead infra)
- `pixel-startup.sh @reboot` (dead openclaw refs; remove if you don't use zoe-dashboard either)
- the 4 `zaoos-crons.sh` lines (only if you choose NOT to rotate `CRON_SECRET` - see Section B)

### 4. Gmail filter (Rec #4)

Gmail web → Settings → Forwarding and POP/IMAP:
1. Add forwarding address `zoe-zao@agentmail.to`
2. Open AgentMail (run `/inbox` in any Claude session), find verification email, copy 9-digit code, paste back in Gmail
3. Filters and Blocked Addresses → Create a new filter
4. Search field: `label:zoe-inbox` (or pick `from:` allowlist, or `to:zoe@bettercallzaal.com` alias - see Doc 652 for all options)
5. Tick: Apply label `zoe-inbox`, Forward it to `zoe-zao@agentmail.to`, optionally Skip Inbox

Smoke test:
- On phone: apply `zoe-inbox` label to one email
- Wait 30s
- Run `/inbox` in Claude → confirm message appears (with Zaal preserved in `Resent-From` headers per #530 skill patch)

### 5. Seed events (Rec #5)

Script shipped in this PR: `bot/scripts/seed-events.sh`. Usage (run on VPS or sync via rsync):

```bash
# Add today's events
ssh zaal@31.97.148.88 'mkdir -p ~/.zao/zoe/events && cat >> ~/.zao/zoe/events/today.txt' <<'EOF'
co-build 11:30am ET meet.baserooms.io/zaal
ZAOstock standup 10am ET
lunch stream 11:30am ET
EOF

# Tomorrow's events
ssh zaal@31.97.148.88 'cat >> ~/.zao/zoe/events/tomorrow.txt' <<'EOF'
Roddy parklet meeting 5pm ET (City Hall)
EOF
```

Or use the script: `ssh zaal@31.97.148.88 'bash -s' < bot/scripts/seed-events.sh today "co-build 11:30am ET"`.

**Automate later:** v2 will wire Google Calendar MCP. For week 1, manual append is fine.

## Section B - Crontab cleanup diff (paste-ready)

Current VPS root crontab (live as of 2026-05-16). Lines marked `-` to remove, `+` to add:

```diff
 # ZAO OS cron jobs (moved from Vercel to save Fluid Compute CPU)
- 0 0 * * 0 /home/zaal/zaoos-crons.sh health-snapshot >> /tmp/zaoos-cron.log 2>&1
- 0 13 11 4 * /home/zaal/zoe-bot/send-coc4.sh >> /tmp/coc4-send.log 2>&1
- 0 2 * * * /home/zaal/zaoos-crons.sh daily-digest >> /tmp/zaoos-cron.log 2>&1
- 0 23 * * * /home/zaal/zaoos-crons.sh wavewarz-sync >> /tmp/zaoos-cron.log 2>&1
- 0 6 * * * /home/zaal/zaoos-crons.sh follower-snapshot >> /tmp/zaoos-cron.log 2>&1
- 0 8 * * * /home/zaal/nightly-research.sh >> /home/zaal/hermes-workspace/reports/cron.log 2>&1
- @reboot /home/zaal/pixel-startup.sh >> /tmp/pixel-startup.log 2>&1
 * * * * * /home/zaal/bin/auto-sync.sh >> /home/zaal/.claude/auto-sync.log 2>&1
- 7 10 4 5 * cd /home/zaal/zaostock-bot && '/usr/bin/node' _send_digest.mjs 1 >> digest-cron.log 2>&1
- 11 11 4 5 * cd /home/zaal/zaostock-bot && '/usr/bin/node' _send_digest.mjs 2 >> digest-cron.log 2>&1
- 14 12 4 5 * cd /home/zaal/zaostock-bot && '/usr/bin/node' _send_digest.mjs 3 >> digest-cron.log 2>&1
- 17 13 4 5 * cd /home/zaal/zaostock-bot && '/usr/bin/node' _send_digest.mjs 4 >> digest-cron.log 2>&1
- 23 14 4 5 * cd /home/zaal/zaostock-bot && '/usr/bin/node' _send_digest.mjs 5 >> digest-cron.log 2>&1
```

**Conditional:** keep the 4 `zaoos-crons.sh` lines IF you rotate `CRON_SECRET` and confirm `www.zaoos.com/api/cron/*` endpoints accept the new value. Otherwise delete them too - silent 401s are worse than no run.

**Conditional:** keep `pixel-startup.sh @reboot` IF you still use the zoe-dashboard at `:3001` (the script also tries `docker exec openclaw-openclaw-gateway-1` which is dead - if you keep the script, edit out the openclaw block first).

After cleanup: 1 active line (auto-sync) + whatever you intentionally kept. Down from 10 to 1-5. zaostock-bot + zoe-bot + cloudflared still run as systemd user units, unaffected.

## Section C - What NOT to build this week

Per [[feedback_ship_and_use_not_meta]] + `bot/src/zoe/posts/README.md` v2 roadmap, **all of these are parked**:

| Feature | Why parked |
|---|---|
| Inline `[Post] [Regen] [Skip] [Edit]` keyboard | Needs real skip-rate data to know if buttons are even needed. Plain DM might be fine. |
| Skip-rate learning (auto-adjust `CATEGORY_WEIGHTS`) | Needs 7+ days of logs. Hand-tune from data, do not pre-build the auto-tuner. |
| Google Calendar MCP wiring (event source v2) | Needs MCP auth on VPS-side claude CLI. Manual `today.txt` works for week 1. |
| `zao-transcribe` integration (personal source v2) | Lunch streams happen daily but transcripts aren't yet routed to ZOE. Manual `/voicememo` covers the gap. |
| Firefly API auto-post | Copy-paste is the v1 commitment. Don't break the manual-tap discipline until v1 proves it's working. |
| Voice-note ingestion via Whisper | Telegram voice notes are nice but `/voicememo <text>` is sufficient. |
| Cloud Routine for `/inbox` daily digest (Doc 652 Rec #5) | Local `/morning` patched per #530 already surfaces `/inbox count`. Cloud Routine adds complexity that's only worth it once VPS cleanup is done. |
| Anything from Doc 422 migration order #3 onward (newsletter, socials, ZOE nightly, WaveWarZ, ZABAL swarm, etc) | All blocked until #1 (`/morning` cloud) and #2 (`/inbox` cloud) are running clean. |

## Section D - Friction watchlist (when to escalate to v2)

Watch for these signals over the next 7 days. Each maps to a specific v2 item:

| Signal | What it means | Trigger v2 work |
|---|---|---|
| Skip rate on personal category > 60% | Voice memos aren't producing usable seeds | Wire `zao-transcribe` (PR for stream transcript routing) |
| 7 days, 0 events ever seeded | Manual `today.txt` is too much friction | Build Google Calendar MCP integration |
| Multiple "regen this" replies | Drafts are off-voice; haiku not enough | Bump default model to `sonnet` for personal+ecosystem |
| ZOE never pings for hours | Scheduler crashed | Investigate `~/.zao/zoe/posts/log.jsonl` + journalctl |
| `/inbox` queue grows but never gets processed in morning | Local `/morning` not being run | Stand up cloud Routine for autonomous /inbox digest |
| Spammy / repetitive drafts | Source data too thin | Add Farcaster /thezao + ZABAL contract events to ecosystem source |

Anything not on this list = file it but do not rebuild yet.

## Section E - Quarterly cadence

Per Doc 653 final action item: re-audit cron + bots **2026-08-16**. By then this entire playbook should either have shipped or been explicitly rejected.

If by 2026-06-16 (one month) any of Sec A items are still pending: those are blockers, not optional. Escalate.

## Sources

- PRs #530, #531, #533 merged 2026-05-16 (this repo)
- Doc 652 [Gmail to /inbox bridge](../652-inbox-gmail-bridge-morning-trigger/)
- Doc 653 [Cron + bots audit](../653-cron-bots-audit-may2026/)
- Doc 422 [Claude Routines automation stack](../422-claude-routines-zao-automation-stack/)
- `bot/src/zoe/posts/README.md` v2 roadmap section
- Memory: `feedback_ship_and_use_not_meta`, `feedback_no_flow_state_gate`, `project_zoe_post_slate`, `project_zoe_soul_architecture`, `project_hermes_canonical`

## Also See

- [Doc 652](../652-inbox-gmail-bridge-morning-trigger/) - Gmail bridge spec (PR #530)
- [Doc 653](../653-cron-bots-audit-may2026/) - Full audit (PR #531)
- [Doc 422](../422-claude-routines-zao-automation-stack/) - Cloud Routines plan (still aspirational)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| SSH restart `zoe-bot.service` to activate post slate v1 | @Zaal | 1 command | Tonight |
| `systemctl --user disable --now paperclipai.service` OR fix doctor-check | @Zaal | 1 command or 30 min debug | Tonight |
| Edit VPS crontab per Section B diff | @Zaal | 5 min | This week |
| Gmail filter setup (forward `label:zoe-inbox` to `zoe-zao@agentmail.to`) | @Zaal | 5 min Gmail UI | This week |
| Seed `~/.zao/zoe/events/today.txt` for tomorrow's events | @Zaal | 30 sec | Tonight (so first event-category draft has data) |
| Tail `~/.zao/zoe/posts/log.jsonl` after 24h, screenshot patterns | @Zaal | 5 min | 2026-05-18 |
| Friction retrospective: review Section D signals | @Zaal | 30 min | 2026-05-23 (1 week post-deploy) |
| Decide v2 priorities based on real friction | @Zaal + Claude | grill session | 2026-05-23 or later |
