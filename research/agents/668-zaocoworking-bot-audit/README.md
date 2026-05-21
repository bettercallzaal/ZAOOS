---
topic: agents
type: audit
status: research-complete
last-validated: 2026-05-20
original-query: What are all the security, architecture, LLM safety, and ops issues in ZAOcoworkingBot after the v2.10-v2.12 emergency bug-fix cycle? (reconstructed)
related-docs: 459, 547, 601, 650, 661, 662, 665, 668
tier: DISPATCH
---

# 668 - ZAOcoworkingBot Full Audit (May 2026)

> 6 parallel sub-agents audited the bot across architecture, LLM/persona safety, state/persistence, security, deploy/ops, and feature/UX. Trigger: today (2026-05-18) we shipped v2.10 -> v2.11 -> v2.12 in one day chasing a single bug (LLM hallucinating Claude Code permission dialogs at the user). Wanted to know what else is fragile before rolling out to ThyRev + Samantha.

## Headline

The bot WORKS. v2.12 is running clean on Iman's VPS with 24 slash commands + auto-updating persona. 18 findings across 6 dimensions, including 3 Critical (security) + 3 P0 (other dimensions). Most are 1-PR-each fixes. **Top blocker for wider rollout: bot runs as root + no pre-commit secret scan + no LLM op-schema validation** - a leaked token (which we proved is easy to do today) gives an attacker control of the VPS, not just the bot.

## Severity Roll-up

| Severity | Count | Dimensions |
|---|---|---|
| Critical | 3 | security (3) |
| P0 | 3 | architecture (1), state (1), UX (1) |
| P1 | 8 | architecture (2), persona (1), state (2), ops (2), UX (1) |
| P2 | 3 | persona (2), ops (1) |
| P3 | 1 | architecture (1) |

## Top 6 Things To Fix First

| Rank | Finding | Doc | File:Line | One-line fix |
|---|---|---|---|---|
| 1 | Bot runs as root | 668d | systemd unit | Create `zaocoworking` user, transfer dirs, update unit |
| 2 | No pre-commit secret scan | 668d | `.husky/` missing | Copy ZAOOS pattern; fail on 64-char hex + `PRIVATE_KEY=` |
| 3 | LLM op-schema not validated | 668d + 668b | `extraction.ts:30-40` | Whitelist `op` enum before save; default branch rejects unknown |
| 4 | seedOrUpdate race | 668c | `memory.ts:108` (v2.12) | Add `fs.open('wx')` lock or atomic rename via temp file |
| 5 | Silent SHA loss on roster commits | 668a | `roster.ts:246` | Try/catch around Octokit + structured error log |
| 6 | Missing Phase / DMAIC field | 668f | `commands.ts` | Add `/setphase` (10 lines, reuse setprio pattern) |

## All 18 Findings

### Security (3 Critical) - [668d](668d-security/)

| # | Finding | Severity |
|---|---|---|
| S1 | No pre-commit hook for secret scanning | Critical |
| S2 | LLM prompt injection bypasses confirm under `/autoconfirm on` | Critical |
| S3 | Bot runs as root via systemd user unit | Critical |
| S4 | GITHUB_TOKEN scope is repo-write (broader than needed) | High |
| S5 | journalctl can include env on crash | High |
| S6 | Token leak today (TELEGRAM_BOT_TOKEN in Claude transcript via grep) | High (incident, left in place) |
| S7 | BYOK keys at-rest unencrypted (chmod 600 only) | Med |
| S8 | Group reply-to-bot edge case may bypass allowlist | Med |
| S9 | Telegram privacy mode unknown / unverified | Low |
| S10 | `/setkey` delete-message can silently fail | Low |

### Architecture (1 P0, 2 P1, 1 P3) - [668a](668a-architecture/)

| # | Finding | Severity |
|---|---|---|
| A1 | Silent SHA loss in roster commits - no try/catch around Octokit call | P0 |
| A2 | Untyped catch in SHA-dance retry - missed 409 conflicts undetected | P1 |
| A3 | Minimax provider missing `max_tokens` - unbounded text risk | P1 |
| A4 | Module coupling minor; clean overall | P3 |

### LLM / Persona (1 P1, 2 P2) - [668b](668b-llm-persona-safety/)

| # | Finding | Severity |
|---|---|---|
| L1 | Forbidden-hallucinations list incomplete - missing 8+ patterns ("I'll SSH", "I'll post to Farcaster", "running shell now", etc) | P1 |
| L2 | `extractSuggestion()` casts JSON.parse to SuggestActionOp without runtime validation | P2 |
| L3 | Prompt injection via transcript - user msg captured in working block, can override persona on next turn | P2 |

### State / Persistence (1 P0, 2 P1) - [668c](668c-state-persistence/)

| # | Finding | Severity |
|---|---|---|
| ST1 | seedOrUpdate not idempotent under concurrent restart - shipped today as v2.12 has race window | P0 |
| ST2 | Pending-suggestion file is single global - 2 users hitting bot simultaneously cross-contaminate | P1 |
| ST3 | Backup files accumulate unbounded - no GC policy | P1 |

### Deploy / Ops (2 P1, 1 P2) - [668e](668e-deploy-ops/)

| # | Finding | Severity |
|---|---|---|
| O1 | No `/version` runtime endpoint - can't verify deploy without SSH | P1 |
| O2 | Silent roster degradation on GitHub failure - falls back to ENV without alert | P1 |
| O3 | Manual deploy with no rollback script | P2 |

### Feature / UX (1 P0, 1 P1, 1 P1) - [668f](668f-feature-ux-gaps/)

| # | Finding | Severity |
|---|---|---|
| F1 | Missing Phase / DMAIC field - dashboard has it, bot has zero support | P0 |
| F2 | Missing Task Type field - bug/feature/spike/epic not settable | P1 |
| F3 | Command menu sprawl - 24 commands listed flat with no inline help on no-args | P1 |

## Proposed Sprint Plan (3 PRs, all ship before ThyRev + Samantha onboard)

### PR v2.13: Security hardening (blocks wider rollout)
- **S3**: Create `zaocoworking` non-root user on VPS; chown ~/.zaocoworking; update systemd unit; transfer .env perms (chmod 600 under new user)
- **S1**: Add `.husky/pre-commit` hook copying ZAOOS pattern (64-char hex + `PRIVATE_KEY=` + GitHub PAT + Anthropic key patterns)
- **S2 + L2**: Replace `as SuggestActionOp` cast in `extraction.ts:33` with explicit schema validation - whitelist `op` against union, reject extras

### PR v2.14: Reliability + observability
- **ST1**: Add lock-file guard to `seedOrUpdate()` using `fs.open(path, 'wx')` to claim, or atomic rename via `${path}.tmp`
- **A1**: Wrap Octokit `createOrUpdateFileContents` in `roster.ts` with try/catch + structured log incl. SHA, current size, error code
- **A2**: Type the SHA-dance catch as `unknown` + narrow with `instanceof Error` + status check
- **A3**: Add `max_tokens: 1024` to Minimax payload
- **O1**: `/version` slash command returning git SHA + start time + PERSONA_VERSION

### PR v2.15: Feature parity (before ThyRev/Samantha onboard)
- **F1**: `/setphase <id> <Define|Measure|Analyze|Improve|Control>` - 30 lines, reuse setprio pattern
- **F2**: `/settype <id> <task|bug|feature|spike|epic>` - same pattern
- **F3**: `/start` reformatted into 4 sections (daily / editing / discovery / admin) + smart no-args (e.g. `/wip` lists your WIP items instead of "usage: ...")
- **ST2**: scope pending-suggestion file by `(chat_id, user_id)` instead of global
- **O2**: Emit CRITICAL log + DM admin if GitHub roster fetch fails AND ENV fallback < 2 members

### Deferred (P2/P3, not blocking adoption)
- L1: extend forbidden-hallucinations list (covered by current v2.12 plus iterations)
- L3: prompt-injection via transcript - add input sanitization (but small team + allowlist mitigates)
- O3: `bin/deploy.sh` rollback wrapper
- ST3: backup-file GC policy (keep most recent 3)
- S4-S10: lower-severity security findings, batch into separate hardening sprint

## What This Audit Confirmed Is Healthy

- Module separation is clean (17 .ts files, clear single responsibility per file)
- Archive-first transcript pattern is safe
- chmod 600 on per-user prefs
- Roster TTL cache with explicit `/reload` escape
- The v2.12 version-marker pattern (today's fix) catches the persona-drift class of bug going forward, race condition aside
- 24 slash commands all registered correctly via `setMyCommands` on boot
- Notification opt-out via `/notify off <channel>` actually wires through
- BYOK pattern works with 4 providers

## Hard Numbers

- 17 TypeScript files under `agent/src/`
- 21 .ts files total (incl. systemd template + tests)
- 24 slash commands registered with Telegram
- 5 roster members (Zaal + Iman + ThyRev + Samantha + bot)
- 24 action items in `data/actions.json` (16,774 bytes)
- 5 critical + high severity findings across all dimensions
- 3 sub-agents ran in parallel (each ~90-160s)
- 18 total findings across 6 dimensions
- 0 secrets in code (today's leak was in a tool-output transcript, not committed)
- 79.6 MB resident memory after restart
- 3 v2.x deploys today (10, 11, 12) - each clean, latest = `f490b23` + `3166f5b`

## Sources

- Code under audit: github.com/songchaindao-dot/cowork-zaodevz @ main HEAD `0b2b87d` post-v2.12 merge
- VPS state: root@187.77.3.104 (Hostinger KVM)
- Sub-doc 668a: [Architecture](668a-architecture/)
- Sub-doc 668b: [LLM / Persona Safety](668b-llm-persona-safety/)
- Sub-doc 668c: [State / Persistence](668c-state-persistence/)
- Sub-doc 668d: [Security](668d-security/)
- Sub-doc 668e: [Deploy / Ops](668e-deploy-ops/)
- Sub-doc 668f: [Feature / UX Gaps](668f-feature-ux-gaps/)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Ship PR v2.13 (security hardening) | @Zaal | PR | Before ThyRev + Samantha onboard |
| Ship PR v2.14 (reliability + observability) | @Zaal | PR | Same sprint |
| Ship PR v2.15 (feature parity + UX) | @Zaal | PR | Same sprint |
| Update doc 662 to reference doc 668 findings + sprint plan | @Zaal | Doc edit | After v2.15 ships |
| Decide: rotate TELEGRAM_BOT_TOKEN that leaked into today's transcript? | @Zaal | Decision | Low priority per Zaal's call earlier |
| Schedule re-audit 4 weeks after v2.15 ships (regression check) | @Zaal | Calendar | After v2.15 |
