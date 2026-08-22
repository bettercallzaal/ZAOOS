---
topic: farcaster
type: strategy-brief
status: awaiting-zaal
created: 2026-08-22
last-validated: 2026-08-22
board-task: none
related-docs: "1441-zao-farcaster-channel-growth-strategy, 1675-farcaster-content-calendar-sep2026, 1607-zol-zabal-channel-autopost-spec, 2385-farcaster-client-landscape-aug2026, 2389-farcaster-miniapp-ecosystem-aug2026, 2388-zaostock-oct3-tech-readiness-brief"
original-query: "ZAO Farcaster distribution strategy update post-operator-crisis — what changes given Base App dropped + Warpcast uncertain, what stays the same"
tier: STANDARD
---

# 2390 - ZAO Farcaster Distribution Strategy Update (Aug 2026)

> **Purpose:** Updates ZAO's Farcaster channel growth strategy (doc 1441) after
> two major shifts: Base App dropped its Farcaster feed (Jul 2026) and Neynar is
> seeking a new Warpcast operator (Aug 2026). What changes; what stays the same.

---

## What Changed (Summary)

| Factor | Before (Jul 2026) | After (Aug 2026) |
|--------|------------------|-----------------|
| Primary reach surface | Warpcast + Base App feed | Warpcast only |
| Base App as distribution | 5M user surface | **GONE** — social feed dropped |
| Warpcast stability | Stable | Uncertain (operator search) |
| Nook (channel discovery) | Active | **SHUT DOWN** (June 2026) |
| ZOL posting mechanism | Hub-level (protocol) | Hub-level — **UNCHANGED** |
| Farcaster social graph | Protocol-native | **UNCHANGED** |
| Channel subscriber reach | All Warpcast + Base App | All Warpcast only |

---

## What Does NOT Change (The Foundation)

**ZOL's posting mechanism is unaffected.** ZOL posts at the hub level — directly
to the Farcaster protocol via `POST /v1/submitMessage`. This is independent of
which client users use to read. Whether users read on Warpcast, Supercast, or any
future client, they see ZOL-posted content.

**ZAO's social graph is protocol-native.** The ZAO/ZABAL Farcaster channel
subscribers are recorded in Snapchain. They're not client-specific. Anyone
following the ZAO channel on any Farcaster client receives ZAO channel casts.

**Engagement quality > vanity reach.** The Farcaster network has always been a
high-intent audience (builders, music creators, governance participants) rather
than a mass consumer audience. Losing Base App's reach removes a large but
less-engaged surface.

---

## Strategy Adjustments

### 1. Remove Base App from distribution projections

Any doc, OKR, or content calendar referencing "Base App reach" should be revised.
Base App is no longer a Farcaster surface (doc 2385). The total addressable
Farcaster audience visible to ZAL content is smaller than assumed in doc 1441.

**Action:** Revise reach estimates in doc 1441 channel growth targets. Base App's
5M users are not reachable via Farcaster content.

---

### 2. Protocol-native framing: "read us on any Farcaster client"

As Warpcast's future becomes uncertain, ZAO should position itself as
**protocol-native** rather than Warpcast-native. This means:

- Never say "follow us on Warpcast" — say "follow us on Farcaster" or
  "follow @zabal on Farcaster" (resolves on any client)
- Channel links should use `farcaster://` deeplinks or plain FID/username,
  not Warpcast-specific URLs where possible
- Content and docs should acknowledge that ZAO members may use Supercast,
  Recaster, or future clients

**Why this matters:** If Warpcast undergoes a rough transition, ZAO shouldn't
appear to be associated with a specific operator's fate.

---

### 3. Supercast as the builder/power-user surface

Supercast is the primary Farcaster client for heavy users — builders, DAO
contributors, protocol engineers. This is exactly ZAO's target audience for
governance and fractal participation.

**ZAO actions:**
- Ensure channel posts work correctly on Supercast (they do — protocol-level)
- Zaal/builders should be visible on Supercast (it's a power-user signal)
- ZAOstock governance material should reference Supercast as an alternative
  for users who want better analytics on their engagement

---

### 4. Double down on channel-native content

With Base App gone and Nook shut down, the primary discovery surface for ZAO
is its own Farcaster channels:
- `/zabal` — ZAO community channel
- `/wavewarz` — battle music channel (doc 1473)
- `/zaofractal` — governance channel

Channel subscribers see all casts. Channel discovery (channel browser in Warpcast,
Supercast) remains the primary organic growth path.

**Implication:** Each ZOL post should include channel tags. The WaveWarZ miniapp
should be announced in the `/wavewarz` channel. The ZAO Fractal article (doc 2382)
should be cast in `/zabal` and `/zaofractal`.

---

### 5. ZAOstock as the Farcaster moment (Oct 3)

ZAOstock is the biggest distribution opportunity ZAO has before year-end. The
strategy (doc 1675 + doc 2388) remains valid. Key adjustments:
- Drop any Base App-specific content plans
- Add Supercast-native content (thread formatting, longer text)
- Emphasize "follow us on Farcaster" (protocol) not "follow us on Warpcast"
- Ensure WaveWarZ miniapp is live before Oct 3 (doc 2388 — Aug 25 decision deadline)

---

### 6. ZOL posting health = priority 1

The entire distribution strategy depends on ZOL posting reliably. The Neynar
migration (doc 2381) must be complete before ZAOstock (Sep 29 target). If ZOL
goes silent during ZAOstock, the entire Farcaster strategy fails.

Priority order for ZOL health:
1. Hub migration (5 lines of code — ship now)
2. Mention polling (spec ready — ship before Sep 29)
3. v1 → v2 search migration (2 lines — ship now)

---

## Content Calendar Impact (Doc 1675 Update)

The September 2026 content calendar (doc 1675) assumed Warpcast + Base App as
distribution surfaces. Revised assumptions:

| Calendar element | Base App impact | Warpcast uncertainty impact |
|-----------------|----------------|---------------------------|
| Weekly ZAO Fractal casts | None — hub-level | None |
| WaveWarZ battle highlights | None | None |
| ZAOstock countdown casts | None | None |
| Push notifications | N/A (Base App gone) | May degrade if Warpcast transitions mid-campaign |
| Channel discovery posts | N/A (Nook gone) | Channel browsing still works in Warpcast/Supercast |

**Bottom line:** Content calendar execution via ZOL is unaffected. Distribution
reach expectations should be adjusted downward (no Base App surface).

---

## Updated Channel Growth Model

**Old model (Jul 2026):** Protocol reach + Warpcast discovery + Base App discovery
**New model (Aug 2026):** Protocol reach + Warpcast discovery + Supercast power users

The new model has less quantity (no Base App's 5M users) but better quality
(Warpcast/Supercast audience is higher-intent for ZAO's products).

| Metric | Old target | Revised direction |
|--------|-----------|------------------|
| Farcaster channel followers | Growth from Base App integration | Growth from Warpcast + organic |
| Weekly active casters in ZAO channel | Growth from Base App DM features | Growth from ZAOstock + miniapp |
| WaveWarZ miniapp WAU | Included Base App mini app reach | Warpcast + Supercast only |

---

## Action Table

| Action | Owner | By | Status |
|--------|-------|-----|--------|
| Revise doc 1441 reach targets (remove Base App) | Zaal | Sep 1 | Awaiting |
| Update all ZAO bios: "on Farcaster" not "on Warpcast" | Zaal / comms | Sep 1 | Awaiting |
| Complete ZOL hub migration (doc 2381) | Dev | Aug 25 | Spec ready |
| WaveWarZ miniapp builder + scope decision | Zaal | Aug 25 | DECISION NEEDED |
| ZAOstock Farcaster moment execution (doc 1675) | ZOL + Zaal | Oct 3 | On track |

---

## Also See

- [Doc 1441](../1441-zao-farcaster-channel-growth-strategy/) — Channel growth strategy (Jul 2026 baseline; revise reach targets)
- [Doc 1675](../1675-farcaster-content-calendar-sep2026/) — September content calendar (adjust Base App references)
- [Doc 2385](../2385-farcaster-client-landscape-aug2026/) — Full client landscape analysis
- [Doc 2388](../2388-zaostock-oct3-tech-readiness-brief/) — ZAOstock tech readiness brief
- [Doc 2389](../2389-farcaster-miniapp-ecosystem-aug2026/) — Miniapp distribution loops

## Sources

- [INTERNAL] Doc 1441 — ZAO Farcaster channel growth strategy (Jul 2026)
- [INTERNAL] Doc 1675 — Farcaster content calendar (Sep 2026)
- [INTERNAL] Doc 2385 — Client landscape post-crisis (Base App dropped; Warpcast uncertain; Nook gone)
- [INTERNAL] Doc 2388 — ZAOstock tech readiness (all workstreams + deadlines)
- [INTERNAL] Doc 2389 — Miniapp ecosystem survey (14.6x WAU gap; channel-native is key loop)
