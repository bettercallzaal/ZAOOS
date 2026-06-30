---
topic: infrastructure
type: market-research
status: research-complete
last-validated: 2026-06-29
related-docs: 836
original-query: "https://www.useboardwalk.com/docs/for-llms can we zao research this"
tier: STANDARD
---

# 917 — Boardwalk + the docs-for-LLMs pattern (llms.txt) for ZAO

> **Goal:** Evaluate Boardwalk (useboardwalk.com), especially its "for LLMs" docs export, as a pattern ZAO should adopt for its own docs/sites.

## Findings

**What Boardwalk is.** A token-launch platform (launch infra, locked liquidity, BMX-staking governance, community discovery) at useboardwalk.com, multichain. Funding/backing claims were NOT verified - a Crunchbase "boardwalktech" result is a different, same-named enterprise-blockchain company, do not conflate. Treat any "Coinbase Ventures backed" claim as unconfirmed until checked against a primary source.

**The "for LLMs" pattern (the actual reason to look).** Boardwalk exposes its docs to AI three ways:
1. **Markdown export** - the entire docs site as one copy-paste markdown file, regenerated every deploy, so a user can paste full product context into Claude/ChatGPT/Gemini before asking a question. (useboardwalk.com/docs/for-llms)
2. **Agent SDK** - an npm package so an LLM can prepare on-chain actions (launch, contribute, stake, vote) as UNSIGNED transactions; the user signs in their own wallet. Non-custodial by design - the agent never holds keys.
3. **llms.txt** - a static index file per the llmstxt.org convention, so LLM tools discover + index docs with no custom crawler.

Why it matters: instead of "how do I do X," a user asks their LLM with full docs in context, and the LLM walks them through complex flows. Zero-infra discoverability (llms.txt) + optional agent execution with human approval gates.

## Relevance to ZAO - recommendation

Adopt the docs-for-LLMs pattern, in priority order:
1. **Now (cheap):** publish `thezao.com/llms.txt` indexing public surfaces (ZAONEXUS, ZAO OS, research docs, Fractal rules). Static file, no infra. Makes ZAO knowledge discoverable by any LLM tool.
2. **Short-term:** a single `llms-context.md` export of ZAONEXUS (the ~141-link canonical set, per doc on NEXUS sources), regenerated on each NEXUS update.
3. **Medium-term:** a research-doc -> markdown export over the ~820 active docs, indexed by date/status/tag, so "what have we learned about X" answers from full institutional memory.
4. **Long-term:** a ZAO agent-SDK pattern (Boardwalk-style, human-approval gated) so an LLM can draft NEXUS edits or queue ZOE tasks.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Audit thezao.com / bettercallzaal.com / ZAONEXUS for llms.txt readiness | Zaal | PR | Next sprint |
| Ship thezao.com/llms.txt (static index) | Zaal | PR | After approval |
| Verify Boardwalk funding/backing before citing it anywhere | Zaal | Check | Before any public use |

## Sources

- [Boardwalk Homepage](https://www.useboardwalk.com/) - FULL
- [Boardwalk For LLMs](https://www.useboardwalk.com/docs/for-llms) - FULL
- [Boardwalk Docs](https://www.useboardwalk.com/docs) - PARTIAL
- [llms.txt convention](https://llmstxt.org) - reference
- Crunchbase "boardwalktech" - REJECTED (same-name different company, not the launchpad)
