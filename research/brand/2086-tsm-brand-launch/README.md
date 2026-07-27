# 2086 — Making a new ZAO brand (case study: TSM / Two Spoiled Mastholes)

**Type:** BRAND-STRATEGY
**Topic:** Brand
**Status:** DRAFT — Zaal-initiated brainstorm (2026-07-26). Launch **TSM**, a Boston sports fan brand (podcast + website) built with a friend, as a new **spoke of The ZAO** (a fresh-audience brand that funnels newcomers to the ZAO hub — see doc 2087 for the wheel-and-spoke architecture). This doc is the single-brand strategy + reusable playbook, not a spec. *(Hub-and-spoke / conversion-bridge refold pending — 2026-07-26.)*

---

## TL;DR

- **TSM** = the brand. **Two Spoiled Mastholes** (or *Two Short Mastholes* — the indecision is a bug that becomes a feature). Boston sports fan brand: podcast-first, clips-driven, website as the hub. It's a **spoke of The ZAO** — its own clean consumer brand that reaches a new audience and pipes the curious into the ZAO community.
- **The strong angle is "spoiled."** Boston fans *are* objectively spoiled — 12+ titles across four teams since 2001. Owning that with self-aware humor is a real POV, not "two guys talk sports." That POV is the whole brand.
- **Ship the minimum brand, not the maximum.** Podcast host + a one-page site + short vertical clips. No custom code needed to launch. Consistency beats polish.
- **Keep ZAO/on-chain OUT of the front door.** A Boston sports audience does not care about DAOs up front. TSM is a clean consumer brand that stands on its own. The bridge to the ZAO hub is deliberate and downstream (show notes, a members-only perk, an eventual "come build with us" moment) — never the opening pitch. The tokenized/on-chain fan layer is where TSM does its **on-chain R&D and shares findings back to the ZAO community** (the spoke's return loop), but it comes *after* audience, never before.

---

## 1. TSM as a spoke of The ZAO

**There is no LaZAO** — TSM is simply a new ZAO brand, built as a **spoke**: a standalone consumer brand that reaches an audience (Boston sports fans) the ZAO hub could never reach directly, and funnels the curious ones into the community. So:

- **Don't** stand up any separate label, holdco, or umbrella. There's nothing to operationalize above TSM — the hub is The ZAO, full stop.
- **Do** treat TSM as its own clean brand at the front door (fans meet TSM, not ZAO), with a deliberate downstream **conversion bridge** into the ZAO hub, and an **on-chain-R&D-shared-back** return loop. (Architecture: doc 2087.)
- The real work is **TSM as its own standalone brand.** Everything below is the TSM strategy; the ecosystem mechanics live in doc 2087.

---

## 2. The two naming decisions to lock FIRST (everything downstream depends on these)

### 2a. Spelling: "Masshole" vs "Masthole"

| | **Masshole** (standard) | **Masthole** (the softer variant) |
|---|---|---|
| Authenticity | THE Boston word. Instantly legible to the target. | A pun (nautical/New England "mast" + hole) — cleverer, less native. |
| Discoverability | High — people search/say it. | Lower — nobody types "masthole." |
| Brand-safety / ad monetization | Crude → risk of YouTube/ad-network filtering, platform demonetization. | Cleaner → safer for sponsors, merch, ads. |
| Ownability / trademark | Crowded; "masshole" is near-generic, hard to own. | More uniquely yours, easier to mark. |

**Recommendation:** Lead with **Masshole** for authenticity + organic reach (the crude word *is* the culture, and "share it around Boston" = organic discovery matters most). Accept the ad-safety tradeoff early — you monetize on merch + local sponsors, not YouTube AdSense, so brand-safety filtering hurts less than losing authenticity would. Reconsider only if a real sponsor deal requires the clean spelling. *Pick one and never mix — split spelling kills searchability.*

### 2b. The "TSM" collision (this is the biggest discoverability risk)

**TSM already = Team SoloMid**, one of the largest esports orgs on earth. A Boston-sports "TSM" will be buried in every search and every hashtag. Do **not** build the brand *on* the initials.

- **Lead with the full name** — *Two Spoiled Mastholes* — as the brand. Let "TSM" be the affectionate short form fans use *after* they're in, not the front-door name.
- **Secure gettable handles** (check availability before committing to anything): `@twospoiledmassholes`, `@spoiledmassholes`, `@spoiledpod`, `@2spoiled`. Grab the same handle everywhere for consistency.
- **Domain:** `twospoiledmassholes.com` / `spoiledmassholes.com` / `getspoiled.show` / `.fm`. Buy the exact-match .com even if you launch on a subdomain.
- **Quick clearance:** 10-minute USPTO + MA Secretary of State search on the name before you spend a dollar on merch.

---

## 3. The concept — why "spoiled" wins

Boston is the most-spoiled fanbase in America and everyone (including Boston) knows it: Patriots dynasty, Sox breaking the curse (multiple), Celtics banner 18, Bruins Cup. **"Two Spoiled Mastholes" names the reputation and wears it on purpose.** That's a POV, and POV is what makes a pod shareable:

- Every episode has a *lens*: spoiled takes, "this is a down year and we're furious about a conference finals appearance," ranking dynasties, refusing to be happy. Argument-bait by design → algorithmic reach.
- **"Two Short"** as the alternate name is the self-deprecating counterweight (a height bit about the hosts) — run it as a *recurring gag*: the show that can't decide what it's called. The indecision is content ("are we short or spoiled today?"). Lean into it, don't resolve it.
- Two-host banter + a strong shared identity is the format that travels. The brand is the *chemistry + the POV*, not the sport coverage — coverage is a commodity.

---

## 4. Minimum Viable Brand (what actually ships, cheap + fast)

Applying the ZAOOS "lab" instinct — prototype standalone, no over-build:

**Podcast (the content engine)**
- Record: 2 decent USB mics, or Riverside/Zencastr for remote (records local high-quality tracks + auto video). Video is optional but *doubles* your clip surface — do it if feasible.
- Host: one host that auto-distributes everywhere — Transistor, RSS.com, or Spotify for Creators (free). One upload → Spotify + Apple + YouTube.
- Format: **short and regular beats long and sporadic.** Weekly anchor episode + fast reaction drops after big Boston games. 30–45 min max early on.

**Website (the hub, not a product)**
- Fastest path: a **single landing page** — Framer or Carrd — with embedded latest episode, links to every platform, and an email capture. Ships in an afternoon.
- Do **not** build custom code to launch. (ZAOOS could host a Next.js one-pager prototype under the "Monorepo as Lab" pattern and graduate it later — but for a sports pod that's premature. Only go custom if you add something interactive: a fan poll, a "spoiled meter," merch store, member area.)

**Clips (the actual growth engine)**
- Every episode → 3–5 vertical clips for TikTok / IG Reels / YouTube Shorts / X. Auto-cut with Opus Clip or Descript.
- This — not the full episodes — is how Boston sports brands grow (the Barstool model). The pod is the factory; clips are the product that travels.

---

## 5. Distribution — "share it around Boston"

Boston fandom is extremely online and tribal — an advantage, because the community self-organizes and argues.

- **X:** Boston Sports X is huge and active. Live-tweet games, quote-tweet hot takes, reply into big accounts, drop clips. Fastest early traction channel.
- **TikTok / Reels / Shorts:** reaction clips + "spoiled" rankings + hot takes. Post daily.
- **Reddit:** r/bostonceltics, r/Patriots, r/redsox, r/bostonbruins, r/bostonsports — genuine participation only; Reddit punishes self-promo. Earn a rep, drop clips sparingly.
- **Local / IRL hooks:** game-day content, bar meetups, tailgates, a rotating local guest. Boston rewards *local* — being physically of the city is a moat national pods can't copy.
- **The "spoiled" POV is inherently shareable** — takes people want to argue with get distributed for free.

---

## 6. 30-day launch plan

| Window | Do |
|---|---|
| **Week 0** | Lock name + spelling (§2). Secure handles + .com. Simple wordmark/logo (Canva or a quick designer). Agree the **workload split** with your co-host — who edits, who clips, who posts (the unglamorous 80% that kills most pods). |
| **Week 1** | Record **2–3 episodes and bank them** (buffer = insurance against life). Set up podcast host + RSS. Stand up the landing page + email capture. |
| **Week 2** | **Launch.** Publish ep 1, cut clips, start daily short-form, seed into Boston communities (§5). |
| **Weeks 3–4** | Consistency: weekly anchor + reaction drops. Iterate on which clip formats hit. Grow the email list. Book the first guest. |
| **Ongoing** | Measure: downloads, clip views, follower growth, email signups. Double down on what works; cut what doesn't. |

---

## 7. Money (later — audience first)

Monetize *after* there's an audience, in this rough order:
1. **Merch** — Boston fans buy merch hard. "Spoiled" hoodies/tees are the natural first drop.
2. **Local sponsors** — bars, barbershops, local brands. (Careful with **sportsbook/gambling** ads — heavy rules + brand-safety flags.)
3. **Membership / paid tier** — Patreon-style bonus eps, or a later on-chain fan layer (POAP-style attendance, fan token, member area) — *only if the audience asks for deeper participation,* never as the launch pitch.
4. **Live shows** — a spoiled-Mastholes bar night once there's a local crowd.

---

## 8. Risks / watch-outs

- **TSM = esports collision** → don't build on the initials (§2b).
- **Crude-word brand-safety** → may cap YouTube/ad monetization; fine if merch + sponsors are the model, but know it going in.
- **Consistency is the #1 killer** → the pod graveyard is full of shows that stopped at ep 5. Bank episodes; set a cadence you can actually sustain.
- **Co-host workload + chemistry** → agree the split upfront; resentment over who does the editing sinks more duos than bad takes.
- **Trademark** → quick USPTO / MA check on the name before merch spend.

---

## 9. The repeatable checklist (if you ever launch another one)

Not a separate "machine" — just the steps that worked, reusable if a next spoke comes:
1. Name + clear the two naming decisions (spelling, collision check).
2. Secure handles + .com everywhere, same handle.
3. Set up the stack once (record → auto-clip → host → landing page).
4. Bank content, launch, seed to the native community, grow on clips.
5. Monetize on merch → local sponsors → membership, in that order.

For now, all that matters is getting TSM out the door.

---

## Related

- Doc 1663 — ZAO Brand Voice Guide (house voice discipline; TSM's voice is its own but the *rigor* transfers)
- Doc 1627 — ZAO Visual Identity Spec (how ZAO does brand systems — reference for building TSM's)
- Doc 1717 — ZAO X Content Playbook (X posting mechanics; adapt the templates for a sports audience)
- Doc 2087 — ZAO brand architecture (the wheel-and-spoke / anti-dilution framework TSM slots into)
- CLAUDE.md "Monorepo as Lab / graduation" — the conceptual parent of spinning up ZAO brands
