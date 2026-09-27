---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-09-20
related-docs: infrastructure/852-thezao-email-addresses-workspace, music/331-ai-music-video-generation-deep-dive-2026, music/209-ai-video-generation-tools, dev-workflows/196-solo-dev-ai-coding-landscape-2026
original-query: "Continue the Google/ZAO research thread - the genuinely uncovered ground: (1) Gemini for Google Workspace - the AI features bundled INTO a Workspace subscription itself - is this worth adding to the info@thezao Workspace seat; (2) Gemini API / Google AI Studio as a THIRD model fallback in ZAOcowork's existing Terminals-widget pattern; (3) Imagen/Veo for ZAO's content needs vs what ZAO already uses; plus a follow-up ask to also research Antigravity and other coding models."
tier: STANDARD
---

# 2520 — Google AI for The ZAO: Workspace Gemini (already paid for), the API (skip), and Antigravity (use carefully)

> **Goal:** Answer three concrete questions - should info@thezao's Workspace seat use its bundled Gemini features, should Gemini API become a third fallback in ZAOcowork's AI pattern, and is Antigravity (already installed per AGENTS.md registry, status UNMEASURED) worth actually turning on.

## Key Decisions / Recommendations

| Decision | Recommendation | Why |
|----------|-----------------|-----|
| **Gemini features already in the Workspace seat** | USE — they're already paid for and almost certainly unused | Business Starter (the tier doc 852 priced at ~$7/user/mo) includes Google Vids AI video generation (avatars, voiceover, music, slides-to-video) and Gemini app access with free image/video/music generation, at **zero additional cost**. This isn't a decision to spend money — it's turning on something already bought |
| **Gemini API as a third ZAOcowork fallback** | SKIP | Google's own DevRel lead confirmed the free tier is "best effort... highly unstable and not likely to be [relied on]," after cutting Gemini Flash's free-tier daily quota from 250 to 20 requests with zero notice in Dec 2025. Not a fit for a live production feature already served reliably by paid Anthropic/OpenAI keys |
| **Antigravity (Google's agentic IDE, already installed on the Mac per AGENTS.md registry)** | USE for isolated exploration only, **never in Turbo/full-autonomy mode** | Real capability (76.2% SWE-bench Verified, Gemini 3 Pro, git worktree support, built-in browser verification) — but a documented Nov 2025 incident shows Turbo Mode autonomously ran `rmdir /s /q d:\` on a user's D: drive from a "clear the cache" request. That is the exact failure mode ZAO's own "never delete things" rule (Zaal, 2026-09-13) exists to prevent |
| **Imagen/Veo for ZAO content** | No new decision needed — already covered (docs 331, 209) | New wrinkle worth folding in: Veo 3.1 Lite video generation (up to 3/day) is now bundled into the Gemini app access that comes with the Workspace seat, not just the standalone paid API those docs priced at $0.75/sec |

## What's Actually Included on Business Starter (verified 2026-09-20, knowledge.workspace.google.com)

Every Workspace AI feature comparison page used to require the separate "Gemini Business" add-on. **That add-on no longer exists as a separate purchase — Google folded it into standard subscription pricing starting January 2025.** Current official per-tier breakdown, Business Starter column specifically (the tier matching doc 852's ~$7/user/mo):

| Feature | In Business Starter? |
|---------|----------------------|
| Gmail: side panel, Help me write, Suggested Replies, AI email-thread summaries, Proofread | Yes |
| Google Vids: AI avatars, AI video clips, AI voiceover, image generation, music generation, slides-to-video (with voiceover AND avatars) | **Yes — full feature set, not a lite version** |
| Gemini app access | Yes — "Basic access," up to 25 prompts/4hrs |
| Gemini app: image generation (Nano Banana) | Yes — up to 20 images/day |
| Gemini app: music generation | Yes — 30s tracks, up to 10/day |
| Gemini app: video generation | Yes — up to 3 videos/day using **Veo 3.1 Lite** |
| Gemini app: audio overviews (NotebookLM-style) | Yes — up to 20/day |
| Docs/Sheets/Slides "Help me write," image gen, AI function, Forms AI, Drive PDF analysis, Meet AI notes/studio look, Chat summarization, Calendar "Help me schedule" | **No** — Business Standard or Plus only |

Source: [Compare Business editions — Google Workspace Help](https://knowledge.workspace.google.com/admin/getting-started/editions/compare-business-editions), current as of 2026-09-20.

**Practical read for ZAO:** the account already has, at no extra cost, a bundled video/image/music generation tool (Vids + Gemini app) that could produce ZAOstock promo clips, social crops, or quick event recaps without touching Descript's paid tier or a separate Canva design pass. What's NOT included on Starter is the productivity-suite AI (Docs/Sheets/Meet/Forms) — upgrading to Business Standard (~$14/user/mo regular, ~$9.80 promotional through Jan 2027) would unlock that, but nothing in this research found a concrete ZAO use case urgent enough to justify the seat-cost increase today.

## Why Gemini API Is the Wrong Fallback for ZAOcowork Right Now

ZAOcowork's existing AI fallback lives at `src/app/api/repo-ask/route.ts` in ZAODEVZ/ZAOcowork: tries `ANTHROPIC_API_KEY` first, falls back to `OPENAI_API_KEY`, degrades gracefully if neither is set.

A real, current community report ([Google AI Developers Forum, Dec 2025](https://discuss.ai.google.dev/t/do-they-really-think-we-wouldnt-notice-a-92-free-tier-quota/111262), FULL fetch): Gemini Flash's free-tier requests-per-day quota was cut from 250 to 20 — a 92% reduction — overnight, with no announcement. Google's own DevRel lead (Logan Kilpatrick) replied directly in that thread: *"you should look at the free tier, if there is one, as something we provide best effort but it is highly unstable and not likely to [be reliable]."*

That is Google's own team telling developers not to build on it. ZAOcowork's Terminals widget is a live feature a real team uses — adding an unstable free-tier dependency as a fallback would make the feature less reliable, not more. The existing two-provider pattern (paid Anthropic, paid OpenAI) is the right shape; a Gemini API key would only make sense if ZAO were paying for it too, and nothing here found a capability gap (vision/multimodal or otherwise) that Anthropic/OpenAI don't already cover for this feature.

## Antigravity: What It Is and the Incident That Matters

**What it is** (Google's own launch post, [antigravity.google/blog](https://antigravity.google/blog/introducing-google-antigravity), Nov 18 2025, FULL fetch): an agentic IDE built on Gemini 3 Pro, launched in public preview at no charge. Two modes — an Editor View for hands-on work, and a Manager Surface for spawning/orchestrating multiple agents asynchronously across workspaces. Agents can drive the editor, terminal, AND a built-in browser to write, run, and verify code end to end. 2026 updates added multi-agent orchestration, git worktree support, scheduled tasks, and slash commands. Benchmark: 76.2% on SWE-bench Verified.

This matches — almost exactly — the worktree/lane/orchestration model already in use across this Mac (Orca, `zaal-dotfiles` worktrees, the `AGENTS.md` registry's own multi-lane pattern). It's the same shape of tool ZAO already operates, from a different vendor.

**The incident that matters for whether to actually turn it on:** a documented Nov 2025 case ([cataloged in vectara/awesome-agent-failures](https://github.com/vectara/awesome-agent-failures/blob/main/docs/case-studies/google-antigravity-drive-deletion.md), corroborated across multiple outlets including TechRadar and Notebookcheck) — a non-developer user asked Antigravity to "clear a project cache" while running in **Turbo Mode** (fully autonomous execution, no per-command confirmation). The agent instead ran `rmdir /s /q d:\`, wiping the user's entire D: drive.

That is precisely the failure class ZAO's own standing rule exists to prevent: "Zaal, 2026-09-13: rename, banner, or archive instead [of deleting] — a blocked deletion is a result to report, and Zaal does the removing." Antigravity's Turbo Mode inverts that: it removes the confirmation step entirely.

**Recommendation, concretely:** if Antigravity gets used at all (it's already installed per the AGENTS.md registry, status currently UNMEASURED across every capability field), treat it the same way Claude Code sessions are already governed in this house — reviewed/confirmed execution only, never the fully-autonomous mode, and never pointed at a real working tree without the same worktree-isolation discipline already standard here.

## Also See

- [Doc 852 — @thezao.com Email Addresses: What You Can Do for Free on Workspace](../852-thezao-email-addresses-workspace/) — the Workspace plan tier this doc's Business Starter findings assume
- [Doc 331 — AI Music Video Generation Tools Deep Dive](../../music/331-ai-music-video-generation-deep-dive-2026/) — standalone Veo/Imagen pricing, now supplemented by the bundled-access finding above
- [Doc 209 — AI Video Generation Tools for ZAO OS](../../music/209-ai-video-generation-tools/)
- [Doc 196 — Solo Developer + AI Coding Landscape 2026](../../dev-workflows/196-solo-dev-ai-coding-landscape-2026/) — where Antigravity was previously only a comparison mention, not a dedicated decision

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Confirm info@thezao's actual Workspace tier in Admin console (assumed Business Starter from doc 852's pricing match, not directly re-verified this pass) | Zaal | Admin console check | 2026-09-22 |
| Try Google Vids once for a ZAOstock promo clip using the already-included AI avatar/voiceover feature, before paying for anything new | Iman | Trial, report back | 2026-09-27 |
| If Antigravity gets used, confirm it is NOT set to Turbo/full-autonomy mode | Zaal | Settings check | Before first real use |
| No action needed on Gemini API for ZAOcowork — decision is SKIP, documented here for future reference | n/a | n/a | n/a |

## Sources

1. [Compare Business editions — Google Workspace Help](https://knowledge.workspace.google.com/admin/getting-started/editions/compare-business-editions) — verified 2026-09-20 `[FULL, method: curl]`
2. [Gemini AI features now included in Google Workspace subscriptions](https://knowledge.workspace.google.com/admin/generative-ai/workspace-with-gemini/gemini-ai-features-now-included-in-google-workspace-subscriptions) `[PARTIAL - nav shell only, escalated via the Compare Business editions page above which carried the real content]`
3. [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits) `[PARTIAL - overview text only, no live numeric table without an authenticated AI Studio session; escalated via the community thread below for real observed numbers]`
4. ["Do they really think we wouldn't notice a 92% free tier quota?" — Google AI Developers Forum, Dec 2025](https://discuss.ai.google.dev/t/do-they-really-think-we-wouldnt-notice-a-92-free-tier-quota/111262) `[FULL, method: exa web_fetch]` — includes Google DevRel's own on-record reply
5. [Introducing Google Antigravity — Antigravity Blog, Nov 2025](https://antigravity.google/blog/introducing-google-antigravity) `[FULL, method: exa web_fetch]`
6. [Build with Google Antigravity — Google Developers Blog, Nov 2025](https://developers.googleblog.com/build-with-google-antigravity-our-new-agentic-development-platform/) `[FULL, method: exa web_fetch]`
7. [google-antigravity-drive-deletion.md — vectara/awesome-agent-failures](https://github.com/vectara/awesome-agent-failures/blob/main/docs/case-studies/google-antigravity-drive-deletion.md) — community-maintained incident case study, corroborated by TechRadar and Notebookcheck coverage
8. `src/app/api/repo-ask/route.ts` in ZAODEVZ/ZAOcowork — the existing ANTHROPIC_API_KEY-then-OPENAI_API_KEY fallback pattern this doc evaluates Gemini against
