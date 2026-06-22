---
topic: agents
type: market-research
status: research-complete
last-validated: 2026-06-21
superseded-by:
related-docs: 888
original-query: "https://tryharness.ai/ also /zao-research this"
tier: STANDARD
---

# 889 — tryharness.ai: Screen-Context AI Assistant (Login-Walled, Thin)

> **Goal:** Identify what tryharness.ai is and whether it matters to ZAO. Honest answer: the public surface is login-walled, so this is a best-effort scan with the gaps marked.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|----------|-----|
| 1 | **TREAT as a "screen-context AI assistant" - low ZAO priority** | The only public copy is the tagline "ask anything about what you see" behind a sign-in wall. That + its direct comparables (ScreenHelp, Moss, ailight) place it squarely in the "AI that sees your screen and answers" category. Not a ZAO need right now. |
| 2 | **DO NOT confuse it with Harness.io** | `harness.io` / developer.harness.io is an established DevOps + AI-Test-Automation company. `tryharness.ai` is a separate, small, login-gated product that happens to share the name. Keep them distinct in any ZAO note. |
| 3 | **PARK it - revisit only if ZAO needs in-app guidance UX** | If ZAO ever wants on-screen user guidance (onboarding walkthroughs, "explain this dashboard"), the category (esp. Moss, which guides users step-by-step) is the reference - not tryharness specifically, which is too opaque to evaluate. |

## What It Is (best-effort, gaps marked)

- **tryharness.ai** presents a single landing surface: "**harness** / ask anything about what you see / checking your sign-in session." The product is **gated behind sign-in** - no public docs, pricing, or feature pages resolved (`/docs` returns not-found; the root is a JS app shell that immediately checks for a session).
- **Inferred category (NOT confirmed):** a **screen-context / vision AI assistant** - you share or capture your screen and ask questions about whatever is visible. The "ask anything about what you see" framing is the defining phrase of this product class.
- **Comparables that ARE documented** (used to triangulate the category):
  - **ScreenHelp** (screenhelp.ai) - share your screen, trigger a capture, an AI vision model streams back an answer; responses readable in-browser or streamed to phone via QR.
  - **Moss** (viamoss.ai) - on-screen step-by-step user guidance layer for SaaS; reads the live UI, masks PII/secrets before capture.
  - **ailight** (macOS/Windows) - highlight + transform anything on screen with pre-built AI commands.
- **Namesake collision:** **Harness** (harness.io) is a well-funded DevOps platform whose "AI Test Automation" reads sanitized HTML wireframes + screenshots and runs multi-agent self-healing tests. Different company; do not merge the two in notes.

## Findings

- **Fetch outcome: login-walled.** WebFetch + exa both returned only the sign-in shell; the Playwright escalation was unavailable this session (MCP bridge extension not installed), so the gated app could not be opened. Per the research fetch-quality gate, this source is marked PARTIAL and the product specifics are explicitly INFERRED, not verified.
- **ZAO relevance: low.** ZAO's surfaces are Telegram/Farcaster/web, not a screen-overlay assistant. The only adjacent ZAO use is in-app onboarding guidance (where Moss is the better-documented reference), and that is not a current priority.
- No pricing, no team, no funding, no launch date could be confirmed from public sources.

## Also See

- [Doc 888](../888-proof-531-claude-cron-loop-app/) - the sibling research request from the same message (the high-value one)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| If curious, sign in at tryharness.ai to see the actual product (gated - needs Zaal's account) | @Zaal | Manual check | Optional |
| Only if ZAO pursues in-app guidance UX: evaluate Moss (viamoss.ai) as the documented reference, not tryharness | @Zaal | Research | If/when needed |

## Sources

- [tryharness.ai](https://tryharness.ai/) - `[FAILED - login-walled; only the sign-in shell + tagline "ask anything about what you see" retrieved via WebFetch + exa; Playwright unavailable this session]`
- [tryharness.ai/docs](https://tryharness.ai/docs) - `[FAILED - not found / CRAWL_NOT_FOUND]`
- [ScreenHelp blog (category reference)](https://screenhelp.ai/blog/translate-understand-foreign-language-text-on-screen) - `[FULL]`
- [Moss (viamoss.ai) (category reference)](https://www.viamoss.ai/) - `[FULL]`
- [Harness Developer Hub - AI Test Automation (namesake disambiguation)](https://developer.harness.io/docs/ai-test-automation/get-started/overview/) - `[FULL]`
