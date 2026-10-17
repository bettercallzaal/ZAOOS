---
topic: agents
type: decision
status: research-complete
last-validated: 2026-10-17
superseded-by:
related-docs: "agents/2483-model-dependency-and-local-ai, dev-workflows/2672-model-tier-routing-cost-per-merged-pr, business/2219-surplus-intelligence-substrate-thesis"
original-query: "review https://www.surplusintelligence.ai/docs against our token usage and inference setup (zao-spend, the agent-spend rule, the claude -> codex -> openrouter -> ollama ladder in claude-usage.md)"
tier: STANDARD
---

# 2682 - Surplus Intelligence: the inference marketplace against our ladder

> **Verdict: SKIP.** Do not route Claude Code or ZOE through it, and leave ZOE's
> existing Surplus rung without a key. It cannot cut the Claude bill, because that
> bill is a flat subscription. The discounts it shows on Anthropic models come from
> sellers reselling API keys, which Anthropic's commercial terms forbid without
> Anthropic's approval. Any prompt we send there runs on a stranger's provider account.
> One thing to correct: **this is not a new tool for us.** ZOE's router has had a
> Surplus rung since PR #3228 (2026-08-21). It is built and wired, and was not live
> as of 2026-09-25.

Doc 2219 shares the name but is about the economic idea "surplus intelligence". It
is not about this company. The two are unrelated.

## What it is

From its own agent file (`/llms.txt`, fetched raw 2026-10-17):

> "An LLM inference marketplace. You call one OpenAI-compatible base URL, a router
> picks the cheapest healthy seller for the model you asked for, and settlement
> happens underneath. Buyers pay less than list price; sellers earn on spare capacity."

The sellers are the important part. The seller quickstart says: "Monetize your
unused API capacity." A seller pastes a provider API key and sets a price as a
fraction of list:

> "API Key - paste a dedicated provider API key. It is encrypted at rest with
> AES-256-GCM under AWS KMS envelope encryption" ... "Price - set a cost_multiplier
> (e.g. 0.5 = 50% of the reference price)."

So a buyer's request goes out through someone else's key at Venice, OpenRouter,
Anthropic or another provider. The marketplace takes payment and pays the seller
in USDC on Base.

Ways in (all from the docs pages fetched):
- an OpenAI-compatible API at `https://api.surplusintelligence.ai/v1`;
- an "Anthropic skin" at `/anthropic`, which points Claude Code at it with
  `ANTHROPIC_BASE_URL` plus a buyer key;
- payment by prepaid card credit (Stripe, not withdrawable), deposited USDC
  (withdrawable), or x402 USDC per request on Base. `/x402/info` reports
  `"flat_fee_micro":3000`, which is $0.003 per x402 request.

## Who runs it

Every page footer reads: "© 2026 Surplus Intelligence Corporation © 2026 Surplus
Intelligence LLC ... 1309 Coffeen Avenue STE 19992 · Sheridan, Wyoming 82801". The
terms of service are governed by Wyoming law, with binding arbitration and a
class-action waiver. **No person, founder or team is named on any page fetched.**
The FAQ says only that "The team and other builders answer questions in Discord."
Who operates it is therefore UNVERIFIED beyond those two entity names.

## Pricing

- **Buyer price = seller price.** From the pricing page: "buyer_cost = base_cost;
  seller_earns = base_cost". The FAQ says: "Today, yes - platform fees are zero
  and seller payouts settle at a 1.0x on-chain multiplier with no flat platform fee."
  The marketplace's own revenue model is therefore UNVERIFIED. The extra costs we
  could find are card top-up fees (Stripe, 2.9% + $0.30 per the agent file) and the
  x402 flat fee.
- **Live discounts on the models we use** (`GET https://api.surplusintelligence.ai/api/markets`,
  fetched 2026-10-17 16:52 UTC). The discount is the best seller input price against the
  direct list price:

| Model | List in/out per 1M | Trusted sellers (discount) | Untrusted sellers (discount) | Median live discount | Uptime |
|---|---|---|---|---|---|
| claude-opus-5.5 | $4 / $20 | anthropic 60%, venice 51%, openrouter 50%, bankr 20%, mordiem 10% | inferhub 90.1%, oneapi 90%, nararouter 85% | 50.25% | 88% |
| claude-sonnet-5.5 | $2 / $10 | venice 78.2%, openrouter 50%, mordiem 45%, bankr 20% | inferhub 89.1%, oneapi 89%, nararouter 85% | 28.74% | 98.4% |
| claude-haiku-5.5 | $0.10 / $0.50 | best trusted 60% | best live 90% | 50.5% | 99.4% |
| claude-fable-5.1 | $10 / $50 | best trusted 60.44% | best live 88.95% | 50% | 97.4% |
| deepseek-v4-pro | $0.21 / $0.42 | venice 51%, openrouter 50%, bankr 20% | inferhub 99.3%, dashscope-cn 84.2% | 84.25% | 71.6% |

"Trusted" is the marketplace's own label. Its verification page says: "Trusted status
is curation. It is a judgment about who operates a host." Trusted-only routing is the
default for new accounts.

## Licence and terms

- **No software licence applies.** It is a hosted service; we fetched no repo or
  licence file. The terms of service ("Last Updated: October 14, 2026") cover AS IS
  service, Wyoming law, arbitration, and a liability cap at what you paid in the
  prior 12 months. They also say the service may be modified or discontinued
  "with or without notice".
- **The terms push the provider-terms risk onto sellers.** Section 6 requires a
  seller to warrant it is "authorized to provide and resell access to the API keys"
  and will comply with "any prohibition on reselling, sublicensing, or providing
  third-party access to the underlying Model Provider's API". Section 5.2 tells
  buyers each request remains "subject to the terms of service ... of the
  underlying Model Provider".
- **Anthropic's terms forbid that resale unless Anthropic approves it.** From
  Anthropic's Commercial Terms D.4 (fetched raw 2026-10-17): "Customer may not and
  must not attempt to (a) access the Services to build a competing product or
  service, including to train competing AI models or resell the Services except as
  expressly approved by Anthropic". The Consumer Terms add: "You may not share your
  Account login information, Anthropic API key, or Account credentials with anyone
  else." A seller listing `anthropic` at 60% below list is either approved by
  Anthropic, or paying less than list some other way, or in breach. Which of those
  applies is UNVERIFIED. Nothing on the site we fetched says Anthropic approved it.

## Against our setup

**The Claude rung: it cannot cut cost.** Our Claude spend is a flat plan.
`agent-spend.md` says the `zao-spend` figures are "list-price meter figures, not
invoice amounts". The 7-day meter re-measured on 2026-10-17 (ZAOOS #3987) was
$3,488.74 at list price. If every one of those turns ran through Surplus at the
best trusted Opus discount (60%), the bill would be about $1,395 for the week. That
is a new pay-per-token bill on top of a flat plan, not a saving on it. The Anthropic
skin would also move Claude Code off the plan login by design. Its setup page:
"Claude Code prefers a cached ANTHROPIC_API_KEY (or a claude.ai login) over
ANTHROPIC_AUTH_TOKEN. Blanking it forces your Surplus key to be used." Changing
those variables is a settings change, which is gated.

**The Codex rung: no overlap.** Codex runs on its own plan. Surplus lists GPT
models through the same reseller model, with the same terms question.

**The OpenRouter rung: the only place it could save money, and not enough to
adopt.** For DeepSeek, the trusted sellers on Surplus are Venice and OpenRouter
itself, at 50 to 51% below their list. Two things are unknown:
- What ZOE actually pays per month on OpenRouter. It is not in the files this run
  read, so UNVERIFIED.
- Whether a 50%-off OpenRouter key resold on a marketplace is allowed under
  OpenRouter's terms. We did not fetch those terms, so UNVERIFIED.

DeepSeek v4-pro also showed 71.6% uptime on the market feed. `claude-usage.md`
already routes research and docs work to the cheap tier, so the cost question
there is cents per task. The bigger risk is whose account the private ZOE prompts
pass through.

**The Ollama rung: Surplus cannot beat it.** It is local and free. Doc 2483 found
the VPS has no model pulled, so that is the cheaper gap to close.

**ZOE's existing Surplus rung (`bot/src/zoe/models/router.ts`, origin/main
2026-10-17):**
- **Order:** it is second on the cap-fallback ladder, after OpenRouter (the comment
  at line ~608 reads "Order: OpenRouter, then Surplus Intelligence, then Grok, then GPT").
- **Not live:** it runs only when `SURPLUS_API_KEY` is set. Doc 2483 read the VPS
  bot env names on 2026-09-25 and found "SURPLUS_API_KEY absent". I did not re-read
  that file, because env files are not read by this lane.
- **Base URL now confirmed:** the code calls its base URL "SOURCED FROM THEIR DOCS
  PAGE VIA A SUMMARISING FETCH". The raw `/llms.txt` confirms
  `https://api.surplusintelligence.ai` with `/v1/...` paths, so the default
  `https://api.surplusintelligence.ai/v1` matches.
- **Default model `auto` is unconfirmed:** the rung defaults to model `auto`, which
  is not in the live catalogue (`GET /v1/models` returned 439 ids, none `auto`).
  Keyless probes could not settle it. `auto`, `claude-haiku-5.5` and a made-up
  model id all returned the same `402 x402_payment_required`, so the probe cannot
  tell a valid model from an invalid one. Whether `auto` works is UNVERIFIED.
- **No privacy gate:** the OpenRouter rung refuses free-tier models through
  `assertNotFreeTier`. The Surplus rung has no equivalent, and it sends no
  trusted-only or minimum-discount header. Trusted-only is the account default per
  the docs, and that default is the only guard.

## Risks

1. **Data goes to a third party, and then a fourth.** The marketplace says it
   stores metadata, not prompt bodies, for normal chat: "For synchronous
   text/chat inference, SI stores usage and settlement metadata, not full
   prompt/response content". But "Upstream providers receive the request payload
   and may have their own logging/retention policies", and the upstream account
   belongs to an unknown seller. Async media prompts are stored ("Treat media
   prompts as retained operational data"). Secret masking exists but is "off by
   default".
2. **No proof of model.** The security page lists under "What does not exist
   today": "cryptographic proof that a seller served the exact claimed model" and
   "automatic detection that a seller is proxying to a cheaper hidden model". At a
   90% discount from an untrusted seller, we cannot tell what answered.
3. **Keys.** Buying needs our own `inf_...` key plus funds. Card credit cannot be
   withdrawn, and a balance is lost if the service stops (unused credit "will be
   refunded" only on discontinuation, not on termination for a terms violation).
   We would only sell on Surplus if we pasted a provider key into it. The docs say a
   deleted offer keeps the encrypted key ("The encrypted provider API key remains in
   storage for that offer record"). Never do that.
4. **Lock-in is low.** The API is OpenAI- and Anthropic-compatible, so leaving it
   is a base URL change. The risks are the money held as non-withdrawable credit
   and an operator nobody has named.
5. **Terms exposure.** If a seller is breaching provider terms, the provider can
   revoke that key without notice. The seller vanishes from the market, and the
   router fails over or returns errors. The Opus 5.5 market showed 88% uptime on
   this fetch.

## Next actions

| Action | Owner | Gate |
|---|---|---|
| Keep `SURPLUS_API_KEY` unset on the VPS; do not route Claude Code through `/anthropic` | Zaal (env and settings are his) | settings |
| If the rung is ever enabled: pin `SURPLUS_MODEL` to a real catalogue id, send `X-Min-Discount` and keep trusted-only, and add a privacy check like `assertNotFreeTier` before private prompts reach it | ZOE lane, as a PR | PR-only |
| Pull a local model on the VPS so the Ollama rung is real (doc 2483, still open) | ZOE lane | PR-only plus a VPS step |

## Sources

All fetched 2026-10-17 with `curl -sSL -A "Mozilla/5.0"`, stripped of HTML by a
local script, and quoted from the files on disk. No WebFetch summary was used.

| URL | Result | Method |
|---|---|---|
| https://www.surplusintelligence.ai/docs | FULL (200) | curl + strip |
| https://www.surplusintelligence.ai/llms.txt | FULL (200, 69 KB) | curl, raw markdown |
| https://www.surplusintelligence.ai/docs/getting-started/seller-quickstart | FULL | curl + strip |
| https://www.surplusintelligence.ai/docs/marketplace/security-privacy | FULL | curl + strip |
| https://www.surplusintelligence.ai/docs/marketplace/pricing | FULL | curl + strip |
| https://www.surplusintelligence.ai/docs/marketplace/provider-verification | FULL | curl + strip |
| https://www.surplusintelligence.ai/docs/marketplace/models | FULL | curl + strip |
| https://www.surplusintelligence.ai/docs/guides/claude-code-setup | FULL | curl + strip |
| https://www.surplusintelligence.ai/docs/guides/byok-priority-provider | FULL | curl + strip |
| https://www.surplusintelligence.ai/terms-of-service | FULL | curl + strip |
| https://www.surplusintelligence.ai/faq | PARTIAL: answers are in the page's JSON-LD; the fee answer was read from there | curl + grep of the HTML |
| https://www.surplusintelligence.ai/privacy-policy, /acceptable-use-policy | fetched, not quoted | curl + strip |
| https://api.surplusintelligence.ai/api/markets | FULL (JSON, 413 markets) | curl |
| https://api.surplusintelligence.ai/v1/models | FULL (JSON, 439 models) | curl |
| https://api.surplusintelligence.ai/x402/info | FULL (JSON) | curl |
| https://api.surplusintelligence.ai/v1/chat/completions (keyless probe, max_tokens 1) | 402 for every model id tried, so it cannot tell models apart | curl |
| https://www.anthropic.com/legal/commercial-terms | FULL | curl + strip |
| https://www.anthropic.com/legal/consumer-terms | FULL | curl + strip |
| OpenRouter terms | NOT FETCHED: UNVERIFIED | - |

Our own surfaces: `bot/src/zoe/models/router.ts` on origin/main (read 2026-10-17);
`.claude/rules/claude-usage.md`, `.claude/rules/agent-spend.md`; doc 2483 (VPS env
names, 2026-09-25); ZAOOS #3987 (7-day meter at current rates).
