# State Claims - name the source, or do not make the claim

Established 2026-08-08 after a single session produced EIGHT wrong statements
about this repo's own state. Not predictions, not opinions - claims about files
sitting on the disk. Zaal: "There's a lot of times u say correction, saying it's
built. I feel like visibility is a big challenge."

`confirm-before-claiming-absence.md` already existed and said to verify. It did
not prevent any of the eight, and understanding WHY is the whole rule.

## Why the existing rule failed

**Every wrong answer came from a proxy that was cheaper to reach than the truth.**

| The claim | What was read | Where the truth was |
|---|---|---|
| "we're on grammy ^1.29.0" | the package.json range | `package-lock.json` |
| "21 files can't find grammy" | tsc's output | an empty `node_modules` |
| "3 pre-existing test failures" | the test runner | the same empty directory |
| "the Heart's only consumer is a canary" | the canary file itself | a grep for call sites |
| "seven things we should build" | a sense of the repo | the code |
| "boot-verify passed" | esbuild's exit code | which commit it checked out |
| "no new typecheck errors" | a diff against a baseline | whether that baseline was current |
| flags set to `true` | assuming true means true | the `=== '1'` in the source |

package.json was already in context; the lockfile was one more read. tsc
volunteered 183 errors; nobody thinks to ask an empty directory whether it is
empty. **The proxy always wins on effort, and it is usually right - which is what
makes it dangerous. It is wrong exactly when the answer matters.**

A rule that says "check the lockfile" loses to "package.json is already open".
So the rule cannot be about diligence. It has to change the cost.

## The rule (behavior-changing)

**1. A state claim carries its source, in the sentence.**

Not "we're on 1.42.0" but "**the lockfile pins** 1.42.0". Not "nothing imports it"
but "**a grep for call sites outside the module and its tests found** nothing".

This is cheap and it is the whole mechanism: naming the source makes a WRONG
source visible to the reader, and - more often - visible to yourself as you type
it. Half of the eight would have died at the moment of writing "the package.json
range says we're on...".

**2. Use `zao-verify` - it is faster than the proxy.**

```
zao-verify dep <name>      installed version vs the range vs what is on disk
zao-verify wired <module>  what actually imports it, excluding itself and tests
zao-verify flag <NAME>     the literal the code accepts - `true` is not universal
zao-verify exists <term>   what already covers this, before building a second one
zao-verify env             is the toolchain installed at ALL
```

Every answer prints its source. If a question is not covered, name the source by
hand - the naming is the requirement, the tool is the convenience.

**3. Before believing ANY tool, confirm the tool can run.**

`zao-verify env` first, whenever a tool reports something surprising. 183
typecheck errors on a healthy repo is not a finding, it is a missing
`node_modules` - and it cost a day of "no NEW errors" instead of "no errors".

**4. Measuring a DELTA instead of an ABSOLUTE means you have already adapted to a
broken instrument.** "No new errors", "same failures as main", "no new warnings" -
each is legitimate ONLY once you have established what the baseline is and why.
Otherwise the baseline is where the real problems live. And re-derive the baseline
against the CURRENT target; one captured before an intervening merge invents
phantom deltas.

**5. "Merged" is not "running".** A feature has four independent states - BUILT,
WIRED, FLAGGED, LIVE - and only the first is visible from the code. Use
`zoe-liveness --remote`. A flag set to a value the code rejects reads as done and
does nothing, which is worse than unset.

## Silence is not evidence (added 2026-08-08)

Rule 5 above says "merged" is not "running". The follow-on, learned the hard
way: **you cannot conclude a feature did NOT run from the absence of log
lines - unless you first prove it CAN log.**

Asked which of eight features shipped that week had executed in production,
seven days of journald could not answer. Not because they had failed. Because
five of the eight contained **no logging statement of any kind**, and the other
three spoke only from inside a `catch`. So silence meant "nothing crashed",
never "it ran", and a flag reading ON proved the code was REACHABLE, not that
it had been reached.

That gap is the whole distance between merged and running, and it is why a week
of work was untestable rather than broken.

### The fix, and why it is one line per feature

`featureRan(name, detail)` prints ONE line the first time a feature actually
executes after a boot:

    [zoe/ran] dm-build - chat 12345

Once per process, not per call, deliberately - a lock acquired every tick would
produce thousands of lines a day and become the noise nobody greps
(`noisy-signal-guard.md`). One line per boot answers the only question being
asked, and the whole inventory becomes one grep.

Placement is on the SUCCESS path, at the point of effect. Never at import time:
that proves the module loaded, which is the same empty proof a flag already
gives.

### What it bought, the same day

A build request typed into the DM did nothing. Zero `[zoe/ran]` lines for the
classifier proved it had **never executed** - separating "ran and declined" from
"never reached". Without that distinction the debugging starts inside the
classifier, where nothing was wrong; the actual bug was a different handler
eating the message a thousand lines earlier (`first-handler-wins.md`).

### The gate

Before reporting that a feature is or is not running:

1. **Does it emit anything on success?** If not, its silence is meaningless -
   fix the observability before drawing any conclusion.
2. **Is the log line on the success path, or only in a `catch`?** A module that
   speaks only when it fails tells you nothing when it works.
3. **Say which you measured.** "No `[zoe/ran]` line since the last boot" is a
   fact. "It is not running" is an inference, and only sound once (1) holds.

## A claim carries its DATE as well as its source (added 2026-08-23)

The rule above says name the source. Its twin: **a claim about a moving fact is
only as good as the day it was made, so a durable artifact must carry that day.**
A time-relative word written into a note, doc or brief is stale the moment the day
turns, and nothing about the sentence announces that.

Five instances of this shape landed in a single day on 2026-08-23, across three
different lanes:

| The claim | Written | Read as current | Reality |
|---|---|---|---|
| A brief set the standup at "2026-08-25" | 08-22 | 08-22 | It was Monday the **24th**; the 25th is a Tuesday, so the date and the day-name disagreed with each other |
| "Lineup announces August 2026" measured off a local clone | - | 08-22 | The clone sat on a branch from days earlier. `main` and production had already been fixed |
| "6 out-of-state artists CONFIRMED" (doc 2295) | 08-15 | 08-22 | **Three** confirmed. A whole doc's arithmetic was built on the stale eight |
| A card note: "Zaal building the deck **TODAY**" | 08-19 | 08-23 | Propagated four days on by a lane that had no way to see the word was old |
| Doc 2325's fact sheet: "8 confirmed **as of 2026-08-20**" | 08-20 | 08-23 | Also wrong by then - **and catchable in seconds, because it carried its date** |

The last row is the fix, demonstrated. Same wrong number as row three; the only
difference is that it said when.

### The gate

1. **Never write "today", "this week", "currently", "now" or "recently" into
   anything that outlives the conversation** - a card note, a doc, a brief, a
   handoff, a commit body. Write the date. "Zaal is building it today" becomes
   "Zaal was building it 2026-08-19".
2. **Stamp any figure that can move.** Counts, confirmations, versions, prices,
   statuses. `as of YYYY-MM-DD` is four words and it converts a future wrong
   answer into a visible one.
3. **When you read a time-relative claim, resolve it against when it was
   WRITTEN, not when you are reading.** Check the note's date, the doc's
   `last-validated`, the commit. If you cannot establish when it was written,
   that is itself the finding - say so rather than assuming it is current.
4. **Check the day-name against the date.** "Mon 25 Aug" carries its own
   contradiction if the 25th is a Tuesday, and `date -j -f %Y-%m-%d` settles it
   in one command. Two of the five above were catchable this way alone.
5. **A local clone is a time-relative claim too.** Measuring anything from a
   working tree without checking what it is checked out to is reading a snapshot
   of an unknown date. Measure against `origin/main`, or against production.

### Why this is not covered by the rules already here

`anti-fabrication.md` rule 5 bans **inventing** dates. This is the opposite
failure: the date was real and true when written, and decayed. Nobody fabricated
anything, and the claim still became false. `recap-followthrough.md` covers the
same decay in meeting recaps specifically; this generalises it to every durable
artifact.

---

## The tell

If you are about to write "it's built", "nothing does X", "we're on version Y", or
"that's already deployed" - stop and ask **which file would prove me wrong?** Then
open that file. If you cannot name one, the claim is a memory, not a fact, and it
should be phrased as one.

## Guards

- This is not a licence to slow everything down. Four of the five checks are one
  command and under a second; the rule is cheap precisely so it survives a tired
  session.
- Honest uncertainty is always allowed and always better: "I did not check" beats
  a confident wrong answer, and `anti-fabrication.md` rule 4 already says grade
  down when unsure.
- Applies hardest to autonomous and overnight work, where nobody is reading over
  your shoulder and a wrong state claim becomes a wrong build.

## Filesystem metadata is not file age (added 2026-08-22)

`stat` and `ls -l` report the mtime of when a file was last written — not when its
content was *created*. Bulk operations destroy this signal entirely.

**The concrete failure (2026-08-21, confirmed):** a pruning pass was proposed for
`~/.claude/projects/.../memory/` based on file age. Every memory file returned
`2026-08-12` as its mtime — because commit `e1b7de5` ("sync: add ZAOOS memory,
284 files, secret-scanned") rewrote all 416 files in one operation on 2026-08-11.
A pruning pass sorted by mtime would have deleted by a meaningless signal — the
newest memories and the oldest look identical.

**Canonical memory-age command:**

```bash
git log --diff-filter=A --format="%ci %s" -- <file>
```

`--diff-filter=A` returns only the commit that ADDED the file. The date that prints
is the true creation date, unaffected by syncs, renames, or bulk checkouts.

To check a specific file:
```bash
git log --diff-filter=A --format="%ci" -1 -- memory/feedback_no_emojis.md
# → 2026-03-15 19:41:23 +0000   (the actual date, not the sync date)
```

**Rule:** before sorting or pruning files by age in any directory that is under
version control, verify that mtime is not synthetic. One `git log --diff-filter=A`
spot-check on two or three files is enough to catch a bulk-sync artifact.

**Never use `stat` as a proxy for content age in a git repo.** It is the cheapest
available measure of file age and wrong the one time it matters — right after a
bulk operation.

## Source

Zaal 2026-08-07/08, from eight wrong state claims in one session and the
observation that visibility was the common cause. Siblings:
`confirm-before-claiming-absence.md` (absence claims - this generalises it to all
state), `anti-fabrication.md` (evidence or UNVERIFIED),
`noisy-signal-guard.md` (a check that always fires is a check nobody reads),
`silent-failure-guard.md`. Tools: `scripts/agents/zao-verify.py`,
`scripts/agents/zoe-liveness.py`.
