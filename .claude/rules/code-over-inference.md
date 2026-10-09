# Code Over Inference - pay once to build it, or pay every time to think it

Measurement ($56.64/PR vs $0 scripts) and history: `research/dev-workflows/2649-rules-history/archive/code-over-inference.md`.

**The test, before an agent does anything repeatable: does this need fresh judgment each time, or the same judgment every time?** Same judgment = a SCRIPT, written once, run free. Fresh judgment = inference, worth paying for.

- **Almost never inference:** counting, parsing, filtering, sorting; fetching and transforming (`curl`, `yt-dlp`, `ffmpeg`, `gh api`, git); formatting and rendering; scheduled checks (a timer = cron, not a loop); transcription (`whisper.cpp` locally, not a per-minute API); verification with a definite answer.
- **Genuinely inference:** judgment under ambiguity; writing someone will read; grounded code changes; synthesis; deciding what the script should be.

Fleet organization:
1. Every lane asks the test before repeatable work; if "same judgment", the deliverable is the tool.
2. Loops on a timer are cron, not agents. Reserve agent loops for work that needs a decision when it arrives.
3. Prefer local binaries over hosted inference for mechanical media work.
4. Measure cost per outcome (`zao-spend` $/PR), not per session.
5. When a task recurs a third time, stop and write the tool.

Guards: not a licence to skip verification (verify more, in code). Do not build a tool for a one-off (`code-restraint.md` rung 1). A tool written under this rule fails loudly, asserts real effects, and is git-tracked.
