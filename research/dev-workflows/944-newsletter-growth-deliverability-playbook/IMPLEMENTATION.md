# 944 - Implementation specs + ZAO-grounded candidates

> Companion to [README.md](./README.md). This is the "how to actually ship the top-3 gaps" file:
> landing page, welcome sequence, and the ZAO-specific lead-magnet + cross-promotion candidates.
>
> **Scope guard:** these are SPECS and skeletons - structure, purpose, and what each piece must do -
> NOT finished outbound copy. Final voice-copy is Zaal's to write/humanize per the drafting protocol
> ([[feedback_drafting_protocol]], [[feedback_brainstorm_before_writing]]). Nothing here is meant to ship
> as-is or auto-post.

---

## A. Landing page spec (gap #1)

One page, one job: turn a Farcaster/X visitor into a subscriber. Sits at a stable URL (e.g. a `/subscribe`
route or a dedicated Paragraph/Framer page), linked from Farcaster bio, X pinned, and every issue footer.

Sections, top to bottom:

1. **Headline** - benefit + specific time. Formula from the research ("X you'd miss in 2 minutes a day").
   Zaal writes the actual line; keep it lowercase-casual, no hype.
2. **Founder video (optional, high-impact)** - 20-40s of Zaal saying why he writes it daily. Adds 25-86% to
   conversion [VERIFIED, see README]. Can defer to v2.
3. **Real issue screenshot** - an actual "Year of the ZABAL" issue, not a mockup. Shows exactly what they get.
4. **One lead magnet offer** - see section C. Must deliver value in under 5 minutes.
5. **Subscribe form** - email + optional name ONLY (each extra field costs ~11% conversion). Plus the
   wallet-subscribe option (Paragraph native) for the web3 crowd.
6. **Proof line** - "Day N and counting" (the streak is the proof; it's already true and on-brand).

Rules: mobile-first (60%+ signups are mobile, <3s load), single CTA, no nav distractions.

## B. Welcome sequence spec (gap #2)

3 emails, first sent IMMEDIATELY on subscribe (instant beats delayed by 50%+ open rate). This is the single
biggest retention lever ZAO is missing. Skeletons only - Zaal writes the voice:

- **Email 1 (instant) - "you're in."** ZM. One line on what "Year of the ZABAL" is and the daily promise.
  Deliver the lead magnet here. Set the expectation: short, daily, real. One link max.
- **Email 2 (day 1-2) - "who's writing this."** The one-paragraph why: The ZAO, build-in-public, what a year
  of daily discipline is for. Link one flagship artifact (e.g. the WaveWarZ on-chain tracker, or the fractal
  process) so they see the world behind the journal.
- **Email 3 (day 3-4) - "here's the best of it."** Point to 2-3 standout past issues (the archive as a taste).
  Soft ask: reply and tell me what you're building. Reply-driven engagement is the truest signal post-Apple-MPP.

Cadence after the sequence: the normal daily issue takes over. Measure clicks + replies, not opens.

## C. ZAO lead-magnet candidates (pick ONE to start)

Grounded in assets ZAO already has - no new production required for most:

1. **The WaveWarZ on-chain one-pager** - "how a music-battle market actually works on-chain, in 2 minutes,"
   built from the real tracker (doc-linked, wwtracker.vercel.app). Proof + novelty. Strong fit.
2. **The daily-3 wins format** - a "here's what a year of shipping in public looks like" sampler pulled from
   docs 928/929/930. Low effort, on-brand.
3. **ZABAL Games context pack** - the existing `zabal-games-context` skill repackaged as a "drop this into your
   AI coding agent so it understands the ZAO stack" download. Targets builders specifically.
4. **The fractal process explainer** - Zaal's magnum opus (doc 696) distilled to a 1-page primer. Higher effort.

Recommendation: start with #1 or #2 - both exist, both take under 5 min to consume, both are unmistakably ZAO.
Verify each is safe to share publicly before using.

## D. Cross-promotion candidates (verify before outreach)

Aligned music/web3 relationships already in the ZAO orbit that plausibly have audiences to swap with. Flagged
[verify] because I have NOT confirmed each runs a newsletter or would swap - that check + the outreach itself is
Zaal's call ([[feedback_dont_invent_outreach]], [[feedback_cold_outreach]] via the skill):

- SongJam / Logesh (SANG, leaderboard + X Spaces audience) [verify]
- POIDH / Kenny (bounty community) [verify]
- Bonfires / Ryan Kagy (knowledge-graph + web3 audience) [verify]
- Wide / Aaron Rafferty (cause-coins crossover, doc 913) [verify]
- Magnetiq / Tyler Stambaugh (event/launch platform, ZABAL Games host) [verify]
- Empire Builder network (Adrian, raidsharks) [verify]

Approach per the research: treat a swap as a relationship start, not a transaction; 5-10 aligned partners, not a
blast. Do NOT auto-send anything - this list is a starting point for Zaal to pick from and reach out himself.

## E. Sequencing (what to build first)

Per README's prioritized list, the ship-first cluster is **A + B + funnel**:

1. Landing page (A) - the front door.
2. Welcome sequence (B) - so new subs don't churn on day 1.
3. Daily Farcaster teaser -> landing page (the funnel) - warm audience, near-zero cost.

Everything else (referral loop, cross-promo, archive SEO, mints) comes after these three are live and measured.

## F. Where should the landing page + welcome sequence live? (repo audit, 2026-07-03)

Audited `zabalnewsletterbuilder` (github.com/bettercallzaal/zabalnewsletterbuilder). It is a **builder**,
not a public site or a sender: it plans the daily-3 sequence, drafts issues in ZAO voice, grades the voice, and
generates Farcaster/X variants (`app/{builder,read,socials,issues}`, `lib/{issues,voice,score,variants,assemble}.ts`).
The newsletter is published on Paragraph; socials go out via the `/socials` skill. No subscribe/landing/welcome code exists.

Conclusion on the two top-gap surfaces:

- **Landing page** - does NOT belong in the builder (that tool is an internal composer, not a public front door).
  Options, best first: (1) confirm what Paragraph's own subscribe page already offers and whether it can carry a
  lead magnet; (2) a small standalone `/subscribe` micro-page (Vercel/Framer) linked from Farcaster/X/issue footer;
  (3) a route on an existing public ZAO surface (e.g. thezao.xyz). Pick based on where ZAO wants the canonical front door.
- **Welcome sequence** - SENDING/automation is a platform concern, not a builder concern. Depends on whether
  Paragraph supports automated sequences; if not, it needs Paragraph automation or a lightweight ESP. NOT the builder's job.
- **What the builder COULD gain (optional, natural fit)** - a "welcome-sequence drafting" mode: draft the 3 welcome
  emails in ZAO voice with the same voice-grader the issues use. That is a content-drafting task, exactly what the
  builder already does. Small, additive, and keeps voice consistent. Still leaves hosting/sending to Paragraph/ESP.

Net: the two ship-first surfaces are Paragraph/public-site work, not `zabalnewsletterbuilder` work. The only builder
change worth considering is an optional welcome-email drafting mode.

## G. Content-supply map - why daily is actually sustainable for ZAO (2026-07-03)

The README flags daily cadence as the #1 risk (burnout, churn). But that risk assumes the writer must *create*
content daily. ZAO's situation is the opposite: it **overproduces** content across the ecosystem. The newsletter's
job is curation and selection, not creation - which flips daily from a burden into a highlight reel.

The supply, by cadence (all real, already happening):

- **Daily:** research docs (research cadence went daily in Q2, docs 900-941+), ZOE captures/briefs, WaveWarZ battles
  run nightly (~8:30 EST), on-chain activity on the tracker.
- **Weekly:** ZABAL Games cobuilds (Mondays), Fractal Mondays (100+ weeks), COC Concertz, the `docs/weekly/*-recap.md`
  series (through W26), partner calls landing in the relationship ledger.
- **Ongoing/threaded:** live partner threads (each new doc 947/951/953... is a story), events on the calendar
  (ZAOstock Oct 3, ZAOville), the ZAO Fund, WaveWarZ tracker milestones, ZABAL Games submissions stacking.
- **Evergreen:** the ~960-doc research library, the fractal process (doc 696), the whitepaper - all mineable for
  "throwback"/explainer issues on a slow news day.

Implication for the newsletter (recommendation): treat each issue as a *pull* from this supply, not a blank page.
The daily-3 format (doc 930) already does this - it selects 3 wins. Extend the same discipline to the personal
"Year of the ZABAL" journal: on any given day there is always a real shipped thing to lead with (a merged PR, a
battle, a research doc, a partner call, a tracker number). ZOE auto-draft (already a logged open idea) can pre-stage
the day's candidate pull from git + the research index + the tracker, and Zaal picks + humanizes. That is the
concrete answer to "how do you sustain daily" - not more writing, better selection from what already exists.

This closes the cadence tension in the README: daily is sustainable *for ZAO specifically* because supply outstrips
one issue per day by a wide margin. The bottleneck is curation + voice, not raw material - and both are already tooled
(`zabalnewsletterbuilder` voice grader, the daily-3 loop, ZOE).

## Open follow-ups for the loop

- Draft the ACTUAL landing-page + welcome-sequence copy WITH Zaal (brainstorm first, then mirror voice) - not
  unilaterally.
- Confirm which lead magnet is cleared for public use.
- Check whether `zabalnewsletterbuilder` should host the landing page + a welcome-sequence module (code follow-up).
