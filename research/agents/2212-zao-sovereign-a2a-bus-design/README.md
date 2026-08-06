---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-06
related-docs: "2184, 2124, 2138, 2190"
original-query: "id rather make my own bus and ask jim how to do it rather than use his - scope ZAO's own A2A bus"
tier: STANDARD
---

# 2212 - ZAO's own sovereign A2A bus (design + build plan)

> **Goal:** Zaal (2026-08-06): build ZAO's OWN agent-to-agent message bus rather than ride Jim's (tasern.quest) as our transport - so ZAO stays sovereign (doc 2184). Match Jim's proven contract so the two interoperate, then terminate at DreamNet's Federation Gateway via a Spore adapter. This specs the bus; a peer "how did you build yours" ask is out to Jim (bus msg 45d4344f).

## Why our own (not Jim's)

Riding Jim's bus as ZAO's transport makes ZAO's federation edge depend on Jim's uptime + his token issuance. The doc 2184 principle is the opposite: **shared protocols, separate sovereignty** - if any one piece drops, each side keeps running. So ZAO runs its own bus; partners (Jim, future A2A partners) get a scoped token to OUR bus; and both buses terminate at DreamNet through a Spore adapter. Same shape, independent infra.

## The contract to match (Jim's bus, observed 2026-08-06)

Jim's `tasern.quest/bus` is the reference shape - clean + proven. ZAO's bus mirrors it:

| Route | Method | Purpose |
|-------|--------|---------|
| `/bus/send` | POST | `{to, subject, body}` + `Authorization: Bearer <token>` |
| `/bus/messages?status=new` | GET | poll new messages addressed to the caller |
| `/bus/messages/<id>` | PATCH | `{status:"read"}` - mark handled |
| `/bus/files/upload?name=X` | POST | `--data-binary` file share (cap ~50MB) |
| `/bus/files` / `/bus/files/<name>` | GET | list / download shared files |

Semantics: each partner sees only its own thread + files shared with it; messages route to a named recipient (`to`); an agent polls hourly (or webhooks later). Token is **separate from all internal keys** and rotatable in one command.

## Architecture (the Brandon fit)

```
Partner agent (Jim / future)          ZOE / ZAO agents
        |  Bearer token (partner-scoped)        |
        v                                        v
   ZAO A2A bus  (send / poll / files, per-partner threads)   <- THIS DOC
        |  raw JSON + files
        v
   Spore compatibility adapter  (wrap -> SporeEnvelope v1, quarantine, hash)
        |
        v
   DreamNet Federation Gateway  (identity / audience / nonce / TTL / capability lease / receipts)
        |
        v
   Read-only capability agents  (Stage 0: contract.analysis.readonly, etc.)
```

The bus is JUST transport (raw JSON + files + per-partner auth). Spore wrapping, quarantine, verification, receipts are the ADAPTER's job (`src/lib/dreamnet`, doc 2184). Keep the layers clean.

## Design decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Node + a tiny HTTP service** (Express/Hono or a bare `http` server), **Supabase** (or a JSON/SQLite store) for messages + a storage bucket for files. | Reuse ZAO's stack; messages/threads/files persist across restarts. |
| 2 | **Per-partner scoped tokens** in `~/.zao/private/bus-partners.json` (chmod 600), each mapping token -> `{partnerId, scope}`. A token authenticates ONLY to the bus - **never an internal ZAO/DreamNet credential** (doc 2184 rule). | Sovereignty + revocability; matches Jim's separation. |
| 3 | **Thread isolation:** a partner sees only messages where `to`/`from` is itself + files shared on its thread. No cross-partner visibility. | Same as Jim's; multi-tenant safe. |
| 4 | **Files land in quarantine first** - stored, hashed (sha256), registered as an evidence ref; NO internal agent auto-consumes until the adapter/Zaal accepts. | Doc 2184 boundary; secret/PII scan before any agent reads (secret-hygiene, pii-hygiene). |
| 5 | **Exposure:** bound to localhost / gated reverse-proxy, NOT open (task #54 decision). Partners reach it via the gateway/tunnel, not a public 0.0.0.0. | The session-start bus security-flag stands. |
| 6 | **Poll first, signed webhooks later** (Jim's pattern). ZOE reads new messages on its existing tick + pings Zaal. | Ship the simple thing; webhooks are a v2. |
| 7 | **Receipts:** every send/read/download emits a receipt (ties into DreamNet `dreamnet.receipt.v1` + Proof Drops). | Doc 2184 receipts row; audit trail. |

## Build plan (phases, PR-only)

1. **Bus core** - the HTTP service + storage: `/send`, `/messages` (GET/PATCH), per-partner token auth, thread isolation. Localhost-bound. Tests for auth + isolation.
2. **File share** - `/files/upload` (quarantine + sha256), `/files` list/download, size cap, secret/PII scan pre-accept.
3. **ZOE integration** - ZOE polls the bus on its tick, surfaces new partner messages to Zaal (button question), replies via `/send`. Reuse the `a2a` skill shape.
4. **Spore adapter wire** - connect the bus output to `src/lib/dreamnet` so a message/file can be wrapped into SporeEnvelope v1 for the DreamNet canary (doc 2184). Flag-gated OFF until the canary passes.
5. **First canary** - the Solidity file: bus upload -> adapter Spore-wrap -> DreamNet verify -> quarantine -> read-only analysis -> receipt -> ACK.

## Also See

- [Doc 2184](../2184-dreamnet-tenant-organism-stage0/) - the sovereign tenant boundary this bus feeds · [Doc 2124](../2124-spore-interop-federation-v0.2/) / [Doc 2138](../2138-spore-phase3-cross-runtime-conformance/) - Spore
- `~/.claude/skills/a2a/SKILL.md` (the client pattern), `.claude/rules/secret-hygiene.md` / `pii-hygiene.md` (file quarantine)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Await Jim's reply (bus msg 45d4344f) on his stack/auth/gotchas; fold his guidance into phase-1 before building | Zaal | Wait | 2026-08-08 |
| Build phase 1 (bus core: send/poll + per-partner token auth + thread isolation, localhost, tests) | Zaal | PR | 2026-08-13 |
| Confirm the bus exposure model with the task #54 security decision before any non-localhost binding | Zaal | Decision | 2026-08-13 |

## Sources

- Jim's `tasern.quest/bus` contract - observed from Jim's setup message (screenshot, 2026-08-06); the `a2a` skill (`~/.claude/skills/a2a/SKILL.md`) - **[FULL]**
- Doc 2184 (tenant boundary + sovereignty principle + the Spore/adapter layering), ZAO `src/lib/dreamnet` + `src/lib/spore` - **[FULL]**
