# Anti-Fabrication

Subagents and long loops fabricate: they claim files were written that were not,
grade findings "critical" that are intentional, invent numbers/URLs/paths, and
report a plan as if it were done. This rule makes fabrication expensive to commit
and cheap to catch. It exists because in one session two subagents claimed
file-writes that did not exist and one over-graded 8 findings to what was really 1.

## The one principle

**A claim is not a fact until it is checked against ground truth.** The
orchestrator (the loop / the main agent) VERIFIES every load-bearing claim a
subagent makes before trusting it, reporting it, or opening a PR from it. "The
rule has been written to X", "8 critical bugs", "the endpoint returns Y" are
claims - `ls` the file, `grep` the line, re-read the source, re-fetch the URL.

## Rules (behavior-changing)

1. **Subagents do NOT write repo files by default.** They RETURN content; the
    orchestrator writes it, at the right path/number, and reads back the diff.
    Subagent file-writes collide (a doc landed at a colliding low number), get
    left uncommitted in the shared tree, and can be claimed-but-absent. If a
    subagent must write (worktree isolation), it reports the EXACT path and the
    orchestrator `ls`-confirms it before proceeding.

2. **Every finding carries EVIDENCE or is marked UNVERIFIED.** Require subagents
    to return each finding as `{claim, file:line (or URL), evidence-quote}`. A
    finding with no quotable evidence is `UNVERIFIED` - never reported as fact,
    never graded as critical.

3. **The orchestrator re-checks every high-stakes claim before it leaves the
    loop.** For each "critical"/"confirmed"/security finding: open the cited
    file:line and confirm the quote is really there and means what was claimed.
    Tonight this downgraded 8 "critical" to 1 real decision. Do it every time.

4. **Grade DOWN when unsure. Fabricated alarm is worse than a miss.** Default a
    finding to the lowest severity the evidence supports. "Intentional soft-fail
    with a comment saying so" is not "critical data-loss bug." Say what the code
    actually does, then whether it is a problem.

5. **Never invent numbers, URLs, paths, doc numbers, contract addresses, or
    counts.** Every number in a report traces to a measurement (a query, a
    `wc -l`, a fetched page). A doc number comes from the reservation scan, not
    a guess. A URL is only cited if it was actually fetched (mark FULL/PARTIAL/
    FAILED). Unknown = write "unknown", not a plausible value.

6. **Distinguish DONE from PLANNED in every report.** "Shipped", "merged",
    "applied", "fixed" require proof (a PR number that exists, a green run, a
    verified row). If it is a design or a proposal, say "design/spec, not built".
    Never let a plan read as an accomplishment.

7. **Standard grounding preamble for every audit/research subagent prompt:**
    > Cite file:line (or a fetched URL) for every claim; quote the evidence.
    > If you cannot verify something, write UNVERIFIED - do not guess. Return
    > only what you actually read/ran; never invent numbers, paths, or URLs. Do
    > NOT write repo files; return the content. Grade findings to the LOWEST
    > severity the evidence supports.

## The orchestrator's verify checklist (run before any loop artifact ships)

- Claimed a file was written? `ls` it. Absent = the claim is false; author it yourself.
- Claimed a file:line? `grep`/`sed` it. Not there = drop or downgrade the finding.
- A "critical"/security finding? Read the source; confirm the quote + its meaning.
- A number/URL/doc-number? Traced to a real measurement/fetch/scan? If not, remove it.
- "Done/shipped/merged"? Proof exists (PR#, green run, verified row)? If not, say "not verified".

## Source

Established 2026-07-27 from an overnight loop where subagents fabricated
file-writes and over-graded findings. Companion to `agent-loops.md` rules 30
(vacuous verify), 33 (verify subagent claims), 34 (relocate subagent docs) and
`feedback_no_sub_agent_context_fabrication`. Sibling: `silent-failure-guard.md`
(green-while-broken) - that is systems lying to you; this is agents lying to you.
