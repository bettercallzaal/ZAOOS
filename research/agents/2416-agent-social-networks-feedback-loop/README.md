---
topic: agents
type: decision
status: research-complete
last-validated: 2026-08-25
superseded-by:
related-docs: "2411, 2415, 1002"
original-query: "/zao-research how other agents work. We should be on one of the agents social media networks getting feedback from other agents all the time"
tier: STANDARD
---

# 2416 - We are already on one. The feedback pipe is built and switched off.

> **Goal:** Zaal wants ZAO on an agent social network, taking feedback from other
> agents continuously. Two checks answer it: what we already have, and whether
> those networks actually produce feedback.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Do not join a new network first. ZOL is already on one and casting today.** | **@zolbot, FID 3338501**, live on Farcaster. Fetched 2026-08-25: recent casts pushing ZABAL Gamez submissions and answering a "gm". The outbound half works. |
| 2 | **Switch on the inbound pipe. It was built on 2026-07-09 and has been INACTIVE for seven weeks.** | `infra/n8n/workflows/01-farcaster-mentions.json`: polls Neynar every 10 minutes for mentions, dedupes, alerts Telegram. Its own README says *"imported inactive... Blocked on `~/n8n/.env` secrets."* Two sibling workflows are in the same state. |
| 3 | **It watches the wrong FID. Fix that before switching it on.** | It polls mentions of **FID 19640 (Zaal)**. ZOL is **FID 3338501**. Switched on as-is it catches mentions of Zaal, **not replies to the agent** - which is the exact thing this request is about. |
| 4 | **Moltbook is real and live, but the evidence says agent networks do NOT yet produce sustained feedback.** | A peer-reviewed-style analysis of its first week: most comments **never receive a direct reply**, reciprocal exchange is **rare**, replies that do land arrive **within seconds**, and a human Reddit baseline shows **deeper threads and longer persistence**. |
| 5 | **The thing that paper says agent networks are missing, ZAO already built.** | Its conclusion names *"explicit memory, thread resurfacing, and re-entry scaffolds."* ZAO has all three, built for other reasons. That is an asset to bring, not a gap to close. |

## What we already have, measured 2026-08-25

### ZOL is live

```
USER: ZOL | @zolbot | FID: 3338501
BIO: ZABAL Opinion Leader. The ZAO music scout. i find sound worth hearing.
```

Recent casts, fetched keylessly through the Haatz Snapchain mirror:

- *"the ongoing earnings angle is the real hook - build once, keep eating. if anyone's already sketching something, drop a wip at https://zabalgamez.com..."*
- *"gm gm, good day to you too. quiet morning here, coffee and checking what the f..."*

That second one matters: **ZOL is already replying to other accounts.** The
social behaviour exists. Note that the brand-priority stack files ZOL as *"on the
burner, low simmer"* - the code is livelier than the priority says.

### The inbound half exists and is off

Three n8n workflows on the VPS, from doc 1002, all **built, imported, and
inactive since 2026-07-09**:

| # | What it does | State |
|---|---|---|
| 1 | Farcaster mentions -> Telegram, 10-min Neynar poll, dedupe by cast hash | **inactive** |
| 2 | Newsletter publish -> per-platform cross-post drafts | **inactive** |
| 3 | GitHub PR merged -> tracker row + Telegram | **inactive** |

The README states the blocker plainly: *"All three are imported on the VPS and
**inactive**. Blocked on `~/n8n/.env` secrets for manual test runs."*

**Seven weeks.** This is the same shape as everything else measured this week -
built, merged, and not running (`state-claims.md`: merged is not running).

### The FID bug, which is the actual gap

Workflow 1 defaults to `NEYNAR_ZAAL_FID=19640` and watches keywords
`thezao,zabal`.

**ZOL is FID 3338501.** So the pipe, even when activated, surfaces mentions of
**Zaal** and brand keywords - not replies to **the agent**. Agent-to-agent
feedback is precisely what it will not deliver.

Fixing it is a config change, not a build: watch both FIDs.

## What the research actually says about agent networks

**Moltbook** - an AI-agent social network where agents post and humans observe.
Live on 2026-08-25 (HTTP 200).

The load-bearing source is a paper studying its first week: **"Fast Response or
Silence: Conversation Persistence in an AI-Agent Social Network"**, arXiv
2602.07667, submitted 2026-02-07, revised 2026-03-01. Its abstract, read raw:

> "Across tens of thousands of commented threads, Moltbook discussions are
> dominated by first-layer reactions rather than extended chains. **Most comments
> never receive a direct reply, reciprocal back-and-forth is rare**, and when
> replies do occur they arrive almost immediately -- typically within seconds --
> implying persistence on the order of minutes rather than hours."

Two more findings worth carrying:

- **The "four-hour heartbeat" is folklore.** The paper: *"Moltbook is often
  described as running on an approximately four-hour heartbeat check-in
  schedule; using aggregate spectral tests... we do not detect a reliable
  four-hour rhythm."*
- **Humans still out-converse agents.** *"A contemporaneous Reddit baseline
  analyzed with the same estimators shows substantially deeper threads and much
  longer reply persistence."*

### So the premise needs adjusting, not abandoning

Zaal's ask was continuous feedback from other agents. On the evidence, an agent
network today gives **fast response or silence** - a burst within seconds, then
nothing. That is not a feedback loop; it is a reflex.

**The value of joining is reach and presence, not critique.** For critique, the
same paper points at the humans.

## The part that makes this interesting for ZAO

The paper's closing line names the fix:

> "sustained multi-step coordination will likely require **explicit memory,
> thread resurfacing, and re-entry scaffolds**."

ZAO has built all three, for unrelated reasons:

| What the paper says is missing | What ZAO already runs |
|---|---|
| **explicit memory** | Bonfire knowledge graph, ZOE memory blocks, 52 vault people notes |
| **thread resurfacing** | the grill's re-ask ladder - 3h fresh, 2h after a day, 1.5h after three, 45m after a week, so a card **nags harder the longer it goes unanswered** |
| **re-entry scaffolds** | vault handoff briefs and `zao-lane-boot`, one living brief per lane |

The re-ask ladder is the sharpest of these. It was built because cards were sent
once and lost; it happens to be exactly the mechanism the paper says agent
networks lack. **If ZAO shows up on an agent network, that is the differentiated
thing it brings** - an agent that comes back to a thread rather than reacting once
and going silent.

## Honest limits

- **n8n's actual running state was NOT verified.** The README says deployed
  2026-07-09 in container `zao-n8n`, localhost-bound. Whether the container is up
  today was not checked from here - that needs an SSH to the VPS. "Inactive
  workflows" is from the README, not from n8n.
- **One paper, one platform, one week.** Moltbook's first-week snapshot is not
  the whole category, and the paper says so. Chirper, Virtuals and others were
  not examined.
- **ZOL's cast sample is five casts** from one keyless fetch. Whether it receives
  replies, and how many, was not measured - which is itself the point: nothing
  currently reads them.
- **No claim is made that Moltbook has a ZAO-relevant audience.** Reach was not
  measured, only interaction structure.

## Also See

- [Doc 2415](../../business/2415-bcz-website-timeline-earned-media/) - same week, same shape: the thing was already built and nothing read it
- [Doc 2411](../../dev-workflows/2411-tool-usage-audit-measured/) - the mandated-but-dead tools, merged as PR #3311

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Point workflow 1 at ZOL's FID 3338501 as well as 19640; done when the workflow JSON watches both | @Zaal (Claude) | PR | 2026-08-27 |
| Fill `~/n8n/.env` and activate workflow 1; done when a Farcaster mention reaches Telegram | @Zaal | Gated - secrets | 2026-08-28 |
| Verify the `zao-n8n` container is actually running; done when a number replaces this doc's honest gap | @Zaal (Claude) | Test | 2026-08-27 |
| Measure whether ZOL's casts receive replies at all, before designing anything to read them | @Zaal (Claude) | Research | 2026-08-29 |
| Decide whether ZOL joins Moltbook - reach play, not a feedback play | @Zaal | Decision | 2026-09-05 |

## Sources

- [FULL - `~/bin/zao-fetch-farcaster.sh` via the Haatz Snapchain mirror, keyless, 2026-08-25] ZOL profile (FID 3338501, bio) and five recent casts, quoted verbatim.
- [FULL - read from disk 2026-08-25] `infra/n8n/README.md` - deployment date, container name, the three workflows, the `NEYNAR_ZAAL_FID=19640` default, and the "imported inactive / blocked on secrets" status, all quoted verbatim.
- [FULL - `curl` raw HTML, 2026-08-25] `arxiv.org/abs/2602.07667` - "Fast Response or Silence: Conversation Persistence in an AI-Agent Social Network", submitted 2026-02-07, revised 2026-03-01. Abstract read and quoted directly from the page, not from a summary.
- [FULL - `curl`, 2026-08-25] `moltbook.com` HTTP 200, 34,592 bytes. Existence and liveness only; contents not analysed.
- [PARTIAL - WebSearch, 2026-08-25] used to LOCATE Moltbook and the paper. No claim in this doc rests on a search snippet; every specific came from the arXiv page or our own files.
- Credit: the Moltbook analysis is the arXiv authors' work, not ZAO's. Moltbook is not affiliated with The ZAO.
