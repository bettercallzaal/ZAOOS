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
   capture the leaving thread to the inbox FIRST, then follow.** Run
   `todo "<the parked thread + its next step>"` so it lands in the cowork inbox
   and enters triage->crush. Never let a pivot leave a thread living only in the
   conversation. A one-line `todo` is cheap; a lost thread is not. (If `todo` is
   unavailable, mark it parked in the ledger and surface it in the end recap.)

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
