---
topic: business
type: decision
status: research-complete
last-validated: 2026-07-18
related-docs: 952-viniapp-brainstorm, 1325-chris-dolinski-viniapp-sparkz-jul17, 1326-culture-coins-meme-engine-sparkz-synthesis, 1286-sparkz-improvement-roadmap-creator-coin-discourse
original-query: "Inbox action: Sparkz: evaluate Viniapp as partner"
tier: STANDARD
---

# 1476 — Viniapp × Sparkz: Partnership Evaluation

> **Goal:** Structured go/no-go on integrating Viniapp as a Sparkz distribution and onboarding partner. Builds on the Zaal x Chris Dolinski call (doc 1325, 2026-07-17) and the original Viniapp brainstorm (doc 952, 2026-06-29). Answers: what does each party get, what's the integration scope, what are the risks, what needs to happen first.

## Verdict: GO — shallow integration now, deeper scope after Sparkz V1 ships

Viniapp is a legitimate fit. The partnership logic is tight and the CEO-level relationship (Zaal x Chris) is already warm. The risk is scope creep before Sparkz V1 is stable. Integration should start small — Viniapp promotes Sparkz to its builders; Sparkz offers credits to ZABAL Games participants — and expand only after both products ship their current PRs.

---

## What Is Viniapp

Viniapp (viniapp.xyz, built by Chris Dolinski / @chrisdolinski) is a vibe-coding platform and Farcaster mini-app builder marketplace for beginner-to-intermediate web3 builders. Core product: a guided onramp that asks a 3-question "what should you build?" quiz and routes you to project templates, learning modules, and integrations contributed by partner apps. Partner integrations appear as modular blocks (title, description, AI prompt, logo, docs URL, optional API key).

Linked to the Clanker Ecosystem Fund (CEF): Viniapp received CEF funding for a "$5 in → up to $100 in build credits" program that solves builder "terminal velocity" (people start, run out of gas, don't finish). This is the credits model that directly parallels Sparkz's treasury-funds-onboarding idea.

"Vinny" is the AI assistant embedded in the Viniapp UI — currently routes to a language model with context about the platform, templates, and partner integrations.

---

## What Viniapp Brings to Sparkz

| Asset | Value |
|-------|-------|
| Distribution channel | Viniapp's builder network is active and CEF-funded. A Sparkz integration block in the Viniapp UI puts Sparkz in front of every new creator who goes through the onramp — before they have any other creator-tool relationship. |
| "Access coins" positioning | Chris coined the phrase "access coins" (what do you get *access* to?) on the 2026-07-17 call, which Zaal immediately adopted. This is a cleaner pitch than "creator coins" in a market where creator coins are perceived as speculation. |
| Credits model validation | Viniapp's CEF "$5→$100 credits" initiative is real proof-of-concept for the Sparkz treasury-funds-onboarding model. CEF already approved the mechanic; Sparkz can borrow the pattern and point to Viniapp as prior art. |
| Audius connection | Chris suggested an Audius music integration for Viniapp that would be a natural surface for ZOL-style music curation. Opens a direct path to the 34-artist Audius roster already on WaveWarZ. |
| MIDAO thread | Chris is engaged with Zaal's Marshall Islands DAO work — ZOL getting a legal entity as the CEO. This is a relationship-level alignment, not just product fit. |

## What Sparkz Brings to Viniapp

| Asset | Value |
|-------|-------|
| First culture-coin integration block | Sparkz becomes the example "creator coin" integration in the Viniapp Ideas + Integrations UI — the canonical starting point for any builder wanting to launch a creator economy. |
| ZABAL Games collab | A pot of ZABAL tokens / compute credits for active Viniapp builders who lack the $5 entry mirrors Viniapp's own CEF program. This creates a shared rewards loop between the two platforms. |
| ZAO curation signal | ZAO-backed launches on Sparkz carry a curation premium Viniapp builders will value — "your app is ZAO-backed" is a stronger signal than "you got a CEF micro-grant." |
| Zoostr / Boostr precedent | The live Zoostr campaign (Boostr auto-like leaderboard, 31 contributors, 592 likes) is something Viniapp builders can point to as evidence that Sparkz-style engagement mechanics work before a token exists. |

---

## Integration Scope (Recommended: Minimal V1)

**V1 (now — no engineering required):**
- Sparkz adds a Viniapp integration block: title="Sparkz - Launch Your Creator Coin", description=one-liner, AI prompt=Sparkz ICM URL, logo, docs link.
- Viniapp mentions Sparkz as the culture-coin launcher in its onboarding flow.
- Zaal offers a ZABAL Games pot (small, fixed amount) for Viniapp builders who submit to ZABAL Games via the Viniapp onramp.

**V2 (after Sparkz V1 ships, ~Q3 2026):**
- Sparkz as a Farcaster mini-app, surfaced inside Viniapp (the miniapp-on-Viniapp path Chris proposed).
- Vinny (Viniapp's AI) routes creators asking "how do I monetize?" to the Sparkz spark flow.
- Sparkz treasury-funded compute credits for non-technical creators using Viniapp templates.

**V3 (contingent on Audius integration existing on both sides):**
- Audius music module in Viniapp + ZOL curation = Sparkz music creators discovered via Viniapp's builder flow.

---

## Risks and Open Questions

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Scope creep before V1 ships | HIGH | V1 integration is zero-engineering (integration block + ZABAL pot). Gate V2+ on Sparkz mini-app milestone. |
| Viniapp builder audience ≠ music creator audience | MEDIUM | Viniapp builds software; Sparkz targets music artists. Overlap exists (builders who make creator tools) but isn't the core creator market. Track referrals, don't over-invest. |
| Clanker v5 in audit (no ETA) | LOW | Viniapp integration doesn't depend on Clanker v5. V1 can launch against current Clanker (v4). |
| Chris's capacity | LOW | Chris is a solo founder with other products (ApiNow.fun, useicm.com). Don't gate on his engineering; V1 is Zaal-executable. |
| "Access coins" IP | NONE | Chris gave Zaal explicit permission ("might steal that phrase"). No IP issue. |

**Open questions before V2:**
- Does Viniapp have a native mini-app surface yet, or is everything in the web app? (If mini-app surface doesn't exist, V2 is blocked.)
- What's Chris's timeline for the Audius integration he mentioned?
- Is Vinny's AI model configurable per integration block, or is it a single shared context?

---

## Recommended Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Submit Sparkz integration block to Viniapp (title/desc/AI prompt/logo/docs URL) | @Zaal | Outreach | 2026-07-25 |
| Reply to Chris with: integration block + ZABAL Games pot offer + ask for Audius timeline | @Zaal | Outreach | 2026-07-20 (per 1325 action) |
| Scope the Sparkz mini-app surface (what does a Farcaster mini-app for Sparkz look like?) | @Zaal | Doc/PR | 2026-07-31 |
| Attend Clanker + Empire Farcaster space (10am ET) for ecosystem context on culture coins | @Zaal | Calendar | 2026-07-23 |
| Write Sparkz ICM context box at useicm.com (needed for Vinny to route creators to Sparkz) | @Zaal | Task | 2026-07-25 |

---

## Also See

- [Doc 952 - Viniapp brainstorm (2026-06-29)](../../events/952-viniapp-brainstorm/)
- [Doc 1325 - Zaal x Chris Dolinski call (2026-07-17)](../../events/1325-chris-dolinski-viniapp-sparkz-jul17/)
- [Doc 1326 - Culture Coins + Meme Engines synthesis](./1326-culture-coins-meme-engine-sparkz-synthesis/)
- [Doc 1286 - Sparkz Improvement Roadmap](./1286-sparkz-improvement-roadmap-creator-coin-discourse/)

## Sources

- [FULL] Doc 952 — Viniapp brainstorm transcript + recap (Zaal x Chris, 2026-06-29)
- [FULL] Doc 1325 — Zaal x Chris Dolinski call recap (2026-07-17, 16 min)
- [FULL] Doc 1326 — Culture Coins + Meme Engine synthesis (Brandon Ducar / DreamNet)
- [PARTIAL] viniapp.xyz — homepage accessible but minimal product detail on web
