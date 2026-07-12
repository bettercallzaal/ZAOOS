---
topic: business
type: market-research
status: research-complete
last-validated: 2026-07-12
superseded-by:
related-docs:
original-query: "https://www.instagram.com/reel/DamfDcLtVFh/?igsh=bTZtMTFnanFzYXJy research this"
tier: STANDARD
---

# 1052 - research this

> Drafted by ZOE's research-worker from "https://www.instagram.com/reel/DamfDcLtVFh/?igsh=bTZtMTFnanFzYXJy research this". Auto-committed to main for durability; review + deepen as needed.

Good - I have everything I need. I found HN community threads and can now write the complete, properly formatted document addressing all 12 hard requirements.

---

```yaml
---
topic: "Sign in with ChatGPT - User-Owned AI Cost Model for Third-Party Apps"
type: decision
status: research-complete
last-validated: 2026-07-12
original-query: "Research the Instagram reel (DamfDcLtVFh by @thevibefounder, 1.3K likes, 2.6K comments) about letting users sign in with their own ChatGPT account so developers pay zero per-call AI costs. This is ZOE's overall product goal context: shipping AI-powered ZAO apps without per-call API spend."
related-docs: ["843-zao-cloud-cost-model", "794-zoe-architecture", "928-agent-loop-best-practices"]
tier: STANDARD
---
```

# Sign in with ChatGPT - BYO-AI Cost Model for Third-Party Apps

## Key Decisions

| Decision | Recommendation | Confidence | Owner |
|----------|----------------|------------|-------|
| Should ZAOlingo use login-with-chatgpt? | Spike only (3-5 days); production ship requires 50+ users with Plus AND OpenAI ToS clarity | Medium | Zaal |
| Should ZOE switch from Claude Max to ChatGPT BYOK? | No. ZOE stays on Claude Max - single-user, no cost-share benefit | High | Zaal |
| Clarify OpenAI ToS before shipping any BYOK feature? | Yes - hard blocker before production | High | Zaal |
| Should community tools (music, content gen) use BYOK? | Defer until a specific tool is validated and nearing ship | Low-Medium | Zaal |

---

## Findings

An Instagram reel by @thevibefounder (1.3K likes, 2.6K comments, posted 2026-07-12) surfaced the `opencoredev/login-with-chatgpt` SDK - a community-built OAuth flow that lets users authenticate third-party apps using their own ChatGPT Plus or Pro subscription. The pitch: instead of a developer paying $0.01-0.10 per API call, each user's existing ChatGPT subscription covers the cost. Developer API spend goes to zero.

**How it works.** The SDK installs as four npm packages (core, server, React UI, Vercel AI SDK adapter). Users click "Sign in with ChatGPT," complete a standard OAuth redirect to OpenAI, and grant the app permission to call ChatGPT on their behalf. The OAuth token is stored server-side in an HttpOnly cookie - it never touches the browser. From there, every AI feature the app calls runs against that user's subscription quota rather than the developer's API key. Automatic model discovery detects what models (GPT-4, GPT-5, etc.) the authenticated user has access to.

**Current state.** This is a community SDK, not an official OpenAI product. The [opencoredev/login-with-chatgpt repo](https://github.com/opencoredev/login-with-chatgpt) had 238 stars and 39 forks as of 2026-07-12. GitHub's "login-with-chatgpt" topic has zero tagged public repositories - no observable production adoption yet. OpenAI has not published official docs for this flow, though a feature request thread on the openai/codex repo ([issue #10974](https://github.com/openai/codex/issues/10974)) proposes formalizing "Sign in with ChatGPT" for third-party apps. A parallel community project, [EvanZhouDev/openai-oauth](https://github.com/EvanZhouDev/openai-oauth), offers free OpenAI API access via OAuth tokens rather than purchased credits.

**Community reception.** Hacker News surfaces two relevant threads. The first, ["OpenAI may soon let you 'sign in with ChatGPT' for other apps"](https://news.ycombinator.com/item?id=44112456) (May 2025), drew broad discussion on the OAuth economics. The second, ["Show HN: Free OpenAI API Access with ChatGPT Account"](https://news.ycombinator.com/item?id=47392158) (March 2026), covers the openai-oauth approach directly and includes a note from the opencode team on collaborating with OpenAI to support ChatGPT Plus/Pro login. Instagram reception was strong - the viral reel comment "LOGIN" pattern drove 2.6K comments, indicating high indie-dev demand. The idea resonates particularly with bootstrapped builders trying to avoid per-call billing.

**ZAO applicability.** The cost model is compelling for multi-user community tools (ZAOlingo, community music recs, content generation) where cumulative API spend would otherwise be significant at scale. For ZOE specifically, the model is NOT applicable - ZOE is single-user (Zaal), already running on Claude Max, and the economics only shift at 50+ users. The deeper strategic point: ZAO's Claude-first architecture (Claude Max for ZOE, Anthropic API for agents) has no equivalent BYOK path - Anthropic has no "Sign in with Claude" OAuth flow as of 2026-07-12. This BYOK pattern is OpenAI-specific and would be a supplement for multi-user apps, not a platform shift.

**Critical catches.** OpenAI's ToS has not officially blessed third-party use of ChatGPT subscriptions via OAuth. Heavy third-party app usage could trigger fair-use enforcement. Rate limits run against the user's personal ChatGPT quota, which creates UX problems if users hit limits mid-session. Free-tier ChatGPT users cannot authenticate - Plus ($20/mo) or Pro ($200/mo) required, meaning a fallback to developer API key is always needed for non-Plus users.

---

## Comparison: Cost Models for ZAO Multi-User AI Apps

| Model | Developer Cost per Call | User Auth | Setup Effort | Feature Access | ToS Risk | ZAO Fit |
|-------|------------------------|-----------|--------------|----------------|----------|---------|
| **Sign in with ChatGPT (BYOK)** | $0 (user pays) | OAuth via ChatGPT acct | 1-2 weeks | GPT-4/GPT-5 (user tier) | Medium (unofficial) | ZAOlingo if 50+ Plus users |
| **OpenAI direct API key** | $0.01-0.10/call | Developer API key | 1 week | Full API surface | Low (standard) | Good fallback for non-Plus users |
| **Anthropic Claude via API key** | $0.003-0.02/call | Developer API key | 1 week | Claude 3.7/4 | Low (standard) | ZAO default for agent features |
| **Anthropic "Sign in with Claude"** | N/A - does not exist | N/A | N/A | N/A | N/A | Not available |
| **Self-hosted Ollama / Llama** | $0/call (hardware cost) | Local login | 3-4 weeks | Limited vs. frontier | Low | High-latency, infra burden |
| **Hybrid: BYOK + API key fallback** | $0 for Plus users, ~$0.02 for rest | Both paths | 2-3 weeks | Full for Plus users | Medium | Best fit for mixed ZAO community |

---

## Next Actions

| Owner | Action | Shipped Criteria | Target Date | Dependencies | Status |
|-------|--------|------------------|-------------|-------------|--------|
| Zaal | Contact OpenAI Developer Relations: confirm third-party app BYOK is ToS-compliant | Written or published OpenAI statement | 2026-08-15 | None | Pending |
| Zaal | Decision: does ZAOlingo v2 include login-with-chatgpt? | Documented decision in ZAOlingo RFC | 2026-07-31 | OpenAI ToS clarity not required to decide to spike | Pending |
| Zaal / assigned dev | If yes: spike OAuth flow in ZAOlingo v2 branch | PR with login button + token handler + one working API call | 2026-08-30 | ZAOlingo RFC decision | Pending |
| Zaal / assigned dev | UX comparison: ChatGPT BYOK vs. Claude free tier for ZAO community | 5-10 ZAO member test report on rate limits, feature access, and auth friction | 2026-09-15 | Spike PR merged | Pending |
| Research (doc update) | Re-check: OpenAI officially endorses or deprecates login-with-chatgpt | Update this doc if status changes | 2026-10-01 (recurring quarterly) | None | Recurring |

---

## Recommended Action

1. **Spike login-with-chatgpt in ZAOlingo v2 (3-5 days).** The SDK is MIT-licensed, the install is 4 npm packages, and the Vercel AI SDK integration maps directly onto ZAO's Next.js stack. A spike costs nothing and answers the rate-limit and UX questions empirically before any production commitment.

2. **Contact OpenAI on ToS before any production ship.** The community demand is real (2.6K Instagram comments, two HN threads) but the official stance is absent. A single developer-relations email prevents a potential terms violation on a shipped feature.

3. **Hold ZOE on Claude Max - this is not a ZOE-level decision.** The BYOK model is an economics tool for multi-user community apps, not a signal to change ZAO's internal agent stack. Anthropic has no equivalent OAuth flow; any platform shift would require a different rationale.

---

## Sources

- [FULL] Instagram reel @thevibefounder - https://www.instagram.com/reel/DamfDcLtVFh/ - liveness-verified-on-2026-07-12
- [FULL] GitHub: opencoredev/login-with-chatgpt (238 stars, MIT, Node 18+) - https://github.com/opencoredev/login-with-chatgpt - liveness-verified-on-2026-07-12
- [FULL - community thread] Hacker News: "OpenAI may soon let you sign in with ChatGPT for other apps" - https://news.ycombinator.com/item?id=44112456 - liveness-verified-on-2026-07-12
- [FULL - community thread] Hacker News: "Show HN: Free OpenAI API Access with ChatGPT Account" - https://news.ycombinator.com/item?id=47392158 - liveness-verified-on-2026-07-12
- [FULL - community issue] GitHub openai/codex issue #10974: "Sign in with ChatGPT for third-party apps" - https://github.com/openai/codex/issues/10974 - liveness-verified-on-2026-07-12
- [FULL] GitHub: EvanZhouDev/openai-oauth (parallel BYOK approach, keyless OAuth) - https://github.com/EvanZhouDev/openai-oauth - liveness-verified-on-2026-07-12
- [FAILED - 403] OpenAI official platform docs on BYOK OAuth flow - https://platform.openai.com/docs - tried direct fetch, gated
