---
topic: farcaster
type: profile
status: research-complete
last-validated: 2026-10-07
superseded-by:
related-docs: "agents/2586-orchestrator-seat-outside-view, agents/2239-zoe-capability-map"
original-query: "can we also /zao-research https://github.com/kazani-351"
tier: STANDARD
---

# 2631 - github.com/kazani-351: who it is, what it has built, and what touches The ZAO

> **Goal:** Zaal asked for research on this GitHub account and gave no purpose (vault `decisions/grill-2026-10-07-seat-morning.md`, item 31). This doc reports what is there, as of 2026-10-07, and does not guess why he asked.

## Summary

1. Kazani is one builder in India who makes small AI tools "for people tech leaves out" and writes each one up.
2. The same person is on Farcaster as @kazani (FID 4926, 12,140 followers) and publishes on Paragraph, the two places Zaal also uses.
3. The account has 97 public repos; 67 are forks, mostly reading lists. About ten recent ones are original, small and mostly MIT.
4. Three touch ZAO's world: a Farcaster moderation-agent essay, a link-safety MCP server for agents, and an agent skill that audits your own AI setup.
5. No ZAO repo, research doc or vault note mentioned the handle before today. Whether Zaal knows this person is UNKNOWN.

## Who the account says it is

| Field | Value | Source |
|---|---|---|
| Name / login | Kazani / `kazani-351` | `gh api users/kazani-351` |
| Bio | "I build small AI tools for people tech leaves out, and write about how they work." | same |
| Location | India | same |
| Site | kazani.pages.dev | same |
| Account created | 2022-06-16 | same |
| Followers / following | 17 / 57 | same |
| Organisations | none public | `gh api users/kazani-351/orgs` |
| Farcaster | @kazani, FID 4926, 12,140 followers, 30 following | haatz API, fetched today |
| Writing | paragraph.com/@kazani, a newsletter called BlogChain | profile README |

The profile README says: "I build small AI tools, ship them live, and then write about how they work. Most of what I make is for people who get left out of tech: older relatives, blind and low-vision neighbours, district health officers."

The GitHub profile links to farcaster.xyz/kazani, and the Farcaster bio links back to kazani.pages.dev, the same site GitHub lists. The two accounts point at each other, so they are the same person. A real name is not given anywhere I read, and none is guessed here.

## What it has built

97 public repos, read from the API on 2026-10-07: 67 forks (security, privacy and Ethereum reading lists, last pushed 2021 to 2025), 30 original. The original work falls into three periods.

**2026, AI tools (the current work)**

| Repo | What it is | Stars | Last push | Licence |
|---|---|---|---|---|
| `linkcheck-mcp` | MCP server: "tells an AI agent where a link really goes and whether it's safe, before anyone clicks it" | 1 | 2026-10-04 | MIT (LICENSE file read) |
| `jan-swasth-map` | Seasonal dengue and diarrhoea risk forecasts for India's districts, with an agent that drafts a response plan | 0 | 2026-10-06 | MIT (API field) |
| `ask-blogchain` | Ask the newsletter archive a question, get an answer citing the exact posts. Hybrid search plus a LangGraph agent, traced in Langfuse | 0 | 2026-10-05 | MIT for code; the posts in `data/` are "all rights reserved" (README) |
| `baton-webmcp` | A WebMCP store where the agent "proposes a state-changing action ... you confirm, and only then does it happen" | 0 | 2026-09-01 | MIT (API field) |
| `good-neighbor-agent` | Triage of help requests from blind and low-vision neighbours: answer, route to a volunteer, or escalate | 0 | 2026-08-28 | MIT (API field) |
| `system-upgrade` | An agent skill: seventeen "system-upgrade meta-prompts" to run on your own agent setup. "Adapted from Daniel Miessler's essay" | 0 | 2026-06-27 | MIT (LICENSE file read) |
| `decentralize-ai-farcaster-modagent` | An essay and spec, no code: a Farcaster moderation agent whose inference runs on decentralized GPU compute | 0 | 2026-07-18 | none; "Ideas and text are the author's own" |
| `samjha-do`, `handoff`, `ballpark`, `qalam`, `diffr` | Small single-purpose web tools | 0 | 2026-01 to 2026-08 | mixed, several none |

**2025:** `farcaster-advanced-search` (a Next.js app, no README, pushed 2025-12-11), `Slide-Quest-1`.

**2022 to 2023:** Ethereum learning projects (`escrow-hardhat`, `gas-tracker`, `NFT-Marketplace`, a Lens tutorial, an Optimism betting game).

Stars are near zero across the board (one star in total on the original repos). This is a personal workshop, not a project with users on GitHub. The reach is on Farcaster, not here.

Recent public activity (last 30 events): pushes to `jan-swasth-map`, `ask-blogchain` and the profile between 2026-10-03 and 2026-10-06, and stars on other people's agent tooling (`swyxio/skills`, `tigerless-labs/autoharness`, `mvanhorn/agent-tincan`).

## What connects to The ZAO's world

| Area | Connection | Strength |
|---|---|---|
| Farcaster | Active account with 12,140 followers; a Farcaster search app; a Farcaster moderation-agent proposal | Strong: same network Zaal posts on |
| Paragraph | Publishes a newsletter there, as Zaal does | Same platform |
| Agents | MCP server, WebMCP, LangGraph, an agent skill for Claude Code and Codex | Strong: same tools the estate runs |
| Human-in-the-loop | Baton's rule that the agent proposes and the person confirms is the same shape as ZAO's "agents prepare, Zaal sends" | Same idea, built independently |
| Farcaster moderation | The essay's thesis: moderation agents "typically route inference through a single centralized AI API, reintroducing the platform risk the protocol was built to avoid". ZAO has Farcaster guardrails for ZOL and ZOE queued as a PR (vault `decisions/grill-2026-10-06-icm.md`, item 32) | Relevant reading, concept stage only |
| Base / Solana | Old Ethereum and one Solana tutorial fork from 2022; nothing current | Weak |
| Music | Nothing found | None |

## Does ZAO already mention the handle

| Where searched | How | Result |
|---|---|---|
| ZAOOS origin/main, whole tree | `git grep -l -i kazani` | 0 files. Control: the same search for a known handle returns 36 files under `research/`, so the search works |
| zao-vault origin/main, whole tree | `git grep -l -i kazani` | 1 file: today's decision record of this request. Control: a known name returns 211 files |
| Agent memory directory | `grep -rli kazani` | 0 files |

Not searched: Zaal's Farcaster follows and DMs, his email, Telegram, and the Farcaster CRM rows in Supabase. So "ZAO has no record of this person" is true only for the three places above. Whether Zaal follows @kazani or has spoken with them is UNKNOWN.

## Three things Zaal could do, ranked

| # | Action | Why | Reversible? |
|---|---|---|---|
| 1 | **Read two things and follow on Farcaster.** The post "My RAG bot scored 26/26. A trace showed me what the score was hiding." and the moderation-agent essay (`draft.md` in the repo) | Lowest cost. The first is the same lesson as ZAO's own rules about a passing score hiding a failure; the second is about the exact agent type ZOL is | Yes: an unfollow |
| 2 | **Have a lane read `system-upgrade` and report what it would change in the estate, without installing it.** MIT, seventeen prompts across harness, security, focus and cross-config consistency | The estate spent this week on exactly those subjects (docs 2586 and 2630). A read costs one lane turn and changes nothing | Yes: a report only |
| 3 | **Try `linkcheck` as an MCP connector in one lane.** It follows redirects by headers only, strips trackers, checks the host against threat lists, and "never falls back to SAFE" | Agents in the estate open links from research and from inbound messages. This is a pre-check before they do | Yes: remove the connector. Adding an MCP server is a settings change, so it is Zaal's own step. The public instance sees every URL checked; the README says it does not save them, which is the author's claim, not verified |

Not on the list on purpose: reaching out. Whether these two know each other is unknown, and outreach is Zaal's own call and his own words.

## UNKNOWN

- Why Zaal asked for this account.
- Whether Zaal and Kazani know each other, follow each other, or have spoken.
- Kazani's real name and employer. Neither is published where I read, and neither was looked for elsewhere.
- Whether the 12,140 Farcaster followers are engaged (one number from one API; no casts were read).
- What `farcaster-advanced-search` does beyond its name: it has no README and its code was not read.
- Whether `linkcheck`'s privacy claim holds.

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Say what this account is for (the purpose was not given), or pick one of the three options | Zaal | Decision | when he wants |
| If option 2: one lane reads `system-upgrade` (`SKILL.md` and `references/prompts.md`) and reports, crediting Kazani and Daniel Miessler | a lane the seat names | Report | after his word |

## Sources

All fetched 2026-10-07. Quotes come from raw text.

1. `gh api users/kazani-351` (profile JSON) [FULL]
2. `gh api users/kazani-351/repos?per_page=100&sort=pushed` (97 repos: fork flag, stars, language, licence field, dates) [FULL]
3. `gh api users/kazani-351/orgs` and `/events/public` (30 events) [FULL]
4. README of `kazani-351/kazani-351`, read raw through the contents API [FULL]
5. READMEs of `linkcheck-mcp`, `system-upgrade`, `ask-blogchain`, `baton-webmcp`, `good-neighbor-agent`, `decentralize-ai-farcaster-modagent`, raw [FULL for the first two and the last; the other three read in part, first 20 to 45 lines plus licence lines]
6. LICENSE files of `linkcheck-mcp` and `system-upgrade`, read raw: both MIT [FULL]. Other licences in the table are the API's classifier field and are marked so
7. Farcaster profile for `kazani` through the haatz API (`/v2/farcaster/user/by_username`) [FULL, raw JSON]
8. `farcaster-advanced-search`: file listing only; no README exists [PARTIAL]

Not fetched: kazani.pages.dev, the Paragraph posts, the X account, the essay `draft.md`, and any cast. The budget was about ten fetches.

Credit: all tools and text described here are Kazani's (@kazani on Farcaster, `kazani-351` on GitHub). `system-upgrade` credits Daniel Miessler's essay "Prompts to Run When Fable Comes Back" as its source.
