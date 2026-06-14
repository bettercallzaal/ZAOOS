---
topic: community
type: relationship-log
status: research-complete
last-validated: 2026-06-14
related-docs: "781, 798, 799, 665, 669"
original-query: "log my DMs with my Bonfire admin @GCvlcnti, then clean up communication with him; start logging all the zabal deepmeeting stuff"
tier: STANDARD
---

# 855 - GCvlcnti (Bonfire admin) - DM relationship log + comms reset

> **Goal:** capture the full DM relationship with @GCvlcnti (Zaal's designated
> ZABAL Bonfire graph admin, doc 799), inventory the threads he has raised,
> record Zaal's stated positions, separate verified signal from unverified
> claims, and define a clean communication protocol going forward. The DM
> stream is high-volume, low-structure - this doc is the structured index.

## Key Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | KEEP GCvlcnti as ZABAL Bonfire graph admin, scoped to a shard, NOT the main graph | His solo graph-fill is real volume; doc 798 already flagged his vocabulary polluting the main graph (TreeUnix fabrication). Shard isolation per doc 799. |
| 2 | RESET comms to a single pinned "important list" in one place; stop free-form DM sprawl | Zaal said it directly: "too much info here in text", "pick one thing and do it to completion", "unbelievably confused by what you're doing". A static edited message kills the visual pollution. |
| 3 | TRUST his macro/industry reads; VERIFY his specifics before they hit the graph | Both big claims this session (Mira, Manus->Meta) checked out. His detail-level claims (TreeUnix, $KNOWS economics) have been wrong/fabricated before. Read = signal, specifics = verify. |
| 4 | His personalized bot is the doc-799 DeepMeeting shard - already gated, do NOT spin a second bot | CLAUDE.md "no new bots without doc". 799 is the gate; this convo is its upstream raw material. |
| 5 | Iman to make first contact to co-carry the relationship | Zaal already told Iman to message him. Offloads the high-touch comms load. |

## Who he is

- **Handle:** @GCvlcnti (alias **DvlsMojo**). Email on file (redacted, off-repo).
- **Age / location:** 42, Brazil (Recife region).
- **Background:** Business Administration faculty ("Faculdade de Administracao
  de Empresas"). Self-deprecating - "never wrote a contract", "ocean of
  knowledge, deep as a puddle". Cancer survivor; had hardware loss + crypto
  FOMO losses circa 2020-21.
- **Self-definition:** **networker** - connects people / projects / flows so
  they meet. Pattern repeats his whole life: Counter-Strike clan -> Telegram
  groups -> `$BITCOIN RECIFE$` Facebook group (2017, still has high-value
  members: doctors, PhDs, a financial manager, an awarded ex-Facebook marketing
  expert, streamers with audience).
- **Claimed Brazil network (UNVERIFIED, high-value-if-true):** a contact at
  **BNDES** (Brazil's federal development bank, deploys ~1B BRL/day) who can
  reportedly reach the sitting president. Grant access requires a formal
  Portuguese-language project with metrics. He cannot execute it solo.
- **Posture:** nervous on live voice ("Blank Thoughts" when live), prefers
  async text + images. Sends screenshots constantly; learns visually.

## Threads he raised (inventory)

| Thread | What it is | Status / action |
|--------|-----------|-----------------|
| **Mira / mira.tg** | First consumer AI agent native to Telegram; builds shared chat memory. Direct parallel to Bonfires-on-Telegram. VERIFIED real. | Competitive watch - see Findings. |
| **Socratox graph** | Another Bonfires graph he found in a Brazilian AI/DeSci public ecosystem. | Note; he says ZABAL branding is "missing" from that ecosystem. |
| **TON ecosystem** | TON.org / t.me - suggests it as the rail for business, partnerships, grants, community-building at world scale. | Park - not a near-term ZAO surface. |
| **Telegram shared folders = public addresses** | Sharing a TG folder yields a public link; `t.me/username` behaves like an https page; chat export = html+css+js+json like a webpage. | True mechanic. Useful for graph-ingest of TG content. Zaal "didn't know that". |
| **Referral system everywhere** | Wants every ZAO project/app to carry a referral/attribution layer so his sharing is counted, evaluated, rewarded (not only money). | His core personal ask. See comms draft. |
| **godfather miniapp** | Config surface for Bonfire bots; he believes the consumer-side config (buttons on godfather + bonfire dashboard) differs from the owner/dev view Carlos sees. | He will investigate bot-config buttons himself. |
| **His named protocols** | "deepmeeting" (DM-as-memory-DB pattern), "TheBlockMeeting" (fractal Circles-in-Circles networking protocol), "Blank Token"/"pomposo" HTML jokes, an old "Wiki Project.html". | Naming/mnemonic patterns, not shipped products. Do not over-weight. |
| **t.me/BotNews** | Telegram's bot-platform news channel. | Reference. |

## Zaal's stated positions this session (for the record)

- Added him as viewer to `zabal.app.bonfires.ai`; graph access confirmed ("i connected").
- Will build him a bot on the ZABAL knowledge graph - coded for him to talk to,
  bring into chats, keep his context. (= doc 799 DeepMeeting shard, already gated.)
- Offered a light title: "ZABAL Bonfire graph lead" / "data lead".
- Pushed back, verbatim: "you get v stuck in a lot of different things", "pick
  one thing and do it to completion", "I'm unbelievably confused by what you are
  doing", "it's just not something I can work with right now", "I am busy most
  of my day so my rnd time is all coding".
- On ZABAL Games: it is intentionally NOT a 3-day hackathon (his critique). Zaal:
  "the 3 day ones never actually go and do anything - dead repo as soon as the
  event is over"; ZAO targets non-technical vibe-coders, AI fills you in by
  month 2. (His prize-structure / compensation question went unanswered.)
- Disagreed with his semantic-markup / `.md`-linking-everything thesis (deferred
  as "a long convo").
- Does not know how `$KNOWS` token economics work; "not too stressed", trusts
  "Carlos is goated dev" (met Carlos in person at ETH Boulder).

## Findings

- **Mira is a real, funded competitor to the Bonfires-on-Telegram thesis.**
  Mira (mira.tg) is positioned as "the first consumer AI agent inside Telegram",
  turning chats into an execution layer with cross-chat shared memory + retrieval
  - the exact shape of what ZABAL Bonfire wants to be on Telegram. GCvlcnti
  surfacing it is genuine competitive intel, not noise. (Sources below.)
- **His Manus->Meta read was correct.** Meta acquired Manus (~$2B+, Dec 2025) and
  Manus's new Agents mode launched on **Telegram first** despite Meta owning
  WhatsApp. His broader narrative - the AI-agent center of gravity moving to
  Telegram, WhatsApp trailing - is supported by the reporting. His macro
  pattern-reading is a real asset.
- **His detail-level claims remain a bad-data risk.** Doc 798 Finding 1 already
  caught his "TreeUnix Protocol" vocabulary fabricating into the main graph. The
  rule that falls out: his industry *reads* are signal; his project-specific
  *specifics* (protocol names, token mechanics, who-owns-what details) must be
  verified before they enter the shared graph. This is exactly why doc 799
  isolates him to a shard.
- **Relationship load is the real cost, not the tech.** The DM stream is
  high-affect, low-structure, multilingual, AI-"corrected" mid-thread. Zaal
  spent real time confused. The fix is structural (one pinned list, Iman
  co-carrying), not more explaining.

## "zabal deepmeeting" group logging - NOT yet captured

Zaal also asked to "start logging all the stuff from zabal deepmeeting." That is
a separate Telegram **group** with resources/tools/screenshots - distinct from
these DMs. It is **not in scope of this doc** because the group content was not
provided. To log it: export the group (Telegram desktop -> Export chat history ->
JSON), drop the export at `~/.zao/private/gcal-... -> ~/.zao/private/tg-zabal-deepmeeting-YYYYMMDD.json`
(per PII rule, off-repo), then run it through the same FULL/PARTIAL classify +
graph-ingest. Tracked in Next Actions.

## Also See

- [Doc 799](../../agents/799-deepmeeting-agent-shard-architecture/) - the gated DeepMeeting shard bot (this contact = admin)
- [Doc 798](../../agents/798-bonfire-graph-quality-audit/) - where his vocabulary polluted the main graph
- [Doc 781](../../agents/781-zabal-bonfire-contribution-architecture/) - shared-graph + soft-barrier contribution model
- [Doc 669](../../agents/669-bonfires-everything-we-know/) - Bonfires reference

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Send the comms-reset message (below) - ask for ONE pinned "important list", set role expectation | @Zaal | DM | Next reply |
| Iman makes first contact to co-carry the relationship | @Iman | DM | This week |
| Export "zabal deepmeeting" TG group -> ~/.zao/private/ -> ingest to shard graph | @Zaal | Bot task | When at desk |
| Confirm doc-799 shard bot greenlight before any bot is created (still gated) | @Zaal | Decision | Before bot build |
| Add Mira (mira.tg) to competitive watch for the Bonfire-on-Telegram thesis | @Zaal | Note | Next Bonfire review |
| Keep his specifics OUT of the main graph; shard-only until verified | @Zaal | Standing rule | Ongoing |

## Sources

- [Mira - mira.tg homepage](https://mira.tg/) [FULL - search-surfaced description: "first consumer AI agent inside Telegram", chat-as-execution-layer, shared memory]
- [Mira wiki](https://wiki.mira.tg/) [PARTIAL - title/positioning only, not deep-fetched]
- [How Telegram's AI Agent Ecosystem And Mira Are Changing Collaborative Workflows - Dataconomy, 2026-05-20](https://dataconomy.com/2026/05/20/telegrams-ai-agent-ecosystem-mira/) [FULL - via search]
- [Manus new "Agents" mode arrives on Telegram first despite Meta owning WhatsApp - the-decoder](https://the-decoder.com/manus-new-agents-mode-arrives-on-telegram-first-despite-meta-owning-whatsapp/) [FULL - via search, corroborates his macro read]
- [Meta-owned Manus launches AI agents on Telegram - Silicon Republic](https://www.siliconrepublic.com/machines/manus-ai-agents-meta-china-telegram-whatsapp) [FULL - via search; ~$2B+ deal Dec 2025]
- Primary source: Zaal <-> @GCvlcnti Telegram DM stream, captured 2026-06-14 [FULL - the convo itself]
