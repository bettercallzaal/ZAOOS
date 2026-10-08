---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-08
superseded-by:
related-docs: 2644, 2586, 2587, 2636, 2640, 2641
original-query: "thats prob something iw anna reivew too is just my agentic system and how i shoudl use orca and claude and cursor and codex and antigravity together and muse ai assistant and also zoe and any other assistants online that would be good" (seat ruling item 8, vault decisions/grill-2026-10-08-seat-morning.md: "a lets try it" for Jev)
tier: STANDARD
---

# 2645 - The agentic system review: one job per tool, which account each runs on, a normal day, and how to trial Jev

> **Goal:** Give each assistant Zaal has (Orca, Claude Code, Codex, Cursor,
> Antigravity, Muse, ZOE) one clear job. Record which account each one runs on.
> Lay a normal day over his rhythm (slots 1-5 overnight, grow until noon, close
> to a top 3 between noon and 3 PM). Propose how to run Jev beside the seat's
> noon ranking until 2026-10-15.
>
> This doc extends [doc 2644](../2644-agent-landscape-oct-2026/), which covers the
> field and the security gap, and [doc 2586](../2586-orchestrator-seat-outside-view/),
> which covers the seat. Neither is repeated here.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **Keep Orca + Claude Code as the only tier that writes to repos.** The seat, the PR lead and the lanes stay there. | It is the only setup here that reads the live repo, edits, verifies and opens a PR under the estate's rules and hooks. 124 ZAOOS PRs merged in the 7 days to 2026-10-08 (doc 2644). |
| 2 | **USE Codex for one job: the second opinion.** Reviews and cross-checks, through the existing `zao-ask-gpt` wrapper. It does not get its own repo lane. | It is a different model family, so it catches different mistakes, and the wrapper already exists. It has hit account usage limits before (seat ruling 26, 2026-09-19). |
| 3 | **USE Antigravity for Google-side research and media, not for repo writes.** | The Google AI Pro plan is on his personal Google account and is already paid for. It includes Deep Research, NotebookLM and Flow. Both Antigravity apps are installed. A second agent writing to repos would bring back the two-writers problem (`worktree-handoff.md`). |
| 4 | **SKIP Cursor cloud agents for now. Cursor.app stays as a code viewer.** | Cursor's docs say "Cloud Agents are charged at API pricing for the selected model" with a spend limit you set on first use. That is new spend for work Orca lanes already do. Adding it is Zaal's call (money). |
| 5 | **Muse stays a personal phone assistant. It gets no estate role.** | It is Meta's personal agent (docs 2587 and 2644). It has no repo, vault or board access, and its page refused our fetch (403). |
| 6 | **ZOE stays the one door from the phone.** Captures, buttons and status go there, and they land on the seat's queue page. | One capture door is already the operating model (`feedback_assistant_operating_model`). |
| 7 | **Send Gmail-dependent jobs to a lane whose account has the Gmail connector.** Do not route them to the seat. | The queue page notes that the Gmail MCP is on a different Claude account from the seat. This research lane's session listed the claude.ai Gmail tools on 2026-10-08. Which of the three Claude accounts that is was not measured, and that is Zaal's fact to confirm. |
| 8 | **The Jev trial, as Zaal pictured it, cannot run as written. Jev picks a role and skills; it does not rank a queue.** The proposal below is a free side-by-side ranking that is labelled "rubric, not Jev". Jev proper waits on his word plus a paid key. | Jev's own doc: it picks "which of 27 roles owns a task, which one to five skills that role loads, which of 19 registered servers are relevant". Its author's evaluation: "Claude matched or beat Jev on every decision". |

## Which account each runs on (measured 2026-10-08, this Mac)

| Tool | Installed | Account | How read |
|---|---|---|---|
| Orca | `/Applications/Orca.app`, CLI on PATH | Manages 3 Claude accounts: `zaalp99@gmail.com`, a WaveWarZ Gmail account (currently **active** for new launches), and `info@thezao.com`. Manages 1 Codex account: `zaal@thezao.com`. | `orca account list` |
| Claude Code | `~/.local/bin/claude` | Whichever Orca account the lane was launched under. A running lane does not show which one. | as above |
| claude.ai connectors (Gmail, Calendar, Drive, ...) | Tied to the claude.ai account, not to the Mac | They "will NOT carry over" when the account changes, and must be reconnected per account | vault `notes/claude-mcp-connector-inventory-2026-09-13.md` |
| Codex CLI | `~/.local/bin/codex`, `codex-cli 0.153.4` | "Logged in using ChatGPT" (the Orca-managed `zaal@thezao.com`) | `codex login status` |
| Cursor | `Cursor.app` installed; no `cursor` or `cursor-agent` on PATH | not measured | `ls /Applications`, `command -v` |
| Antigravity | `Antigravity.app` and `Antigravity IDE.app` installed; no CLI on PATH | Google AI Pro is on `zaalp99@gmail.com`, his **personal** Google account, not the ZAO Workspace | vault `notes/google-ai-pro-plan-2026-09-20.md` |
| Muse | phone app | Meta account, not measured | - |
| ZOE | VPS bot `@zaoclaw_bot` | Its own bot token; model calls go through the fleet chain | CLAUDE.md |

**The one account fact this doc cannot settle:** which of the three Claude accounts
has the Gmail connector, and which one the seat runs on. The queue page says they
differ. A running session can only see whether the Gmail tools appear in its own
tool list, which is the check behind Decision 7.

## The split: one job per tool

| Job | Tool | Never |
|---|---|---|
| Edit live repos, verify, open PRs | Claude Code lanes inside Orca | Merge without the PR lead |
| Decide order, route work, hold the queue page | The seat (Claude Code) | Write code itself |
| Merge, licence check | `zaal-dotfiles-fc` | Rank work |
| Second opinion on a PR or a plan | Codex, through `zao-ask-gpt` | Hold its own lane |
| Long reads, Deep Research, NotebookLM audio, video drafts | Antigravity / Gemini on the personal Google plan | Write to a ZAO repo; make public visuals (seat item 53: no AI-made public visuals) |
| Reading code on screen | Cursor.app | Cloud agents (spend) until Zaal says |
| Capture from the phone, buttons, status | ZOE | Second capture door |
| Personal life admin | Muse | Estate work |
| Gmail reads and drafts | A lane on the Gmail-connected Claude account | Sending (outbound is his tap) |

Orca already provides the coordination layer these tools would otherwise each
need: `orca orchestration` has `run-create`, `send`, `ask`, `task-create`,
`dispatch` and `inbox`, and `orca worktree ps` "show[s] a compact orchestration
summary across worktrees" (`orca --help`, 2026-10-08). That is a reason not to
add a second orchestrator from Cursor or Antigravity.

## A normal day, laid over his rhythm

His shape comes from the seat. This doc only says which tool carries each part.

| Window | What runs | Tools | Zaal's part |
|---|---|---|---|
| Overnight, slots 1-5 | Up to five lanes on PR-only work: research docs, reviews, refresh PRs. No code to live routes (`agent-loops.md` rule 35). Codex second opinions on PRs opened that night. | Orca lanes, Codex | none |
| Morning until noon: grow | Each capture lands as a queue item. Lanes take queue items. Antigravity takes any long read or media pass he starts himself. | ZOE, seat, lanes, Antigravity | Captures from the phone |
| Noon: rank | The seat ranks the queue (deadline, then money or reach, then lanes waiting on it; seat item 6). The trial ranking below is printed beside it. | Seat + the trial script | Picks the top 3 |
| Noon to 3 PM: close | Lanes finish the top 3. Gated steps come to him as buttons. | Lanes, PR lead, ZOE | Taps the gates |
| After 3 PM | Handoffs, briefs, park the rest | Lanes | none |

**A clash to check.** As of 2026-08-28 his calendar had a "Daily doot stream"
block at 12:00-13:00 (vault `daily/2026-08-28.md`). If that block still stands,
the noon ranking lands while he is streaming. Either the ranking moves to 13:00
or he picks the top 3 after the stream. That is his choice.

## The Jev trial

### What Jev is, read from its source

`nahid-sparktales/agent-dispatcher` is MIT licensed (LICENSE file read: "MIT
License, Copyright (c) 2026 Nahid Masad"). Jev is its optional decision engine,
run by TypeSafe:

- It **"ships with Jev switched off on every decision"**.
- To turn it on you set `TYPESAFE_API_KEY` and `AGENT_DISPATCHER_DECISION_SCOPES`
  ("nothing runs without this").
- Its candidates are fixed by the repo's own catalogue: 27 roles, their skills, and
  19 servers. It is a classifier over that set. It is not a ranker of arbitrary items.
- The task text is sent to an outside provider: "Enabling Jev means an external
  provider sees your task text."
- Cost is "billed to the account that owns the key". The full 206-case evaluation
  "cost roughly two cents".
- Results on 162 routing cases, agent top-1: keyword baseline 23, Jev 143, Claude
  **158**. Median Jev latency is 358 ms. Five runs of Jev scored 136-143, so its
  number moves between runs.

So the picture in seat item 8, "Jev's top 3 beside the seat's top 3", has no direct
equivalent. Jev would say which of its 27 roles should own each queue item. It
would not say which three items matter most today.

### What the queue page can feed a ranker

`notes/orca-terminals-latest.md` (stamp 2026-10-08 09:01 EDT) has three tables:
Waiting on Zaal, Running now, and Terminals. Their columns are `#`, `Item`, and
`Where` or `Who`. **No column carries a deadline, money, reach, or a count of lanes
waiting.** Those are the three inputs of the seat's own ranking rule. Any ranking
from this page, by the seat, by a script or by Jev, has to infer them from the
item text. That is the first thing to fix, whichever ranker wins.

### Three ways to run it, recommendation first

| | What | Needs | Gate |
|---|---|---|---|
| **A (recommended)** | A read-only script reads the queue page at noon and scores each item on the seat's rule: a date in the item text, a money or reach word, and how many Terminals rows name it. It prints its top 3 beside the seat's, labelled **"rubric, not Jev"**. Run daily 2026-10-09 to 2026-10-15. Zaal picks each day, and the log records which list he took. | A small git-tracked script, PR-only, written by this lane once approved. No key, no network, no install. | None beyond the normal PR review. |
| B | Jev for what it actually does: route each queue item to one of the dispatcher's 27 roles. Shown as a column ("Jev says: backend role"), not as a ranking. | Clone or install agent-dispatcher, plus a TypeSafe key | **Zaal's word on the install, and a paid key (money, account)** |
| C | Call TypeSafe's API directly with queue items as the candidate set | Same as B, and it is not supported by the repo. Whether the API accepts arbitrary candidates is UNVERIFIED. | As B, plus unverified |

**Why A.** It tests the thing Zaal actually wants to know: does a second,
mechanical ranking beat the seat's judgment often enough to keep? It costs nothing.
It also makes the missing fields visible every day, because the script will print
"no deadline found" against most items. Under `code-over-inference.md`, a ranking
rule that is the same judgment every time is a script.

B is only worth it if he wants role routing as well, and the author's own numbers
say Claude already routes better.

**Scoring the week (proposal).** Each day log three things: both top 3 lists, the
one he picked, and the overlap. On 2026-10-15, keep the script if he took its list,
or an item only it surfaced, on at least 2 of the 7 days. Otherwise drop it. That
threshold is a proposal for him to change, not a measured number.

## Also See

- [Doc 2644](../2644-agent-landscape-oct-2026/) - the field in October 2026 and the security gap (plugin and repo trust)
- [Doc 2586](../2586-orchestrator-seat-outside-view/) - the seat seen from outside
- [Doc 2587](../2587-hermes-muse-memory-dreaming/) - Muse and memory dreaming
- [Doc 2641](../2641-orchestrator-seat-measured-dispatch/) - the seat as dispatcher, measured
- [Doc 2640](../2640-orchestrator-loop-improvements/) - seat loop failures and ranked fixes

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Pick a Jev trial path: A (free rubric script, recommended), B (install plus a TypeSafe key), or none | Zaal | Decision | 2026-10-09 |
| If A: write the read-only noon ranker as a git-tracked script, open a PR, and log daily to the vault. Shipped = merged PR plus 7 daily log lines. | zaoos-35 (Claude) | PR | 2026-10-09 |
| Add `due`, `money/reach` and `blocks` fields to queue-page items so every ranker has real inputs. Shipped = a queue page with the columns, passing `zao-queue-page-check`. | seat | PR | 2026-10-10 |
| Confirm which Claude account has the Gmail connector, and which one the seat runs on | Zaal | Fact | 2026-10-10 |
| Confirm whether the 12:00 doot stream block still stands; if so, move the noon ranking or pick after the stream | Zaal | Decision | 2026-10-10 |
| Score the trial: compare the two lists over 7 days, keep or drop | seat | Review | 2026-10-15 |

## Sources

Method is stated per row. Quotes come from raw text (curl plus an HTML strip, a raw
markdown file, or CLI output). None comes from a WebFetch summary.

- [nahid-sparktales/agent-dispatcher README and docs/jev.md](https://github.com/nahid-sparktales/agent-dispatcher) - raw markdown fetched 2026-10-08 **[FULL]**. LICENSE read via `gh api .../contents/LICENSE` **[FULL]**
- [Cursor docs, Cloud Agents](https://cursor.com/docs/cloud-agent) - curl plus strip, 2026-10-08 **[FULL]** (billing and isolated-VM quotes)
- [OpenAI Codex cloud docs](https://developers.openai.com/codex/cloud) - curl plus strip **[PARTIAL]**: nav text only, no product claims used. [openai/codex README](https://raw.githubusercontent.com/openai/codex/main/README.md) raw **[FULL]**
- [antigravity.google](https://antigravity.google) - curl (gzip) plus strip **[FULL]**: product list and "Your command center to manage multiple local agents in parallel". antigravity.google/docs/agent-manager returned 404 **[FAILED]**
- [meta.ai](https://www.meta.ai/) - 403 **[FAILED]**. Muse facts come from docs 2587 and 2644 only
- `orca --help`, `orca account list`, `codex --version`, `codex login status`, `command -v`, `ls /Applications` - run on this Mac 2026-10-08 **[FULL]**
- Vault (origin/main, 2026-10-08): `decisions/grill-2026-10-08-seat-morning.md` items 6-8, `notes/orca-terminals-latest.md`, `notes/claude-mcp-connector-inventory-2026-09-13.md`, `notes/google-ai-pro-plan-2026-09-20.md`, `decisions/grill-2026-09-19-seat-afternoon.md` item 26, `daily/2026-08-28.md`, `handoffs/status/zj.md` **[FULL]**
- Credit: agent-dispatcher and Jev by Nahid Masad (MIT). Jev is run by TypeSafe.
