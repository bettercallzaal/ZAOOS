---
topic: identity
type: guide
status: research-complete
last-validated: 2026-05-23
related-docs: "542, 543, 544, 545, 546, 548, 549, 569, 570, 580, 581, 606, 665, 680, 717, 725"
original-query: "Bonfires and teach me all about it and how it works so I can share with another bot"
tier: STANDARD
---

# 726 - Bonfires: a hand-off guide so another bot can read + write the ZABAL knowledge graph

> **Goal:** Teach a second bot (CannonJones agent, a new Hermes worker, ZOEY, whatever) how the ZAO uses Bonfires - the auth model, the live endpoints, the payload shape, the failure modes, and the security guardrails. Written so a fresh agent can be online in an afternoon, plus links to the deeper research already in the library.

End-to-end **WRITES verified live 2026-05-23** via [doc 725](../../events/725-cannon-zabal-iman-hackathon-may23/) (17/17 episodes posted from VPS, status `Bonfire: 17 posted, 0 failed, 0 skipped`). READS via vector search are still gated until an admin runs labeling (a known constraint - see Failure Modes).

---

## Key Decisions (Recommendations FIRST)

| Decision | Verdict | Why |
|----------|---------|-----|
| **The new bot reads + writes the SAME ZABAL Bonfire as ZOE** - do NOT spin up a separate Bonfire | YES | Per the Bonfires model "one Bonfire can have many agents - all agents share the same knowledge graph, documents, vector store" (bonfires.ai obsidian publish docs). Splitting a graph defeats the point. The new bot identifies itself via `source_description` (e.g. `cannon:capture`), not via a separate Bonfire. |
| **The Bonfire API key stays on the VPS, never copies to laptops or per-bot machines** | YES | Pattern locked 2026-05-22 in [doc 717](../../agents/717-meeting-bonfire-posting-via-vps/). Every workflow SSHes to the VPS where `/home/zaal/zao-os/bot/.env` (or `/root/cowork-zaodevz/agent/.env` for the cowork variant) holds the key. Local secret-scan first, then ship + run remote. Mirrors the bonfire skill at `.claude/skills/bonfire/SKILL.md`. |
| **Use the bonfire-episode.sh script pattern, not a hand-rolled curl loop** | YES | Script already enforces: input validation, secret guard (9 HIGH-severity regex patterns), best-effort exit-0, per-episode reporting, jq-driven payload assembly. Re-implementing in a new bot is wasted work + risks dropping the secret guard. Just call `bash bonfire-episode.sh /path/to/episodes.json` from inside the bot. |
| **Build episode bodies as self-contained natural-language prose** | YES | Bonfires auto-extraction (Graphiti under the hood) reads prose and pulls entities + edges. A graph node has to stand on its own, so each body MUST name the people, the date, the project. `"On 2026-05-23, CannonJones committed to two ZABAL Games workshops in June."` is a good body. `"committed to two workshops"` is bad - no context, no extraction. |
| **`name` field is the dedup key - design it to be stable** | YES | Re-posting the same `name` updates the episode rather than creating a duplicate. Use patterns like `meeting:2026-05-23:decision-1`, `<bot>-capture:<unix-ms>:<i>`, `<bot>-task-add:<id>`. Don't include random uuids in `name` if you want idempotent re-runs. |
| **Reads degrade to manual-relay UNTIL admin labeling runs** | YES | `POST /vector_store/search` returns `{"success":true,"results":[],"count":0}` for non-admin keys until `/labeling/hybrid` is run by an admin. The 780+ episodes live in the graph and show in the dashboard, just not yet via API search. ZOE's `recall.ts` already handles this gracefully - copy that pattern for the new bot. Do NOT block the write path waiting on read; they are independent. |
| **For document/PDF ingest, use the Bonfire dashboard ingest connectors, not custom code** | YES | Bonfires bundles 30+ connectors (email, Slack, Discord, Telegram, Notion, Google Docs, PDF) per [doc 544](../544-bonfires-sdk-zao-wiring/). The new bot only owns its OWN episodes (decisions, captures, meetings). Bulk document ingest is a separate path Zaal runs from the dashboard. |
| **Use `source: "text"` for prose, `"message"` for chat-style multi-turn, `"json"` for structured data** | YES | Mirrors Graphiti's `EpisodeType.{text,message,json}`. We've used `"text"` exclusively so far - that's the right default for meeting decisions/actions. If a new bot is ingesting raw Telegram conversation, switch to `"message"` and format the body as `{role/name}: {message}` pairs. |

---

## What a Bonfire Actually Is (60-second model)

A Bonfire is a community's persistent knowledge store. ONE Bonfire owns:

- **Documents + chunks** (MongoDB) - all ingested content split into chunks.
- **Knowledge graph** (Neo4j via Graphiti) - entities, relationships, episodes extracted from text + conversations.
- **Vector store** (Weaviate) - semantic embeddings of chunks + labels.
- **Taxonomy + labels** - auto-generated multi-label classification, propagated chunk-by-chunk.

A Bonfire is NOT an agent. Agents are stateless interfaces that read/write to the Bonfire. **Many agents, one Bonfire, one shared graph.**

Diagram (from the public docs):

```
+---------------------------+
|         Bonfire           |
|                           |
|  Documents + Graph        |
|  Vectors + Taxonomy       |
+-----------+---------------+
            |
   +--------+----------+
   |        |          |
 Agent A  Agent B   Agent C
(Telegram) (Discord) (API/bot)
```

How content flows in:

1. **Conversation capture (auto):** every ~20 min, a background job pulls recent messages from each agent's stack, extracts entities + relationships, writes episodes to the graph. This is the Bonfire Telegram bot eating group chats and DMs.
2. **Document ingest (manual):** PDFs / text via dashboard or API connectors.
3. **Episode updates (API):** what we do - external bots POST episodes directly to `/knowledge_graph/episode/create`. This is the integration surface for a new bot.

Source: `https://publish.obsidian.md/bonfires/files/Technical/Bonfires` (bonfires.ai public docs).

---

## The Live API Surface (verified 2026-05-23)

### Base URL
```
https://tnt-v2.api.bonfires.ai
```
(`tnt-v2` is a named/versioned endpoint - the ZAO Genesis-tier endpoint. Configurable via `BONFIRE_API_URL` env, but in practice it's this.)

### Auth
Single bearer token per Bonfire:
```
Authorization: Bearer <BONFIRE_API_KEY>
```
- Issued from the Bonfires dashboard via signed message (Clerk auth).
- Single key per Bonfire, NOT per user or per agent. Multiple agents reuse the same key.
- The non-admin key can WRITE episodes and READ vector search. It CANNOT call `/labeling/hybrid` (admin-gated, returns 403).

### WRITE - create an episode (the primary integration point)

```http
POST /knowledge_graph/episode/create
Authorization: Bearer <key>
Content-Type: application/json

{
  "bonfire_id":       "69ef871f0d22ed7e6f2b243a",   // ZABAL bonfire id
  "name":             "<stable unique id>",          // dedup key
  "episode_body":     "<self-contained prose>",      // 1-3 sentences ideal
  "source":           "text",                        // or "message" / "json"
  "source_description": "<bot>:<event-type>",        // e.g. "zoe:capture", "meeting:cannon-iman-may23"
  "reference_time":   "2026-05-23T18:30:00.000Z"     // ISO UTC, when the fact occurred
}
```

Response: `200 OK` with `{ "success": true, "task_id": "..." }`. Auto-extraction runs async - graph nodes appear in the dashboard within seconds to a few minutes.

### READ - vector store search

```http
POST /vector_store/search
Authorization: Bearer <key>
Content-Type: application/json

{
  "bonfire_ref":   "69ef871f0d22ed7e6f2b243a",
  "search_string": "<natural-language query>",
  "limit":         5
}
```

Response: `{ "success": true, "results": [...], "count": N }`.

**Today (2026-05-23):** returns `count: 0` until an admin runs labeling on the ZABAL bonfire. Episodes are there, but the embeddings haven't been built into the labeled vector index yet. Treat read as **not live** until further notice - design the new bot to fall back to manual relay (see Failure Modes).

### MCP - alternative read/write surface

Bonfires ships an MCP server (per [doc 544](../544-bonfires-sdk-zao-wiring/) + the Graphify section of the public docs). Connect Claude Desktop / Cursor / a custom MCP client to query the Bonfire programmatically. Practical for human-in-the-loop research; less useful for an autonomous bot, where direct HTTP is simpler.

### Endpoints we have NOT verified

- `/knowledge_graph/<id>/episodes` (list/query episodes) - returns 404 with the non-admin key. List is dashboard-only today.
- `/labeling/hybrid` (run labeling pass) - 403 with non-admin key. Admin-gated.
- `/kengrams/*` (versioned subgraph operations) - documented in the SDK but we have not exercised them from the bot. [doc 544](../544-bonfires-sdk-zao-wiring/) covers the SDK path.

---

## ZAO Identifiers (so the new bot knows where to write)

| Name | Value | Used as |
|------|-------|---------|
| Bonfire ID | `69ef871f0d22ed7e6f2b243a` | `bonfire_id` field on writes, `bonfire_ref` on reads |
| Agent ID (ZABAL Bonfire Bot) | `69ef871f0d22ed7e6f2b243c` | Only relevant if calling agent-routing endpoints |
| Telegram surface | `@zabal_bonfire` | DM/group chat to the Bonfires-provided Telegram agent |
| Dashboard | `zabal.bonfires.ai` | Where episodes show up after POST, where labeling is run |
| Graph explorer | `graph.bonfires.ai` | Visual node/edge exploration |
| Genesis tier | Wallet-gated, custom pricing | We're not metered like an OpenAI API |

---

## How to Plug a New Bot In (the actual recipe)

### Option A - new bot lives on the VPS (recommended)

If the new bot runs on the same VPS as ZOE / cowork-zaodevz, it already has access to `BONFIRE_API_KEY` + `BONFIRE_ID` via the existing `.env` files. To post:

```bash
# 1. Build episodes JSON anywhere (local or on-VPS).
cat > /tmp/cannon-episodes.json <<'EOF'
{
  "episodes": [
    {
      "name": "cannon:capture:2026-05-23-zaostock-cards-update",
      "body": "On 2026-05-23, CannonJones reported the ZAO Cards NFC networking cards are on track for the 2026-10-03 ZAOstock event. Two prototype designs in test print.",
      "source_tag": "cannon:capture"
    }
  ]
}
EOF

# 2. Source the existing env + run the existing script.
set -a && . /home/zaal/zao-os/bot/.env && set +a
bash /path/to/meeting/scripts/bonfire-episode.sh /tmp/cannon-episodes.json
```

Script output:
```
[bonfire] OK cannon:capture:2026-05-23-zaostock-cards-update
Bonfire: 1 posted, 0 failed, 0 skipped (of 1)
```

That's it. The new bot is now writing into the shared ZABAL Bonfire alongside ZOE, identifiable by `source_tag: "cannon:capture"` in the graph.

### Option B - new bot runs off the VPS

Mirror the laptop pattern from `.claude/skills/bonfire/SKILL.md`:

1. Bot builds the episodes JSON on its own machine.
2. Bot runs the secret-scan locally (the 9-pattern regex in `bonfire-episode.sh` lines 57-58).
3. Bot SCPs the JSON + the script to the VPS over its own SSH key (no shared cred unless intentional).
4. Bot SSHes to the VPS, sources the env, runs the script. Outputs come back over SSH.
5. **Key never leaves the VPS.**

For a TypeScript bot, the equivalent direct-HTTP code lives in `bot/src/zoe/recall.ts` - copy the `remember()` function (lines 83-122) and `containsSecret()` (lines 39-53) verbatim. Both functions are independent of the rest of ZOE.

### Option C - bot integrates via the Bonfires SDK

Use the Python SDK at `github.com/NERDDAO/bonfires-sdk` (canon branch, v0.4.0 as of [doc 544](../544-bonfires-sdk-zao-wiring/)). The SDK wraps the same HTTP endpoints plus the kEngram operations. Suitable if the new bot needs kEngram (versioned subgraph) work, not just episode writes.

---

## What to Write (and What Not To)

Episodes are facts the team wants the graph to remember. From ZOE's `mirrorTurn()` and the meeting skill's distribution, the canonical event types are:

| Episode type | When to write | Body shape | `source_description` |
|--------------|---------------|------------|----------------------|
| Capture | New fact the bot learned in conversation | "On <date>, <person> said/decided/learned: <fact>." | `<bot>:capture` |
| Task add | New action item assigned to a person | "On <date>, <bot> added a task for <person>: <description>." | `<bot>:task-add` |
| Task complete | Action item closed | "On <date>, <bot> marked task <id> complete<: outcome>." | `<bot>:task-done` |
| Side quest | New side initiative | "On <date>, <bot> added a side quest for <team>: <title>. <description>" | `<bot>:quest-add` |
| Decision | Team agreed to a course of action | "In the <event> on <date>, <team> decided: <decision>. Owner: <person>." | `<event>:decision-<i>` |
| Meeting summary | One per meeting | "On <date>, <people> had a <type> call. They covered <topics>. Decisions: <list>." | `meeting:<slug>` |
| Tuesday/follow-up | Scheduled future touchpoint | "Following the <date> call, <people> have a follow-up scheduled for <future-date>." | `meeting:<slug>:followup` |

DO write:
- Decisions with explicit owners + dates.
- Captured facts about people, projects, places.
- Action items that have a person + verb + outcome.
- One idea per episode (atomic graph nodes).

DO NOT write:
- API keys, private keys, tokens, mnemonics, wallet addresses (secret guard will block, but don't rely on it).
- Speculation, gossip, unverified claims.
- Giant blobs - split into multiple atomic episodes.
- Conversation transcripts verbatim - use `source: "message"` if you must, or summarize first.
- Anything with PII you wouldn't put in a public Slack.

---

## Failure Modes + How the Bot Should Degrade

| Failure | Symptom | Bot response |
|---------|---------|--------------|
| `BONFIRE_API_KEY` unset | Script exits 0 with `Bonfire: skipped (no key)` | Continue the rest of the workflow. Surface "skipped (no key)" to the operator. Never abort. |
| `BONFIRE_ID` unset | Same as above | Same. |
| Network down / API 5xx | curl returns non-2xx | `[bonfire] FAIL <name> - HTTP <code>`. Script keeps going through other episodes. Posted count drops but the workflow continues. |
| Secret-shape match in body | Body matches one of the 9 HIGH patterns | `[bonfire] SKIP <name> - body matched a secret pattern`. Skipped count goes up. NEVER post. The capture is not lost; flag to the operator. |
| Empty body | Body is `null` or blank | Silently skipped (no graph noise). |
| Vector search returns `[]` | Labeling not yet run | Fall back to manual relay - format a `RECALL: <query>` block, ask the user to paste into `@zabal_bonfire` DM, paste the reply back. Pattern lives in `recall.ts` `formatManualRelay()`. |
| Vector search returns `5xx` | Bonfire API outage | Same fallback as empty. Never tell the user "Bonfire is broken" - degrade silently to manual. |
| Duplicate `name` | Two POSTs with identical `name` | Second POST updates the first rather than creating a duplicate. Use this for idempotent re-runs; don't fear it. |
| Telegram bot says "storage currently disabled" | A Bonfires UI flag is OFF for that group/DM | This is the AGENT (Telegram side), not the API. Toggle "Disable Storing DM Messages" OFF in the Bonfires Notion/dashboard config, add the user to allowed DMs. [doc 544](../544-bonfires-sdk-zao-wiring/) section "Why Storage Currently Disabled Appears" has the full diagnosis. |

---

## Security + Guardrails (do not skip)

1. **Secret guard runs LOCAL, before anything leaves the machine.** Mirrors `recall.ts containsSecret()` and `bonfire-episode.sh` regex line 58. Both must stay in sync.
   ```regex
   sk-ant-[A-Za-z0-9_-]{20,}                       (Anthropic)
   sk-(proj-|cp-)?[A-Za-z0-9_-]{30,}               (OpenAI)
   ghp_[A-Za-z0-9]{36}                             (GitHub PAT)
   github_pat_[A-Za-z0-9_]{60,}                    (GitHub fine-grained)
   -----BEGIN ([A-Z]+ )?PRIVATE KEY-----           (PEM)
   0x[0-9a-fA-F]{64}                               (Ethereum private key)
   [0-9]{9,12}:[A-Za-z0-9_-]{30,}                  (Telegram bot token)
   xox[bpaors]-[A-Za-z0-9-]{10,}                   (Slack)
   AKIA[0-9A-Z]{16}                                (AWS access key)
   ```
   Add to this list when a new secret format appears in ZAO's stack. Never remove.

2. **Key lives only on the VPS.** New bots that aren't on the VPS SSH in to use it - they do not copy the key. Pattern locked [doc 717](../../agents/717-meeting-bonfire-posting-via-vps/).

3. **Episodes are public-ish.** Treat the bonfire as a shared team notebook. Anyone with the bot's access can read it (once labeling runs). Don't put anything sensitive in.

4. **Best-effort writes.** A Bonfire failure must NEVER abort a larger workflow (a meeting capture, a chat reply, a bot turn). Script exits 0; the bot continues.

5. **Best-effort reads.** Until labeling runs, the bot assumes vector search returns nothing and falls back to manual relay. Do not branch your logic on "what if Bonfire is offline" - branch on `count > 0`.

---

## How ZOE Does It Today (reference implementation, do not skip reading)

ZOE's bridge is `bot/src/zoe/recall.ts` (293 lines). The interface another bot should copy:

```typescript
// Write
const r = await remember({
  body: "On 2026-05-23, ZOE captured a fact about CannonJones: he committed to two ZABAL Games workshops.",
  name: "zoe-capture:1716494400000:0",
  sourceTag: "zoe:capture"
});
// r = { ok: true, taskId: "..." } | { ok: false, skipped: 'no-config'|'secret-detected'|'empty', error?: string }

// Read (degrades to manual relay when vector store is empty)
const result = await recall({
  query: "what did CannonJones commit to on the May 23 call?",
  reason: "user asked about CannonJones progress",
  expected_kind: "decision"
});
// result = { kind: 'sdk_response', text: "- ..." } | { kind: 'manual_relay_needed', relay: "Paste into @zabal_bonfire..." }
```

Turn-mirroring (auto-write whenever the bot does something interesting):

```typescript
const { mirrored, skipped } = await mirrorTurn({
  captures: result.captures,   // any new facts learned
  task_ops: result.task_ops,   // task add/complete from this turn
  quest_ops: result.quest_ops  // side quests added/promoted
});
// Returns { mirrored: 7, skipped: 0 } typically. Best-effort, never throws.
```

A new bot should expose the same three primitives - `remember()`, `recall()`, `mirrorTurn()` - so its surface looks like ZOE's. That keeps the Bonfire ingestion pattern uniform across bots.

---

## The Read Path Will Unlock (and what changes)

Today: vector search returns `[]`. Labeling is admin-gated; only Zaal-as-admin can run `/labeling/hybrid` on the ZABAL bonfire.

When labeling runs:
- Existing 780+ episodes get embedded into the labeled vector index.
- New episodes get auto-labeled on a ~20-minute background cadence.
- `POST /vector_store/search` returns relevant chunks.
- The `recall()` fallback to manual relay stops triggering - bots can answer "what did we decide last Tuesday?" from the graph alone.

What a new bot should do TODAY to be ready:
- Implement the manual-relay fallback first. Verify it works.
- Implement the vector-search call second. Verify it returns `[]` cleanly.
- The day labeling runs, no code changes - the `count > 0` branch starts firing.

---

## Sources

- [FULL] [Bonfires technical overview - bonfires.ai obsidian publish](https://publish.obsidian.md/bonfires/files/Technical/Bonfires) - the canonical "what is a Bonfire" doc. Covers stack (Neo4j + Weaviate + MongoDB), agent model, content pipeline, search surfaces, MCP integration. Verified via exa web_search 2026-05-23.
- [FULL] [Bonfires landing - mint.bonfires.ai](https://mint.bonfires.ai/) - subscription model, Knowledge Network monetization, multi-platform agent surfaces.
- [FULL] [Graphiti add_episode docs - help.getzep.com](https://help.getzep.com/graphiti/core-concepts/adding-episodes) - upstream library; confirms `source` / `episode_body` / `source_description` / `reference_time` / `name` schema. Source types `text`, `message`, `json`.
- [FULL] [Graphiti add_episode mintlify mirror](https://getzep-graphiti.mintlify.app/guides/adding-episodes) - same content, cleaner formatting, parameter table.
- [FULL] `bot/src/zoe/recall.ts` (293 lines, this repo) - live ZAO production code. `remember()` lines 83-122, `recall()` lines 187-207, secret patterns 39-49, mirror function 219-293.
- [FULL] `.claude/skills/meeting/scripts/bonfire-episode.sh` (107 lines, this repo) - the shell pattern, secret guard regex, best-effort exit code.
- [FULL] `.claude/skills/bonfire/SKILL.md` - the SSH-via-VPS pattern, key-on-VPS-only constraint, posting recipe.
- [FULL] [Doc 544 - Bonfires SDK ZAO wiring](../544-bonfires-sdk-zao-wiring/) - SDK capability matrix, "storage currently disabled" diagnosis, agent isolation model, kEngram pattern.
- [FULL] [Doc 542 - bonfires.ai KG BCZ Strategies](../542-bonfires-ai-knowledge-graph-bcz-strategies/) - architecture, 30+ connectors list, BCZ-specific framing.
- [FULL] [Doc 549 - Bonfire personal second brain](../549-bonfire-personal-second-brain/) - personal-bonfire pattern (single user / Zaal flavour).
- [FULL] [Doc 569 - Yapz bonfire ingestion strategy](../569-yapz-bonfire-ingestion-strategy/) - episode-shape conventions for a bot ingesting podcast-style content.
- [FULL] [Doc 717 - meeting bonfire posting via VPS](../../agents/717-meeting-bonfire-posting-via-vps/) - the why behind the key-on-VPS-only constraint, design doc.
- [FULL] [Doc 680 - meeting skill bonfire bridge](../../agents/680-meeting-skill-bonfire-bridge/) - per-meeting real-time vs bulk-ingest pipeline distinction.
- [FULL] [Doc 725 - ZAO Devz call 2026-05-23](../../events/725-cannon-zabal-iman-hackathon-may23/) - reference recap; its 17 episodes were used as the live verification for this doc.

---

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Ask Joshua.eth / Bonfires admin to run `/labeling/hybrid` on the ZABAL bonfire so vector search unblocks | Zaal | Bonfires DM | Before Tuesday CannonJones meeting (read path useful by then) |
| Decide whether CannonJones bot lives on the existing VPS (Option A) or runs off-VPS via SSH (Option B) | Zaal | Decision | Before any code is written |
| Mirror `recall.ts` `remember()` + `containsSecret()` into the new bot's repo when started | New bot author | Code | At bot bootstrap |
| Add a regression test that posts a synthetic episode + verifies the dashboard reflects it | New bot author | Test | First sprint |
| When labeling unlocks, write a follow-up doc capturing the search-quality + ontology drift over time | Zaal | Research doc | 30 days after labeling |
| Keep the secret guard regex (in `recall.ts` lines 39-49 + `bonfire-episode.sh` line 58) in sync across both surfaces | Whoever edits either | Discipline | Per edit |

---

## Also See

- [Doc 544 - Bonfires SDK ZAO wiring](../544-bonfires-sdk-zao-wiring/) (DEEP) - SDK capability matrix, the official complement to this doc
- [Doc 717 - meeting bonfire posting via VPS](../../agents/717-meeting-bonfire-posting-via-vps/) - design doc for the SSH pattern
- [Doc 680 - meeting skill bonfire bridge](../../agents/680-meeting-skill-bonfire-bridge/) - per-meeting integration design
- [Doc 581 - bonfire graph wipe + bot hygiene](../581-bonfire-graph-wipe-bot-hygiene/) - what NOT to write + cleanup playbook
- [Doc 549 - Bonfire personal second brain](../549-bonfire-personal-second-brain/) - alternative single-user pattern
