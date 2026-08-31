# Handoff Discipline - succession is an artifact, and it lives in the vault

Adopted 2026-08-18 from the handoff workflow audit (doc 2319; 36 decisions
grilled with Zaal across 9 rounds). Replaces the dated-file pileup in
`~/.zao/handoffs/` and corrects a drift: agent-loops rule 36 cites a
`lane_handoffs` Supabase table (doc 2092) that was DESIGNED BUT NEVER BUILT -
verified absent from the cowork project 2026-08-18. The vault is the system now.

## The system (behavior-changing)

1. **One living brief per lane at `~/zao-vault/handoffs/<lane>.md`.** Git
   history is the version layer; no dated copies. Frontmatter contract:
   `lane, machine (mac|windows|vps|pi), repo, status (unconsumed|consumed|ready),
   written, context-pct-at-write`. Template: `zao-vault/handoffs/TEMPLATE.md`.
   Soft cap ~200 lines - link out to docs/vault for anything bigger. The brief
   embeds the session-summary tail (tasks, files, decisions) at write time.

2. **Write the handoff by 75% context.** A session that reaches 75% without a
   fresh brief for its lane writes one THEN, while it still has the context to
   write it well. The PreCompact hook enforces the floor: if compaction fires
   and no fresh brief exists, the session MUST emergency-dump a minimal one
   (current tasks, git state, open threads, last user directive) before
   continuing. The wavewarz failure (died at 90% with no brief) is the incident
   this kills.

3. **Receiver flips `status: consumed` ON READ, not on boot** - and appends a
   3-line "gaps found" note (what the brief was missing, what had to be
   rediscovered). That note is the quality loop; briefs compound.

4. **Boot is one command.** `zao-lane-boot` (zaal-dotfiles/bin, git-tracked)
   boots every unconsumed brief targeting the current machine; `--list` shows
   brief age + status (restart debt at a glance). Morning order: phone daily
   note -> boot wave -> first grill round. Evening: per-terminal `/handoff`
   (the skill upgraded as the universal /end - any lane can end clean at any
   moment and be resumable).

5. **Lane lifecycle: idle >1 day = hand off and close.** Write/refresh the
   brief, set `status: ready`, merge work back, kill the tmux session. The
   ready-list (briefs with `status: ready`) is the menu of attack sessions
   openable instantly. Lanes are ephemeral; briefs are the persistent identity.

6. **Cross-lane map: `zao-vault/handoffs/IN-FLIGHT.md`.** One line per lane on
   session start + major ship (lane, doing, claimed doc numbers/branches).
   Read it BEFORE claiming a doc number - two collisions on 2026-08-18 alone.

7. **Surface boundaries (ends the ambiguity):**
   | Surface | Job | Never |
   |---|---|---|
   | SendMessage / lane-send | live transport | the record |
   | Vault handoff | succession + founding state | task tracking |
   | Cowork board | task truth | knowledge storage |
   | Bonfire | knowledge, decisions, lore | operational state |
   | Research library (`research/NNNN-slug/`) | findings + decisions + the why, with sources | current task state |
   | Rules (`.claude/rules/*.md`) | operating policy binding every session | facts, task state |
   | Skills (`~/.claude/skills/`) | repeatable procedures | policy, one-off notes |
   | Agent memory (`~/.claude/projects/*/memory/`) | user + project facts needed at boot | operating lessons - those are rules |
   | ICM boxes | brand truth - what a ZAO brand IS | operational state |
   Anything that matters lands in handoff/board/vault BEFORE it rides a message.

   **Precedence, when two disagree:** ICM box (brand truth) > rules > skills >
   research library > vault > board > agent memory. The point is not that lower
   stores are less trustworthy - it is that recency alone must not decide, or a
   superseded decision wins for being the most recently touched file. Use the
   newest APPROVED information, not merely the newest file. If the answer is in
   none of them, say what you could not find (`anti-fabrication.md`) rather than
   filling the gap. The same table with each store's owner is in `CLAUDE.md`
   ("Where Knowledge Lives"); routing a CORRECTION into the right one is
   `agent-loops.md` rule 6.

8. **Scratchpads hold nothing that outlives the session.** Anything a handoff,
   doc, or another session will reference lands in vault or repo before session
   end. Two artifacts died with their sessions this week (ruleset.json,
   newsletter-craft-research.md). Extends `vanishing-dependencies.md`.

9. **People briefs: `zao-vault/handoffs/people/<name>.md`** - same discipline
   for human collaborators; PII-scanned, pasted to TG by Zaal (outbound stays
   his tap). The Motomoto stakeholder-reply is the standard closing move.

10. **Cross-device:** the vault syncs by git; each machine boots only its
    `machine:` briefs. VPS/Pi loops join after the disk fix. Phone reads and
    writes briefs via Working Copy. Never mix a second sync layer (Obsidian
    Sync / iCloud) with the git vault - doc 2317's #1 reported failure mode.

## Metrics (the weekly review reads these)

Primary: **waiting%** - share of lane-hours spent WAITING (from the existing
zao-cc-state stamps). Zaal: "if it had 50% time waiting we couldve done it in
half the time." Secondary: closed loops/week, taps per closed loop,
capture-to-routed latency, restart debt hours (now visible in
`zao-lane-boot --list`).

## Source

Doc 2319 (the audit). Siblings: `session-boundaries.md` (the handoff is the
artifact), `agent-loops.md` rule 36 (transport vs record - corrected by this
rule), `vanishing-dependencies.md`, doc 2092 (the unbuilt table this
supersedes), doc 2317 (vault-as-hub research).
