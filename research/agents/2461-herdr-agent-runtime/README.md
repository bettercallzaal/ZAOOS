---
topic: agents
type: decision
status: research-complete
last-validated: 2026-09-01
superseded-by:
related-docs: "2456, 2407, 875, 2420, 2444"
original-query: "https://x.com/shannholmberg/status/2094704183345922356?s=46"
tier: STANDARD
---

# 2461 - herdr: the runtime we built by hand, with 34,377 stars on it

> **Goal:** Read the AI-stack post Zaal sent, find what is actually new in it, and answer one question it forces: ZAO derives lane state by scraping terminal panes and got that wrong three times today - does a 34k-star Apache-2.0 runtime already provide it as a first-class feature.

## Key Decisions (recommendations first)

| # | Decision | Grounded in | Grade |
|---|---|---|---|
| 1 | **EVALUATE herdr before moving the lane tools into zorca.** Zaal decided on 2026-09-01 to consolidate `zj`, `zao-lanes`, `zao-tick`, `lane-send`, `zao-lane-boot` into zorca. That is **1,449 lines** of hand-rolled lane tooling. herdr is an Apache-2.0 runtime whose feature list is a near-exact match, so the consolidation may be moving code that should be deleted. | `wc -l` on the five tools, 2026-09-01. herdr.dev compare matrix, fetched raw. | A |
| 2 | **The single highest-value feature is semantic agent state, and it is the thing we keep getting wrong.** herdr ships `blocked / working / done / idle` as first-class runtime state with attention cues. ZAO *derives* the same four by scraping pane text - **7 state-derivation sites in `zao-lanes` alone** - and that derivation produced three separate wrong-state bugs on 2026-09-01 (ZAOOS#3390). | `grep` of `~/zaal-dotfiles/bin/zao-lanes`; issue #3390 | A |
| 3 | **Do NOT rip out tmux on this doc's evidence.** herdr's own compare page puts tmux in the "terminal multiplexer" column and concedes tmux already does detach/reattach and survives a client closing. The gain is semantic state, a driving API and clients; the gain is NOT persistence, which we already have. | herdr.dev/compare, fetched raw 2026-09-01 | A |
| 4 | **Nothing else in the post is new to us.** Orca is already the ADE zorca is built on (doc 2407). NousResearch Hermes was researched in doc 875, which explicitly names the collision with ZAO's own `hermes-orchestrator`. Wispr Flow, Cursor, and the design tools are outside the orchestration question. | docs 2407, 875 | A |
| 5 | **Verify the install path before anyone runs it.** The advertised install is `curl -fsSL https://herdr.dev/install.sh \| sh`. That is a pipe-to-shell from a domain we have not audited, and `secret-hygiene.md` plus `no-rm-rf.md` both bite here. Read the script first; do not pipe it. | herdr.dev, fetched raw | A |

## What the post actually said

@shannholmberg, 2026-09-01 08:29 UTC, 1,307 favourites and 121,154 views at read time. Seven tools, verbatim:

1. `@orca_build` - main ADE for working with multiple agents
2. `@bot` - marketing agents autonomous workers
3. `@paper` - design, FE, visual mood board
4. `@herdrdev` - ADE in terminal
5. `@cursor_ai` - FE and access to Grok Bot
6. `@WisprFlow` - transcribing my voice notes into text
7. `@NousResearch` - hermes for orchestration of agents

**Two of the seven are already ZAO's stack**, which is worth stating plainly rather than treating the post as new information. Item 1 is the ADE `zorca` exists to drive. Item 7 is the subject of doc 875, whose own Goal line warns that this Hermes is a different product from ZAO's fix-PR bot of the same name.

**Item 4 is the finding.** `herdr` had **zero hits** across the research library before this doc.

## herdr, measured

| | Measured 2026-09-01 |
|---|---|
| Repo | `herdrdev/herdr`, **34,377 stars** |
| Licence | **Apache 2.0** (stated on herdr.dev; the repo's LICENSE file is the authority and should be read before adoption - Hard Requirement 13) |
| Installs claimed | 658,966 |
| Community plugins | 909 |
| Agent CLIs detected | 21 |
| Backing | Y Combinator |
| Platforms | macOS, Linux, Windows |

Its own one-line pitch: *"Herdr is the runtime your coding agents live on - laptop, desktop, or a box you rent. It holds real terminals open so the work survives the lid closing, and gets you back in from anything with a keyboard."*

**That sentence describes the ZAO lane system.** Terminals held open on a machine, work surviving the laptop closing, reachable from a phone.

### The architecture claim, which is the part that matters

> *"Apps manage the herd. Herdr runs it. Most tools Herdr gets compared to are apps: a window you open to manage coding agents, and a window the work depends on. Herdr is a different kind of thing: a runtime. A server holds real terminals open on the machine, the agents live in those, and every UI, ours included, is just a client that attaches."*

And the row it says sorts the field: **"what happens to the agents when the thing you're looking at goes away."**

ZAO already passes that test, because tmux passes it. What ZAO does *not* have is the layer above it.

## The comparison that matters to us

From herdr's own matrix, restricted to the column we actually occupy:

| Capability | herdr | tmux / zellij | ZAO today |
|---|---|---|---|
| Work survives its own UI closing | server owns the terminals | yes, detach | **yes** - tmux |
| Runs inside your existing terminal | yes | yes | yes |
| **Semantic agent state** | **blocked / working / done / idle, with attention cues** | process status | **derived by scraping panes** - 7 sites in `zao-lanes` |
| Detach, reattach, SSH in | any tty | yes | yes |
| **Direct attach to one agent** | **yes** | — | via tmux target, and it prefix-matched wrongly until today |
| **API for agents to drive themselves** | **read / send / wait / split / attach** | terminal scripting | `lane-send`, hand-rolled |
| Clients on the same runtime | TUI, CLI, plain SSH | its own client | `zj`, `zao-lanes`, the phone app |

The two bolded rows are the whole argument.

### Why semantic state is not a nice-to-have for us

Every wrong-state bug on ZAOOS#3390 exists because the state is **inferred from terminal text** rather than reported by a runtime:

- `zao-lanes` passed bare names to `tmux capture-pane -t`; tmux prefix-matches, so `-t orc` returned a different lane's pane, byte-identical. A runtime with `attach <agent-id>` has no such failure mode.
- `IDLE` could not distinguish *finished* from *waiting on a human*, because a plain-text question carries no marker and scrolls above the six-line window the detector reads. `blocked` is a distinct state in herdr.
- The lane watcher attributes commits by repo because it cannot see which agent made them.

Three bugs, one root: **we compute what a runtime could report.**

## What this does NOT settle

- **Whether herdr's state is actually better.** Its four states are advertised; nothing here measured them against a real agent that ends a turn on a question. That is the exact case ZAO's own detector fails, and it is the test worth running first.
- **Whether the Claude Code CLI is among its 21 detected agent CLIs.** Unverified, and it is the gate on the whole idea.
- **Whether it survives ZAO's actual constraint**, which is not one machine but four - Mac, VPS, Pi, Windows - plus a phone. `dcolinmorgan/herdr-remote` (307 stars) advertises menu bar, phone and Telegram, which is the right shape, but it is a third-party plugin and unread.
- **The licence, read from the file.** Apache 2.0 is claimed on the site. `credit-attribution.md` and Hard Requirement 13 both require the LICENSE file itself, and today's session already caught `LICENSE.md` versus `LICENSE` breaking a conventional fetch.

## Also See

- [Doc 2456](../2456-orchestrator-practice/) - the orchestration practice audit; its decision 9 is the repo-consolidation this doc argues to pause
- [Doc 2407](../../dev-workflows/2407-orca-tmux-lane-integration/) - Orca and the Wall are blind the same way
- [Doc 875](../875-nousresearch-hermes-7day-setup-vs-zao-hermes/) - the other Hermes, and the name collision
- [Doc 2420](../2420-zorca-gui-redesign/) - the zorca GUI
- [Doc 2444](../2444-always-on-orchestrator/) - the deterministic tick

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Read `herdrdev/herdr`'s LICENSE file and confirm Apache 2.0 from the file, not the site (shipped = licence quoted in this doc) | @Zaal | Research | 2026-09-03 |
| Establish whether the Claude Code CLI is one of herdr's 21 detected agent CLIs - this gates everything else (shipped = a yes/no in this doc with the evidence) | @Zaal | Research | 2026-09-03 |
| Run one lane under herdr and check whether a turn ending on a plain-text question reports `blocked` - the case `zao-lanes` fails (shipped = the observed state recorded here) | @Zaal | Spike | 2026-09-08 |
| Hold the zorca lane-tool consolidation until the above answers land (shipped = decision recorded in `zorca/README.md`) | @Zaal | Decision | 2026-09-08 |
| Read `install.sh` before any install; never pipe it to sh (shipped = script read, or adoption dropped) | @Zaal | Security | 2026-09-03 |

## Sources

Method stated per source, per `.claude/rules/research-grounding.md`. No WebFetch was used.

- [@shannholmberg, 2026-09-01](https://x.com/shannholmberg/status/2094704183345922356) - **[FULL - `zao-fetch-x.sh`, fxtwitter tier 0, full text and metrics]** 1,307 favourites, 65 replies, 121,154 views at read time.
- [herdr.dev](https://herdr.dev/) - **[FULL - `curl` + HTML strip, 49,960 bytes]** The pitch, the install line, and the counters: 34,252 stars on the page, 658,966 installs, 909 plugins, 21 agent CLIs.
- [herdr.dev/compare](https://herdr.dev/compare) - **[FULL - `curl` + HTML strip]** The nine-tool matrix and the runtime-versus-app framing, quoted verbatim above.
- [herdrdev/herdr](https://github.com/herdrdev/herdr) - **[PARTIAL - `gh search repos` metadata only: 34,377 stars. The repo contents and LICENSE file were NOT read]** - which is why that is the first Next Action.
- [stablyai/orca](https://github.com/stablyai/orca) - **[FULL - `gh api` plus the LICENSE file read directly]** 59,152 stars, MIT confirmed from the file, pushed 2026-09-01, not archived. The account bio claimed 58k; the measured figure is 59,152.
- Local, measured 2026-09-01: `wc -l` across the five lane tools (1,449 lines); `grep` of `~/zaal-dotfiles/bin/zao-lanes` (7 state-derivation sites); ZAOOS issue #3390 (eight instances of a monitor reporting state it cannot observe).
