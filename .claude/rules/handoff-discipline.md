# Handoff Discipline - succession is an artifact, and it lives in the vault

From doc 2319 (the handoff audit). The `lane_handoffs` Supabase table cited by older docs was never built; the vault is the system. History: `research/dev-workflows/2649-rules-history/archive/handoff-discipline.md`. Rule numbers are stable.

1. **One living brief per lane at `~/zao-vault/handoffs/<lane>.md`.** Git history is the version layer; no dated copies. Frontmatter: `lane, machine (mac|windows|vps|pi), repo, status (unconsumed|consumed|ready), written, context-pct-at-write`. Template `zao-vault/handoffs/TEMPLATE.md`. Soft cap ~200 lines; link out for anything bigger. Embed the session-summary tail (tasks, files, decisions).
2. **Write the handoff by 75% context.** If compaction fires and no fresh brief exists, emergency-dump a minimal one (current tasks, git state, open threads, last user directive) before continuing.
3. **Receiver flips `status: consumed` ON READ** and appends a 3-line "gaps found" note.
4. **Boot is one command:** `zao-lane-boot` boots every unconsumed brief for this machine; `--list` shows age + status. Morning order: phone daily note -> boot wave -> first grill round. Evening: per-terminal `/handoff`.
5. **Idle >1 day = hand off and close:** refresh the brief, `status: ready`, merge work back, kill the tmux session. Lanes are ephemeral; briefs are the persistent identity.
6. **Cross-lane map: `zao-vault/BLACKBOARD.md`, section WORK PACKETS.** One line per lane on session start + major ship (lane, doing, claimed doc numbers/branches). Read it BEFORE claiming a doc number. (Was handoffs/IN-FLIGHT.md until 2026-09-10.)
7. **Surface boundaries:**
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

   Anything that matters lands in handoff/board/vault BEFORE it rides a message. **Precedence when two disagree:** ICM box > rules > skills > research library > vault > board > agent memory. Use the newest APPROVED information, not merely the newest file. If the answer is in none of them, say what you could not find.
8. **Scratchpads hold nothing that outlives the session.** Anything referenced later lands in vault or repo before session end.
9. **People briefs: `zao-vault/handoffs/people/<name>.md`** - same discipline; PII-scanned; pasted to TG by Zaal (outbound stays his tap).
10. **Cross-device:** the vault syncs by git; each machine boots only its `machine:` briefs. Never mix a second sync layer (Obsidian Sync / iCloud) with the git vault.

**Metrics:** primary is waiting% (share of lane-hours spent WAITING); secondary: closed loops/week, taps per closed loop, capture-to-routed latency, restart debt hours.
