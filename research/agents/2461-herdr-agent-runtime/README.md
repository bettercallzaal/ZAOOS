---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-25
superseded-by:
related-docs: "2456, 2407, 875, 2420, 2444"
original-query: "https://x.com/shannholmberg/status/2094704183345922356?s=46"
tier: STANDARD
---

# 2461 - herdr: the runtime we built by hand, with 34,377 stars on it

> **Goal:** Read the AI-stack post Zaal sent, find what is actually new in it, and answer one question it forces: ZAO derives lane state by scraping terminal panes and got that wrong three times today - does a 34k-star Apache-2.0 runtime already provide it as a first-class feature.
>
> **Re-research, 2026-09-25.** All five Next Actions from the 2026-09-01 version were still open and overdue (due dates 2026-09-03 through 2026-09-08). This pass closes two of them (the LICENSE read, the Claude Code CLI question), confirms a third never happened (the spike), and surfaces one the original doc could not have known: the zorca consolidation decision 1 argued to pause **already happened, on 2026-09-06, in the opposite direction** - see Findings.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|---|---|---|
| 1 | **The premise of this decision moved. Zorca was retired to a pointer on 2026-09-06; lane tools stayed in `zaal-dotfiles/bin`.** This doc originally argued to evaluate herdr *before* moving `zj`/`zao-lanes`/`zao-tick`/`lane-send`/`zao-lane-boot` **into** zorca. That move never happened - the reverse did. `zorca/README.md` now reads "The ZAO orchestration layer does not live here any more. It lives in `zaal-dotfiles/bin`", dated 2026-09-06, five days after this doc and reasoned in `zao-vault/notes/zao-orchestrator-2026-09-05.md`, which **does not mention herdr at all** (`grep -i herdr`, zero hits). The literal consolidation question is moot; the underlying one - should the hand-rolled semantic-state derivation be replaced with a runtime that reports it natively - is untouched and still fully open. | `zorca/README.md` read directly 2026-09-25; `zao-vault/notes/zao-orchestrator-2026-09-05.md` grepped for "herdr", 0 hits | A |
| 2 | **Claude Code CLI is confirmed among herdr's detected agent CLIs - the gating Next Action from 2026-09-01 is now answered YES.** herdr.dev's homepage explicitly lists "Claude Code, Codex, Pi, opencode, Cursor, Grok, Copilot, Hermes" as 8 of the "22 agents detected out of the box," and the page's own hero demo runs a mocked `Claude Code v2.1.198` session as the primary example. This closes the Next Action that "gates everything else." | `curl` + HTML strip of herdr.dev, read 2026-09-25 | A |
| 3 | **The LICENSE gap is closed: Apache-2.0 confirmed from the file itself, not the API classifier or the site.** `gh api repos/herdrdev/herdr/contents/LICENSE --jq .content | base64 -d` returns the verbatim Apache License 2.0 text. The site's footer independently states "v0.9.1 · Apache 2.0." Source escalated PARTIAL to FULL per Hard Requirement 13. | `gh api` contents fetch, read 2026-09-25 | A |
| 4 | **The spike never ran. No lane has been run under herdr, and the zorca-consolidation hold was never formally decided either way.** `zao-research-index "herdr spike lane run"` and `"consolidate zorca decision"` return no doc besides this one and 2456. The ZAO cowork tracker shows the two research-action tasks from this doc (LICENSE read, due 09-03; run-a-lane spike, due 09-08) both still `todo` and overdue. | `zao-research-index`, `~/bin/zao-tracker search "herdr"`, both 2026-09-25 | B |
| 5 | **Do NOT rip out tmux on this doc's evidence - still holds.** The compare matrix re-fetched 2026-09-25 is unchanged in structure: tmux still sits in "terminal multiplexer," still credited with detach/reattach/SSH persistence. The gain is still semantic state, direct attach, and an agent-facing API - not persistence, which ZAO already has via tmux. | herdr.dev/compare, re-fetched raw 2026-09-25 | A |
| 6 | **Read `dcolinmorgan/herdr-remote`'s actual licence before treating it as a drop-in fix for the four-machine constraint - it is AGPL-3.0-or-later, not the "Other/NOASSERTION" GitHub's classifier reports.** The repo is dual-licensed: AGPL-3.0-or-later, or a paid commercial licence for organizations that "cannot comply with AGPL." AGPL's network-use clause is a real consideration for anything that talks to it as a service across ZAO's four machines - this is exactly the kind of licence-field trap Hard Requirement 13 exists to catch, on a different repo than the one it caught last time. | `gh api .../contents/LICENSE` read directly, 2026-09-25; classifier said `NOASSERTION`, file says AGPL-3.0-or-later + commercial option | A |

## What the post actually said

@shannholmberg, 2026-09-01 08:29 UTC, 1,307 favourites and 121,154 views at read time. Seven tools, verbatim:

1. `@orca_build` - main ADE for working with multiple agents
2. `@bot` - marketing agents autonomous workers
3. `@paper` - design, FE, visual mood board
4. `@herdrdev` - ADE in terminal
5. `@cursor_ai` - FE and access to Grok Bot
6. `@WisprFlow` - transcribing my voice notes into text
7. `@NousResearch` - hermes for orchestration of agents

**Two of the seven are already ZAO's stack**, which is worth stating plainly rather than treating the post as new information. Item 1 is the ADE `zorca` was built to drive (note: zorca itself is now retired to a pointer as of 2026-09-06 - see Key Decision 1). Item 7 is the subject of doc [agents/875-nousresearch-hermes-7day-setup-vs-zao-hermes](../875-nousresearch-hermes-7day-setup-vs-zao-hermes/), re-resolved 2026-09-25 (single match), whose own Goal line still warns that this Hermes is a different product from ZAO's fix-PR bot of the same name.

**Item 4 is the finding.** `herdr` had zero hits across the research library before this doc (still true - `zao-research-index "herdr"` returns only this doc and doc 2475, which cites this doc rather than adding new information).

## herdr, measured

| | Measured 2026-09-01 | Measured 2026-09-25 | Change |
|---|---|---|---|
| Repo | `herdrdev/herdr` | same | - |
| Stars (GitHub API) | 34,377 | **40,768** | +6,391 (+18.6% in 24 days) |
| Stars (site counter) | 34,252 | 40,432 | site lags API by ~1 day, as before |
| Licence | Apache 2.0 (site-claimed only) | **Apache 2.0, confirmed from the actual LICENSE file** | escalated PARTIAL to FULL |
| Installs claimed | 658,966 | **1,046,795** | +387,829 (+58.8%) |
| Community plugins | 909 | **1,324** | +415 (+45.7%) |
| Agent CLIs detected | 21 | **22** | +1; Claude Code confirmed among them (see below) |
| Version | not stated | **v0.9.1** | new info |
| Backing | Y Combinator | Y Combinator, plus "We raised $6M. We're hiring" banner on the homepage | new info, not previously captured |
| Forks | not captured | 3,115 | new info |
| Open issues | not captured | 362 | new info |
| Platforms | macOS, Linux, Windows | unchanged | - |

Its pitch line changed slightly in wording but not substance: *"Herdr is where your coding agents live. However many you run, across however many projects, each in its own terminal. Walk away and they keep working. Come back from any machine and they're where you left them."*

### Claude Code CLI - the gating question, answered

The 2026-09-01 doc flagged this as the single Next Action that "gates everything else... Unverified." Re-fetched 2026-09-25: the homepage explicitly names the detected CLIs - *"Claude Code, Codex, Pi, opencode, Cursor, Grok, Copilot, Hermes"* - out of "22 agents detected out of the box." Claude Code is not just present, it is the CLI used in the page's own hero demo (a mocked `Claude Code v2.1.198` session with "Fable 5 with high effort · Claude Max" shown in the pane). **Confirmed: yes.**

### The architecture claim - unchanged

> *"Apps manage the herd. Herdr runs it. Most tools Herdr gets compared to are apps: a window you open to manage coding agents, and a window the work depends on. Herdr is a different kind of thing: a runtime. A server holds real terminals open on the machine, the agents live in those, and every UI, ours included, is just a client that attaches."*

Re-read verbatim on herdr.dev/compare 2026-09-25 - unchanged from 2026-09-01.

## The comparison that matters to us

From herdr's own matrix, re-fetched 2026-09-25 and structurally unchanged from 2026-09-01, restricted to the column ZAO occupies:

| Capability | herdr | tmux / zellij | ZAO today |
|---|---|---|---|
| Work survives its own UI closing | server owns the terminals | yes, detach | **yes** - tmux |
| Runs inside your existing terminal | yes | yes | yes |
| **Semantic agent state** | **blocked / working / done / idle, with attention cues** | process status | **derived by scraping panes** - 7 sites in `zao-lanes` (not re-measured this pass; see Doc 2456 for the current inventory of lane tooling) |
| Detach, reattach, SSH in | any tty | yes | yes |
| **Direct attach to one agent** | **yes** | - | via tmux target, and it prefix-matched wrongly as of 2026-09-01 |
| **API for agents to drive themselves** | **read / send / wait / split / attach** | terminal scripting | `lane-send`, hand-rolled |
| Clients on the same runtime | TUI, CLI, plain SSH, "more coming" | its own client | `zj`, `zao-lanes`, the phone app |

The two bolded rows are still the whole argument, and the underlying ZAO problem (state inferred from terminal text, not reported by a runtime) was not re-measured this pass - it is orthogonal to which repo holds the tools.

## What this does NOT settle (updated 2026-09-25)

- **Whether herdr's state is actually better in the exact failure case ZAO hit.** Still unmeasured. The spike ("run one lane under herdr, see if it reports `blocked` on a plain-text question") **was never run** - confirmed absent from the research index and still `todo` on the tracker, overdue since 2026-09-08.
- ~~**Whether the Claude Code CLI is among its 21 detected agent CLIs.**~~ **RESOLVED 2026-09-25: yes**, explicitly named, and used in the product's own demo.
- **Whether it survives ZAO's actual constraint** - four machines (Mac, VPS, Pi, Windows) plus a phone. `dcolinmorgan/herdr-remote` (387 stars, up from 307) now has its README read in full (was previously "unread"): it delivers exactly the claimed shape - menu bar app, phone/Telegram relay, one-tap approvals, a daily digest - via a Python relay + web dashboard + Telegram client that "run on macOS, Linux, and Windows." But its licence is **AGPL-3.0-or-later** (dual-licensed with a paid commercial option), not the site-implied "just a plugin" - worth weighing before adopting it as infrastructure ZAO would run as a network service.
- ~~**The licence, read from the file.**~~ **RESOLVED 2026-09-25:** Apache 2.0, confirmed from the LICENSE file itself.
- **NEW this pass: whether the zorca-consolidation hold this doc requested was ever honored.** It was not formally decided either way - it was overtaken. Zorca was retired to a pointer on 2026-09-06 (before this doc's own 2026-09-08 due date for "hold the consolidation"), and the reasoning note behind that move never mentions herdr. So the hold was neither granted nor denied; the thing it was meant to hold no longer exists in the form the doc described.

## Also See

- [Doc 2456 - agents/2456-orchestrator-practice](../2456-orchestrator-practice/) - the orchestration practice audit; its decision 9 and Next Action ("decide the single home for lane tooling," due 2026-09-12) is the consolidation this doc argued to pause. Resolved by event, not decision: `zorca/README.md` shows the tools stayed in `zaal-dotfiles/bin` and zorca itself was retired 2026-09-06.
- [Doc 2407 - dev-workflows/2407-orca-tmux-lane-integration](../../dev-workflows/2407-orca-tmux-lane-integration/) - Orca and the Wall are blind the same way
- [Doc 875 - agents/875-nousresearch-hermes-7day-setup-vs-zao-hermes](../875-nousresearch-hermes-7day-setup-vs-zao-hermes/) - the other Hermes, and the name collision (re-resolved 2026-09-25, single match, claim still accurate)
- [Doc 2420 - agents/2420-zorca-gui-redesign](../2420-zorca-gui-redesign/) - the zorca GUI (note: zorca itself is retired as of 2026-09-06; read this doc as historical)
- [Doc 2444 - agents/2444-always-on-orchestrator](../2444-always-on-orchestrator/) - the deterministic tick

## Next Actions

All five 2026-09-01 actions were overdue as of today (2026-09-25). Status per row below.

| Action | Owner | Type | By When | Status |
|---|---|---|---|---|
| ~~Read `herdrdev/herdr`'s LICENSE file and confirm Apache 2.0 from the file~~ | @Zaal | Research | 2026-09-03 | **DONE 2026-09-25** - Apache 2.0 confirmed from file content, quoted above |
| ~~Establish whether the Claude Code CLI is one of herdr's detected agent CLIs~~ | @Zaal | Research | 2026-09-03 | **DONE 2026-09-25** - confirmed YES, explicitly listed and demoed |
| Run one lane under herdr and check whether a turn ending on a plain-text question reports `blocked` - the case `zao-lanes` fails (shipped = the observed state recorded here) | @Zaal | Spike | 2026-09-30 | **STILL OPEN** - never run; re-dated from the lapsed 2026-09-08 |
| Decide, explicitly, whether the herdr question changes anything now that zorca is retired and tools live in `zaal-dotfiles/bin` (shipped = a decision line in this doc or in `zaal-dotfiles/README.md`) | @Zaal | Decision | 2026-09-30 | **NEW** - replaces the moot "hold the zorca consolidation" action |
| Read `install.sh` before any install; never pipe it to sh (shipped = script read, or adoption dropped) | @Zaal | Security | 2026-09-30 | **STILL OPEN** - not re-verified this pass; re-dated from the lapsed 2026-09-03 |

## Sources

Method stated per source, per `.claude/rules/research-grounding.md`. No WebFetch was used as a quote source.

- [@shannholmberg, 2026-09-01](https://x.com/shannholmberg/status/2094704183345922356) - **[FULL - `zao-fetch-x.sh`, fxtwitter tier 0, full text and metrics, read 2026-09-01, not re-fetched this pass since the post is static]** 1,307 favourites, 65 replies, 121,154 views at original read time.
- [herdr.dev](https://herdr.dev/) - **[FULL - `curl` + HTML strip, re-fetched 2026-09-25]** 40,432 stars (site counter), 1,046,795 installs, 1,324 plugins, 22 agent CLIs detected including Claude Code by name, version v0.9.1, "$6M raised" banner.
- [herdr.dev/compare](https://herdr.dev/) - **[FULL - `curl` + HTML strip, re-fetched 2026-09-25]** The nine-tool matrix, structurally unchanged from 2026-09-01, quoted verbatim above.
- [herdrdev/herdr](https://github.com/herdrdev/herdr) - **[FULL - escalated from PARTIAL. `gh api repos/herdrdev/herdr` for live metadata (40,768 stars, 3,115 forks, 362 open issues, license.spdx_id=apache-2.0, not archived, pushed 2026-09-26T00:13Z) AND `gh api repos/herdrdev/herdr/contents/LICENSE --jq .content | base64 -d` for the actual file content, read 2026-09-25 - confirms Apache License 2.0 verbatim.]**
- [stablyai/orca](https://github.com/stablyai/orca) - **[FULL - `gh api` for live metadata plus the LICENSE file read directly, re-verified 2026-09-25]** 78,304 stars (up from 59,152 measured 2026-09-01, +32.4% in 24 days), 5,121 forks, 6,878 open issues, MIT confirmed from file ("Copyright (c) 2026 Lovecast Inc."), pushed 2026-09-26T00:14Z, not archived.
- [dcolinmorgan/herdr-remote](https://github.com/dcolinmorgan/herdr-remote) - **[FULL - escalated from unread. `gh api` for live metadata (387 stars, up from 307; 71 forks; 4 open issues; pushed 2026-09-24) plus the LICENSE file (dual-licensed: AGPL-3.0-or-later, or paid commercial - NOT the "Other/NOASSERTION" the license API field reports) and the README (menu bar app, phone/Telegram relay, one-tap approvals, daily `/digest`), all read directly 2026-09-25.]**
- [Doc 2456 - agents/2456-orchestrator-practice](../2456-orchestrator-practice/README.md) - **[FULL - read directly 2026-09-25]** Its decision 9 and matching Next Action (due 2026-09-12, "decide the single home for lane tooling") is the sibling context for this doc's decision 1.
- [zorca/README.md](file:///Users/zaalpanthaki/Documents/zorca/README.md) - **[FULL - local file, read directly 2026-09-25]** "The ZAO orchestration layer does not live here any more. It lives in `zaal-dotfiles/bin`," dated 2026-09-06. This is the event that resolved (by bypassing) doc 2456's Next Action and this doc's decision 1.
- `~/zao-vault/notes/zao-orchestrator-2026-09-05.md` - **[FULL - local file, `grep -i herdr`, 0 hits, read directly 2026-09-25]** Confirms the zorca-retirement reasoning never considered herdr.
- Doc 875 - [agents/875-nousresearch-hermes-7day-setup-vs-zao-hermes](../875-nousresearch-hermes-7day-setup-vs-zao-hermes/README.md) - **[FULL - re-read directly 2026-09-25, `zao-research-health --resolve 875` confirms single match]** Name-collision claim re-verified accurate; doc's own `last-validated` is 2026-06-17 (stale on its own terms, out of scope for this re-research).
- `zao-research-index "herdr"` / `"zorca lane tooling"` / `"herdr spike lane run"` / `"consolidate zorca decision"` - **[FULL - FTS5 index queries, run 2026-09-25]** No follow-up doc found recording a completed herdr spike or a formal zorca-consolidation decision beyond doc 2456 and this one.
- `~/bin/zao-tracker search "herdr"` - **[FULL - live tracker query, run 2026-09-25]** Three related tasks, all still `todo`, all overdue (due 2026-09-03, 09-04, 09-08).
- Local, measured 2026-09-01, not re-measured this pass: `wc -l` across the five lane tools (1,449 lines); `grep` of `~/zaal-dotfiles/bin/zao-lanes` (7 state-derivation sites); ZAOOS issue #3390 (eight instances of a monitor reporting state it cannot observe). These are cited for historical continuity; a fresh line count would reflect whatever moved during the 2026-09-06 zorca retirement and was out of scope for this pass.
