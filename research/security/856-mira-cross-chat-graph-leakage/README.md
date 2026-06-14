---
topic: security
type: threat-landscape
status: research-complete
last-validated: 2026-06-14
related-docs: "855, 799, 798, 781, 669"
original-query: "investigate the bots co-resident in the DeepMeeting group (Mira, Socratox, Sanctuary, Suma) - are they reading/federating with ZAO's knowledge graph?"
tier: STANDARD
---

# 856 - Mira cross-chat leakage of the ZABAL knowledge graph

> **Goal:** assess whether the third-party AI agents sharing the DeepMeeting
> Telegram group with ZAO's ZABAL Bonfire Bot are ingesting or leaking ZAO's
> private knowledge-graph context, and what to do about it.

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Keep Mira (`@mira`) OUT of the private graph-coordination group, but USE it elsewhere (content, explainer videos, translation, GCvlcnti's Brazil outreach) | Mira learns from every chat it joins and stores cross-chat memory on its own servers, outside ZAO control - bad for private graph internals. But it's a capable tool; the fix is a safe lane, not a ban. Use it for public/content/personal work, not where the ZABAL bot's architecture + strategy live. |
| 2 | Ask GCvlcnti to disable Mira's daily summaries + audit what it has stored | Daily recaps have run since ~2026-06-02; the already-ingested data lives on mira.tg servers. Reduce ongoing capture. |
| 3 | ADOPT a standing rule: no third-party bot/agent added to any ZAO coordination group without Zaal's explicit approval | The leak happened because bots were added freely. Gate it. |
| 4 | CLARIFY Socrat0x / kEngram status with GCvlcnti - collaborator or sovereign external graph | Socrat0x is GCvlcnti's own separate ~36,000-node graph actively querying the ZABAL bot. Not leakage (separate system) but it is modeling ZAO structure. Decide the boundary. |
| 5 | Mira itself = WATCH not adopt (covered in doc 857) | It is a real, capable product GCvlcnti is championing - but its data model is incompatible with private graph work. |

## The finding

The DeepMeeting group (`[DeepMeeting][@Zaabal]`, 20 members) runs ZAO's
`@zabal_bonfire_bot` alongside several other agents. Investigation of the
1,381-entry backlog + web research on each:

| Agent | What it is | Risk to ZAO graph |
|-------|-----------|-------------------|
| **`@zabal_bonfire_bot`** | ZAO's own graph agent (ElizaOS v1.7, 12 constraints, explicit ingest-only discipline) | None - owned, gated. Only ingests on explicit "ingest"/"commit". |
| **Mira** (`@mira`, mira.tg) | Telegram-native AI agent; 500k MAU, 50k+ groups. **Learns from all conversations across personal + group chats, builds a cross-chat shared-memory layer, stores embeddings + daily summaries on its own servers.** | **HIGH - uncontrolled ingestion.** Captures ZABAL bot system prompt, graph architecture, Zaal identity/strategy; can surface that context in other groups its users belong to. |
| **Socrat0x** | GCvlcnti's own separate ~36,000-node "kEngram" graph; actively queries `@zabal_bonfire_bot`. | MEDIUM - not leakage (separate system) but a competing graph actively modeling ZAO structure. Boundary unclear. |
| **`@sanctuary_bonfire_bot`** | Another bonfire instance; non-responsive in the group. | LOW - dormant here. |
| **Suma AI** (`@SumaAI_Bot`) | Present, role unclear. | LOW - no observed ingestion. |

### Why Mira is the real problem

- **By design it learns cross-chat.** Mira's own positioning: "learns from real
  conversations across personal and group chats" with a shared memory layer and
  semantic retrieval. That is the opposite of a gated graph.
- **Storage is off-ZAO.** Embeddings + summaries live on mira.tg infrastructure.
  Zaal cannot delete or audit them directly.
- **Cross-group surfacing.** Mira's memory is shared per user; ZAO context can
  appear in other groups a member is in.
- **Telegram API does NOT save you here.** Bots can't read other bots' messages,
  but Mira records all *human* messages and any human relay of bot output - which
  in this group includes the ZABAL bot's architecture, repeatedly pasted/quoted.

### What is NOT a leak

- Bonfire-to-bonfire: separate bonfires (ZABAL vs Sanctuary) are isolated
  instances; no documented cross-graph federation on bonfires.ai. Low risk.
- Socrat0x querying the ZABAL bot returns only what the bot chooses to answer -
  it's external observation, not exfiltration. Still worth a boundary conversation.

## The irony worth noting

GCvlcnti is the one championing Mira ("use mira", "it's years ahead", "what
bonfires should copy") - i.e. he is advocating for the exact agent that is
siphoning the graph he helps maintain. He is not acting in bad faith; he sees
Mira as the product model. The fix is hygiene, not blame: keep Mira out of
private coordination spaces, study it separately as a competitor (doc 857).

## Also See

- [Doc 855](../../community/855-gcvlcnti-bonfire-admin-relationship-log/) - the relationship + comms context
- [Doc 857](../../infrastructure/857-ton-telegram-native-strategy/) - Mira/TON as a competitive/strategic question (separate from the security one)
- [Doc 799](../../agents/799-deepmeeting-agent-shard-architecture/) - DeepMeeting shard (the gate)
- `.claude/rules/pii-hygiene.md` + `secret-hygiene.md` - extend with the bot-boundary checklist below

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Remove Mira from the DeepMeeting group | @Zaal | Telegram action | Today |
| Ask GCvlcnti to disable Mira daily summaries | @Zaal | DM | Today |
| Add "no third-party bots without approval" to ZAO group norms | @Zaal | Rule | This week |
| Pre-bot checklist (learns cross-chat? where stored? can Zaal delete? audit log?) -> pii-hygiene.md | @Zaal | PR | Next |
| Clarify Socrat0x/kEngram boundary with GCvlcnti | @Zaal | DM | This week |

## Sources

- [Mira - mira.tg](https://mira.tg/) [FULL]
- [Mira AI agent launches inside Telegram group chats - ITBrief](https://itbrief.co.uk/story/mira-ai-agent-launches-inside-telegram-group-chats) [FULL]
- [Telegram's AI Agent Ecosystem And Mira - Dataconomy, 2026-05-20](https://dataconomy.com/2026/05/20/telegrams-ai-agent-ecosystem-mira/) [FULL]
- [Bonfires Technical Documentation](https://publish.obsidian.md/bonfires/files/Technical/Bonfires) [PARTIAL - platform isolation model not fully documented]
- Primary: DeepMeeting backlog (1,381 entries), 2026-06-14, zdeepmeeting repo [FULL]
