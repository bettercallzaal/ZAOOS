---
topic: agents
type: architecture
status: proposed
last-validated: 2026-05-31
related-docs: "601, 734, 771, 772, 773"
original-query: "how should ZAO agents interconnect around one shared Bonfire graph + a soft barrier for community contribution to the ZABAL Gamez knowledge graph"
tier: STANDARD (design synthesis grounded in the live ZOE/Bonfire/CRM stack)
---

# 781 - ZABAL Bonfire contribution architecture (shared graph + soft barrier)

> **Goal:** let EVERYONE in the ZABAL Gamez 3-month buildathon contribute to the
> ZABAL Bonfire knowledge graph so it becomes a shared source of truth (who is
> building what, project states, facts, docs) queryable by any person or agent -
> open enough that the community contributes, gated enough that it does not get
> spammed or polluted.

## TL;DR

- **Topology:** the *graph* is the hub (blackboard / shared memory), NOT the
  Bonfire bot. Agents are read/write spokes through a single ingestion gateway
  where the soft barrier lives. No agent-to-agent (x402) calls in v1.
- **Soft barrier:** don't pick one moderation model - layer all three on a
  contribution lifecycle. Anyone can submit (open); submissions land
  author-tagged + pending; queries default to canonical only (pollution never
  surfaces); trust tier sets the start point + who can promote.
- **Identity:** reuse existing ZAO signals - Farcaster FID (iron-session),
  ZAO Respect, Bonfire score, and promoted-vs-rejected track record. Build no
  new identity system. Agents act as their human and inherit that human's tier.
- **v1 (June):** the CRM pattern (doc 772) repointed at Bonfire - a Supabase
  `bonfire_submissions` pending table -> curator promote -> write canonical
  episode via ZOE's existing `remember()`/`episode/create` path, gated by ZOE's
  existing approval state machine (doc 770/773).

## 1. Topology - graph-as-blackboard, single write-gateway

```
   people (Telegram/web)        their agents          ZOE / music bot
          |                          |                      |
          +------------- submit -----+----------------------+
                                |
                    +-----------v------------+
                    |   Ingestion Gateway    |  <- the soft barrier lives HERE
                    |  trust + rate-limit +  |
                    |  pending -> promote    |
                    +-----------+------------+
                       promoted | (episode/create, typed triples)
                    +-----------v------------+
                    |   ZABAL Bonfire graph  |  <- single source of truth
                    +-----------+------------+
                       query    | (/delve, typed reads)
          +--------------+------+-------+--------------+
        ZOE          music bot   participant      any person
                                  agents
```

**Decisions + rationale:**

- **Shared memory (blackboard) over agent-to-agent.** Direct a2a is N^2 coupling;
  a participant's agent should not need to know ZOE/the music bot exist. They all
  read/write *the graph*. This generalizes the pattern ZOE already uses
  (`remember()` episodes + `/delve` reads, see doc 771 + `bot/src/zoe/recall.ts`).
- **The graph is the hub, not the bot.** The Bonfire *bot* is one privileged
  client. Making the bot the orchestrator creates a bottleneck + single point of
  failure. The *gateway* enforces rules; the *graph* is authoritative.
- **x402 / metered a2a: deferred.** Real future fit (premium cross-org queries,
  compensating curators) but adds payment friction to a buildathon whose goal is
  *more* contribution. v2+: monetized query tier / cross-DAO federation.
- **Read subscriptions / notifications: v2.** Webhook/pub-sub so agents react to
  graph changes is valuable but not load-bearing for June; query-on-demand first.

ZOE's place: both a privileged curator-client (it owns the approval machine) and
Zaal's personal query/intake agent. It is NOT the gateway and NOT the sole writer.

## 2. Soft barrier - layer all three options on a lifecycle

The three candidate models are stages of one contribution's life, not rivals:

| Candidate | Role in the combined model |
|-----------|----------------------------|
| (c) confidence-weighted, everyone writes | the DEFAULT - submission never bounces; lands as a pending/low-confidence, author-attributed stub |
| (a) submission queue + reviewer | the PROMOTION gate for untrusted authors - a curator raises it to canonical (reuses Bonfire's existing manifest-approve) |
| (b) reputation / trust tiers | sets the START point: trusted authors auto-promote / start high-confidence; stewards can promote others |

**Why the combination beats any single option:**

- Open-feel, zero rejection friction (community contributes freely - c).
- Pollution is *contained, not prevented* - the lever is **visibility**, not
  blocking. Canonical queries see only promoted items, so a spam stub sits inert
  in "pending" and never poisons answers (fixes c's weakness).
- Reviewer load scales DOWN - trusted contributors self-serve, so curators touch
  only newcomers + disputes (fixes a's bottleneck).
- Matches the graph's native shape - Bonfire/FCG is confidence + bi-temporal
  already (doc 771), so "raise confidence / mark canonical" is the grain of the
  system, not a bolt-on.

The single axis: a contribution's **`status` (pending -> canonical)** +
**`confidence`**, with **trust tier** setting the start point and promotion rights.

## 3. Identity & trust - compose existing ZAO signals

Build no new identity system. Compose what exists:

- **Farcaster FID** = primary identity (iron-session already does FID/wallet auth;
  188 members). Sign-in-with-Farcaster is near-zero friction + non-anonymous ->
  kills drive-by spam.
- **ZAO Respect score** = native reputation -> drives trust tier.
- **Bonfire / Genesis score** = second reputation input as it matures.
- **Contribution track record** = promoted-vs-rejected ratio; earn your way up.

**Rate-limit without friction:** cap *pending* items per FID (tier-1 = few open
pending; tier-2 = unlimited because they auto-promote). Stale unpromoted stubs
decay. Everything is FID-attributable -> spam is revocable.

**"Everyone gets their own agent":** an agent acts AS its human, carrying the
principal's FID and inheriting their tier. No separate agent-trust system in v1.
(That is where agent-identity / x402 returns later.)

## 4. Minimal v1 (June) - the CRM pattern repointed at Bonfire

Loop: `submit -> lands pending (Supabase) -> curator promotes -> written to
Bonfire as canonical episode`.

1. **Submit** - lowest friction: a Telegram command (`/contribute project: X,
   status: Y`) or a tiny web form. Attribution = sender FID/Telegram ID.
2. **Pending store = Supabase `bonfire_submissions`** (NOT the graph yet):
   `author_fid, type (fact|project|doc), body, status (pending|approved|rejected),
   created_at`. Near-verbatim the `crm_contacts` pattern (doc 772), RLS-locked,
   admin view. **Why Supabase not the graph:** keeps the canonical graph spotless
   and sidesteps any uncertainty about whether FCG exposes a first-class
   confidence/canonical query filter today. Only promoted items touch Bonfire.
3. **Curate** - a `/curate` view lists pending; approve writes to Bonfire via the
   path ZOE already uses (`remember()` -> `episode/create`, including the existing
   secret-scan). Reject -> marked, author notified.
4. **Query** - unchanged; `/delve` already serves canonical truth to ZOE + anyone.

**ZOE's role (mostly already built):**
- Curator interface - surfaces the pending queue and, on Zaal's "approve" (the
  exact propose->y/n flow in `bot/src/zoe/approvals.ts`), fires the Bonfire write.
- Intake helper - accepts Zaal's own contributions conversationally (auto-promote
  since tier-3).
- Query agent - already answers from the graph via `/delve`.

**v1 trust tiers = binary:** everyone pending; a hardcoded steward FID list can
approve. Defer Respect-weighted auto-promote + in-graph confidence to v2.

## Tradeoffs / deferred

| Decision | v1 choice | Cost | Revisit |
|----------|-----------|------|---------|
| Pending location | Supabase table | two stores to reconcile; pending not graph-queryable | v2: in-graph low-confidence once FCG confidence-filter confirmed |
| Promotion | manual curator | reviewer bottleneck (fine for 188 + cohort) | v2: Respect-tier auto-promote |
| Trust tiers | binary (steward list) | no self-serve for trusted yet | v2: wire Respect/Bonfire score |
| Submit channel | Telegram | less structured than a form | add light web form if needed |
| a2a / x402 | none | agents contribute as their human only | v2+: agent identity, metered queries, federation |
| Notifications | poll/query | no real-time reactions | v2: webhook/pub-sub on graph changes |

**Throughline:** v1 changes almost no architecture - it reuses ZOE's approval
machine + the CRM pending-table pattern, with the graph as the one source of
truth. That is what makes it shippable in June and lets tiers/confidence/
federation layer on without a rewrite.

## Open questions (need verification before v2)

- Does Bonfire/FCG expose a first-class `confidence` + `canonical/status` field
  that queries can filter on? (Determines when pending can move in-graph.)
- Does Bonfire support webhooks / change subscriptions? (Gates the notification
  layer.)
- Typed intake (`/knowledge_graph/add_triples`, `/entity`, `/edge`, `/ontology`
  per doc 771) vs prose episodes for structured project/state records - which the
  promote step should emit.

## Source

Design synthesis (2026-05-31) grounded in the live stack: `bot/src/zoe/`
(approvals, recall, crm), doc 771 (Bonfires FCG kernel), doc 772 (Supabase CRM
pattern), doc 601 (agent-stack cleanup / "no new bots without doc").
