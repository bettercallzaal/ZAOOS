# Code Over Inference - pay once to build it, or pay every time to think it

Zaal, 2026-08-20: *"We really need to focus on AI costs versus building software
that is just autonomous code that runs for us for free. That's super important
distinction that we need to make and include as a part of our fleet
organization."*

He is right, and our own numbers make the case harder than any argument.

## The measurement, same machine, same day

| | cost |
|---|---|
| 24h of agent work | **$3,001.85** across 71 sessions, **$56.64 per PR** |
| `zj`, `zao-wall`, `zao-spend`, `zao-waiting`, `zao-lanes`, `lane-send`, `zao-status-write` - **2,019 lines** | **$0 per run, forever, unlimited** |

Those 2,019 lines were written BY an agent. That is the whole point: **the
inference was paid once and the capability is now free.** `zj` renders the wall
forty times a day for nothing. An agent asked to "look at the lanes and tell me
which need work" forty times would cost forty turns.

## The one test

Before an agent does anything repeatable, ask:

> **Does this need fresh judgment each time, or the same judgment every time?**

- **Same judgment every time** -> it is a SCRIPT. Write it once, run it free.
- **Fresh judgment each time** -> it is inference. Pay for it, and it is worth it.

That is the whole rule. Everything below is how to apply it without being silly
about it.

## What is almost never inference

If an agent is doing one of these by reading and reasoning, it is burning a turn
on something a script does for nothing:

- **Counting, parsing, filtering, sorting.** Board queries, lane states, file
  inventories, PR lists.
- **Fetching and transforming.** `curl`, `yt-dlp`, `ffmpeg`, `gh api`, git.
- **Formatting and rendering.** Tables, digests, status lines, index rows.
- **Scheduled checks.** Anything on a timer is a cron, not a loop.
- **Transcription.** `whisper.cpp` runs free on the Pi's idle cores. An LLM
  transcription API bills per minute of audio, forever.
- **Verification with a definite answer.** "Does this file exist", "did the test
  pass", "is this PR mergeable" - assert it, do not reason about it.

## What genuinely needs inference

Do not over-correct. These are worth every turn:

- **Judgment under ambiguity** - which of two readings of a request is right.
- **Writing that someone will read** - docs, briefs, copy, PR bodies.
- **Grounded code changes** - reading live code and editing it correctly.
- **Synthesis** - turning a transcript into decisions and obligations.
- **Deciding what the script should be.** This is the highest-leverage
  inference there is: an agent spending a turn to write a tool that then runs
  free a thousand times.

## The counterexample, priced

Thirteen VPS cheap-loops ran for a week on a 2-core box at load 12.5 with 2GB of
swap, five of them doing concurrent local LLM inference, and **wrote zero files
in seven days**. They were agent loops doing work that had no fresh judgment in
it - and they paid for it in CPU continuously while producing nothing.

Compare `zao-vault-linkrot.py` or `zao-board-vault-check.py`: written once,
scan the whole estate in seconds, cost nothing, and their findings are
reproducible rather than re-derived.

## How this changes fleet organization

**1. Every lane asks the test before starting repeatable work.** If the answer
is "same judgment every time", the deliverable is a SCRIPT, not a result. Ship
the tool, then let the tool produce the result forever.

**2. Loops on a timer are cron, not agents.** An agent loop that wakes, checks,
and finds nothing changed still costs a full turn (~$1, `agent-spend.md`). A
cron that does the same costs nothing. Reserve agent loops for work that needs a
decision when it arrives.

**3. Prefer local binaries over hosted inference for mechanical media work.**
`whisper.cpp`, `ffmpeg`, `yt-dlp` on the Pi's idle cores are free and unmetered.
This is also why the Pi matters: it adds CPU, and CPU is the cheap resource.

**4. Measure cost per outcome, not cost per session.** `zao-spend` already
prints `$/PR`. A lane whose cost-per-PR is rising is usually re-deriving
something that should have become a script three runs ago.

**5. When a task recurs a third time, stop and write the tool.** Twice is
coincidence. Three times is a script you have not written yet.

## Guards

- **This is not a licence to skip verification.** Checking is the work
  (`confirm-before-claiming-absence.md`), and the cheapest checks are exactly
  the deterministic ones this rule prefers. Verify MORE, not less - just do it
  in code.
- **Do not build a tool for a one-off.** `code-restraint.md` rung 1 still binds:
  the best code is the code you never wrote. This rule fires on the RECURRING
  case.
- **A script that lies is worse than a turn spent thinking.** Every tool written
  under this rule must fail loudly, assert real effects rather than exit codes,
  and be git-tracked (`silent-failure-guard.md`, `vanishing-dependencies.md`).
  Four load-bearing tools were found broken on 2026-08-20 alone.
- **Cost is not the only axis.** On Max the binding constraint is the weekly
  cap, not dollars - but the cap is spent by the same turns, so the rule holds
  either way.

## Source

Zaal, 2026-08-20, after a day measured at $3,001.85 and $56.64 per PR. Siblings:
`agent-spend.md` (cost = turns x ~$1, flat - this says what to do about it),
`claude-usage.md` (which surface for which task - this is the same ladder inside
one machine), `code-restraint.md` (do not build what need not exist),
`silent-failure-guard.md` + `vanishing-dependencies.md` (what a written tool
owes you), doc 2353 (session length dominates model choice).
