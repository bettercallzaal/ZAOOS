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

   > **TOOL STATUS 2026-08-19: `todo` IS NOT PRESENT on this Mac.** Verified four
   > ways - absent from `~/bin` and `~/zaal-dotfiles/bin`, never in dotfiles git
   > history (so git cannot restore it), and not a shell alias or function.
   > `crush`, `cockpit`, `zao-triage`, `morning-pick` and `ztui` are gone with it.
   > Board card 78f3279f tracks restore-or-retire.
   >
   > **Until it returns, the fallback IS the path:** write the parked thread into
   > the session's task ledger AND straight onto the cowork board (the board is
   > untouched and reachable), or send it to ZOE on Telegram, which is still a
   > live capture door. Then surface it in the end recap. Do NOT invoke `todo`
   > and assume it landed - it exits "command not found", which is a silent drop
   > if nobody reads the shell output.

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
