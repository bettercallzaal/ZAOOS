# Research Grounding - real fetches, or it is UNVERIFIED

Research subagents fabricate citations (2026-08-03: four scouts invented arxiv IDs, thread numbers and percentages). Incident and WebFetch audit (doc 2250): `research/dev-workflows/2649-rules-history/archive/research-grounding.md`.

**A cited source is not grounding unless it was fetched and read this run.** Every specific claim, number, quote, URL, or repo traces to a fetched page, or is marked UNVERIFIED.

**WebFetch returns a small model's summary, not the page.** Never quote from WebFetch. Load-bearing claims come from RAW text: `curl` + HTML strip, an official JSON API, or the keyless fetchers (`zao-fetch-reddit.sh`, `zao-fetch-farcaster.sh`, FxTwitter). State the METHOD in Sources, not just FULL/PARTIAL/FAILED. A subagent's prose is also a summary: have it write raw text to a file and quote from disk. WebFetch is fine for triage.

**Every research/audit subagent prompt includes, verbatim-equivalent:**
> REAL FETCHES ONLY. Actually fetch pages with WebFetch/WebSearch and report per-URL FULL/PARTIAL/FAILED. Do NOT synthesize from memory and invent citations - prior scouts fabricated arxiv IDs / thread numbers / percentages and were caught. Every specific claim, number, tool name, or repo MUST come from a page you fetched THIS run. If you cannot fetch something, say FAILED and move on - never fill the gap with a plausible invention. A short grounded answer beats a long fabricated one.

**Before trusting any research subagent:**
1. Check effort against claims: 20 cited sources from ~1 tool call (`tool_uses` in the usage footer) = UNVERIFIED specifics.
2. Spot-check one load-bearing citation; if it fails, discard that scout's specifics and keep only the directional pattern, saying so.
3. Convergence is not proof - verify anyway.
4. In the doc, keep only what you can stand behind; drop fabricated citations explicitly; mark retained items FULL/PARTIAL.

For a small, high-stakes question, fetch inline rather than dispatch a scout. Fan-out stays right for broad sweeps; just never trust its specifics unchecked.
