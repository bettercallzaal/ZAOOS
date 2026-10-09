# Thread Discipline (anti-sprawl / executive-function support)

Established 2026-07-29 after a marathon session opened ~10 threads fast and left
several half-done ("we moved too fast and lots of things got left behind"). This
is the in-session complement to `workflow-discipline.md` rule 1 (one thread
finished, then the next) and to Zaal's capture->triage->crush loop
([[project_capture_triage_crush_loop]]): that loop catches thoughts Zaal
deliberately captures; this rule catches threads that open MID-SESSION and would
otherwise evaporate from the chat. Externalizing the open loops is the point -
don't hold them in working memory or the transcript alone.

## The three behaviors (behavior-changing)

1. **LIVE LEDGER - hold every open thread in the Task tools, all session.** The
   moment a new thread/task opens, `TaskCreate` it (status in_progress). On
   finish, `TaskUpdate` -> completed. This keeps the open loops externalized and
   visible, so a fast pivot can't silently drop one. The ledger is the source of
   truth for "what's still open," not the chat scrollback.

2. **PARK-ON-PIVOT - when Zaal jumps threads before the current one is done,
   capture the leaving thread FIRST, then follow.** Never let a pivot leave a
   thread living only in the conversation. Capturing is cheap; a lost thread is
   not.

   > **TOOL STATUS 2026-08-23: `todo` IS PRESENT. Use it.** All six resolve on
   > this Mac - `todo`, `crush`, `cockpit`, `zao-triage`, `morning-pick`, `ztui`,
   > each at `~/bin/<name>`, each git-tracked in `zaal-dotfiles`. Zaal rebuilt
   > them on **2026-08-21 09:59 EDT** (zaal-dotfiles `9c8993b`, "rebuild the
   > capture-triage-crush CLI six", PR #67). Board card 78f3279f is resolved by
   > that commit.
   >
   > **This block previously said the opposite, and that was correct when it was
   > written.** The 2026-08-19 note recorded a real absence, verified four ways.
   > It went stale two days later when the rebuild landed, and nothing updated
   > it - so for two days a rule loaded into every session told every lane to
   > route around a tool that worked. Re-verified 2026-08-23 by resolving all
   > six with `command -v` and confirming the dotfiles commit.
   >
   > **The lesson is the shape, not the tools.** A TOOL STATUS note is a claim
   > with a shelf life, and an absence claim goes stale the moment someone fixes
   > the thing. Any note in these rules asserting a tool is missing must be
   > re-verified before it is acted on, not trusted because it is written down
   > (`state-claims.md`: name the source; `vanishing-dependencies.md` rule 3: a
   > dependency's existence is checked, not assumed - which cuts both ways).

3. **END RECAP - on a natural stop, a `/compact`, or when asked, surface the
   ledger in three buckets:** DONE (shipped, with proof - PR#/file), PARKED
   (captured to inbox/board, will resurface via crush), DROPPED (open, needs a
   decision). Never end a long session without this - it's the "nothing left
   behind" checkpoint. Honest DONE vs PARKED vs DROPPED (per `anti-fabrication.md`).

## Guards

- Parking is NOT doing. `todo` captures the thread; it does not execute it (iron
  rule from the capture loop: capture never = do-it-now).
- Don't over-capture: only park a thread that has real remaining work. A finished
  or trivial aside doesn't go to the inbox.
- The ledger reuses Zaal's existing loop - a parked thread flows todo -> zao-triage
  -> crush -> morning-pick. No new system; this is discipline + the Task tools.

## Source

2026-07-29 marathon-session retro. Siblings: `workflow-discipline.md` (one thread
at a time), `agent-loops.md` (rule 4: never leave a broken state),
`[[project_capture_triage_crush_loop]]`, doc 606 (second-brain system).

TOOL STATUS corrected 2026-08-23 after an idle-lane audit (`idle-lane-audit.md`
step 2, "does what we depend on still exist") resolved all six binaries that this
rule had declared missing. Found while checking a different artifact's claims -
which is the argument for that rule: the check cost seconds and the stale note
had been steering every session for two days.
