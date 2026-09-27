---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-09-23
superseded-by:
related-docs: 1365, 2028, 2066
original-query: "[QUICK] Stripe Buy Button embed vs Payment Link - how buy-button-id relates to a Payment Link, customization options, checkout identity guarantee. Context: ZAOstock (infrastructure/payments) is wiring per-tier Stripe Buy Buttons (Fan $1, Supporter $20, Pro $50) into /tickets and /donate."
tier: QUICK
---

# 2542 — Stripe Buy Button embed: how it relates to a Payment Link, and what can and cannot be customized

> **Goal:** Pin down, from Stripe's own docs, exactly what a `<stripe-buy-button>` embed is, how its `buy-button-id` is tied to the Payment Link it was generated from, what can be customized and where, and the shadow-DOM styling limit ZAOstock's own code had already discovered by reading the rendered component.

## Key Decisions

| # | Recommendation |
|---|---|
| 1 | USE the Buy Button's own **"Customize the buy button"** step in the dashboard (colors, shape, font, simple-button-vs-card-widget) to fix the white-card mismatch reported on ZAOstock's `/tickets` and `/donate` — do NOT attempt CSS overrides from the embedding page, because the component ships as a closed custom element and nothing outside it can reach in. |
| 2 | TREAT each `buy-button-id` as a 1:1 pointer to the specific Payment Link selected when it was generated in the dashboard — do not assume two ids are interchangeable, and re-verify the id after any dashboard edit to the underlying link. |
| 3 | KEEP the publishable key check-in-place practice ZAOstock already uses (hardcoded in the component, not an env var) — Stripe's own docs confirm this key is meant for client-side code and is safe to ship, but note the docs' own caveat: if the key is ever revoked, every embed using it breaks until the code is updated. |

## Findings

**What a Buy Button is, mechanically.** Stripe's docs describe it as an embeddable version of an existing Payment Link: you start from the [Payment Links list](https://dashboard.stripe.com/payment-links), pick (or create) a link, then click **"Buy button"** on that link's page to configure the button design and generate the embed code. The embed is a `<script async src="https://js.stripe.com/v3/buy-button.js">` tag plus a `<stripe-buy-button buy-button-id="{{BUY_BUTTON_ID}}" publishable-key="<<YOUR_PUBLISHABLE_KEY>>">` custom element. This confirms the id is generated **from** a specific Payment Link, not independently — there is no path to a `buy-button-id` that does not start from selecting the link it will check out to.

**Customization happens before you copy the code, not after.** The docs list four things configurable at generation time: choose between a simple button and a full card widget (this is the "white card" vs plain-pill distinction visible in ZAOstock's own screenshots); set brand colors, shapes and fonts; set the button/payment-page language; customize the button's call-to-action text. By default the button inherits the branding and CTA already configured on the Payment Link itself. None of this is exposed as a prop on the `<stripe-buy-button>` element in the embed code — it's baked into the `buy-button-id` at generation time via the dashboard UI, which is consistent with (and confirms) what ZAOstock's own `StripeBuyButton.tsx` component comments already concluded from reading the rendered DOM: the widget cannot be restyled from the embedding page's CSS, because Stripe controls its internal markup entirely server-side per button id.

**Checkout parameters that ARE settable from the embedding page.** Three HTML attributes on `<stripe-buy-button>` are real, documented customization points, distinct from visual styling: `client-reference-id` (an arbitrary string echoed into the `checkout.session.completed` webhook, useful for reconciling a purchase against an internal record), `customer-email` (prefills and locks the email field), and `customer-session-client-secret` (attaches an existing Stripe Customer/Account to the session, generated server-side and good for ~30 minutes, must be freshly generated per render — never cached). None of these are currently used in ZAOstock's integration, and none are needed for the current ask (matching visual style between tiers).

**Revocation risk, confirmed.** The docs state directly: "The buy button uses your account's publishable API key. If you revoke the API key, you need to update the embed code with your new publishable API key." This is a real, if unlikely, operational hazard for a hardcoded key shared across every `<stripe-buy-button>` instance on the site (ZAOstock currently reuses one `PUBLISHABLE_KEY` constant across all tiers in `StripeBuyButton.tsx`) — a key revocation breaks every embedded button at once, site-wide, until redeployed.

**Content Security Policy.** If the site ever adds a CSP header, the docs specify the button needs `frame-src https://js.stripe.com` and `script-src https://js.stripe.com` — worth a forward note since ZAOstock does not currently ship a CSP, but any future one must allowlist these or every Buy Button silently breaks.

**Local testing limitation.** The docs note the button requires a real website domain to render at all — testing it on `localhost` needs an actual local HTTP server (they suggest Python's simple server or the `http-server` npm package), not just opening the HTML file directly. Relevant if anyone tries to preview a Buy Button change outside `next dev`'s dev server.

**Not confirmed by these pages, but consistent with observed behavior:** Stripe's docs do not use the words "shadow DOM" anywhere on either fetched page. The closed-shadow-DOM behavior cited in ZAOstock's own component comments is an inference from the rendered DOM (a custom element with no accessible internal styling hooks), not a documented Stripe guarantee — it is very likely accurate (custom elements with encapsulated styling are the standard way to ship a widget that can't be broken by host-page CSS, and nothing in the docs contradicts it), but this doc cannot cite an official Stripe statement confirming the shadow root is literally `mode: 'closed'` rather than `mode: 'open'`. Flagging this rather than stating it as Stripe-confirmed.

## ZAOstock context (codebase, not this repo)

- `src/components/StripeBuyButton.tsx` (ZAODEVZ/ZAOstock) — as of 2026-09-23, generalized from a single hardcoded Pro-only button into a `BUY_BUTTONS: Partial<Record<TierId, string>>` map + `hasBuyButton(tierId)` helper, so any tier with a verified id renders the widget and any tier without one falls back to a plain Stripe Payment Link button. Comments in that file already independently concluded the shadow-DOM styling limit this doc set out to verify.
- `src/content/site.ts` — `STRIPE_LINKS` holds the plain Payment Link URL per tier id (`supporter`, `pro`, and as of this research, `fan`). The finding above (buy-button-id is generated FROM a specific Payment Link) is why ZAOstock's earlier session verified a `buy-button-id`'s `checkout_url` against Stripe's API to confirm it matched the corresponding `STRIPE_LINKS` entry exactly before shipping it — that verification step is the correct one per this doc's findings, not a redundant caution.

## Also See

- [Doc 1365 - ZAOstock Ticketing Strategy (Jul 2026)](../../events/1365-zaostock-ticketing-strategy-jul2026/) - earlier mention of a "buy button" on the Instagram-bio funnel path
- [Doc 2028 - Unlock Protocol for ZAOstock Ticketing](../../events/2028-unlock-protocol-festival-ticketing-eval/) - the onchain rail sitting alongside this card-rail work
- [Doc 2066 - Unlock Protocol on React Native (zao-festivals mobile)](../../business/2066-unlock-protocol-react-native-zao-festivals/) - notes Stripe Connect KYC is required for the mobile app's own credit-card checkout path, a different integration shape than the web Buy Button covered here

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Use dashboard "Customize the buy button" to set brand colors/shape on the Supporter and Fan Buy Buttons before generating their embed codes, so the white-card mismatch Zaal flagged does not recur per tier | @Zaal | Manual (Stripe dashboard) | 2026-09-24 |
| Verify each new `buy-button-id` (Fan $1, Supporter $20) against Stripe's API `checkout_url` to confirm it matches the corresponding `STRIPE_LINKS` entry, same method used for Pro's id | Claude session (zaostock) | PR | 2026-09-24 |
| If ZAOstock ever adds a Content-Security-Policy header, allowlist `frame-src`/`script-src https://js.stripe.com` for the Buy Button | @Zaal | PR | wontfix (no CSP shipped yet) |

## Sources

- [Create an embeddable buy button](https://docs.stripe.com/payment-links/buy-button) — Stripe official docs [FULL, method: curl + HTML strip of raw page, then spot-checked every quoted line (revocation warning, local-testing limitation, CSP directives) against the stripped text verbatim, verified 2026-09-23. The raw HTML was also grepped for "shadow" to check for an explicit shadow-DOM statement — none found; only unrelated CSS `box-shadow` custom properties.]
- [Share a payment link](https://docs.stripe.com/payment-links/share) — Stripe official docs, the page that links to the buy-button doc above [PARTIAL, method: WebFetch triage only — used to confirm the page exists and points at the buy-button doc; no claim in this doc's Findings is sourced from it directly, so it was not escalated to a raw fetch]
