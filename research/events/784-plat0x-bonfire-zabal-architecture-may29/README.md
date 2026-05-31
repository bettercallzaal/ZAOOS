---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-05-29
related-docs: "778, 780, 740, 759, 682"
tier: DEEP
---

# 784 - Plat0x (Carlos, Bonfires) x Zaal: the GitHub-to-Bonfire architecture for ZABAL Games submissions

> **Goal:** Capture - in full - the 2026-05-29 architecture call between Zaal and Plat0x (Carlos, on the Bonfires team) that designed the submission + judging spine for ZABAL Games, with Bonfires as the knowledge-graph backend. This is a load-bearing design decision, not a catch-up: it defines how builders submit, how their work gets indexed, and how it gets judged in July. Plat0x is the Bonfire technical architect, so this is primary-source.

This is the technical backend for the ZABAL Games plan from docs 778 (Magnetic = identity/hub) and 780 (Empire Builder = a buildable surface). Magnetic holds identity + the front door; Bonfires holds the knowledge graph + judging; GitHub holds the work. Builds on the corrected Bonfire recall finding in doc 740 ([[project_bonfire_delve_recall]]).

## Who's who (corrected 2026-05-29)

- **Plat0x = Carlos** - on the Bonfires team, the technical architect/dev. The primary voice in this call.
- **Josh = the Bonfires founder.**
- **Ryan Kagy** - an associated person, NOT the founder (corrects the earlier memory that labeled him "Bonfires founder").

## The core insight

Plat0x's framing, which drives the whole design: **"The most interesting thing about Bonfires is not Bonfires itself, but what you can do with it as a backend."** So the ZABAL Games system is built so that almost nothing custom touches the Bonfire API directly - the graph-making is already solved by pushing to Bonfires; Zaal's only new surface is a thin registration + scheduled-push layer.

## The architecture (designed in-call)

A GitHub-as-submission, Bonfire-as-backend pipeline:

1. **Builders bring their own harness and keys.** Hermes / Codex / Claude, their own API tokens - they spend their own money. They are handed a **skill file**.
2. **The skill does not need to call the Bonfires API.** It instructs the builder's agent to **push to GitHub** with their **wallet address / hash in an MD file**, then makes **one call to a registration server**.
3. **The registration server keeps a simple list: `{wallet address -> GitHub repo}`.** (e.g. "user 0x2 has GitHub repo /several-beatbox".)
4. **A cron job (hourly/daily) checks each registered repo for new commits and creates a new Bonfire episode** from them.
5. **Clean separation of concerns:**
   - Data lives on **GitHub** (the builder owns it).
   - The graph lives on **Bonfires** (already solved).
   - Zaal maintains only the **registration list + the scheduled push**.

Why the separation is good (Plat0x): builders bring their own tokens/keys, so cost scales with them; and because they know their GitHub logs are read + indexed by the main agent, they are incentivized to write richly. "If people think they're not going to be heard, they won't say anything. If you tell them it'll be indexed, they write."

## The judging layer (already built)

Bonfires has an existing **judging pipeline that is agnostic to what it judges** - a person, a project, a joke, an abstract contribution. You only supply a **rubric** defining what "good" means for that evaluation (uniqueness, integrity, whatever the criteria are). For ZABAL Games: feed it the set of contributions + a rubric, and it ranks them.

This connects directly to the **ZAO Fractal Respect model** (asynchronous games, weekly sharing, members voting on each other's contributions to pick top contributors): instead of humans coming in to vote, an agent does it - "here's the criteria, you're looking at everyone's data, rank everyone this month." Zaal flagged this as something he wants to do with one of his other projects in combo with ZABAL.

## The knowledge-gathering game (the big idea)

- **July 1, before open submission:** an **`LLMS.txt`** containing all ZAO brand info + brand assets. Builders point their harness at it: "what's interesting for what we've built and what we want to build."
- **Knowledge-gathering phase: builders don't even write code - they make a GitHub repo and write REPORTS.** All reports get indexed into the centralized graph.
- It becomes a **knowledge game**: whose reports are used most often (measured by **whose information gets cited** in the agent's daily queries / summaries) = who brings the most interesting information.
- **Hyper-block / remixes:** because many people write about different things, you can query "tell me what the DeFi reports say" and the agent returns a **cited** synthesis drawing on different people's reports.

## Website integration

Instead of routing people through Telegram, put the Bonfire bot/graph on Zaal's own site: builders **log in with GitHub / Farcaster / wallet**, then **add information to their submission through the graph** - the bot as an interactive piece sitting on top of the graph (the same idea they had floated for an ETH Boulder hackathon).

## Key Decisions

| # | Decision | Owner | Status | Confidence |
|---|----------|-------|--------|------------|
| 1 | ZABAL Games submission = builder GitHub repos + a registration server + a cron that pushes new commits to Bonfire as episodes | Both | TODO | high |
| 2 | Builders bring their own harness + keys; the skill file pushes to GitHub + registers (the skill need not touch the Bonfire API) | Both | TODO | high |
| 3 | Use Bonfire's existing rubric-based judging pipeline to rank contributions; tie it into the Fractal Respect agent-ranking model | Both | TODO | high |
| 4 | Knowledge-gathering phase = write REPORTS to GitHub (not code), indexed into the graph; "whose reports get cited most" becomes the game | Both | TODO | high |
| 5 | Ship an LLMS.txt of all ZAO brand info + assets, ready July 1 before open submission | Zaal | TODO | high |
| 6 | Plat0x does a ZABAL Games workshop June 1 (Mon) 5-6pm ET; wants 3+ sessions (workshops first half June, panels second half), AMA after 2-3 | Both | TODO | high |

## Action Items

| Title | Owner | Due | Category | Confidence |
|-------|-------|-----|----------|------------|
| Build the registration server + cron-to-Bonfire push into the ZABAL Games repo, send to Plat0x | Zaal | - | Site / Tech | high |
| Send Zaal a calendar invite / email for the June 1 5-6pm ET session | Plat0x | 2026-06-01 | ZABAL Games | high |
| Prep the LLMS.txt brand-info + assets file before open submission | Zaal | 2026-07-01 | Site / Tech | medium |
| Have a longer follow-up on combining the Fractal Respect async-voting model with Bonfire agent-ranking | Both | - | ZAO Devz | medium |

## Quotes

- Plat0x: "The most interesting thing about Bonfires is not Bonfires in itself, but what you can do with it as a backend."
- Plat0x: "Your job becomes this part only, because the graph-making is already kind of solved - you just push it to Bonfires. You're just creating that small scheduled push. The data is stored on GitHub, the graph is stored on Bonfires, and all you have to do is keep this list."
- Plat0x: "We already have the judging pipeline you can use... it's very agnostic about what it's judging - it can judge a person, a project, a joke, a contribution. All you have to do is set up the rubric of what good means for that evaluation."
- Plat0x: "On the knowledge-gathering phase, we don't even want you to make code, but rather make a GitHub repo and write reports... then you can play this game of whose reports are used more often - who brings the most interesting information, measured by whose information is used in the queries."
- Plat0x: "If people think they're not going to be heard, they're not going to say anything. But if you tell them it's going to be indexed, they write."
- Zaal: "That's exactly what I would like. I'm going to start building that into the ZABAL Games repo and then send it over to you."

## Why this is load-bearing

ZABAL Games now has its three rails defined end-to-end:
- **Magnetic** (docs 778/783) = identity, the front door, the email channel.
- **Bonfires** (this doc) = the knowledge graph + the judging + the "knowledge game" incentive layer.
- **GitHub + builder harnesses** = where the actual work + reports live.

The elegant part: Zaal's custom build shrinks to a registration list + a scheduled push. Everything else (graph construction, rubric-based judging, cited synthesis) already exists in Bonfires. This is the technical answer to "how does the July submission + judging actually work."

## Transcript

Full transcript: [transcript.md](transcript.md) (heavy looping intro/outro auto-trimmed by trim-loops.sh - 56 looped lines collapsed).
