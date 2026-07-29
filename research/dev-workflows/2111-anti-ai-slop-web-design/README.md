---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-07-28
related-docs: 2107, 2103
original-query: "/zao-research the r/VibeCodeDevs thread - 'I built an MCP to stop AI websites from all looking the same' (5 anti-sameness design fixes + PingFusi)."
tier: STANDARD
---

# 2111 - Anti-AI-slop web design - 5 fixes for ZAO's AI-built surfaces

> **Goal:** Capture the 5 concrete moves that make AI-built websites stop looking generic, plus the sharp critique that these belong in CLAUDE.md not an MCP - and apply both to ZAO's AI-built web surfaces.

## Why this matters to ZAO

Every ZAO web surface is AI-built - thezao.com (redesign), the zaodevz onboarding site, WaveWarZ, ZABAL Games, Sparkz UIs, the cowork board. They all risk the "AI slop / every AI site looks the same" problem (centered layouts, Inter font, three even cards, one purple gradient - the exact tells the `artifact-design` skill also warns about). This thread is a tight, actionable checklist to avoid it.

## The 5 fixes (r/VibeCodeDevs, verified from the thread)

1. **Change the font.** Typography carries the site's personality; don't let AI default to Inter every time. Name a specific pairing + how to use it: e.g. *"Instrument Serif for display headings, Geist for body."*
2. **Limit the color palette.** More colors rarely help. Start with white, black, and ONE accent. (For ZAO that's already the system: navy `#0a1628` / gold `#f5a623`, or the brand palette `#141e27` / `#e0ddaa` - use it, don't let AI invent a rainbow.)
3. **Break the default grid.** AI loves three evenly-sized cards in a row. Ask for asymmetry: one large card beside two small, overlapping sections, offset text, varied card sizes, content that breaks the container.
4. **Add micro-animations.** Small interactions (subtle text reveals, hover states, scroll transitions) make a site feel *designed* more than adding visual elements does.
5. **Give it references.** "Make it look good" means nothing. Show 2-3 real sites and say exactly what you like about each.

## The sharp critique (the actual lesson)

The tool the author built is an MCP (`PingFusi`). The best comment nails it: **"This is all just context you'd drop into a CLAUDE.md file. MCP is for giving a model access to things it doesn't have - APIs, files, live data. Design taste isn't a tool call, it's just better instructions."**

That is exactly right and it's the ZAO takeaway: **these 5 fixes belong in ZAO's CLAUDE.md / design conventions / the `design` skill, not a client-server tool.** ZAO already has the pieces - the brand palette, the mobile-first + dark-theme rules in `.claude/rules/components.md`, the `artifact-design`/`design`/`design-review` skills. This thread is a prompt to make the anti-sameness checklist explicit in those instructions so every AI-built ZAO surface gets it by default.

## How ZAO applies it

- **Add an "anti-AI-slop" block to the ZAO web design conventions** (`.claude/rules/components.md` or the `design` skill): named font pairing, the locked 2-3 color palette, "break the 3-card grid," a micro-animation default, and a standing set of ZAO reference sites. So the checklist is instructions, not a tool.
- **Give the AI ZAO reference sites** when building a surface - the strongest ones we already have (or admire) - per fix #5.
- **Pairs with doc 2107** (the implementation-brief pattern): the brief's "art direction" section is exactly where these 5 fixes live for a given build.

Note: `PingFusi` (github.com/alex-durango/pingfusi) is the OSS tool; per the critique, ZAO does not need the tool - it needs the checklist in its instructions.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Add an "anti-AI-slop" design block (font pairing + locked palette + break-the-grid + micro-anim + reference sites) to `.claude/rules/components.md` or the `design` skill | @Zaal | PR | 2026-08-08 |
| Pick 2-3 canonical ZAO reference sites to hand the AI on every new surface (fix #5) | @Zaal | Decision | 2026-08-08 |

## Also See

- [Doc 2107](../2107-implementation-brief-prompt-pattern/) - the implementation-brief pattern (art-direction section is where these live)
- [Doc 2103](../../agents/2103-grounding-beats-guessing/) - screenshot-iteration (how you verify the design actually landed)

## Sources

- [r/VibeCodeDevs - "I built an MCP to stop AI websites from all looking the same" (Unique-Watercress225)](https://www.reddit.com/comments/1v98wco/) [FULL - the 5 fixes + the CLAUDE.md-not-MCP critique verbatim from the thread]
- [github.com/alex-durango/pingfusi](https://github.com/alex-durango/pingfusi) [PARTIAL - repo named in-thread, not deep-read]
