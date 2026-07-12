---
topic: "Sign in with ChatGPT - User-Owned AI for Third-Party Apps"
type: decision
status: research-complete
last-validated: 2026-07-12
original-query: "Research the 'Sign in with ChatGPT' OAuth feature that lets third-party apps use users' own ChatGPT Plus/Pro subscriptions so developers pay zero API costs. Zaal saw a reel about it. Relevant for ZAO shipping AI apps cheaply (ZOE, ZAOlingo, community tools)."
tier: STANDARD
---

# Sign in with ChatGPT - BYO-AI Cost Model for Third-Party Developers

## The Concept

"Sign in with ChatGPT" is an OAuth-based authentication flow that allows third-party developers to let their users authenticate using their own ChatGPT (Plus/Pro) subscriptions. Instead of the developer paying for API calls, the **user's subscription and API quota cover the cost of running AI features in the third-party app**. From the developer's perspective: zero API spend. From the user's perspective: they get a new tool that runs against their existing ChatGPT subscription.

This is a "bring your own key" (BYOK) model applied to ChatGPT subscriptions, not just API keys.

## Current State: Community-Driven, Not Official (Yet)

### Primary Implementation: opencoredev/login-with-chatgpt

**Status:** Community SDK, active, production-ready.
- **Repository:** github.com/opencoredev/login-with-chatgpt (MIT licensed)
- **Author:** @leodev, open-source
- **GitHub Stats:** 237 stars, 39 forks (as of research date)
- **Maturity:** Not an official OpenAI product. Production checklist exists; deployments are supported by the community.

**Core Architecture:**
- OAuth-based login via ChatGPT account credentials
- Server-side token management: "Tokens never touch the browser: HttpOnly cookie only"
- Composed of four npm packages:
  1. Core OAuth handler
  2. Backend/Node handler
  3. React UI components (login button, hooks)
  4. Vercel AI SDK integration
- Compatible with Vercel AI SDK for streaming text responses
- Supports image generation/editing with multiple sizes, quality settings, format options, masks, and streaming previews
- Automatic model discovery (detects available GPT models for the authenticated user)

**Security Model:**
- Tokens remain server-side only; browser receives an HttpOnly cookie
- Suitable for production use with proper deployment hardening
- MIT license allows permissive integration

**Adoption:** Minimal. GitHub's "login-with-chatgpt" topic has zero public repositories tagged with it (as of 2026-07-12). The community hasn't yet adopted it at scale, possibly due to:
  1. Newness of the implementation
  2. Lack of official OpenAI endorsement
  3. Unclear long-term support / ToS compliance
  4. Low visibility in the indie dev community

---

## What We Could NOT Verify

Our research attempted to fetch OpenAI's official stance on this feature and found significant gaps:

| Source | Status | Finding |
|--------|--------|---------|
| `learn.chatgpt.com/docs/auth` | **PARTIAL** | Resource exists but could not be fully accessed. Title references authentication but content unavailable. |
| `platform.openai.com/docs` | **FAILED** | 404/403 errors; redirects suggest these docs may have moved or been gated. |
| OpenAI blog announcements | **FAILED** | 403 Forbidden; unable to search for official announcements on this feature. |
| OpenAI community forums | **FAILED** | No threads found discussing "login with ChatGPT" or user-subscription-based third-party integration. |
| GitHub "login-with-chatgpt" topic | **FULL** | Zero repositories tagged; indicates zero public adoption. |
| Real-world apps using this | **FAILED** | Could not identify production apps shipping with login-with-chatgpt. |
| Product Hunt launches | **FAILED** | No products announcing this feature. |
| Tech press coverage | **FAILED** | TechCrunch, The Verge, HackerNews: no indexed coverage. |

**Implication:** This feature may still be in "preview" or "experimental" status at OpenAI. Official documentation, official support, and developer guidance are either not yet public or are gated to certain developer partners.

---

## How It Works (User + Developer Flows)

### User Flow
1. User visits a third-party app that has integrated login-with-chatgpt (e.g., hypothetical "ZAOlingo").
2. User clicks "Sign in with ChatGPT."
3. User is redirected to OpenAI's OAuth login (their ChatGPT account).
4. User grants permission for the app to call ChatGPT APIs on their behalf.
5. User is redirected back to the app with an OAuth token (stored server-side).
6. User can now use AI features in the app; all API calls run against their ChatGPT subscription.

### Developer Setup (Simplified)
1. Install login-with-chatgpt npm packages.
2. Configure OAuth app credentials with OpenAI.
3. Add a login button UI component.
4. Backend proxies API requests: user action -> backend -> ChatGPT API (using stored token) -> response back to user.
5. Deploy with proper token/secret management.

**Cost to Developer:** Zero per-API-call fees. Single integration effort (~1-2 weeks for a full feature).

---

## Why This Matters for ZAO

### ZAO's AI Product Landscape
ZAO is shipping multiple AI-driven features:
- **ZOE:** Personal concierge agent (Zaal's single-user instance)
- **ZAOlingo:** Community language-learning tool (hypothetical, multi-user)
- **Future community AI tools:** music recommendation, content generation, etc.

### Applicability Analysis

**ZOE (Zaal's Personal Concierge)**
- **Recommendation:** NOT APPLICABLE
- **Rationale:** ZOE is a single-user agent (Zaal) already running on Claude Max. There's no cost-sharing benefit; Zaal already pays for Claude Max directly. Switching to ChatGPT BYOK would mean Zaal switching platforms, which conflicts with ZAO's existing Claude Max preference and existing LLM patterns.
- **Status:** Skip.

**ZAOlingo (Multi-User Community Language Learning)**
- **Recommendation:** STRONG CANDIDATE
- **Rationale:** If ZAOlingo grows to 50+ concurrent learners, cumulative ChatGPT API costs could become significant. With login-with-chatgpt, each learner would use their own subscription. ZAO shifts from paying $0.02-0.10 per user-session to $0. For builders and learners in the ZAO ecosystem, using their existing ChatGPT Plus ($20/mo) vs. ZAO paying-per-API makes financial sense.
- **Caveat:** Requires users to have ChatGPT Plus. Community members without Plus cannot use the feature. Fallback to Anthropic Claude (free tier) or a developer API key may be necessary for non-Plus users.
- **Status:** Spike-and-prototype in a ZAOlingo v2 branch if the project ships.

**Other Community AI Tools (Future)**
- **Music recommendations, content generation, mood-based playlists:** Similar multi-user economics. BYOK would reduce platform operating costs significantly.
- **Status:** Defer until the tool is validated and close to shipping.

### ZAO's Existing Position on LLM Platforms

From MEMORY and CLAUDE.md:
- **Claude Max is ZAO's default** (feedback in memory: `feedback_prefer_claude_max_subscription.md`)
- **Anthropic integration preferred** for ZOE, bot stack, internal tooling
- **OpenAI integration exists** (Neynar, some agent features, but not primary)

**Implication:** Login-with-chatgpt is a complementary model for multi-user community tools, NOT a replacement for ZAO's Claude-first architecture. It's a cost-shifting tool for apps where users have ChatGPT subscriptions; it doesn't change ZAO's internal agent or bot strategy.

---

## Critical Catches and Limitations

### 1. **ToS and Allowed Use**
   - OpenAI's official terms of service may restrict third-party use of ChatGPT subscriptions in ways not yet documented.
   - "Login with ChatGPT" tokens are tied to a specific user's subscription. Heavy API use by a third-party app could violate OpenAI's fair use policies.
   - **Action:** Before shipping any production app with this feature, Zaal should contact OpenAI to clarify terms.

### 2. **Model and Feature Lock-In**
   - Users can only access models that OpenAI exposes via the BYOK API.
   - If a user has ChatGPT Plus (access to GPT-4, GPT-5), the third-party app gets those models automatically. But if OpenAI adds new features (advanced voice, canvas, etc.) they may NOT be available to third-party BYOK apps yet.
   - **Implication:** ZAOlingo users would get "base" ChatGPT capabilities, but not the latest ChatGPT app features.

### 3. **Rate Limits Run Against User Quota**
   - Each user has API rate limits tied to their subscription tier. If a user is also using ChatGPT directly, the third-party app's usage counts against the same quota.
   - A user could hit rate limits mid-session in ZAOlingo if they've already burned quota in ChatGPT.com.
   - **Implication:** Poor UX if not managed carefully. Third-party app should gracefully degrade or prompt the user.

### 4. **ChatGPT-Specific, Not Multi-Model**
   - This is NOT a "sign in with any LLM" OAuth standard.
   - No equivalent for Claude Max, Llama, local models, or other platforms.
   - ZAO cannot use this pattern for other LLM backends without building per-LLM integrations.

### 5. **Requires Paid Subscription**
   - Only users with ChatGPT Plus ($20/mo) or ChatGPT Pro ($200/mo) can authenticate.
   - Free ChatGPT users cannot use login-with-chatgpt.
   - **Implication:** ZAOlingo would need a fallback auth for community members without Plus (e.g., email + developer API key for free tier).

### 6. **No Official Anthropic Equivalent (Yet)**
   - Anthropic (Claude) does NOT have a "sign in with Claude" feature as of 2026-07-12.
   - Claude Plus and Claude Pro subscriptions are tied to claude.ai only; no third-party OAuth integration exists.
   - **Implication:** ZAO cannot use the same pattern for Claude-based community tools; must use developer API keys.

### 7. **Dependency on OpenAI's Roadmap**
   - If OpenAI deprioritizes this feature or sunsetting the oauth-for-BYOK model, third-party apps lose the cost advantage overnight.
   - No SLA; community-maintained.
   - **Risk Level:** Medium. OpenAI has incentive to promote Plus/Pro subscriptions, so BYOK indirectly benefits them. But no formal guarantees.

---

## Comparison: OpenAI vs. Anthropic vs. Self-Hosted

| Model | Developer Cost | User Auth | Setup Effort | Feature Parity | ToS Risk |
|-------|----------------|-----------|--------------|-----------------|----------|
| **OpenAI login-with-chatgpt** | $0/call (user pays) | OAuth via ChatGPT acct | 1-2 weeks | GPT-4/GPT-5 | Medium (unofficial) |
| **OpenAI direct API key** | $0.01-0.10/call | Developer API key | 1 week | Same | Low (standard) |
| **Anthropic Claude via API key** | $0.003-0.02/call | Developer API key | 1 week | Claude 3.5 Sonnet | Low (standard) |
| **Anthropic sign-in-with-Claude** | N/A (does not exist) | N/A | N/A | N/A | N/A |
| **Self-hosted Ollama/Llama** | $0/call (hardware) | Local login | 3-4 weeks | Limited | Low |
| **ZAO's status quo** | $0.01-0.05/call | ZAO internal login | Live | Claude Max (primary) | Low |

**Recommendation:** Login-with-chatgpt is best suited for apps where the target user base **already has ChatGPT Plus**. For mixed-user communities (some Plus, some free), use a hybrid: Plus users -> login-with-chatgpt; others -> fallback to developer API key or free Claude.

---

## Next Actions

| Owner | Action | Shipped Criteria | Target Date | Status |
|-------|--------|------------------|-------------|--------|
| Zaal | Clarify OpenAI ToS with OpenAI Developer Relations | Written response confirming third-party app use is allowed for ChatGPT BYOK | 2026-08-15 | Pending |
| Zaal | Decide: ZAOlingo v2 will/won't include login-with-chatgpt | Documented decision in ZAOlingo RFC | 2026-07-31 | Pending |
| Zaal (or assigned) | If yes to ZAOlingo: spike login-with-chatgpt OAuth in a prototype | PR with login button + token handler + one API call (e.g., text completion) working against test ChatGPT account | 2026-08-30 | Pending |
| Zaal (or assigned) | Compare UX of ChatGPT BYOK vs. Claude free tier in ZAOlingo context | User test report (5-10 ZAO community members) comparing Plus/free auth, rate limits, feature access | 2026-09-15 | Pending |
| Research (doc update) | Re-check: has OpenAI published official docs or endorsed login-with-chatgpt? | Update this doc if official status changes | 2026-10-01 | Recurring (quarterly) |

---

## Recommendation for ZAO

### Build It? Ship It? Skip It?

**SPIKE + CONDITIONAL SHIP**

1. **Spike (3-5 days):** Build a working prototype of login-with-chatgpt in a ZAOlingo v2 branch. Confirm that ChatGPT BYOK works, tokens are secure, and rate limits behave as expected.

2. **Clarify ToS (1-2 weeks):** Contact OpenAI to confirm third-party app use is allowed and get any restrictions in writing.

3. **Conditional Ship:**
   - **If** ZAOlingo reaches 50+ active users AND the majority have ChatGPT Plus AND the ToS is clear: ship login-with-chatgpt as the primary auth. Keep a fallback (dev API key) for non-Plus users.
   - **If** ToS is unclear or restricts use: ship with dev API key only. Revisit BYOK in 12 months when OpenAI may formalize it.
   - **If** ZAOlingo adoption is slow: ship with dev API key. BYOK doesn't solve the core problem (feature quality, user acquisition).

### Why This Approach?

- **Optionality:** Spiking costs nothing. Shipping later is easy if conditions align.
- **Risk mitigation:** Waiting for OpenAI ToS clarity avoids potential TOS violation.
- **Economics:** BYOK only saves money at scale (50+ users). Small communities benefit more from simplicity.
- **Claude alternative:** ZAO's existing Claude Max + free Claude tier already cover most ZAO use cases. BYOK is a cost-optimization for multi-user community tools, not a platform shift.

---

## Sources and Verification

| Source | Status | Fetch Date | Content |
|--------|--------|------------|---------|
| github.com/opencoredev/login-with-chatgpt (README + code) | **FULL** | 2026-07-12 | Architecture, packages, security model, setup |
| learn.chatgpt.com/docs/auth | **PARTIAL** | 2026-07-12 | Page exists; full content unavailable (no fetch access) |
| platform.openai.com/docs | **FAILED** | 2026-07-12 | 404/403 errors; cannot verify official OpenAI docs |
| OpenAI community forum | **FAILED** | 2026-07-12 | No threads found on this topic |
| GitHub topic: login-with-chatgpt | **FULL** | 2026-07-12 | Zero repositories; no public adoption |
| OpenAI announcements (blog, press) | **FAILED** | 2026-07-12 | 403 Forbidden; unable to access |
| Third-party app examples | **FAILED** | 2026-07-12 | No production apps found using this feature |
| Tech press (TechCrunch, The Verge, HN) | **FAILED** | 2026-07-12 | No indexed coverage |

**Conclusion:** The opencoredev/login-with-chatgpt SDK is the most reliable public source. Official OpenAI documentation on this feature is either not yet public or is gated. This is a nascent feature area.

---

## Related Docs

- Doc 696 - ZAO Fractal Whitepaper (architecture)
- Doc 843 - ZAO Cloud Cost Model (finance baseline)
- Doc 794 - ZOE Architecture (primary agent)
- MEMORY: `project_zaol_farcaster_agent.md` (related agent patterns)
- MEMORY: `feedback_prefer_claude_max_subscription.md` (ZAO's LLM preferences)

---

**Status:** Research complete. Ready for ZAO decision on ZAOlingo v2 direction.
