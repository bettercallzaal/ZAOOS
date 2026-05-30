# Handoff — ZOE research-quality work + live testing

**From:** Claude Code (web/cloud session, no SSH/Telegram access)
**To:** local terminal (has SSH to VPS + can DM `@zaoclaw_bot`)
**Branch:** `ws/zoe-research-quality-773`
**Date:** 2026-05-30

---

## Why this handoff exists

The cloud session can't `ssh zaal@31.97.148.88` (no ssh binary) and can't drive
Telegram, so ZOE can't be **live-tested** from there. Everything below needs a
local terminal. Code state is committed and clean.

## Where the code is

Latest commit on this branch:

- `8064e9a feat(zoe): split internal extraction from web research (doc 773)`
- `e7f90f0 feat(zoe): live progress bar + parallel-spawn ENOENT fix (doc 772)`
- `0e1eb05 fix(zoe): resolve 5 HIGH orchestrator audit findings (doc 771)`

Source of truth for the bot: `bot/src/zoe/`. Key files touched:
`decompose.ts`, `workers.ts`, `critics/`, `reflexion.ts`, `learn.ts`, `index.ts`.

## OPEN DECISION (blocking — needs Zaal)

PR #742 / doc 773 currently ships **all three**: `doc-extractor` worker +
decompose routing + source-aware critic (Zaal's original "do all of these").
A later click selected just **"Source-aware critic"** (the contained option).
These conflict. Two paths:

- **(A) Keep full #742** — recommended. Built, tested, green. The
  `doc-extractor → task-result-critic` split is the more correct fix.
- **(B) Slim to source-aware-only** — drop the `doc-extractor` worker +
  decompose routing, keep only the `research-critic.ts` prompt change.

**Do not proceed on either until Zaal confirms.**

## To LIVE-TEST ZOE (the original ask)

DM `@zaoclaw_bot` from phone/desktop Telegram:

1. `/start` → confirms alive
2. `/tasks` → see queue
3. `what should I focus on this morning` → tests Haiku/Sonnet/Opus routing
4. `note: testing the feedback loop` → should reply 👍 + pending count

Service health (run locally):

```bash
ssh zaal@31.97.148.88 "systemctl --user status zoe-bot.service"
ssh zaal@31.97.148.88 "journalctl --user -u zoe-bot.service -f"   # logs
```

Commands actually registered (verified in `index.ts`):
`/start /tasks /seed /quest /quests /vm (/voicememo) /notes /zg (admin)`
— plus free-form chat, `note:`/`cc:`/`claude:` prefix, 5am brief, 9pm reflect.

## Cleanup item (not blocking)

The `.claude/skills/vps/` skill still targets the **decommissioned openclaw
container** (killed 2026-05-04 per CLAUDE.md). It needs a rewrite to match the
current `bot/src/zoe/` systemd service (`zoe-bot.service`). The May-4
`bot/src/zoe/USERGUIDE.md` is also stale vs. the May-29/30 code.

## Suggested first move locally

1. Confirm the #742 decision (A vs B) with Zaal.
2. Live-test ZOE per the 4 DMs above.
3. If green, deploy; then optionally tackle the `/vps` skill rewrite.
