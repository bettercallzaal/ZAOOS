# Session handoff - 2026-07-03 18:15

> from ZAO OS V1 (mac, mixed branches) -> to zabalgamez terminal (fresh CC session)
> doc: research/events/session-2026-07-03-onchain-q2-win-handoff/README.md
> chain: none

## Receiver instructions (read me FIRST, then do exactly this)

You just received a handoff bundle. Do NOT start work yet. Do this:

1. Read ALL sections below (A through E) before responding to anything.
2. Section C has no diff to apply - all work this session is committed + pushed on PR branches.
3. Create TaskList entries from section A. These are the "to do" items.
4. Use section B as your "why" - do not re-litigate decisions captured there unless new info surfaces.
5. Use section D to know what's still running (nothing blocking - the loop was stopped).
6. Use section E as your cold-start map for files, PRs, memory state.
7. Once integrated, message back: "Ingested handoff onchain-q2-win-handoff. 3 tasks queued. Ready."

## A. Tasks to absorb (paste these into your TODO list)

- [ ] **Build a way to put a Q2 big win on-chain (the lead ask).** Take a win from doc 928 (`research/events/928-q2-2026-big-wins/` - 28 wins listed, on `origin/main`) and record it on-chain as a permanent, verifiable artifact. Decide the mechanism first (see the spec block below), then build a minimal end-to-end path: pick one win -> write it on-chain -> get a shareable link/tx. Effort: medium. This is a NEW build for the zabalgamez terminal - likely its own small repo or a route, Zaal's call.
- [ ] **Finish wiring ecosystem context into the socials generator** in `~/Desktop/repos/zabalnewsletterbuilder` `lib/socials.ts` (branch `feat/ecosystem-context`, PR #9). The newsletter builder already has `lib/context.ts` (canonical links + dated/verified numbers); the composer surfaces it, but `generatePosts()` in `lib/socials.ts` does NOT yet pull canonical links from it. Wire it so cross-posts use real links. Small. Was the in-progress step when the session was handed off.
- [ ] **Review + merge the 3 open PRs from this session** (all green, all mergeable): ZAOOS **#1057** (newsletter growth/deliverability playbook, doc 944), zabalnewsletterbuilder **#9** (ecosystem context source + guard test), wwtracker **#15** (true-scale volume + treasury charts on the overview). wwtracker #14 (overview tab) already merged.

### Spec block for the on-chain Q2-win build (task 1)

- **What:** one Q2 win from doc 928 -> a permanent on-chain record with metadata (title, one-line, date, proof URL, win-number). Start with ONE win end-to-end, then generalize.
- **Mechanism options (decide with Zaal):**
  - **EAS attestation on Base (recommended MVP).** Ethereum Attestation Service. Define a schema (`string title, string oneLiner, string date, string proofUrl, uint256 winNumber`), attest each win. Cheapest "put a fact on-chain forever + verifiable" primitive; no token mechanics to reason about. Attestations get a shareable EAS scan URL.
  - **Zora / ERC-1155 collectible mint per win.** Each win = a mintable collectible. Adds collectible + social + optional revenue (ties to doc 944's collectible-mint growth idea). More surface than EAS.
  - **Paragraph collectible** (if the win is also a newsletter issue) - Paragraph already does wallet-native collectible mints; lowest-code if the win maps to an issue.
- **Chain:** default Base (where most ZAO/BCZ lives). WaveWarZ is on Solana - only go Solana if the win is WaveWarZ-specific.
- **Data source:** `research/events/928-q2-2026-big-wins/README.md` (Quick Reference table = 28 wins). Good first candidates: FarHack win with zlank (#26), ZAO Fund #2 on Artizen (#28), WaveWarZ x Wide partnership (#25).
- **Ties into:** doc 944 IMPLEMENTATION.md flagged per-issue collectible mints as an unproven-but-on-brand growth lever; this is the same primitive pointed at wins instead of issues.

## B. Why - decisions + pivots + ruled-out paths

- **On-chain-win idea is a NEW build handed to the zabalgamez terminal** - Zaal explicitly wants it built there, not in this session. This bundle is the brief.
- **WaveWarZ tracker:** built an OVERVIEW tab with a master multi-line toggle chart. Chose to INDEX each line to its own peak (=100%) so volume (~325 SOL), treasury (~3.7 SOL), and trades (9,045) share ONE axis - because dual-axis charts are the #1 dataviz mistake. True-scale SOL charts live separately (#15). Live treasury Dune query (7717935) was cached at 2026-06-16 (~2wk stale) - re-ran it (~1 credit), now current through 2026-07-03 (~3.68 SOL, above the 3.5 floor).
- **Did NOT fabricate the Profitability distribution rows** - they stay TBD in `lib/distributions.ts` until Zaal supplies real dates/amounts/wallets. Same rule everywhere: no invented numbers.
- **Did NOT regenerate the wwtracker analytics snapshot** - `ww-gen.py` needs 8 Dune query files, the repo ships only 4; a partial regen would ZERO OUT volume/program/timeline. That refresh needs the missing 4 queries rebuilt first.
- **Newsletter research (doc 944):** surfaced the daily-cadence tension honestly (research says daily churns) but recommended MITIGATIONS (serialized short-form + ZOE auto-draft + clean list), NOT "switch to weekly" - because daily is a deliberate ZAO identity. Content-supply map concluded: ZAO overproduces content, so the newsletter's job is CURATION not creation - which is why daily is sustainable for ZAO specifically.
- **`lib/context.ts` (nlbuilder):** single source of canonical links + numbers, every fact dated (`asOf`) + `verify`-tagged, guarded by a vitest test. Rule in code + docs: update in one place, NEVER invent a figure.
- **Kept the newsletter as SPECS not final outbound copy** - final voice-copy stays Zaal's per the drafting protocol.
- **FRICTION (save yourself the rediscovery):**
  - Both browser bridges (Chrome extension + Playwright MCP) were DOWN all session. Could not visually verify any render - used Node math checks on chart coordinates instead. If you build UI, expect to verify by hand or via a live deploy, not a local browser tool.
  - `git push --force-with-lease` is PERMISSION-BLOCKED for the agent here - Zaal has to run force-pushes himself (needed once to update a rebased PR).
  - The ZAOOS local working tree is heavily diverged (whitepaper branch + many untracked research dirs from parallel terminals; branch flips between sessions). For a CLEAN PR to main, use an isolated `git worktree add <tmp> origin/main` and cherry-pick - do NOT try to branch off the dirty local tree.

## C. Git state

- **ZAOOS** (`/Users/zaalpanthaki/Documents/ZAO OS V1`): branch flips between parallel terminals (was ws/zao-whitepaper, now ws/research-100k-reach-h2). PR **#1057** OPEN/mergeable (doc 944, landed via worktree off origin/main). No uncommitted work of this session's own.
- **zabalnewsletterbuilder** (`~/Desktop/repos/zabalnewsletterbuilder`): branch `feat/ecosystem-context`, clean, all pushed. PR **#9** OPEN/mergeable. Resume task-2 here.
- **wwtracker** (`~/Desktop/repos/wwtracker`): clean. PR **#14** MERGED (overview live), PR **#15** OPEN (true-scale charts).
- No uncommitted diffs to apply. Nothing to `git apply`.

## D. In-flight

- Background bash jobs: none.
- Subagents pending: none (3 newsletter-research agents completed earlier; results in doc 944 + session scratchpad).
- Scheduled wakeups: **the /loop was STOPPED** at handoff (no ScheduleWakeup this turn). If a stale wakeup fires with a /loop prompt, ignore it - work has moved to the zabalgamez terminal.
- Open AskUserQuestion: none.

## E. Cold-start map

- **Files touched this session:**
  - wwtracker: `components/OnChainProof.tsx` (new - overview + master toggle chart + true-scale charts), `components/AppShell.tsx` (added overview as opening section), `app/globals.css`, `README.md`.
  - zabalnewsletterbuilder: `lib/context.ts` (new), `lib/starter.ts` (context hint), `app/builder/page.tsx` (context panel), `lib/__tests__/context.test.ts` (new guard), `NEWSLETTER-UPDATE.md`, `.gitignore`.
  - ZAOOS: `research/dev-workflows/944-newsletter-growth-deliverability-playbook/{README.md,IMPLEMENTATION.md}` (new), dev-workflows README index.
- **Skills invoked:** `/newsletter` (WaveWarZ deep-dive draft + Day 183), `/loop` (newsletter research then context build), `dataviz` + `artifact-design` (the wwtracker charts + a standalone Artifact proof page), `/handoff` (this).
- **Memory writes:** `project_zabalnewsletterbuilder.md` - updated with doc 944 playbook + ship-first cluster + key reframes.
- **Last-known mental model:** WaveWarZ tracker is shipped + live (overview merged, charts in #15). Newsletter research + context tooling done across 3 PRs. Session pivoted to a NEW ask - put a Q2 big win on-chain - which is being handed to the zabalgamez terminal to build. That build is task 1.
- **Open questions for the receiver:** (a) which win to encode first? (b) EAS attestation vs collectible mint vs Paragraph collectible? (c) which repo/route does the on-chain-win thing live in? Clarify with Zaal before building past the MVP.

## Inline copy-paste block (for fast receiver paste)

```
Ingest the bundle at /Users/zaalpanthaki/Documents/ZAO OS V1/research/events/session-2026-07-03-onchain-q2-win-handoff/README.md and follow receiver instructions at the top. 3 tasks to absorb.
```
