---
topic: business
type: design-spec
status: design-complete
last-validated: 2026-07-17
related-docs: 1098, 1100, 1101, 1141
tier: STANDARD
original-query: "Design the Farcaster-first access gating flow for Sparkz token launches: Farcaster login unlocks info/early access (soft tier), creator token gates deeper tiers. Inspired by @alaskanmagpie's $Shiny 'Farcaster sees it first' treasure-hunt launch. Fits the 'coordination not casino' framing."
---

# 1225 - Sparkz: Farcaster-First Access Gating

> **Purpose:** Design the Farcaster-first access ladder for Sparkz creator token launches. Three tiers: public info → Farcaster login (soft gate, free) → creator token (hard gate, paid). Models @alaskanmagpie's $Shiny "Farcaster sees it first" treasure-hunt mechanic on the Sparkz launch rail. Board task `2d7796ed`.

---

## TL;DR

Add a Farcaster sign-in layer BEFORE the token gate. Anyone with a Farcaster account gets early access / unlocked info for free. Token holders get the deeper utility tier. This ladders Farcaster community loyalty into the Sparkz funnel without requiring anyone to buy immediately — "earn early access by being on Farcaster, earn deeper access by backing the creator."

---

## 1. The Inspiration: @alaskanmagpie's $Shiny Launch

The $Shiny launch by @alaskanmagpie ran a "Farcaster sees it first" treasure-hunt mechanic:
- Farcaster community got access, info, or mint priority BEFORE it hit public
- Created a clear "if you're on Farcaster, you're already early" signal
- Built urgency and identity: being on Farcaster IS the early access tier
- The community FELT like insiders, not bystanders

The ZAO / Sparkz audience is already heavily Farcaster-native. Applying this pattern to Sparkz creator launches turns the Farcaster community into the launch community by design.

---

## 2. The Three-Tier Access Ladder

| Tier | Gate | What you unlock | Who sees it |
|------|------|-----------------|-------------|
| **0 — Public** | None | Basic info: creator bio, what the token is, teaser | Everyone |
| **1 — FC Insider** | Farcaster Sign In (SIWF, free) | Full story: early access info, extended listen/watch, early-supporter list signup, bonus content | Anyone with Farcaster |
| **2 — Token Holder** | Hold N $[CREATOR] tokens | Deep utility: exclusive channel, voting, merch drop, stem files, co-creation access | Buyers / backers |

This is a **ladder**, not a wall. No one bounces off "token required" immediately. They hit Farcaster first, which is frictionless, and THEN decide if they want to go deeper.

---

## 3. Why This Fits Sparkz

| Sparkz principle | How FC-first supports it |
|---|---|
| **Farcaster-native audience** | The audience is ALREADY there. The gate lives in the environment where Sparkz launches. |
| **Coordination not casino** | Tier 1 gives ACCESS not speculation. Early supporters feel in-the-know before the price moves. |
| **Ladders cleanly** | FC login → "I'm in the room" → "I want to back this" → token purchase. Natural progression. |
| **Configurable** | Each creator can set what Tier 1 unlocks (listen early, see the tracklist, get the demo) vs Tier 2 (stem files, co-write access, exclusive channel). Not one-size-fits-all. |
| **Grows the Farcaster channel organically** | Anyone who hits Tier 1 is now a follower candidate. The Farcaster channel grows as a side effect of the gate. |

---

## 4. What "Farcaster Sign In" Actually Is

SIWF (Sign In With Farcaster) is a proven, gasless login primitive:
- User clicks "Sign in with Farcaster"
- Scans a QR code with Warpcast OR clicks a link (mobile direct flow)
- No token, no payment, no wallet signature required — just a Farcaster account (free to create)
- Returns: Farcaster FID, username, display name, custody address
- Zero friction for any Warpcast user

ZAO already has a SIWF implementation in **Zuke** (ZAODEVZ/Zuke repo) — though the Warpcast sign-in flow has an open bug (`9d6e3895` board task). For zaalcaster Sparkz, this would be a fresh implementation (or the Zuke codebase can be referenced once that bug is fixed).

**Implementation note:** SIWF is NOT the same as token-gating. It just verifies "this person has a Farcaster account." Post-verification, the app stores the FID and unlocks Tier 1. No on-chain transaction required for Tier 1.

---

## 5. Tier 1 Unlock Options (Configurable Per Creator)

When a creator sets up a Sparkz launch via the zaalcaster wizard, they choose what Tier 1 unlocks:

| Option | What it gives | Use case |
|---|---|---|
| **Early listen** | Full track/album stream before public release | Music artist launches |
| **Extended look** | Behind-the-scenes content, extended trailer | Film/video creators |
| **Early-supporter list** | Gets your name in the "OG supporter" credits onchain | Any creator |
| **Direct line** | Access to a Farcaster channel or DM group | Community builders |
| **Token discount / whitelist** | 24h priority window before public sale | Token launch campaigns |

Default recommendation for most music Sparkz launches: **early listen + early-supporter list** (simple, strong, no extra infra).

---

## 6. The "Farcaster Sees It First" Campaign Frame

When a creator launches with this flow, the marketing copy writes itself:

> "If you're on Farcaster, you can hear it first. Sign in to unlock early access before it's public."

> "Farcaster OGs hear it before launch. Everyone else waits."

> "No token needed for early access. Just show up on Farcaster."

This turns the launch into a **Farcaster-exclusive moment**, which gets shared by Farcaster users who want to feel special. The virality mechanism is identity ("I was on Farcaster, so I got early access") not speculation.

---

## 7. Configurable AI Advisor Integration

The Sparkz configurable AI advisor (referenced in board task `2d7796ed` — `project_sparkz_configurable_ai_advisor`) should include FC-first gating as one of the wizard options:

```
Sparkz Launch Wizard — Step 4: Who can see what?

○ Public only (no gate)
○ Farcaster-first (FC login unlocks more)  ← RECOMMENDED for most launches
○ Token holders only (hard gate from day 1)
○ Custom (define your own tiers)

[If Farcaster-first selected] What does FC login unlock?
☑ Early listen (stream the track/album before public)
☐ Extended behind-the-scenes content
☐ Early-supporter name in onchain credits
☐ Priority token discount window (24h before public)
☐ Access to private Farcaster channel
```

The wizard generates the correct SIWF config for the creator's landing page + the token-gate config for Tier 2.

---

## 8. Implementation Sketch (For zaalcaster)

The feature lives in the zaalcaster Sparkz wizard (the page at `/sparkz/launch` or similar):

1. **Tier 0 landing page**: Public page with creator name, token symbol, teaser. "Sign in with Farcaster to unlock more."
2. **SIWF hook**: `useSignIn()` from `@farcaster/auth-kit` — same stack Zuke uses. On success, stores FID in session.
3. **Tier 1 content gate**: Server checks `req.session.fid` — if present, render Tier 1 content. If absent, prompt sign-in.
4. **Tier 2 token gate**: Checks `balanceOf(walletAddress, tokenAddress) >= threshold`. Standard ERC-20 read via Wagmi/viem. If below threshold, show "back the creator" CTA.
5. **Analytics**: Track FID signups (Tier 1) vs token holders (Tier 2). Conversion rate between tiers = key metric.

**Gated (Zaal's hand):** Choosing what Tier 1 content is, deploying the token, and any on-chain setup.

---

## 9. Pre-flight Checklist (Before Building)

- [ ] Verify the Zuke SIWF bug (`9d6e3895`) to understand if the auth-kit implementation can be reused or needs a fresh start in zaalcaster
- [ ] Confirm Clanker v5 timing — the Sparkz token launch is gated on v5 (doc 1098 + 1101); the Tier 2 gate depends on the token existing
- [ ] Decide: does Tier 1 live on zaalcaster.com/sparkz/[creator] or on a creator-specific subdomain?
- [ ] Confirm with Zaal: what does Tier 1 unlock for the first Sparkz launch (Zaal's own $zaalcaster token OR the first creator token)?

---

## 10. Open Questions for Zaal

1. **Which launch is this for?** The $zaalcaster token itself (dogfood), or a creator's Sparkz token? Framing differs significantly.
2. **Does Tier 1 require a Farcaster follow?** Some launches require following the creator's channel to unlock — adds friction but grows the channel. Opt-in for the wizard.
3. **What's the threshold for Tier 2?** Holding 1 token, 100 tokens, or a minimum dollar value? Sets the "back the creator" bar.
4. **Should Tier 1 have an expiry?** "Farcaster sees it first — for 72 hours. Then it goes public." Creates urgency without permanently locking out non-Farcaster users.

---

## Sources

- Board task `2d7796ed` (Zaal idea 2026-07-17 — FC-first gating inspired by @alaskanmagpie's $Shiny)
- Doc 1098 (Sparkz master brief — Farcaster-native, energy-first creator coin)
- Doc 1100 (Sparkz community launch tokenomics)
- Doc 1101 (Sparkz onchain revenue mechanism — 0xSplits rail)
- Doc 1141 (Boostr x Sparkz campaign config — FC gating context)
- Board task `9d6e3895` (Zuke SIWF Warpcast sign-in bug — related auth-kit implementation)
