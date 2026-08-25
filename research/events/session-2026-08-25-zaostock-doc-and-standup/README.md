# Session handoff - 2026-08-25

> from mac, ZAO OS V1, branch `ws/research-2352-paid-oss-slopcash-sweetman` -> to ZOE via Bonfire
> doc: `research/events/session-2026-08-25-zaostock-doc-and-standup/README.md`
> chain: none

## Receiver instructions (read me FIRST, then do exactly this)

You just received a handoff bundle. Do NOT start work yet. Do this:

1. Read ALL sections below (A through E) before responding to anything.
2. Section C has no diff to apply - the session's work landed in worktrees, PRs, a Google Doc and the vault, not in the working tree.
3. Create task entries from section A.
4. Use section B as your "why" - do NOT re-litigate decisions captured there unless new info surfaces.
5. Use section D to know what is still open.
6. Use section E as your cold-start map.
7. Once integrated, message back: "Ingested handoff zaostock-doc-and-standup. 5 tasks queued. Ready."
8. If you `/handoff` later, point your `chain:` field back at this bundle's path.

---

## A. Tasks to absorb

- [ ] **Fill the AV List tab** - spec due **Aug 26**, worked at the Wednesday 11:30 AV meeting. The sheet is already built in the ZAOstock doc with a blank OWNER and BACKUP on every line. Three things on it nobody has answered at all: power circuits on the parklet, whether there is workable internet outdoors, and where the stream actually goes.
- [ ] **Raw pitch deck content to Candy and paper** - Zaal committed to Tuesday night on the Aug 24 call. Slide 9 is the only blocker: tier prices and an early-close date, both Zaal's to set. Anchors already fixed at $500 sponsor-an-artist and a $50 Friend floor.
- [ ] **Merge three open PRs** - ZAOOS **#3304** (doc 2402, Google Doc editing research), ZAOOS **#3310** (doc 2410 speaker correction), ZAODEVZ/ZAOstock **#50** (press kit page at /press).
- [ ] **Send the local network drafts** - eleven CRM contacts, all still at status `new`. Drafts ready in clipboard `zaostock-local-network-outreach`. The Chamber's three go the same day once the deck exists.
- [ ] **Decide the finder's fee** - 10 / 15 / up to 25 percent, floated on the Aug 24 call and explicitly not finalised. Zaal said decide this week.

**Not on this list on purpose:** the parklet permits. Roddy confirmed on Aug 25 that the paperwork is with the city and we are waiting on them. Earlier in the session this was written up as the most time-critical open risk. **It is not a blocker.** Zaal is separately talking to a contact at a local bank about event insurance on Aug 25.

---

## B. Why - decisions, pivots, ruled-out paths

- **Google Docs became scriptable.** Built `~/bin/gdoc` (read/replace/append) and `~/bin/gdoc-md` (Markdown to real Docs styles, with hyperlinks and a `--compact` mode). Both git-tracked in zaal-dotfiles. Doc 2402 recommends **retiring both** for `taylorwilsdon/google_workspace_mcp` once verified - keeping two paths to one document is how they drift.

- **Browser automation was abandoned for the doc.** It put a meeting recap in the wrong tab, split notes mid-sentence, and an undo over-reverted. Not a tuning problem - coordinate clicking on a live shared document is the wrong mechanism.

- **The claim that tab create/rename/reorder is UI-only was WRONG and cost Zaal three manual actions before it was caught.** The Docs API has `addDocumentTab`, `deleteTab` and `updateDocumentTabProperties`; title, index and parentTabId are all writable. The lesson: check the API's own discovery document rather than inferring a limit from the tool you happened to build.

- **Audio diarization was discarded in favour of video name tags.** `sherpa-onnx` returned 75 speakers on auto-detect and 48 with the count forced to 6. A Meet recording is an active-speaker feed with the display name burned into the frame, so the method is: take the utterance timestamp from the Whisper JSON, `ffmpeg -ss` that one frame, read the tag. **Verified against two speakers already identified by content before being trusted.** Allow 2-4 seconds of switch lag.

- **Supabase was NOT migrated, and that was the right call.** Zaal asked to move ZAOstock to a fresh project on ZAOdevz. Measurement first: the database is **Healthy**, shows **1 request in 60 minutes** and **zero Postgres errors**, while the site returns 503. That points at Vercel environment variables, not the database. **Migrating would have moved everything and fixed nothing.** Still unfixed.

- **Backend direction: doc and Google Forms for anything humans read and write; Supabase only for what the website renders.** Zaal's refinement, after considering killing Supabase entirely.

- **The press kit ships WITHOUT the lineup.** Holding the whole page until Sep 1 loses every press enquiry in exactly the window a local paper plans coverage. The lineup section says names come Sep 1, says press are held to that too, says why, and invites earlier deadlines to get in touch.

- **`zao-doc-next` handed out an already-taken number TWICE in one session.** It advances its own tag sequence without scanning branches. The second time it gave 2409, which the VPS lane was actively writing and which merged as #3308. That tag was released rather than left to block them, and 2410 reserved by hand after checking directory, branch and tag.

- **A follow-up push raced an auto-merge and stranded a commit.** PR #3309 merged while the speaker correction was being pushed to its branch. Recovery was a cherry-pick onto current main as #3310 - never re-PR the stale branch.

- **Two tool bugs found and fixed by measuring rather than assuming.** Inserted text inherits the paragraph's bullet formatting, so a source file with zero list items produced 78 bulleted paragraphs including the H1. And Docs' default heading spacing turned a 3,000-character agenda into four printed pages.

- **`crm_contacts` does not exist; the table is `contacts`.** I told a peer session the CRM write script might be writing nowhere - **that was wrong and I corrected it.** The script was always right and even carries a comment saying so. Only SKILL.md's prose was wrong. Opening the file before making the claim would have avoided it.

### Friction sources - do not re-discover these

- **`zao-doc-next` cannot be trusted for the number.** Verify against merged directories, remote branches AND tags before reserving. A gap costs nothing; a collision costs a renumber mid-PR.
- **Docs research PRs auto-merge.** After any follow-up push, check `gh pr view <n> --json state` and confirm the SHA is inside the merged range.
- **The doc-collision guard blocks at COMMIT time, not push.** A blocked commit leaves files staged and an empty branch, so a later push succeeds while creating nothing - and `gh pr create` then fails with "No commits between".
- **Reading `$?` after a pipeline is blocked by a hook.** Redirect to a file and check the status separately.
- **The vault and dotfiles have concurrent writers.** Stash, pull with rebase, push, pop - and verify local matches upstream rather than trusting a `push rc=0` that was actually an echo of the previous command.

---

## C. Git state

- Branch: `ws/research-2352-paid-oss-slopcash-sweetman` (ahead 0, behind 0, dirty 9 files, untracked 2)
- Push status: clean relative to origin
- **The 9 dirty files are other lanes' work, not this session's** - `.claude/settings.json`, `bot/src/zoe/*`, `scripts/check-pipeline-exit.py`, a research doc. **Do not commit them as part of this work.**
- This session's output went to worktrees, PRs, the Google Doc, the vault and dotfiles. **There is no diff to apply.**

---

## D. In-flight

- **Background jobs:** none running. Transcription and both diarization attempts completed.
- **Subagents:** none.
- **Scheduled wakeups:** none.
- **Open questions to Zaal:** none blocking.
- **Open PRs awaiting merge:** ZAOOS #3304, ZAOOS #3310, ZAODEVZ/ZAOstock #50.
- **Cross-session:** the harness lane surfaced the CRM local-network finding and was sent a verification plus a correction. No reply needed.

---

## E. Cold-start map

**The ZAOstock organizing doc is the master surface.** `1B78AVonJS3-bXXdHMYJ-M2LruujQjZhcONT-vAO0Jko`

Ten tabs, all formatted with real headings, bold, italics and live hyperlinks:

`Start Here` (a directory, nothing else) · `Run of Show` (minute by minute, every slot tagged LOCKED / PROPOSED / NEEDS NAME) · `AV List` (fill-in sheet) · `Improvements` (ten run-of-show findings plus call feedback) · `Team and Roles` · `What We Need` (every open ask with owner and date) · `Local Network` (the eleven CRM contacts) · `Links and Assets` · `Meetings` (subtabs per call) · `ZAOVille` (archive)

**Files touched**

- `~/bin/gdoc`, `~/bin/gdoc-md`, `~/bin/gdocs-mcp` - new, committed to zaal-dotfiles
- `~/.claude/skills/meeting/SKILL.md` - name-tag identification, four new extraction passes, blind-spots list, CRM table-name fix
- `~/zao-vault/handoffs/zaostock.md` - rewritten 1,233 lines to 147, log archived
- `~/zao-vault/handoffs/IN-FLIGHT.md`, `~/zao-vault/handoffs/archive/zaostock-log-through-2026-08-23.md`
- `research/events/2410-zaostock-standup-aug24/` - recap plus transcript
- `research/dev-workflows/2402-agent-editing-google-docs/`
- `ZAODEVZ/ZAOstock: src/app/press/page.tsx` - new

**Skills invoked:** `/zao-research` (doc 2402) · `/clipboard` (five pages) · `/quick-grill` (two rounds) · `/meeting` (the Aug 24 standup) · `/handoff` (this)

**Memory writes:** none this session.

**Credentials now in place:** a Google OAuth client and token at `~/.zao/private/gdocs-oauth-client.json` and `gdocs-oauth.json`, both chmod 600, scoped to Docs and Drive only. `gdocs` is registered as an MCP server for future sessions.

**Mental model:** ZAOstock is 39 days out. The organizing doc went from a half-broken artifact only editable by hand to the master planning surface, fully scriptable. The Aug 24 standup is captured and its decisions are reflected across the doc. What is genuinely unresolved is the lineup - five artists confirmed of a target around fifteen - the AV spec due Aug 26, and the pitch deck that unlocks sponsorship.

**Open questions for the receiver:** whether Zaal wants the Vercel environment variables fixed to unbreak the lineup API and the four public forms. Real work, currently unowned, deliberately left off Section A.
