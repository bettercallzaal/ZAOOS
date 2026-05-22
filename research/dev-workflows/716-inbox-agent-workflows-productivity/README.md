---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-05-22
superseded-by:
related-docs: 684, 706, 708
original-query: "[/inbox cluster] 4 forwarded items - Mnimiy '9 Claude Cowork prompt-templates', Kirill 'Kimi Agent Swarm 300-agent system', CyrilXBT 'Obsidian as a personal OS', Reddit r/ClaudeCode 'Claude Code + Remotion launch video' - clustered into one synthesis doc"
tier: STANDARD
---

# 716 - Inbox Cluster: AI-Augmented Workflows & Productivity Systems

> **Goal:** Drain four forwarded inbox items into one synthesis doc. All four are variations on a single theme - using AI to multiply one operator's output - and each maps to something ZAO already does. This doc extracts what is worth stealing and flags what could not be retrieved.

## Source items

| # | Item | Source | Retrieval |
|---|------|--------|-----------|
| 1 | "Obsidian as a personal operating system" - CyrilXBT | x.com/cyrilxbt (article) | `[FULL]` via mirror |
| 2 | "Used Claude Code to build a full launch video with Remotion" | r/ClaudeCode | `[FULL]` |
| 3 | "Kimi Agent Swarm - 300-agent parallel system" - Kirill | x.com/kirillk_web3 (article) | `[PARTIAL]` - article paywalled; topic reconstructed from 9 other sources |
| 4 | "9 Claude Cowork prompt-templates" - Mnimiy | x.com/mnilax (article) | `[FAILED]` - article behind X 402 paywall, no mirror exists |

## Key findings - what is worth stealing

| Finding | Worth it for ZAO? | Why |
|---------|-------------------|-----|
| The "capture -> connect -> brief -> generate" knowledge loop (CyrilXBT) | **YES - high value** | ZAO has a 700+ doc research library that is mostly a flat archive. This turns it into a compounding system |
| A weekly Claude "connection session" across recent notes | **YES - cheap, do it** | Finds cross-project synergies ZAO's standups miss |
| The 5-field content brief before writing anything | **YES** | A friction-killer for ZAO 1-pagers, RFCs, specs |
| Remotion + Claude Code for video-as-code | **YES - test it** | ZAO needs festival/launch/music-recap video; ZAO has a video-editor project already |
| Kimi K2.6 300-agent swarm | **MONITOR - do not switch** | ZAO already runs parallel agents (this very research used 8+ at once). Kimi is an alt if cost ever bites |
| Mnimiy's "9 Cowork templates" | **UNKNOWN - re-fetch needed** | Could not be retrieved; flagged as an action |

## The cross-cutting pattern

All four items describe the same shift: **one person plus an Aon-augmented system now does what used to need a team.** A creator with Obsidian + Claude posts daily with no agency. A solo dev ships a launch video in an evening with no editor. A Chinese lab runs 300 agents in parallel where others run one. The common ingredients are always the same three: a **structured input system**, a **repeatable prompt/template layer**, and a **tight iterate-and-rerender loop**.

ZAO already lives this pattern - the Hermes fix-PR pipeline, ZOE, and the parallel research agents are exactly this. So the value in these items is not the idea; it is the specific, copyable mechanics. Items 1 and 2 deliver those. Items 3 and 4 do not (see retrieval status).

## Item 1 - The Obsidian knowledge-OS (CyrilXBT) `[FULL]`

The fully-retrieved, highest-value item. CyrilXBT's actual article (titled "I Post Every Day. No Team. No Agency. Just Obsidian + Claude", 13 Apr 2026) lays out a five-phase system:

1. **Frictionless capture, four categories.** Every thought worth thinking gets saved into one of: Observations (raw, not analysed), Reactions (genuine opinions), Patterns (cross-domain matches), Numbers (real data points). Hard rule: **max 3 tags per note** - if it needs more, the note is not specific enough.
2. **A 20-minute daily input ritual** before opening X - capture price action, AI news that shipped, one paragraph from reading, one personal observation.
3. **A weekly connection session** - feed the week's notes to Claude with a prompt that asks for *non-obvious* cross-domain links ("the same underlying principle appearing in two different domains"). Each connection becomes one bridging sentence - a potential hook.
4. **A 5-field content brief before writing anything:** the one thing (single insight, one sentence), the proof (a real number), the reader transformation, the hook (exact first 2 lines), the closer (exact last line). Hook and closer are written first; the middle fills itself.
5. **Claude writes FROM your brain, not for you** - every generation prompt is loaded with your voice rules, your data, your numbers, and the brief. Claude is an extension of thinking, not a search engine.

Why it "never breaks down": **compounding.** Every published piece, every high-performing post with its metrics, every connection goes back into the vault. The vault gets smarter weekly; the edge is consistency of ritual, not complexity.

The connection-session prompt and the brief prompt are the two copyable artifacts - both are in the source (see Sources).

## Item 2 - Remotion + Claude Code for video-as-code (Reddit) `[FULL]`

A solo dev built a full product launch video in one evening for $0: describe each scene in natural language, Claude Code generates the whole video as **Remotion** React/JSX components, then tweak timing and re-render. "Every animation is just `interpolate(frame, [start, end], [from, to])`."

Five production rules that separate it from a slideshow:
1. Crossfade every cut - overlap and blur-fade, no hard cuts.
2. One easing curve everywhere - `cubic-bezier(0.22, 1, 0.36, 1)`. "Consistency in motion is 80% of looking designed."
3. Film grain + vignette - SVG noise at 2% opacity plus a soft vignette. The cheapest cinematic trick.
4. Layered audio - background music low, targeted SFX only on chapter cuts and the CTA. Overdoing SFX is the number-one amateur tell.
5. Cut ruthlessly - if a scene does not earn its place in 3 seconds, kill it.

Honest note: the Reddit comments were skeptical - some called it a thinly-veiled ad for the poster's own product, and one flagged that the posted video itself cut audio mid-sentence. The *technique* (Remotion + Claude Code) is real and proven; the poster's polish was not. Stack: Remotion, React, TypeScript, Claude Code, Google Fonts, freesound.org for SFX.

## Item 3 - Kimi K2.6 Agent Swarm `[PARTIAL]`

The Kirill X article itself could not be retrieved (X 402 paywall, no mirror). The underlying technology is well documented across other sources, so the topic is covered even though the author's specific take is not.

Kimi K2.6 (Moonshot AI, a Chinese lab, released ~April 2026) is an open-weight model that natively orchestrates **up to 300 parallel sub-agents** in a single run - an orchestrator builds a dependency graph, spawns domain-specialised agents with isolated context windows, and merges their outputs. Its training method (called PARL) is meant to make the parallelism productive rather than cosmetic. Reported benchmarks are strong, and it is API-accessible and cheap.

For ZAO: this validates a pattern ZAO already uses - this research session alone dispatched 8+ parallel agents. The difference is Kimi makes swarm-orchestration native to the model rather than something you choreograph by hand (the Hermes pattern). **Recommendation: monitor, do not switch.** ZAO's agent stack is on Claude and works; Kimi is a fallback worth knowing about if agent cost ever becomes a real constraint. Treat the specific numbers as agent-reconstructed and verify before citing.

## Item 4 - Mnimiy's "9 Claude Cowork prompt-templates" `[FAILED]`

Could not be retrieved. The X article (`x.com/i/article/2056747315226951680`) is behind X's 402 paywall and no mirror or archive copy exists. The only verifiable fact: Mnimiy/Mnilax is the author of a separately-circulated "CLAUDE.md 12-rule" engineering framework, but that is a different artifact and not a substitute. The nine Cowork templates themselves are unknown. This item is carried forward as an action, not summarised - writing it up from the preview would be guessing.

## ZAO applications

| Item | ZAO application | Effort |
|------|-----------------|--------|
| Obsidian knowledge-OS | Run a periodic Claude "connection session" across recent `research/` docs to surface cross-project patterns - ZAO has the corpus, not the loop. The 4-category capture + 3-tag rule could shape future research-doc frontmatter | Low - it is a prompt + a habit |
| 5-field content brief | Adopt as a gate before ZAO 1-pagers, specs, RFCs - state the one thing, the proof, the transformation, the hook, the closer first | Low |
| Remotion + Claude Code | Pilot for a ZAOstock teaser or a Cipher release video; feeds the existing ZAOVideoEditor project. Use the 5 production rules as a checklist | Medium - one evening to try |
| Kimi swarm | No action - ZAO's parallel-agent pattern already covers this. Note Kimi as a cost fallback | None |
| Mnimiy templates | Re-fetch when X access allows, or ask Zaal to copy the article text in directly | Blocked |

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Try a Claude "connection session" across the last ~20 research docs - test whether it surfaces real cross-project links | @Zaal | Experiment | Low priority |
| Pilot Remotion + Claude Code on one short ZAO video (ZAOstock teaser or Cipher) | @Zaal | Experiment | When a video is needed |
| Re-fetch Mnimiy's "9 Cowork templates" article - or have Zaal paste the text so it can be captured | @Zaal | Follow-up | When convenient |
| Adopt the 5-field content brief as a pre-writing gate for ZAO docs | @Zaal | Habit | Optional |
| All 4 inbox items filed (research + processed) - inbox drained to 0 unread | @Claude | Done | This session |

## Sources

Four forwarded inbox items, fetched via the zao-research fetch ladder:

- [CyrilXBT - "I Post Every Day... Obsidian + Claude"](https://x.com/cyrilxbt/status/2056924424838815824) `[FULL]` - retrieved via a bookmark.build mirror after the X article returned 402; full five-phase system and both prompt templates captured
- [r/ClaudeCode - "Used Claude Code to build a full launch video with Remotion"](https://www.reddit.com/r/ClaudeCode/comments/1tjm0z1/used_claude_code_to_build_a_full_launch_video/) `[FULL]` - retrieved via the Reddit .json endpoint; full post + 8 comments
- [Kirill - "Kimi Agent Swarm"](https://x.com/kirillk_web3/status/2057497197638242362) `[PARTIAL]` - the X article is paywalled (402) and unmirrored; the Kimi K2.6 / 300-agent topic was reconstructed from ~9 independent web sources, but the author's specific framing was not retrieved
- [Mnimiy - "9 Claude Cowork prompt-templates"](https://x.com/mnilax/status/2056783455472554008) `[FAILED]` - X article 402 paywalled, no mirror or archive copy found after WebFetch, exa, Playwright, and Wayback attempts

Note: Items 3 and 4 were escalated through the full fetch ladder (WebFetch -> exa web_fetch -> Playwright -> Wayback -> mirror search) before this doc was written. Item 3's reconstructed details are agent-sourced and should be verified before any public use; Item 4 is genuinely unavailable and is carried as an action.
