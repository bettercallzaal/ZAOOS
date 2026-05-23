# ZAO Context Handoff - for Ryan Kagy + the compiled new ZOE

> One file. Hand it to your bots, or have them fetch it. Every link resolves. This is everything they need to ingest ZAO context and rebuild ZOE without inheriting her current bugs.

Prepared 2026-05-20 for the Bonfires / ZAO agent partnership (docs 648, 682).

---

## 1. The one move that matters

The whole ZAOOS repo is public. Your bots can clone it and have the agent runtime + 200+ research docs in one shot:

```
git clone https://github.com/bettercallzaal/ZAOOS
```

Raw single-file fetch (for bots that pull URLs, not git):

```
https://raw.githubusercontent.com/bettercallzaal/ZAOOS/main/<path>
```

Browse: https://github.com/bettercallzaal/ZAOOS

---

## 2. ZOE the runtime - what to rebuild

Source: https://github.com/bettercallzaal/ZAOOS/tree/main/bot/src/zoe

| File | What |
|------|------|
| `index.ts` | Telegram entrypoint, command routing, `chunkMessage` |
| `concierge.ts` | the LLM turn - persona + memory + reply + task-op parse |
| `memory.ts` | the memory system - ring buffer + archive + context assembly |
| `types.ts` | `selectModel()` tiered routing (Sonnet/Opus/Haiku) |
| `recall.ts` | the Bonfire read/write bridge (your product) |
| `scheduler.ts` | morning brief + nudges crons |
| `brief.ts` / `reflect.ts` / `tasks.ts` / `sidequests.ts` / `groups.ts` | features |
| `persona.md` / `brand.md` / `README.md` / `USERGUIDE.md` | the written soul + docs |

### The bug to NOT inherit

ZOE's `memory.ts` writes every turn to a permanent archive (`appendArchive` -> `~/.zao/zoe/archive/<scope>/<month>.jsonl`) but `loadMemory()` only loads an 8-turn ring buffer into context. `readArchive()` exists and is never wired in. ZOE has a complete lifelong record and runs amnesiac past 8 turns.

**For the compiled ZOE: the lifestream must be LOADED, not just appended.** That single property is the point of the rebuild. Full analysis: README.md in this folder (doc 683).

---

## 3. ZOE's soul files - Zaal sends these directly

Not in the public repo (they hold Zaal's personal context). Zaal zips `~/.zao/zoe/` and sends:

| File | What |
|------|------|
| `persona.md` | voice, anti-patterns, format rules, elder/lineage |
| `human.md` | who Zaal is - now with the 4 closed gaps (SongJam/$SANG, Recoup, Infanity external, Ansuz external) |
| `bootloader-template.md` | the child-bot seed |
| `brand.md` | brand voice |
| `groups.json` | registered Telegram groups |
| `tasks.json` | open task queue |
| `archive/<scope>/*.jsonl` | **the lifestream corpus - every turn ZOE ever logged. This is the raw history to compress.** |
| `recent/<scope>.json` | the 8-turn ring buffer (the prompt window) |

---

## 4. Key research docs - verified links

The canonical ZAO context. All on `main`:

| Doc | Topic | Link |
|-----|-------|------|
| 050 | The ZAO complete guide | https://github.com/bettercallzaal/ZAOOS/tree/main/research/community/050-the-zao-complete-guide |
| 051 | ZAO whitepaper 2026 | https://github.com/bettercallzaal/ZAOOS/tree/main/research/community/051-zao-whitepaper-2026 |
| 079 | SongJam / $SANG | https://github.com/bettercallzaal/ZAOOS/tree/main/research/music/079-songjam-music-player-research |
| 460 | ZAO agentic stack end-to-end design | https://github.com/bettercallzaal/ZAOOS/tree/main/research/agents/460-zao-agentic-stack-end-to-end-design |
| 483 | Hermes agent + local-LLM framework | https://github.com/bettercallzaal/ZAOOS/tree/main/research/agents/483-hermes-agent-local-llm-framework |
| 601 | Agent stack cleanup - the 5 operating surfaces | https://github.com/bettercallzaal/ZAOOS/tree/main/research/agents/601-agent-stack-cleanup-decision |
| 647 | Agent quality deep research (persona decay, evals) | https://github.com/bettercallzaal/ZAOOS/tree/main/research/agents/647-agent-quality-deep-research |
| 648 | Ryan Kagy sync (the May 13/14 call) | https://github.com/bettercallzaal/ZAOOS/tree/main/research/agents/648-ryan-kagy-zao-civilization-sync |
| 669 | Bonfires - everything we know | https://github.com/bettercallzaal/ZAOOS/tree/main/research/agents/669-bonfires-everything-we-know |
| 673 | Meeting capture skill | https://github.com/bettercallzaal/ZAOOS/tree/main/research/dev-workflows/673-meeting-capture-skill |
| 680 | Meeting skill - Bonfire bridge | https://github.com/bettercallzaal/ZAOOS/tree/main/research/agents/680-meeting-skill-bonfire-bridge |

Pending on open PRs (not on `main` yet):

- **682** - Ryan Kagy Limitless call (May 12, the origin call): https://github.com/bettercallzaal/ZAOOS/pull/581
- **683** - ZOE troubles analysis (this folder): https://github.com/bettercallzaal/ZAOOS/pull/582

Whole research library (202 docs, 13 folders): https://github.com/bettercallzaal/ZAOOS/tree/main/research

> Note: the research library has a few duplicate doc numbers from parallel work (601, 676, 683 each appear twice). Always resolve a doc by its folder path, not the bare number.

---

## 5. The Bonfire - you already have a pre-extracted corpus

The ZABAL Bonfire is your product. ZAO context is already flowing into it:

- **bonfires.ai** | dashboard: **app.bonfires.ai/dashboard** | the ZAO bonfire: **zabal.bonfires.ai**
- API base: `https://tnt-v2.api.bonfires.ai`
- Write: `POST /knowledge_graph/episode/create` (works, non-admin key)
- Read: `POST /vector_store/search` (returns empty until labeling runs - admin-gated, `/labeling/hybrid` is 403 for the non-admin key)

What is in it: ~780 prior episodes, plus **57 meeting episodes** the ZAO `/meeting` skill auto-posted (Iman call, Tanja call, ZAOstock advisor, your May 12 Limitless call - all decisions + actions as episodes).

**Ask: run a labeling pass on the ZABAL bonfire.** That unlocks `vector_store/search`, and the compiled ZOE - and your bots - can read ZAO context straight from the graph you control. Right now everything is write-only on the non-admin key.

The ZOE-side Bonfire bridge that proves the API: https://github.com/bettercallzaal/ZAOOS/blob/main/bot/src/zoe/recall.ts

---

## 6. The ZAO agent stack - the map

5 operating surfaces (doc 601), Hermes locked as THE framework (2026-05-05):

| Bot | Role | Source |
|-----|------|--------|
| ZOE `@zaoclaw_bot` | concierge - tasks, captures, brief/reflect, recall | `bot/src/zoe/` |
| Hermes `@zoe_hermes_bot` | autonomous fix-PR pipeline (coder + critic + auto-PR) | `bot/src/hermes/` |
| ZAO Devz `@zaodevz_bot` | group dispatch + learning tips | `bot/src/devz/` |
| Bonfire `@zabal_bonfire` | knowledge graph (your product) | bonfires.ai |
| ZAOstock bot `@ZAOstockTeamBot` | festival team coordination | `bot/` root |

ZOE is the lineage elder - child bots inherit her voice + anti-patterns verbatim. The compiled ZOE inherits that role.

---

## 7. What the compiled ZOE needs to fix (from doc 683)

1. **Load the lifestream.** Not just append. The P0 bug.
2. **Chunk every send.** ZOE 400s on long scheduler sends (brief/nudges bypass the chunker).
3. **Honest self-description.** ZOE's persona text wrongly says it has no archive - it does.
4. **A real context window.** 8 turns loses group chats in ~2 minutes.

---

## 8. Stack reference

Next.js 16 / React 19 / TypeScript / Tailwind v4 / Supabase (RLS) / Neynar / XMTP / Stream.io / Wagmi + Viem / iron-session / Vitest / Biome. Bot runtime: Node + grammY (Telegram), Claude via CLI, tiered model routing. VPS: `31.97.148.88`.

---

That is the full handoff. Clone the repo, pull the soul zip from Zaal, run Bonfire labeling, and your bots have all of ZAO context. Questions -> the thread.
