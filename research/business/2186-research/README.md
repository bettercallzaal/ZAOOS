---
topic: business
type: market-research
status: research-complete
last-validated: 2026-08-03
superseded-by:
related-docs:
original-query: "https://x.com/bateshkaaa/status/2079218516150862086?s=46 research"
tier: STANDARD
---

# 2186 - research

> Drafted by ZOE's research-worker from "https://x.com/bateshkaaa/status/2079218516150862086?s=46 research". Auto-committed to main for durability; review + deepen as needed.

Now I have all the material I need. Writing the complete structured doc:

---

## Findings

```markdown
---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-08-03
related-docs: 2111, 688, 549
original-query: "Research https://x.com/bateshkaaa/status/2079218516150862086 - Romario's X Article on building agency-quality $10K marketing websites with Claude Code in one afternoon using a 5-step framework."
tier: STANDARD
---

# 2186 - Build Agency-Quality $10K Websites with Claude Code (Romario / @bateshkaaa)

## Key Decisions

| Decision | Recommendation | Confidence | Notes |
|----------|---------------|-----------|-------|
| Use this framework for new ZAO web surfaces | Yes - adopt for thezao.com redesign and WaveWarZ surface | High | The 5-step approach is a tighter, more opinionated version of ZAO's existing design skill conventions |
| Astro + Tailwind + Cloudflare Pages as the stack | Yes - aligns with ZAO's zero-cost shipping target | High | Astro is free/OSS; Cloudflare Pages free tier covers all ZAO property volumes |
| Screenshot references (9 total, 3 sites) over open-ended "make it look good" | Yes - formalize this as a required input in the ZAO design brief | High | Directly solves the AI-slop sameness problem doc 2111 cataloged |
| Add the "ban list" pattern to ZAO's CLAUDE.md / design skill | Yes | High | The ban list (no purple gradients, no centered-everything, no Inter default) makes the anti-sameness rules explicit per-build, not just in a global rule |

## Why This Matters to ZAO

Agencies charge $8,000-$12,000 for a marketing site and take 3 weeks. Romario's article demonstrates the same quality output in one afternoon with Claude Code. Every ZAO web surface - thezao.com (redesign pending), WaveWarZ, ZABAL Games, Sparkz UIs, BCZ - is AI-built and faces the design-sameness risk documented in doc 2111. This framework is the tightest published recipe for avoiding it. The approach pairs directly with ZAO's existing design skill and the anti-AI-slop block in `.claude/rules/components.md`.

## Framework Steps: Findings Table

| Step | Time | Core Action | Why It Works | ZAO Equivalent |
|------|------|-------------|-------------|----------------|
| 1. Load Design Brain | 15 min | Install Claude Code; add `frontend-design` skill + UI/UX ruleset to `.claude/skills/` | Overrides Claude's default aesthetics (Inter, purple gradient, 3 cards) before the first prompt | ZAO's `design` skill + `components.md` rules - already exists, needs the ban-list block added |
| 2. Steal the Direction | 20 min | Screenshot 3 reference sites (9 screenshots: hero, content section, footer each) from Awwwards or Dribbble | Gives AI concrete visual targets; "match the typography scale, spacing rhythm, and motion" is an actionable constraint | Missing from ZAO's current flow - needs a canonical set of ZAO reference sites per doc 2111 fix #5 |
| 3. The Build Prompt | 11 min | 5-block prompt: audience definition + single CTA + reference files + tech stack (Astro/Tailwind/Cloudflare) + ban list | One structured message produces 70% completion in 4-6 min; no iterative vagueness | ZAO's implementation-brief pattern (doc 2107) is the right container for this |
| 4. Polish Pass | 1-2 hr | Three SEPARATE passes: typography only, spacing only, motion only. Then mobile at 375px | Separation of concerns prevents compounding errors; each pass has a single measurable target | Not formalized in ZAO workflow - treat these as three distinct Claude Code turns |
| 5. Ship It | 15 min | Push to GitHub, connect Cloudflare Pages, deploy | Free hosting, git-backed, zero infrastructure overhead | Already ZAO standard practice for static surfaces |

## Approach Comparison

| Approach | Cost | Wall Time | Quality Ceiling | Best For |
|----------|------|-----------|----------------|----------|
| Traditional agency | $8K-$12K | 3 weeks + revision cycles | High | Enterprises needing full-service |
| Romario's Claude Code framework | ~$0 (Claude Max) | 1 afternoon | High (with references + ban list) | Solo founders, ZAO property launches |
| No-code template (Webflow, Framer) | $100-$500 | 1-2 days | Medium (locked to template grid) | Quick MVPs, non-technical builders |
| Vibe-coding without a framework | ~$0 | 30-60 min | Low (AI-slop risk per doc 2111) | Prototyping only |

## Synthesis

The article is essentially a codified solution to two failure modes ZAO has already documented: (1) AI-built sites look the same (doc 2111) and (2) open-ended "make it look good" prompts produce nothing production-worthy (doc 688). The five steps work because they front-load constraint: design brain (what NOT to do), reference screenshots (what to aim for), a structured 5-block prompt (one coherent instruction set), separated polish passes (one variable at a time), and a fixed deployment target.

The ban list is the most portable ZAO takeaway. Romario's ban list for a generic marketing site maps onto ZAO's existing system: no Inter default (ZAO uses named font pairings), no purple gradients (ZAO is navy/gold), no centered-everything (break the grid per doc 2111 fix #3). Adding this explicitly to the `design` skill or `components.md` means every AI-built ZAO surface gets it without needing to re-specify per build.

The 3-reference-site step is the second-most-portable. ZAO needs a canonical shortlist of ZAO-appropriate reference sites to hand the AI on any new surface. These should live in the design skill, not be chosen from scratch each time.

Caveats: Romario is writing for solo founders building B2B marketing sites. The framework assumes Astro for a static site - it does not directly address the Next.js / Supabase app surfaces that make up most of ZAOOS. The Polish Pass timing (1-2 hours) will vary significantly by surface complexity. The framework's "agency-quality" claim is not independently benchmarked.

## Next Actions

| Action | Owner | Timeline |
|--------|-------|---------|
| Add the ban-list block (no Inter default, no purple gradient, no centered-everything, named font pairing) to `.claude/rules/components.md` or the `design` skill | @Zaal | 2026-08-10 |
| Pick 3 canonical ZAO-appropriate reference sites (Awwwards / Dribbble) and add them to the `design` skill as the standing reference set | @Zaal | 2026-08-10 |
| Add a "Polish Pass" section to the ZAO design brief template (doc 2107): three turns - typography only, spacing only, motion only | @Zaal | 2026-08-15 |
| Pilot the full 5-step framework on the next new ZAO static surface (WaveWarZ or BCZ landing page) | @Zaal | Next new surface |

## Also See

- [Doc 2111](../2111-anti-ai-slop-web-design/) - 5 fixes for AI-built web surfaces (direct complement; the reference-sites and ban-list fixes map 1:1)
- [Doc 2107](../2107-implementation-brief-prompt-pattern/) - implementation brief pattern (Step 3 build prompt belongs in the brief's art-direction section)
- [Doc 688](../688-vibecoding-economics-tooling/) - vibecoding economics and tooling context

## Sources

- [FULL, liveness-verified 2026-08-03] "Build Agency-Quality $10K Websites With Claude Code" (Romario/@bateshkaaa, X Article) retrieved via fxtwitter mirror - https://api.fxtwitter.com/status/2079218516150862086
- [PARTIAL - content retrieved via mirror; direct URL auth-walled, liveness-verified 2026-08-03] X Article original URL - https://x.com/i/article/2079213481534898176
- [FULL, liveness-verified 2026-08-03] Astro Framework - free/OSS, confirmed as the tech stack prescribed in the article - https://astro.build/
```

---

## Recommended action

| Action | Owner | Timeline |
|--------|-------|---------|
| Save this doc at `research/dev-workflows/2186-bateshkaaa-10k-website-claude-code/README.md` | ZOE | Immediate |
| Apply the ban-list block and canonical reference sites to `.claude/rules/components.md` | @Zaal | 2026-08-10 |
| Pilot the 5-step framework on the next new ZAO static surface | @Zaal | Next new surface |

## Sources

- [FULL, liveness-verified 2026-08-03] @bateshkaaa X Article via fxtwitter API - https://api.fxtwitter.com/status/2079218516150862086
- [PARTIAL - auth-walled, content retrieved via fxtwitter mirror, liveness-verified 2026-08-03] X Article original - https://x.com/i/article/2079213481534898176
- [FULL, liveness-verified 2026-08-03] Astro Framework (tech stack prescribed by the article) - https://astro.build/
