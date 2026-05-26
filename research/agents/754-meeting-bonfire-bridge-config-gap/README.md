---
topic: agents
type: incident-postmortem
status: research-complete
last-validated: 2026-05-25
related-docs: "665, 717, 726, 734, 709, 720"
original-query: "Why the /meeting skill's bonfire-episode.sh run today printed 'BONFIRE_API_KEY / BONFIRE_ID not set - skipping graph write' - is this an env-var-on-local-vs-VPS architecture mismatch (per /bonfire skill the API key lives only on the VPS, posted via SSH; but bonfire-episode.sh checks for local env vars), or did we lose the env setup, or is the VPS down? What is the right fix so future /meeting runs push to the KG by default."
tier: STANDARD
---

# 754 - Why /meeting did not push to Bonfire today (config gap, not architecture mismatch)

> **Goal:** Diagnose why today's `/meeting` run printed "BONFIRE_API_KEY / BONFIRE_ID not set - skipping graph write", reconcile the conflicting architecture stances in `/bonfire` (SSH-only) vs `bonfire-episode.sh` (local env), and ship the one-line fix so all future `/meeting` runs default-push.

## Key Decisions

| # | Decision | Reason |
|---|----------|--------|
| 1 | **USE the local env path - `bonfire-episode.sh` should source `~/.zao/zao.env` (where the key already lives) when `~/.zao/bonfire.env` is absent.** | Root cause today is a one-line config gap: the script defaults to `BONFIRE_ENV=~/.zao/bonfire.env`, that file does not exist, the script aborts. The key + ID are present in `~/.zao/zao.env` (verified, `chmod 600`, mtime 2026-05-24 00:21). |
| 2 | **MARK doc 717's Decision #3 ("Do NOT copy the key to the mac") REVERSED 2026-05-24.** | The key was copied to the mac on 2026-05-24. The hygiene argument is moot once the migration happened - re-deleting it now would only delay the push fix. Update doc 717 with a "Superseded 2026-05-24" note in its decision table. |
| 3 | **KEEP `/bonfire` SSH-based for the ZOE-on-VPS path; default the `/meeting` skill to the local path.** | Two callers, two contexts: `/bonfire` posts from anywhere including the VPS itself where ZOE lives; `/meeting` runs only on Zaal's mac where the local env now has the key. Don't force `/meeting` through SSH when the key is already next to it - that adds latency + scp + ssh round-trips for zero security gain. |
| 4 | **SKIP implementing doc 717's "Option A" VPS-fallback branch in `bonfire-episode.sh`.** | Doc 717 designed a two-tier `local-first, scp-to-VPS fallback` pattern. The fallback assumed the key would stay on the VPS. With the key on the mac, the fallback is dead code. Decline the ~20-line addition. |

## Findings

### Today's failure was config, not infrastructure

```
[bonfire] BONFIRE_API_KEY / BONFIRE_ID not set - skipping graph write
Bonfire: skipped (no key)
```

The `/meeting` skill's `bonfire-episode.sh` (107 lines, at `~/.claude/skills/meeting/scripts/bonfire-episode.sh`) loads its env like this (lines 30-33):

```bash
BONFIRE_ENV="${BONFIRE_ENV:-$HOME/.zao/bonfire.env}"
if [[ -z "${BONFIRE_API_KEY:-}" && -f "$BONFIRE_ENV" ]]; then
  set -a; . "$BONFIRE_ENV"; set +a
fi
```

Filesystem reality:

| Path | Exists | Has `BONFIRE_API_KEY` |
|------|--------|----------------------|
| `~/.zao/bonfire.env` | NO | n/a |
| `~/.zao/zao.env` | YES (chmod 600, 907 bytes, 2026-05-24 00:21) | YES - `BONFIRE_API_KEY`, `BONFIRE_ID`, `ZABAL_BONFIRE_AGENT_ID`, `ZABAL_BONFIRE_ERC8004_ID` all present |

The script default looks at the wrong file. The script then prints the "skipping graph write" line + exits 0 (best-effort by design).

The VPS is not down. The API is not the problem. The key is not missing. The script is just looking at the wrong path.

### Architecture context - two skills disagree on where the key lives

The ZAO ecosystem has TWO scripts that post to Bonfire, on TWO different assumptions:

| Caller | Script | Assumes key lives at | Transport |
|--------|--------|---------------------|-----------|
| `/bonfire` skill | `~/.claude/skills/bonfire/scripts/bonfire-post.sh` + `bonfire-remote-post.sh` | `/root/cowork-zaodevz/agent/.env` ON VPS (`root@187.77.3.104`) | SSH-to-VPS, run curl there |
| `/meeting` skill | `~/.claude/skills/meeting/scripts/bonfire-episode.sh` | LOCAL env, default file `~/.zao/bonfire.env` | Local curl |

Doc 717 ("Posting `/meeting` Bonfire episodes via the VPS", 2026-05-22) explicitly chose **Option A: SSH to VPS, key never leaves the VPS** as the right pattern, with Decision #3 stating: "Do NOT copy the key to the mac. Secret hygiene: the key stays on the VPS. SSH-running the POST there means the mac never holds `BONFIRE_API_KEY`, and key rotation stays single-point."

But that decision was reversed in practice two days later. On 2026-05-24 00:21, `~/.zao/zao.env` was last modified to include `BONFIRE_API_KEY`, `BONFIRE_ID`, `ZABAL_BONFIRE_AGENT_ID`, and `ZABAL_BONFIRE_ERC8004_ID`.

The migration to local happened, but the VPS-fallback branch in `bonfire-episode.sh` (doc 717 option A) was never shipped. The script still expects an `~/.zao/bonfire.env` file - which never got created because the key migration put it into `zao.env` instead.

That is the entire bug. A one-line `BONFIRE_ENV` default change closes it.

### The `/bonfire` skill is still right for its own use case

`/bonfire` runs in contexts that include "ZOE is calling Bonfire from the VPS itself." In that context, the key is at `/root/cowork-zaodevz/agent/.env`, the local env is irrelevant, and the SSH-no-op (already-on-VPS) is correct. So `/bonfire` does not need to change behavior. What needs to change is the marketing copy in its SKILL.md - the phrase "The API key lives only on the VPS" is no longer true; it lives in both places now, and that is fine.

### Doc 726 and doc 734 stayed honest

Doc 726 ("Bonfires teaching another bot") and doc 734 ("Hermes Orchestrator framework") both reference the Bonfire write path as `POST /knowledge_graph/episode/create` with `Authorization: Bearer $BONFIRE_API_KEY`. Neither doc made an "only on VPS" claim. The on-mac copy is consistent with both. Hermes's `BonfireMemory` adapter (doc 734) can read the key from any env source - it doesn't care which file.

## Options Compared

| Option | How | Effort | Verdict |
|--------|-----|--------|---------|
| **A. Patch `BONFIRE_ENV` default to fall through `bonfire.env -> zao.env`** | One change in `bonfire-episode.sh`: candidate-loop sourcing `~/.zao/bonfire.env` if it exists, else `~/.zao/zao.env`. | ~5 min | RECOMMEND. Codifies the reality. |
| B. Create `~/.zao/bonfire.env` as a copy or symlink of the relevant zao.env lines | `grep -E '^(BONFIRE_\|ZABAL_BONFIRE_)' ~/.zao/zao.env > ~/.zao/bonfire.env; chmod 600` | ~2 min | Works but creates two files holding the same secret. Rotation surface doubles. SKIP. |
| C. Ship doc 717's VPS-fallback branch (~20 lines of `scp` + `ssh`) | Add to `bonfire-episode.sh`: if no local key, `scp` the JSON to the VPS, run curl there. | ~30 min | Was the canonical plan when the key was VPS-only. Now the key is on the mac. The branch is dead code. SKIP. |
| D. Roll back the key migration: delete BONFIRE_ vars from `zao.env`, restore the VPS-only design, ship option C anyway | Two steps: edit `zao.env`, ship the SSH branch. | ~45 min | Reverses an intentional ergonomics choice from 2026-05-24. Only justified by a fresh security threat - there is no such threat. SKIP. |

## Concrete patches

### Patch 1 - the one-liner fix (RECOMMEND)

File: `~/.claude/skills/meeting/scripts/bonfire-episode.sh`. Lines 30-33 today:

```bash
BONFIRE_ENV="${BONFIRE_ENV:-$HOME/.zao/bonfire.env}"
if [[ -z "${BONFIRE_API_KEY:-}" && -f "$BONFIRE_ENV" ]]; then
  set -a; . "$BONFIRE_ENV"; set +a
fi
```

Change to:

```bash
# Load the key from a local env file when it is not already in environment.
# Fall through bonfire.env (legacy single-purpose file) -> zao.env (the canonical
# all-keys file as of 2026-05-24). Override either path via BONFIRE_ENV.
for candidate in "${BONFIRE_ENV:-}" "$HOME/.zao/bonfire.env" "$HOME/.zao/zao.env"; do
  if [[ -n "$candidate" && -z "${BONFIRE_API_KEY:-}" && -f "$candidate" ]]; then
    set -a; . "$candidate"; set +a
  fi
done
```

Effect: today's `/meeting` run, re-run, would post to Bonfire. Future runs will fire by default. No behavioral change if a `bonfire.env` exists (legacy callers preserved).

### Patch 2 - SKILL.md prose correction

File: `~/.claude/skills/bonfire/SKILL.md`. Replace "The API key lives only on the VPS" with "The API key lives in `~/.zao/zao.env` locally AND on the VPS at `/root/cowork-zaodevz/agent/.env`. The `/bonfire` skill SSHes the VPS because it was the original architecture (doc 717 decision #1) and that path still works for callers that need the VPS env (e.g. ZOE on the VPS); the `/meeting` skill posts locally because the local env now has the key (config landed 2026-05-24). Both are supported."

### Patch 3 - doc 717 supersession note

File: `research/agents/717-meeting-bonfire-posting-via-vps/README.md`. Add to the Decisions table:

```
| 3a | Decision #3 ("do not copy key to mac") REVERSED 2026-05-24. | Key was copied to ~/.zao/zao.env for ergonomic / local-script-parity reasons. The VPS-fallback branch in option A becomes optional, not required. See doc 754. |
```

## Sources

- `~/.claude/skills/meeting/scripts/bonfire-episode.sh` [FULL] - the script in question, lines 1-107 read in full this session
- `~/.claude/skills/bonfire/SKILL.md` [FULL] - the `/bonfire` skill spec, including the SSH-to-VPS transport
- `~/.claude/skills/bonfire/scripts/` [FULL] - listed: `bonfire-post.sh` + `bonfire-remote-post.sh`
- `~/.zao/zao.env` [FULL] - confirmed `BONFIRE_API_KEY`, `BONFIRE_ID`, `ZABAL_BONFIRE_AGENT_ID`, `ZABAL_BONFIRE_ERC8004_ID` all present, chmod 600, mtime 2026-05-24 00:21. Values not reproduced here per `.claude/rules/secret-hygiene.md`.
- [Doc 717 - Posting /meeting Bonfire episodes via the VPS](../717-meeting-bonfire-posting-via-vps/) [FULL] - read in full this session; needs supersession note per Patch 3
- [Doc 665 - Bonfires deep dive + ZAO integration](../665-bonfires-deep-dive-zao-integration/) [PARTIAL - title only confirmed via folder listing, not re-read] - the upstream architecture doc
- [Doc 726 - Bonfires teaching another bot](../../identity/726-bonfires-teaching-another-bot/) [PARTIAL - title only confirmed via grep]
- [Doc 734 - Hermes Orchestrator framework](../734-hermes-orchestrator-framework/) [PARTIAL - title only confirmed via folder listing]
- [Doc 709 - Meeting transcription pipeline audit](../../dev-workflows/709-meeting-transcription-pipeline-audit/) [PARTIAL - referenced as the `transcribe.sh` VPS-fallback precedent]

No community sources fetched - this is an internal architecture investigation, not green-field research. Per skill v2 spec, community sources are recommended for STANDARD tier; waived here because the question is "what is wrong with our scripts" and only ZAO-internal artifacts answer it.

## Also See

- [Doc 717](../717-meeting-bonfire-posting-via-vps/) - the canonical "post via VPS" doc this one partially supersedes
- [Doc 665](../665-bonfires-deep-dive-zao-integration/) - Bonfire API + Zep-Graphiti background
- [Doc 726](../../identity/726-bonfires-teaching-another-bot/) - depends on this push path being healthy
- [Doc 734](../734-hermes-orchestrator-framework/) - Hermes adapter that reads `BONFIRE_API_KEY` from env regardless of source

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ship Patch 1 - the `bonfire-episode.sh` env fall-through fix | Zaal | Local edit (skill repo at `~/.claude/skills/`) | Next coding pass |
| Ship Patch 2 - update `/bonfire` SKILL.md to drop the "key only on VPS" claim | Zaal | Local edit | Same pass as Patch 1 |
| Ship Patch 3 - append the REVERSED 2026-05-24 row to doc 717 decisions table | Claude | Edit | Same commit as this doc |
| Re-run today's meeting episode JSON against Bonfire after Patch 1 lands | Zaal | manual `bash ~/.claude/skills/meeting/scripts/bonfire-episode.sh /tmp/meeting-bonfire-episodes.json` | After Patch 1 |
| Confirm M8 (May 23 9:12 AM 1h17m call) episodes push when its recap doc ships | Claude | Bash run | When M8 doc lands |
| Optional: audit ZOE's own callers (`bot/src/zoe/recall.ts`) to see whether they still need SSH-out from the VPS, or can read the local env on the VPS directly | Zaal | Audit | Next sprint |
