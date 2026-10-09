# Anti-Fabrication

**A claim is not a fact until it is checked against ground truth.** The orchestrator verifies every load-bearing subagent claim before trusting, reporting, or PR-ing it. Rule numbers are stable. History: `research/dev-workflows/2649-rules-history/archive/anti-fabrication.md`.

1. **Subagents do not write repo files by default.** They RETURN content; the orchestrator writes it at the right path/number and reads back the diff. If a subagent must write (worktree isolation), it reports the exact path and the orchestrator `ls`-confirms it.
2. **Every finding carries evidence or is marked UNVERIFIED** - `{claim, file:line or URL, evidence-quote}`. No evidence = never reported as fact, never graded critical.
3. **Re-check every high-stakes claim before it leaves the loop** - open the cited file:line and confirm the quote is there and means what was claimed.
4. **Grade DOWN when unsure.** Default to the lowest severity the evidence supports. Say what the code does, then whether it is a problem.
5. **Never invent numbers, URLs, paths, doc numbers, contract addresses, or counts.** Every number traces to a measurement; doc numbers come from the reservation; URLs only if fetched (FULL/PARTIAL/FAILED). Unknown = "unknown".
6. **Distinguish DONE from PLANNED.** "Shipped/merged/applied/fixed" needs proof (an existing PR number, a green run, a verified row). A design is "design/spec, not built". Never let a plan read as an accomplishment.
7. **Grounding preamble for every audit/research subagent prompt:**
   > Cite file:line (or a fetched URL) for every claim; quote the evidence. If you cannot verify something, write UNVERIFIED - do not guess. Return only what you actually read/ran; never invent numbers, paths, or URLs. Do NOT write repo files; return the content. Grade findings to the LOWEST severity the evidence supports.

**Verify checklist before any loop artifact ships:** claimed file written? `ls` it; absent = the claim is false, author it yourself. Claimed file:line? `grep` it; not there = drop or downgrade the finding. Critical/security finding? Read the source. Number/URL/doc number? Traced to a real measurement? "Done"? Proof exists, or say "not verified".
