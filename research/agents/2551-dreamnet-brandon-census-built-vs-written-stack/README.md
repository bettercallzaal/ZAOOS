---
topic: agents
type: audit
status: research-complete
last-validated: 2026-09-24
superseded-by:
related-docs: "agents/2550-session-memory-across-compactions-and-agents, agents/2184-dreamnet-tenant-organism-stage0, agents/2357-brandon-receipts-dadfi-status, agents/2138-spore-phase3-cross-runtime-conformance, agents/2176-dreamnet-canary-reality-board, agents/1178-brandonducar-repos-zol-integration-scan, technology/1512-zol-dreamloops-weekly-curator-artist-spotlight"
original-query: "Can we /zao-research dream net and all past implementations and mentions of anything from Brandon and review our agentic stack with our vault"
tier: DEEP
---

# 2551 - DreamNet and Brandon Ducar: the census, what we built versus what we wrote, and our stack against his thesis

> **Goal:** Answer three separate questions in one doc. (1) Where do Brandon Ducar's own words and specs live across this estate, and what state is each in? (2) What did we BUILD from his ideas, compared with what we WROTE DOWN about them? The gap between the two is the finding. (3) Our agentic stack re-measured against the vault, with no figure carried over from the 2026-09-19 and 2026-09-20 measurements. His words and his code are the primary sources. Our own `research/` and `measured/` folders are secondary, because we wrote them. Where the two disagree, this doc says so.

This is Brandon **Ducar** (DreamNet, github.com/BrandonDucar). It is not Brandon Beckwith (International Artists Project / Artizen, board card 10102), and nothing here touches that thread.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **DO NOT send `outbound/2026-09-20-reply-to-brandon-conformance.md` as written.** Fix two claims first. | It names `1c6d3b19...` as "your current upstream". That SHA is the **v0.1.0 annotated tag object** (it points to commit `f21aafc`, 2026-07-14), and his upstream HEAD is `611795b` (2026-07-19). The runtime-identity claim still holds against HEAD (`diff -rq` of runtime `src/` and `schemas/` is empty today). The draft also says zol "runs" the manifests, and section 2 shows they run nowhere measurable. |
| 2 | **Treat transcripts as a place the record goes to die, and pull Brandon material out of them the same day.** | His 2026-09-20 answers to our questions sat for four days only in the zj seat's transcript. The repo said "0 answered" while 6 were answered. Recovered as dreamnet-zao `b18bd1d`. |
| 3 | **Zaal decides whether to freeze new agentic tooling until after ZAOstock (Oct 3).** The lane does not decide this. | Brandon, 2026-09-24, iMessage (relayed from a screenshot, partial): "No need to add another framework just for the sake of it, especially with your event coming up." The estate added tooling in the same 24 hours. |
| 4 | **Card 9076 is a record problem, not a build problem.** Retitle it, or close its build half. | "RESUME DreamNet tenant Stage 0 build" has been `in_progress` since 2026-08-03, the day the build merged (ZAOOS #2805 and #2815). The live remainder is the 2026-09-13 ask to prep a message to Brandon. Zaal's call. |
| 5 | **USE his six-part authority hierarchy as the test for section 3.** | It came from the Brandon side on 2026-09-24 and splits "who is right about X" into six surfaces. Every gap we found is two of those surfaces claiming the same authority. |
| 6 | **SKIP building anything new from this doc before Zaal reads it.** | Brandon deferred the four blockers ("let me verify the current canonical artifacts"). Federation Canary #1 is gated on them and on a Mac backup. Nothing in this doc unblocks it. |

## The finding in one paragraph

Both sides found the same failure without being told it by the other. From the Brandon side, 2026-09-24, addressed to Brandon about Zaal:

> "Don't let Obsidian slowly become his equivalent of our receipt-store problem where documentation says something happened and everybody starts treating that as operational truth."

On our side it is measurable today. A card says a build is in progress while the build merged seven weeks ago. A README says zol "runs 72 dreamloop manifests" while the zol process on the Pi carries zero and the copy on the VPS runs under no unit, cron or process. A question file said none of 13 were answered while his answers sat in a session transcript. A repo described as "the institution's copy" has one collaborator. That both institutions hit this, through unrelated failures, is the strongest evidence in this doc that his primitives (evidence, receipt, authority) are real and not one person's framework.

---

## 1. Census: where Brandon Ducar's words and specs live

PRIMARY means his words or his code, verbatim. SECONDARY means we wrote it about him.

### 1a. `bettercallzaal/dreamnet-zao` (private; `~/Documents/dreamnet-zao`, main at `6c6ba26`)

| Path | Date | Kind | State |
|---|---|---|---|
| `inbound/2026-09-15-codex-and-the-shared-layer.md` | sent 09-15 | PRIMARY | verbatim, arrows replaced with commas (the header says so) |
| `inbound/2026-09-16-dreamnet-with-zero-ai.md` | sent 09-16 | PRIMARY | verbatim. Its header points to `outbound/2026-09-20-reply-zero-ai-note.clip.md`, **which does not exist in the repo**. The drafts live in `zao-vault/inbox/clips/` |
| `inbound/2026-09-16-the-300-agent-conservatory.SUMMARY.md` | 09-16 | SECONDARY | self-declared "NOT his words" |
| `inbound/2026-09-20-the-smallest-shared-contract.md` | sent 09-20 | PRIMARY | **recovered today** from the zj transcript (pasted 2026-09-20T19:47:42Z), byte-identical to the transcript by `diff` |
| `inbound/2026-09-24-google-ecosystem.RELAYED-PARTIAL.md` | 09-24 06:27 | PRIMARY, partial, relayed | transcribed by the zj seat from a screenshot this lane has not seen. The top bubble is cut off |
| `inbound/2026-09-24-brandons-agent-on-zaos-knowledge-layer.RELAYED.md` | 09-24 | PRIMARY text, framing uncertain | written TO Brandon ABOUT Zaal. Author unknown, probably his agent |
| `outbound/2026-09-20-reply-to-brandon-conformance.md` | drafted 09-20 | SECONDARY | **untracked. Whether it was sent is unknown** and asked of Zaal |
| `measured/` (2 files), `model/` (3), `research/` (2) | 09-19 to 09-20 | SECONDARY | our measurements and design notes. `model/first-app-2026-09-20.md` embeds one quote from him dated 2026-09-18 |

Count: 4 primary files (one of them partial and relayed), 1 primary text with uncertain framing, 9 secondary files.

### 1b. The vault (`~/zao-vault`)

- `grep -ril "ducar\|dreamnet\|ghostmint" --include=*.md` gives 166 paths, about 80 distinct once the mirror under `.claude/worktrees/` is removed. Positive control: `"ZAO"` gives 2,921.
- **The five files** at the root, per `projects/agentic-infrastructure-spec-2026-09-09.md` line 267: BLACKBOARD, AGENTS, SYSTEM_MAP, DECISIONS and SOUL, plus GENESIS "per Brandon" (spec section 15). Only SOUL.md is recorded as his text verbatim. The others are our writing, shaped by him.
- **Spec sections 13 to 19** (lines 293 to 766) are his words relayed by Zaal on 2026-09-09 and 2026-09-10: five tightenings, the federation framing (ZaalNet, Spore, Gundarium, Warper Keeper), the GENESIS/SOUL split, PoMP ("Proof of Model Portability"), and the frozen 12-step order. They are quoted "where it matters", so they are mixed primary and secondary.
- `inbox/2026-09-16-brandon-dreamnet/README.md` is a second primary copy of the 09-16 notes. `people/Brandon-Ducar.md` is secondary.
- `inbox/clips/`: **six drafts addressed to Brandon between 09-19 and 09-20** (a 45-minute ask, a morning message, the one big ten-question message, a one-liner, a brand link, a marketing-pack text). None of them is marked sent anywhere in the vault.

### 1c. The cowork board (`zao-tracker search`)

`dreamnet` gives 7 cards (2 in_progress, 5 done). `brandon` gives 14: 12 are Ducar, 2 are Beckwith (excluded), and **1 is ambiguous** ("Download 5 convos ... Arun, Brandon, Jose", todo, due 2026-08-21, which names no surname). `ghostmint` gives 4 (all Ducar), `spore` 2 (done), `dreamloop` 13 (our build cards, done).

### 1d. ZAOOS research library (`zao-research-index`, FTS over the library; no AND-to-OR fallback reported)

dreamnet 21 docs, brandon 19, dreamloop 20, spore about 22, conformance 17, ghostmintops 7, "warper keeper" 6, "receipt journal" 5, "tenant organism" 3. The docs nearest to his words are `agents/1178-brandonducar-repos-zol-integration-scan`, `agents/2184-dreamnet-tenant-organism-stage0`, `agents/2138-spore-phase3-cross-runtime-conformance` and `agents/2357-brandon-receipts-dadfi-status`. All of them are secondary by construction.

### 1e. His code (primary)

- `github.com/BrandonDucar`: 27 public repos, account created 2025-07-11, bio "Building DreamNet". Eight were pushed on 2026-09-23, including `Dreamnet`, `dreamnet-spore-sdk` and `zaostock-live-command`.
- `BrandonDucar/dreamloops`: HEAD `611795b` (2026-07-19). **No commit since 2026-07-19.** His 2026-09-20 "I want to audit our side" has produced no upstream change to date.
- The same repo's `packages/runtime/schemas/dreamloop.schema.json:18` declares the six-value status enum. `packages/runtime/src/validate.js:32` and `:59` check only that `status` is non-empty text. `library/dreamnet/hermes-social-caretaker-standing-goal.dreamloop.md:6` declares `status: active_local_supporting_contract`. **All re-read today from a fresh clone.**
- zol vendors dreamloops runtime, cli and `@dreamloops/warper-keeper` 0.1.0 (`~/Documents/zol/vendor/dreamloops/PROVENANCE.md`, Apache-2.0 as it records).

### 1f. Searched, and not searched

- **Searched:** the five dreamnet-zao folders, the vault (grep plus named files), the infra spec, the board, the research index, `~/Documents/zol`, the Pi (`ansuz`), the VPS, GitHub (`gh api`, `gh search code` across `bettercallzaal` and `ZAODEVZ`, rate-limited after 10 of 11 searches), and Claude Code session transcripts (`~/.claude/projects/**/*.jsonl`, where both recovered texts were found).
- **Not searched:** iMessage (where this conversation actually lives; no lane can read it), Gmail, Discord, Google Drive (**his stated documentation home**), the Windows PC (ssh aliases do not resolve), and the "fences"/"authority.v1" code search (cut off by the rate limit, so that one is UNKNOWN rather than absent).

---

## 2. What we BUILT versus what we WROTE DOWN

| Idea (his source) | Built | Wired or running, measured 2026-09-24 | What the record says | Gap |
|---|---|---|---|---|
| Spore conformance (`dreamnet-spore-sdk`) | ZAOOS `src/lib/spore/*`. #2704 (47/47 cross-runtime, merged 2026-07-30), #2713, #2792 | `src/app/api/spore/verify/route.ts` is a real route. The trust layer is behind `SPORE_TRUST_ENABLED`, default off | `agents/2138-...`: confirmed | **None in ZAOOS.** But dreamnet-zao `measured/2026-09-19-status-against-the-12-steps.md` step 7 calls the Spore harness "built, unrun" and knows only the vault's Python `scripts/spore/core.py` (490 lines, `.venv` still absent today). **Two implementations exist, and each record knows about one of them.** |
| Receiptable by design (his 2026-07-20 WaveWarZ note) | A generic receipt spine in ZOE: `bot/src/zoe/receipt-envelope.ts` and `receipts.ts`, imported by `work-loop.ts` and three others | Live in the ZOE loop | Card 1289 in_progress. `agents/2357-...` says the spine is shipped and the WaveWarZ adapter is "one tap" | Accurate but undifferentiated. The spine runs; the WaveWarZ adapter was never built. The card has waited on option C since 2026-08-21. zol #65 was closed 2026-08-29 as "superseded by #72", which is not a decision on C. |
| Tenant-organism Stage 0 and capability leases | `src/lib/dreamnet/tenant/*`, #2805 and #2815 (merged 2026-08-03) | **Imported by nothing outside its own directory.** `flags.ts:5`: "Nothing in this module is wired". The flags are off and absent from `.env.example` | Card 9076: "RESUME ... build", **in_progress, due 2026-08-06** | **The confirmed shape.** Built and merged, never wired, and the card still reads as unbuilt. |
| Proof Drops | `src/lib/dreamnet/proof-drop/*`, #2817 (2026-08-04) | Flag off, no consumer outside its tests | `business/2179-...` points to his own `proof-drop-zabal` repo, not ours | The ZAOOS copy is dead code; the record points at his. |
| Federation canary (crash-resume) | `bot/src/zoe/federation-checkpoint.ts`, #3051 and #3079 (merged 2026-08-15) | **Referenced by no non-test file** (`git grep`; the only other hit is a research doc). The scheduler never calls it | PR titles read `feat(zoe)` | Built and tested, unreachable. It cannot run. |
| DreamLoops (his `dreamloops`) | `bettercallzaal/zol`: 72 manifests, `scripts/dl-run.js`, vendored runtime. zol #61 merged 2026-09-19 | **Runs nowhere measured.** Pi `~/zol/farcaster-agent` (the live ZOL, HEAD `0d4a66c`): 0 manifests, no `dl-run`, no vendor tree. Its origin is a third-party clone with push disabled. VPS `~/zol-upgrade`: 72 manifests on branch `ws/v2-curiosity-scan-cycle5` (`17afcdb`, 2026-08-22), no env flag, no unit, no cron, no process. Mac launchd: 0 of 547 labels match. `DREAMLOOPS_ENABLED` is absent from `.env.example` | `technology/1512-...` is titled "ZOL DreamLoops Activated". The dreamnet-zao README says zol "runs 72 dreamloop manifests". The 11:09 draft to Brandon says "zol already runs 72 manifests" | **The largest written-versus-built gap.** "Runs" is a claim about runtime, and no runtime was found. The PC was not measured. |
| Warper Keeper | Vendored in zol as `@dreamloops/warper-keeper` 0.1.0. His repo `BrandonDucar/warper-keeper` (pushed 2026-08-23) | Not running (disabled mode by default, per `agents/1178-...`) | 12-steps step 11: "No implementation files found anywhere searched ... repo URL still UNMEASURED". `agents/2176-...`: "MISSING in ZAO repos" | **The record undercounts.** The code is on disk and his repo is public. |
| Hold, lease, fence (his 2026-09-20 answer) | `zorca-lock` (single local mutex), the `zao-merge` merge gate, the claims guard | The gate refuses at its own path only | 12-steps step 4 and step 9: partial or not started | By his own test, "if ... a human shell or another session can still merge without passing through the merge fence, the file is documentation". `gh pr merge` still bypasses the gate. |

**Pattern.** Seven of the eight rows have code on disk; the eighth (hold, lease, fence) is partial. Of the seven, two run: Spore verify (the ZAOOS record matches, and the dreamnet-zao record says "unrun") and the receipt spine (its card cannot say which part is done). The other five (tenant Stage 0, Proof Drops, the federation canary, DreamLoops, Warper Keeper) are built and not running. Their records describe them as more alive than they are (DreamLoops "Activated", card 9076 "in progress", the canary's `feat` PRs) or less alive (Warper Keeper "missing"). One record in the table (ZAOOS on Spore) matches runtime. Every other gap was found by going to runtime by hand.

---

## 3. Our stack against the vault, re-measured, on his six-part hierarchy

### 3a. The hierarchy (from the Brandon side, 2026-09-24, verbatim)

> GitHub → code reality / Google Drive/Docs/Sheets → documents and structured human data / Obsidian → linked knowledge/context / NotebookLM → grounded interrogation of curated sources / Hermes → intelligence/execution / runtime/logs → what actually ran

| His surface | Ours | Where two of ours claim the same authority |
|---|---|---|
| GitHub: code reality | `bettercallzaal` + `ZAODEVZ` | **The live ZOL code is on no remote we own**: the Pi checkout's origin is `rishavmukherji/farcaster-agent` with push disabled. The registry records a bundle as the backup. |
| Docs/Sheets: structured human data | the cowork board (Supabase `tasks`) | The board claims work state that GitHub contradicts (card 9076 against #2805). |
| Obsidian: linked knowledge | `zao-vault` (markdown, git) | The vault claims agent status that runtime contradicts. The registry was regenerated 2026-09-21 and still names `zorca-audit-seat` as top orchestrator, against the 2026-09-13 decision `vault-is-the-orchestrator-2026-09-13.md`, which still says "seat is NOT yet changed in the registry". **This is his "#9, ruling drift" measured on us.** |
| NotebookLM: grounded interrogation | the ZAOOS research library (2,246 numbered dirs) + `zao-research-index` | Research docs claim runtime state (1512 "Activated") that runtime contradicts. |
| Hermes: intelligence/execution | Claude Code lanes, ZOE (VPS), ZOL (Pi). Hermes Agent: `~/.hermes` present on the VPS, but no Hermes unit (only `zoe-bot.service` matches) | Brandon's side told him "show me your existing Hermes setup first". What exists is a config directory, not a running Hermes. |
| runtime/logs: what actually ran | no single surface: BLACKBOARD `ACTIVE AGENTS` (fleet-health), the VPS journal, tmux sessions on the Pi | **No surface is designated as the authority for "what ran".** Every gap in section 2 was settled by going to runtime by hand. |

### 3b. The two measurements from 09-19 and 09-20, re-run today rather than inherited

| Claim (dreamnet-zao `measured/`) | Then | Today | Verdict |
|---|---|---|---|
| BLACKBOARD lines | 783 | 837 | MOVED |
| GENESIS / SOUL / DECISIONS / SYSTEM_MAP lines | 201 / 18 / 67 / 80 | same | HOLDS |
| Registry "built 2026-09-10, unchanged since" | unchanged | regenerated 2026-09-21T19:12:49Z, **drift persists** | MOVED (timestamp), HOLDS (drift) |
| Decision files / people files | 61 / 76 | 92 / 82 | MOVED |
| "100 briefs", "48 lane diaries" | 100 / 48 | `handoffs/briefs` 16, `handoffs/status` 50 | CANNOT RE-RUN: which folders those counted was never recorded |
| Research docs | about 2,200 | 2,246 | HOLDS |
| dotfiles scripts / tests | 167 / 64 | 253 / 76 | MOVED |
| Skills | 59 | 66 | MOVED |
| Spore core / tests lines, `.venv` absent | 490 / 417, absent | same | HOLDS |
| zol manifests (local checkout) | 72 | 72 | HOLDS, and **irrelevant to runtime** (section 2) |
| PC reachable over ssh | no | no | HOLDS |

`bin` grew by 86 scripts in five days. Skills grew by 7.

### 3c. His thesis, tested on us

**Law 2, "the least expensive, most deterministic qualified actor"**, and his 09-20 version, "compile the lesson downward":

- `zao-mistake due` today: **123 entries** (107 shaped). Both graduated laws read **LAW NOT HOLDING**: `surface-cannot-report-state` 24 entries, **16 logged after graduation**; `unmeasured-prediction-in-a-record` 11 entries, **4 after**. A law written into always-loaded context did not change behaviour.
- The mechanical guards did change it. On surface: the SHA guard refused a message of this lane's today because it cited a transcript id that looked like a SHA. The effect of guards is covered in `agents/2550-session-memory-across-compactions-and-agents` (Findings, lines 20 to 27 and 90 to 98: 20 logged rule failures against 0 observed guard failures on the guard's own surface, with the admitted bias that guard misses are not logged). That half is not repeated here.

**Law 3, "institutions own knowledge, authority and continuity"**, is where our evidence is sharpest, and it comes as a pair:

1. **His answers lived in an actor.** Brandon's 2026-09-20 reply existed only in one Claude session's transcript for four days. The institution's record said 0 of 13 answered. Measured: 6 answered, 2 partly answered, 1 deferred by him, and 4 **never asked**. His "#9, human-ruling drift" matches the numbering of the 11:09 ten-question draft (`zao-vault/inbox/clips/clip-20260920-110902-brandon-everything-0920.md`), not the repo's list, so that draft was very probably what was sent. Zaal has not confirmed it.
2. **The shared record is not shared.** `bettercallzaal/dreamnet-zao` is private. Its collaborators: `bettercallzaal` only. Invitation to `BrandonDucar`: write access, created 2026-09-20T12:38:40Z, not expired, not accepted. Zaal says he told Brandon it was sent (relayed by the zj seat). So Brandon has been told it exists and it is still open. That does not establish that he is ignoring it, or that we dropped it. Until he accepts, the README's "the institution's copy" describes a private note with one reader.

**The board**, read-only today: **432** open cards, **105** with no type, and **44** with no due date. Archived cards change none of these (0 archived cards carry an open status). The 44 are invisible to every sweep in the estate, because every sweep asks "what is late" and none asks "what has no date".

### 3d. What he told us to do about it, in his words

- iMessage, 2026-09-24 (relayed from a screenshot, partial): "No need to add another framework just for the sake of it, especially with your event coming up."
- From the Brandon side, the same day, addressed to Brandon: "you stopped trying to sell him architecture and met him where he actually is: "show me your existing Hermes setup first; then we identify the missing capability.""
- And the correction to his own morning line, "Use the Google ecosystem for it ... that solves everything really": "Google + Obsidian doesn't "solve everything." It solves a large part of the human-readable knowledge/documentation problem." **Both stand.** The later one is narrower.
- How that side frames the relationship: "Zaal ... is becoming a great external test of whether DreamNet concepts are portable primitives."

This lane does not rule on these. They are recorded so Zaal can decide with them in view (Key Decision 3).

---

## Where our writing disagrees with his words or his code

1. **The test itself.** Our `measured/2026-09-20-...` ran "if every model disappeared tomorrow". That is faithful to his 09-16 note, line 508. On 09-20 he moved it: "we pushed it one step further than "what survives if the models disappear?" We asked: what would DreamNet look like if AI agents had never existed at all?" Our measurement answers the earlier question.
2. **Obsidian.** His 09-16 note: "Brandon reads it in Obsidian." His 09-24 iMessage: "Use the Google ecosystem for it." The Brandon-side text the same day puts both in a hierarchy. Our vault design assumed the first.
3. **The pin in our draft reply.** The draft calls `1c6d3b19...` "your current upstream". It is his v0.1.0 tag object. His upstream is `611795b`. The substance holds; the sentence would fail a lookup.
4. **"zol runs 72 manifests".** This appears in our README and in the 11:09 draft. Section 2 found no runtime executing any of them.
5. **Warper Keeper "missing" and "unmeasured".** This appears in our 12-steps doc and in `agents/2176-...`. His repo is public and zol vendors it.
6. **Spore "built, unrun".** This appears in our 12-steps doc. ZAOOS has had a live, 47/47-conformant Spore route since 2026-07-30.

## Gaps this doc could not close

- Whether the 11:09 draft and the conformance reply were sent. Only Zaal knows.
- The full "why not Hermes" exchange. Only a fragment survives. It is narrowed by the Brandon-side text, not closed.
- The four blockers (Conformance Kit, reference adapter, `did:civilization` owner, receipt schema). Deferred by him on 09-20; nothing since in his public repos.
- The claim on his public site dreamnet.ink of "34,012 active nodes". This is his public claim, not measured by us.
- The PC, iMessage, Gmail, Discord and Google Drive (section 1f).

## Also See

- [agents/2550 - Carrying state across compactions and agents](../2550-session-memory-across-compactions-and-agents/): the context and memory half, not repeated here
- [agents/2184 - DreamNet tenant organism Stage 0](../2184-dreamnet-tenant-organism-stage0/)
- [agents/2357 - Brandon receipts and DadFi status](../2357-brandon-receipts-dadfi-status/)
- [agents/2138 - Spore phase 3 cross-runtime conformance](../2138-spore-phase3-cross-runtime-conformance/)
- [agents/2176 - DreamNet canary reality board](../2176-dreamnet-canary-reality-board/)
- [agents/1178 - BrandonDucar repos, zol integration scan](../1178-brandonducar-repos-zol-integration-scan/)
- [technology/1512 - ZOL DreamLoops weekly curator and artist spotlight](../../technology/1512-zol-dreamloops-weekly-curator-artist-spotlight/)
- Tracker 9076 (in_progress, due 2026-08-06) - RESUME DreamNet tenant Stage 0 build
- Tracker 1289 (in_progress, due 2026-07-22) - WaveWarZ receiptable by design
- Tracker 1290 (in_progress, due 2026-07-22) - DadFi.org rewrite (dadfi.org has no A or NS record today)

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Tell the dreamnet lane whether the 09-20 11:09 ten-question draft and the conformance reply were sent. Done when each is committed to `outbound/` as sent, or marked as never sent | @Zaal | Answer | 2026-09-26 |
| Correct the unsent conformance draft (tag object to commit `f21aafc` / HEAD `611795b`; "runs" to "declares"). Done when a dreamnet-zao commit changes those two sentences. If it was already sent, the correction goes out as a follow-up for Zaal to send instead | dreamnet lane | Commit | 2026-09-25 |
| Decide whether to freeze new agentic tooling until after ZAOstock on Oct 3, per Brandon's 09-24 advice. Done when the ruling is in `zao-vault/decisions/` | @Zaal | Decision | 2026-09-25 |
| Card 9076: retitle it to the live message-prep ask, or close its build half, citing #2805. Done when the card no longer reads as an unbuilt build | @Zaal | Card | 2026-09-30 |
| Correct the dreamnet-zao README ("runs 72") and `measured/` steps 7 and 11 by annotation, not by rewriting the old figures. Done when a commit adds dated correction lines at each claim | dreamnet lane | Commit | 2026-09-26 |
| Name one surface as the authority for "what actually ran" (his sixth layer), or rule that none is needed yet. Done when the ruling is in `zao-vault/decisions/` | @Zaal | Decision | 2026-10-10 |

## Sources

Primary, his words or code:
- [FULL, method: git clone + grep] [BrandonDucar/dreamloops](https://github.com/BrandonDucar/dreamloops), HEAD `611795b` (2026-07-19), tag [v0.1.0](https://github.com/BrandonDucar/dreamloops/releases/tag/v0.1.0) (tag object `1c6d3b19`, commit `f21aafc`)
- [FULL, method: clone] [dreamloop.schema.json:18](https://github.com/BrandonDucar/dreamloops/blob/main/packages/runtime/schemas/dreamloop.schema.json), the status enum
- [FULL, method: clone] [validate.js:32,59](https://github.com/BrandonDucar/dreamloops/blob/main/packages/runtime/src/validate.js), non-empty text check only
- [FULL, method: clone] [hermes-social-caretaker-standing-goal.dreamloop.md:6](https://github.com/BrandonDucar/dreamloops/blob/main/library/dreamnet/hermes-social-caretaker-standing-goal.dreamloop.md)
- [FULL, method: gh api] [github.com/BrandonDucar](https://github.com/BrandonDucar) (27 repos), [Dreamnet](https://github.com/BrandonDucar/Dreamnet), [dreamnet-spore-sdk](https://github.com/BrandonDucar/dreamnet-spore-sdk), [warper-keeper](https://github.com/BrandonDucar/warper-keeper)
- [FULL, method: curl + HTML strip] [dreamnet.ink](https://dreamnet.ink), his public site (the "34,012 active nodes" claim is not verified)
- [FULL, method: file read] dreamnet-zao `inbound/` files 2026-09-15, 2026-09-16 and 2026-09-20 (the last recovered from the zj session transcript and checked with `diff`)
- [PARTIAL: screenshot transcribed by the zj seat, not seen by this lane; top bubble cut off] dreamnet-zao `inbound/2026-09-24-google-ecosystem.RELAYED-PARTIAL.md`
- [FULL text, framing uncertain: relayed paste, author unknown] dreamnet-zao `inbound/2026-09-24-brandons-agent-on-zaos-knowledge-layer.RELAYED.md`
- [FULL as relayed, method: file read] `zao-vault/projects/agentic-infrastructure-spec-2026-09-09.md` sections 13 to 19

Our code and records (secondary to him, primary for "what we built"):
- [FULL, method: gh pr view] ZAOOS [#2704](https://github.com/bettercallzaal/ZAOOS/pull/2704) (merged 2026-07-30), [#2792](https://github.com/bettercallzaal/ZAOOS/pull/2792) (2026-08-02), [#2805](https://github.com/bettercallzaal/ZAOOS/pull/2805) (2026-08-03), [#2815](https://github.com/bettercallzaal/ZAOOS/pull/2815) (2026-08-03), [#2817](https://github.com/bettercallzaal/ZAOOS/pull/2817) (2026-08-04), [#3051](https://github.com/bettercallzaal/ZAOOS/pull/3051), [#3079](https://github.com/bettercallzaal/ZAOOS/pull/3079) (2026-08-15), [#3221](https://github.com/bettercallzaal/ZAOOS/pull/3221) (2026-08-21), [#3643](https://github.com/bettercallzaal/ZAOOS/pull/3643) (doc 2550)
- [FULL, method: gh pr view] zol [#61](https://github.com/bettercallzaal/zol/pull/61) (merged 2026-09-19), [#65](https://github.com/bettercallzaal/zol/pull/65) (closed unmerged 2026-08-29)
- [FULL, method: git grep on origin/main `56af8d15b`] `src/lib/dreamnet/tenant/flags.ts:5`, `src/lib/spore/`, `src/app/api/spore/verify/route.ts`, `bot/src/zoe/federation-checkpoint.ts`
- [FULL, method: ssh, read-only] Pi `ansuz:~/zol/farcaster-agent` (`0d4a66c`), VPS `~/zol-upgrade` (`17afcdb`), process and unit listings with positive controls
- [FULL, method: CLI and read-only Supabase GET] `zao-mistake due`, `zao-tracker types`, open cards with `due=is.null`

Community and external:
- [FULL, method: curl + HTML strip] [Anthropic, Building effective agents](https://www.anthropic.com/engineering/building-effective-agents): "we recommend finding the simplest solution possible, and only increasing complexity when needed. This might mean not building agentic systems at all." This is his Law 2, from outside DreamNet.
- [FULL, method: HN Algolia items API] [HN 42470541](https://news.ycombinator.com/item?id=42470541), 763 points, 2024-12-20. Top comments: serjester, "too many people rush to build autonomous agents when their problem could easily be defined as a DAG workflow"; brotchie, "The most effective agents I've seen ... are largely traditional software engineering with a sprinkling of LLM calls". Consensus with him; no dissent in the top six on the core point.
- [FULL, method: HN Algolia] [HN 44301809](https://news.ycombinator.com/item?id=44301809), 543 points, 2025-06-17, the same post re-submitted
- [FULL, method: curl + HTML strip] [Open Policy Agent docs](https://www.openpolicyagent.org/docs): "OPA decouples policy decision-making from policy enforcement". This is the industry shape of his "centralized policy semantics, distributed enforcement".
- [FULL, method: HN Algolia] [HN 17121020](https://news.ycombinator.com/item?id=17121020), OPA launch, 157 points, 2018-05-21 (low signal: 5 top-level comments, the co-author answering)

Staleness: every figure is as of 2026-09-24. Brandon's repos move daily (eight pushed 2026-09-23). Re-measure section 2 when zol is redeployed or any DreamNet flag changes; those are the conditions that invalidate it.
