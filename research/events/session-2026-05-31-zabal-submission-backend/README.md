# Session handoff - 2026-05-31 13:20
> from: ZAO OS V1, branch `ws/meeting-784` (mac) -> to: fresh CC terminal (same mac)
> doc: research/events/session-2026-05-31-zabal-submission-backend/README.md
> chain: none

## Receiver instructions (read me FIRST, then do exactly this)

You just received a handoff bundle. Do NOT start work yet. Do this:

1. Read ALL sections below (A through E) before responding to anything.
2. Section C has NO uncommitted diff - the prior work (doc 784) is committed + pushed. Nothing to `git apply`.
3. Create TaskList entries from section A. These are the "to do" items.
4. Use section B as your "why" - do NOT re-litigate decisions captured there unless new info surfaces.
5. Use section D to know what is still open (PRs awaiting merge, the Ryan Kagy conflict).
6. Use section E as your cold-start map for files, the architecture doc, memory state.
7. Read `research/events/784-plat0x-bonfire-zabal-architecture-may29/README.md` IN FULL before writing any code - it is the architecture spec. This bundle summarizes it; that doc is the source of truth.
8. Once integrated, message back: "Ingested handoff zabal-submission-backend. 5 tasks queued. Ready."

## A. Tasks to absorb (paste these into your TODO list)

- [ ] **Locate / confirm the ZABAL Games repo.** Zaal said he would build this "into the ZABAL Games repo." Confirm where it lives (likely a separate `zabalgames` / `zabal-games` repo under the bettercallzaal org, NOT ZAOOS - this graduates out). Ask Zaal if not obvious. Everything below lands there.
- [ ] **Build the registration server.** A thin HTTP service: `POST /register {wallet, github_repo}` -> persists a `{wallet -> github_repo}` mapping (a JSON file or a small Supabase table is fine for v1). Idempotent on wallet. Returns 200. That is the entire write surface.
- [ ] **Build the commit-watcher cron.** For each registered repo, detect new commits since the last-seen SHA (store last-seen per repo), pull the new commit messages + changed MD/report files, and create a Bonfire episode per batch. Reuse the POST shape in `~/.claude/skills/meeting/scripts/bonfire-episode.sh` (`POST /knowledge_graph/episode/create`, Bearer `$BONFIRE_API_KEY`, `$BONFIRE_ID`). Hourly or daily.
- [ ] **Write the builder skill file.** A skill the builder drops into their own harness (Hermes / Codex / Claude). It does NOT call the Bonfire API. It instructs the agent to: (1) push work to GitHub with the builder's wallet address/hash in an MD file, (2) make ONE call to the register endpoint. That is it.
- [ ] **Send the working scaffold to Plat0x + prep the July 1 LLMS.txt** (stretch). Plat0x (Carlos) is the Bonfires architect; he expects this back. The LLMS.txt = all ZAO brand info + assets, builders point their harness at it before open submission.

## B. Why - decisions + pivots + ruled-out paths

- **GitHub is the source of truth for builder work; Bonfires is the graph.** Decided with Plat0x (doc 784). Custom build shrinks to TWO things: the register-list + the scheduled push. Graph construction is already solved by pushing to Bonfires - do NOT build graph/indexing logic.
- **The skill must NOT call the Bonfire API directly.** Intentional separation: builders push to GitHub + register once; the server-side cron is the only thing that talks to Bonfires. This keeps builder setup trivial and keeps API keys server-side.
- **Builders bring their own harness + keys.** Cost scales with them, not Zaal. The skill assumes the builder already has Hermes/Codex/Claude + their own tokens.
- **This IS the backend for the GitHub-auth judging committed with Tyler in doc 778.** Same system - do NOT build a second judging path. Signup (wallet/Farcaster + GitHub auth) -> commits scored. 784 is the how.
- **Judging = Bonfire's existing rubric-agnostic pipeline.** Do NOT rebuild ranking. You feed it contributions + a rubric (uniqueness, integrity, etc.); it ranks. Ties into the ZAO Fractal Respect model (agent ranks vs criteria instead of humans voting).
- **Knowledge-gathering phase = reports, not code.** Builders write reports to GitHub; indexed into the graph; the game is "whose reports get cited most" in the agent's daily summaries. This widens the audience beyond developers - keep the design report-friendly, not code-only.
- **UNRESOLVED CONFLICT - do not assume:** Zaal said Bonfires founder = Josh, Carlos = Plat0x (team), Ryan Kagy = just associated. This contradicts prior docs 648/669/682 which call Ryan the founder + describe an "Option B" partnership (adopt Ryan's framework, Zaal helps fund). Flagged in `project_ryan_kagy` memory. Do NOT build on the Option B partnership premise until Zaal reconciles who is actually the Bonfires principal.
- **Bonfire dependency risk:** the judging + graph are Bonfires-owned. Before building the whole submission flow on it, consider a "what if Bonfires changes terms / goes away before July" fallback. Not blocking v1, but note it.

## C. Git state

- Branch: `ws/meeting-784` (clean - all work committed)
- Push status: PUSHED. PR #758 open (doc 784). No uncommitted diff.
- This session shipped 6 PRs off `main`, all open awaiting merge: #748 (776/777), #749 (778... see note), #752 (780), #755 (782), #756 (783), #758 (784). The new build work has NOT started - it is all in Section A.
- Untracked: pre-existing iCloud `" 2"` dupe files (ignore - not this session's).

## D. In-flight

- Background bash jobs: none running.
- Subagents pending: none.
- Scheduled wakeups: none.
- Open AskUserQuestion: none.
- **Open PRs awaiting Zaal merge:** the 6 meeting-recap PRs above. The build work does not depend on them merging.
- **Open decision for Zaal:** the Ryan Kagy / Josh / Plat0x founder reconciliation (see Section B).

## E. Cold-start map (read if you are confused)

- **THE spec to read first:** `research/events/784-plat0x-bonfire-zabal-architecture-may29/README.md` (tier DEEP) + its `transcript.md`. This bundle is a summary; that is the source.
- **Three-rail context for ZABAL Games:**
  - Magnetic (identity / front door / 67-person email list) - docs 778, 783, memory `project_zabal_games_magnetic_build`
  - Bonfires (graph + judging + knowledge-game) - doc 784, memory `project_plat0x_bonfire_zabal_architecture`
  - Empire Builder (a buildable surface) - doc 780, memory `project_adrian_empire_builder`
- **Files touched this session:** 6 meeting recap docs (776, 777, 778, 780, 782, 783, 784) + transcripts under `research/events/`; the `_meetings-index.md`; the `/meeting` skill improvement (doc 781 + edits to `~/.claude/skills/meeting/` scripts: new `trim-loops.sh`, transcribe/extract-frames/append-actions edits, SKILL.md).
- **Skills invoked:** `/meeting` x6, `/clipboard` (running master at `~/.zao/meeting-top3-master.html`, slug `meeting-top3-master`), `/handoff` (this).
- **Memory writes (new):** `project_plat0x_bonfire_zabal_architecture`, `project_ven_open_machine`, `project_adrian_empire_builder`, `project_telamon_edge_esmeralda`, `project_duo_do_musicians`, `project_zabal_games_magnetic_build` (updated), `project_ryan_kagy` (conflict flag added), `feedback_meeting_top3_master_clip`.
- **Bonfire reference for the cron:** `~/.claude/skills/meeting/scripts/bonfire-episode.sh` - copy its POST shape + env loading (`~/.zao/zao.env` -> `BONFIRE_API_KEY`, `BONFIRE_ID`). Recall is via `POST /delve {bonfire_id, query}` (doc 740, memory `project_bonfire_delve_recall`).
- **Last-known mental model:** ZABAL Games now has all three rails defined. The Bonfires rail (this build) is the unblock for the June workshops + July judging. The build is small by design - a register endpoint + a commit-watching cron that pushes to Bonfires. Plat0x is waiting on the scaffold.
- **Open questions for the receiver:** (1) Which repo is "the ZABAL Games repo"? (2) JSON file or Supabase for the register list in v1? (3) Reconcile the Ryan Kagy founder question with Zaal before leaning on any Bonfires partnership terms.

## Inline copy-paste block (for fast receiver paste)

```
Ingest the bundle at /Users/zaalpanthaki/Documents/ZAO OS V1/research/events/session-2026-05-31-zabal-submission-backend/README.md and follow receiver instructions at the top. 5 tasks to absorb. Read research/events/784-plat0x-bonfire-zabal-architecture-may29/README.md in full first.
```
