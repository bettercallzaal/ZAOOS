# Worktree Handoff - never hand another agent a writable path inside your own git tree

Established 2026-08-27 after the second instance of one shape: **two agents
writing to the same git working tree, with nothing failing and nothing warning.**
Both instances were caught by noticing an unexpected line in `git log`, not by any
guard.

A capable agent handed a path inside a git repo will reasonably write there,
`git add`, and commit. That is correct behaviour everywhere else. It is only
wrong because the tree belonged to someone else, and nothing in the handoff said
so.

## The two instances

1. **Parallel sessions swapping HEAD under each other** (2026-04-29, research doc
   554). Every session shared `~/Documents/ZAO OS V1`, so whichever ran
   `git checkout` last won. A session wrote doc 548, pushed, then found its own
   file gone: another session had checked out a different branch beneath it.
   `git branch -a` is global, but HEAD is per-worktree, and the main dir is one
   worktree.

2. **A spawned lane agent committing into the caller's branch** (2026-08-27,
   issue #3338). `/meeting` Phase 3.5 spawned a lane agent and handed it a packet
   path inside the caller's live worktree. The lane wrote its review there and
   committed to the caller's branch on its own. The commit was **well-behaved**:
   one file, no push, no recap edit. That is exactly what hid it - nothing
   failed, and `git status` was clean because the agent had committed its own
   change. Two agents were writing the same file in the same window; the race was
   won by timing, not design.

Different mechanisms, one shape. **Instance 1's fix does not cover instance 2**:
"one worktree per session" assumes the other writer is a peer session, and here
the caller pointed a subagent at its own tree deliberately.

## The rule

**A path you hand to another agent is a path you no longer control.**

- **Do not pass a writable path inside your own worktree to a spawned agent,
  subagent, or lane.** Copy the input to a scratch path outside any git tree you
  are working in, let the other agent write its output there, and copy the result
  back yourself. Then the failure cannot occur, rather than being asked not to.
- **Telling the other agent not to commit is not enough on its own.** It relies
  on compliance, and the compliant case is the one that hides best. If you must
  rely on it, say in the handoff that the path belongs to another lane, put the
  instruction in every layer the agent actually reads, and **check it** (below).
- **Before spawning, ask: whose tree is the path I am about to hand over?** If
  the answer is "mine", you are about to create one of these.
- **After any run that spawned agents, read `git log` before trusting
  `git status`.** A clean tree does not mean nobody else wrote; it can mean
  somebody else already committed.

## Two layers, and they are not alternatives

**Prevention: copy-out.** Removes the possibility. The other agent never holds a
writable path in your tree, so there is nothing to comply with.

**Detection: record HEAD before the handoff, compare after.** `lane-weigh-in.py`
(`8d309de`) does this: it writes the target repo, branch and HEAD to a baseline
file before the first packet goes out, and `collect` diffs it afterwards and
names any commits that landed in the window. Its own comment states the case
better than a rule can:

> An instruction nobody checks is a hope.

Two properties worth copying, not just the idea:

- **It reports, never reverts.** It cannot tell which pane authored what, and it
  says so rather than guessing. Naming the commits and letting a human look beats
  a confident wrong rollback.
- **It costs one `git rev-parse`.** There is no budget argument against it.

The same commit also hardened the instruction side, and how it did that is the
transferable part: the no-git rule is repeated in the packet, in the pane brief,
AND in the spawn command line, because *a pane acts on the message in front of
it* - the agent that committed on 2026-08-27 had a correct packet sitting on disk
beside it and never read that far.

**Use both.** Copy-out is the fix; detection is what tells you the fix is holding,
and it still covers the cases copy-out cannot reach - an agent that wanders into a
tree on its own, or a handoff someone adds later without reading this rule.

## Guards

- **This is not an argument against spawning agents in repos.** An agent working
  in its OWN repo is the normal, correct case. The hazard is specifically a
  writable path in the *caller's* tree.
- **Do not delete another agent's commit to "clean up".** In instance 2 the
  commit's content was correct and carried the lane's own reasoning; removing it
  would have destroyed the record. Leave it, attribute it, and fix the handoff.
- **Mixed authorship on a branch is a symptom, not the problem.** The problem is
  that two writers were unsynchronised. A branch with tidy authorship and a
  clobbered file is strictly worse.

## The tell

A commit in `git log` you did not write, on a branch you thought was yours. By
the time you see it, the race has already been run - you are reading the outcome
of a coin flip, not a failure.

## Source

2026-08-27, issue #3338 (Phase 3.5 lane committed into the caller's branch),
promoted to a rule on the second instance per `agentic-issue`. First instance:
research doc 554, Worktree Collision Postmortem (2026-04-29). Detection layer
from `8d309de` in `zaal-dotfiles`, written by another lane against this same
incident while this rule was being drafted - which is itself a third occurrence
of the shape, found the way this rule says to find it, by reading `git log`.
Siblings:
`silent-failure-guard.md` (green while broken), `first-handler-wins.md` (two
handlers, one input), `state-claims.md` (name the source).
