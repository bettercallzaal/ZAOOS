---
topic: agents
type: decision
status: research-complete
last-validated: 2026-05-21
related-docs: 650, 665, 668
tier: DEEP
parent-doc: 668
---

# 668d — ZAOcoworkingBot ↔ ZABAL Bonfire Integration Spec

> **Goal:** Concrete implementation spec for piping ZAOcoworkingBot events into the ZABAL Bonfire. Triggered by Zaal in DM: "we should have a place where we can add things to it from the ZAO coworking as things and todos are finished." This is the V1 use case from Doc 665 made concrete + ready-to-build.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Build using current public CLI surface (subprocess `bonfire kengram batch`) | YES, ship now | Doc 665 confirmed the CLI is stable. Don't wait for Ryan's new SDK; swap to native call when it drops (zero rework). |
| Pipe ALL events (`/add`, `/wip`, `/done`, `/assign`), not just `/done` | YES | Lifecycle context > completion context. Future agents need to know what was started + what got dropped vs shipped. |
| Tag every event with brand (`The ZAO` / `WaveWarZ` / `COC Concertz` / `ZAOstock` / `BCZ Strategies` / `ZABAL Games` / etc) | YES | The user said "across all brands." Brand-tagged nodes let ZOE answer brand-scoped questions. |
| Block user action if Bonfires API fails | NO — graceful degradation | Bot UX > strict provenance. Queue retries via a local sqlite/jsonl spool; replay on next success. |
| Write directly to the canonical ZABAL bonfire (id: TBD; Zaal has key) | YES, Phase 1 | Per Zaal: "I have the api key." One bonfire = one knowledge graph = simplest mental model. Multi-bonfire fanout = Phase 3. |
| Use Bonfires SDK Python via subprocess vs native Node call to REST API | Subprocess MVP, REST native upgrade | Bonfires SDK is Python; bot is Node TS. Subprocess `execFile('bonfire', ['kengram', 'batch', '--json', '-'])` works in ~30 lines. Native REST API call would be ~60 lines + auth handling. Ship subprocess first, swap if latency becomes a problem. |

## Architecture

```
ZAOcoworkingBot Telegram event
  → bot/src/teams/commands.ts dispatch handler
  → existing /add /wip /done /assign branches
  → NEW: after action commits to local store, call bonfireHook(event)
  ↓
bot/src/teams/bonfire.ts (NEW FILE, ~80 LoC)
  exports async function bonfireHook(event: TeamEvent): Promise<void>
  ↓
execFile('bonfire', ['kengram', 'batch', '--to', BONFIRE_ID, '--sync', '--json', '-'])
  stdin: JSON changeset
  ↓
https://tnt-v2.api.bonfires.ai
  ↓
ZABAL bonfire kEngram update (merkle-rooted, content-addressed)
```

## Event Taxonomy → kEngram Changeset

Each command in ZAOcoworkingBot maps to a changeset JSON. All node UUIDs use `"auto"` for UUID4 generation. Edge `source`/`target` resolve by name first, then existing manifest.

### `/add <title>` — create a todo

```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:<id>",
      "summary": "<title>",
      "labels": ["Todo", "Open", "<brand>"]
    }
  ],
  "edges": [
    { "source": "todo:<id>", "target": "<creator-username>", "name": "CREATED_BY", "fact": "<utc-iso-timestamp>" },
    { "source": "todo:<id>", "target": "<brand>", "name": "BELONGS_TO" }
  ]
}
```

### `/wip <id>` — mark in-progress

```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:<id>:wip",
      "summary": "Marked in-progress at <utc>",
      "labels": ["TodoEvent", "InProgress", "<brand>"]
    }
  ],
  "edges": [
    { "source": "todo:<id>:wip", "target": "todo:<id>", "name": "UPDATES" },
    { "source": "todo:<id>:wip", "target": "<actor-username>", "name": "DONE_BY" }
  ]
}
```

### `/done <id>` — completion

```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:<id>:done",
      "summary": "Completed at <utc>",
      "labels": ["TodoEvent", "Done", "<brand>"]
    }
  ],
  "edges": [
    { "source": "todo:<id>:done", "target": "todo:<id>", "name": "COMPLETES" },
    { "source": "todo:<id>:done", "target": "<actor-username>", "name": "COMPLETED_BY", "fact": "<utc-iso-timestamp>" }
  ]
}
```

### `/assign <id> <owner>` — reassignment

```json
{
  "nodes": [
    {
      "uuid": "auto",
      "name": "todo:<id>:assigned",
      "summary": "Assigned to <owner> at <utc>",
      "labels": ["TodoEvent", "Assignment"]
    }
  ],
  "edges": [
    { "source": "todo:<id>:assigned", "target": "todo:<id>", "name": "UPDATES" },
    { "source": "todo:<id>:assigned", "target": "<owner>", "name": "ASSIGNED_TO" }
  ]
}
```

### `/setbrand <id> <brand>` (or auto-inferred) — brand assignment

If brand changes mid-lifecycle, write a new edge. Don't mutate the original `BELONGS_TO` (kEngrams are append-only).

## File Plan

| File | New / Modify | LoC est | Purpose |
|---|---|---|---|
| `bot/src/teams/bonfire.ts` | NEW | ~80 | Subprocess wrapper. Exports `bonfireHook(event)`. Handles spool/retry on failure. |
| `bot/src/teams/commands.ts` | MODIFY | +10-15 | After each successful command's local commit, call `bonfireHook(event)` non-blocking. |
| `bot/src/teams/spool.ts` | NEW | ~50 | Local jsonl spool at `~/.zao/teams/bonfire-spool.jsonl`. Append-only. Drained on next success. |
| `bot/.env.example` | MODIFY | +3 | Document `BONFIRE_API_KEY`, `BONFIRE_ID`, `BONFIRE_API_URL`. |
| `bot/README.md` | MODIFY | +1 paragraph | Mention the bonfire integration + how to verify (`bonfire kengram show <id>`). |

Total: ~130 LoC new code + ~15 LoC modifications. Estimated effort 3-4 hours.

## Auth Model

- `BONFIRE_API_KEY` lives in `~/.zao/teams/.env` (chmod 600) on the VPS, NOT in repo.
- Bot reads via `process.env.BONFIRE_API_KEY`.
- Bonfires CLI auto-loads from `~/.config/bonfires/config.env` per its config priority (Doc 665).
- Per `.claude/rules/secret-hygiene.md`: pre-commit hook scans for `BONFIRE_API_KEY=` literal value — block any commit that contains it.
- API key revealed via signed-message on app.bonfires.ai/dashboard. One-time per device.

## Brand Inference

ZAOcoworkingBot tracks multiple brands. Brand needs to land on every event.

Options for inferring brand from Telegram context:

1. **Per-group config** — each Telegram supergroup is configured to one brand. `/setbrand` admin command. Group → brand map in `~/.zao/teams/groups.json`. **Recommended.**
2. **Per-user default** — user picks default brand via `/setdefaultbrand`. Useful in DM context.
3. **Per-command tag** — `/add foo @WaveWarZ` style. Heavy UX, skip.

Phase 1: option 1 (per-group config). Phase 2: add option 2 fallback for DMs.

## Failure Mode

`bonfireHook` is non-blocking. The bot returns the OK reply to the user IMMEDIATELY (todo got added/done/assigned). The bonfire write is fire-and-forget.

```typescript
export async function bonfireHook(event: TeamEvent): Promise<void> {
  try {
    await execFile('bonfire', [
      'kengram', 'batch', '--to', process.env.BONFIRE_ID!,
      '--sync', '--json', '-'
    ], { input: JSON.stringify(buildChangeset(event)) });
  } catch (err) {
    // Spool for retry on next success
    await appendSpool(event);
    log.warn({ err, event }, 'bonfire write failed, spooled');
  }
}
```

On the next successful write, drain spool first.

If spool grows > N events (say 1000), alert via Telegram to Zaal: "bonfire is unreachable, spool is full." Then Zaal investigates.

## Verification Path

After any command, user (or ZOE) can verify the kEngram landed:

```bash
# CLI: show the kEngram for a recent todo
bonfire kengram show <kEngram-id>

# OR: search the KG
bonfire delve "What WaveWarZ todos completed this week?"
```

ZOE could expose a `/verify <id>` command in ZAOcoworkingBot that runs the above + replies with the result.

## Rollout Phases

**Phase 1 (this sprint, ~4 hours):** One-way write. Every command → kEngram. No reads back. Validate end-to-end.

**Phase 2 (post Ryan SDK drop):** ZOE reads back from bonfire for `/mine`, `/list`, `/team` queries instead of local sqlite. Means: ZOE's recall is full-history, not just last-N.

**Phase 3 (later):** Bidirectional. ZOE can write to bonfire on her own (not just team bot pipe). Cross-bot KG. ZAOstockTeamBot + Magnetiq + AttaBotty all pipe to the same bonfire.

## Cost Model

- Genesis NFT mint for ZABAL bonfire = 0.1 ETH (one-time, already done per Doc 665 / memory `project_bonfires_zao_integration.md`).
- Per-API-call cost: **unknown from public docs**. Open question for Ryan / Bonfires team. Flag as risk; if pricing is per-call, the high-volume write rate (potentially 50+/day across all brands as team grows) may need a budget conversation.
- Compute: subprocess cost is negligible (~10ms per `bonfire kengram batch`).

## Risks

| Risk | Mitigation |
|---|---|
| Bonfires API rate limits unknown | Spool model handles it; just queue and replay |
| Subprocess latency adds to bot turn time | `bonfireHook` is fire-and-forget; user gets reply immediately |
| Schema drift (Bonfires changes kEngram shape) | Doc 665 pinned version; spool isolates the failure |
| API key leaks via env/log/commit | Pre-commit hook + chmod 600 env file + don't log the key |
| Spool grows unboundedly | Alert at threshold; rotate spool weekly |
| ZAOcoworkingBot codebase is uncertain on where `commands.ts` lives | Read `bot/src/teams/` first to verify before writing code |

## Open Questions

1. **Exact path to ZAOcoworkingBot command handler.** Doc 650 said `bot/src/teams/`. Verify on disk.
2. **Brand-to-group mapping** — does `groups.json` already exist (referenced in `project_zoe_soul_architecture.md`), or do we create it?
3. **Bonfire ID for ZABAL** — Zaal has key + bonfire is at zabal.bonfires.ai. Need the actual `BONFIRE_ID` (likely shown in app.bonfires.ai/dashboard). Get this from Zaal.
4. **Pricing per API call** — Ryan to confirm.

## Cross-References

- [Doc 650](../../650-cowork-zaodevz-imanagent/) — ZAOcoworkingBot spec + command surface
- [Doc 665](../../665-bonfires-deep-dive-zao-integration/) — Bonfires architecture + V1 integration vector
- `project_bonfires_zao_integration.md` — chat transcript with Ryan + ZABAL bonfire status
- `bot/src/teams/` — ZAOcoworkingBot source (verify path)
- `~/.config/bonfires/config.env` — Bonfires CLI config (per Doc 665)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Get `BONFIRE_ID` from app.bonfires.ai dashboard | @Zaal | Local lookup | Today |
| Set `~/.zao/teams/.env` on VPS with `BONFIRE_API_KEY` + `BONFIRE_ID` (chmod 600) | @Zaal | VPS setup | Today |
| `pip install bonfires` on the VPS so the CLI is available to the bot's subprocess | @Zaal | VPS setup | Today |
| Confirm exact ZAOcoworkingBot handler path in `bot/src/teams/` | @Zaal or Hermes | Verification | Pre-build |
| Build + ship the integration (Phase 1, ~4 hours) | @Zaal + Hermes | PR | This week |
| Verify end-to-end with `bonfire delve` query after first `/done` | @Zaal | Smoke test | After PR merge |
| Ask Ryan about per-API-call pricing | @Zaal | DM | Pre-Phase-3 |

## Sources

- Doc 665 (Bonfires deep-dive, all primary sources cited there)
- Doc 650 (ZAOcoworkingBot spec)
- Zaal's DM context: "we should have a place where we can add things to it from the ZAO coworking as things and todos are finished"
- ZOE's session export ("I have api key for it" Zaal said in same DM thread)
- `project_bonfires_zao_integration.md` memory file
- `feedback_never_accept_pasted_secrets.md` + `.claude/rules/secret-hygiene.md` — auth model rules
