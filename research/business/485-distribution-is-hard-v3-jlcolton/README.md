# 485 — Distribution Is Hard V3 (jlcolton) — GTM Field Guide for Builders

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Extract the operating principles from jlcolton's V3 rewrite and translate them into a distribution playbook for ZAO OS, ZAO Music, BCZ Strategies, and the portal bot fleet.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Apply "build distribution from day one" to every ZAO launch? | USE — every new feature/brand/bot gets a distribution plan before the first commit. No exceptions. Matches Zaal's "document every step for content creation" rule (`feedback_build_public.md`). |
| Adopt the FounderCheck 4-question diagnostic as a ZAO `/new-feature` gate? | USE — 5 minutes, blocks over-engineering. Wire it into `/worksession` so every new `ws/` branch is stamped with the 4 answers. |
| Use Dog Food Labs agent-research pattern for ZAO? | USE — applied to ZAO Music release planning: agents listen to Reddit / Farcaster / X for "music distribution pain," score pitches, hold contradictions. Low-cost prototype. |
| Replace "ICP/JTBD" jargon in ZAO docs? | USE plain language — "best-fit customer" + "the job your product does" — so the 100+ ZAO community members (many non-technical) can actually use the same frameworks. |
| Replicate Marc Louvion's build-in-public loop for ZAO Music + BCZ? | USE — literally copy the 1K→45K Twitter/Farcaster journey template: daily cast after every user conversation, using their exact words. |

## Comparison of Options

| Framework | Audience | Vocabulary | Evidence-based | Fit for ZAO |
|---|---|---|---|---|
| **Distribution Is Hard V3** | Builders, not MBAs | Plain language | Validated by Dog Food Labs (Reddit + PH scoring) | Excellent |
| Paul Graham essays | Founders | Abstract | Anecdotal | Good, orthogonal |
| April Dunford — Obviously Awesome | Positioning focus | Jargon-heavy | Case studies | Partial |
| Superhuman — Rahul Vohra PMF engine | B2B SaaS | Survey-driven | Quantitative | Good for BCZ Strategies |
| Lenny Rachitsky playbooks | Broad | Jargon | Aggregated | Reference-only |

## The V3 Core Claims, ZAO-Applied

1. **Distribution is downstream of the job.** A product with unclear job-to-be-done cannot be distributed — hype is not a substitute. For ZAO Music: the job is "artist gets paid + gets heard." For ZAO OS: the job is "find your people in a gated, high-signal music community." For BCZ Strategies: the job is "musician hires a bench of ZAO operators to do the work their label won't."

2. **The pain comes from your users, not your head.** Write down their exact phrases. Phrases beat slogans. Already codified in `project_zao_master_context.md`: post their words, not ours.

3. **Failure layer = honesty.** Founders retreat into building when distribution feels hard. ZAO antidote: publish the pain phrases weekly (ties into `/socials` skill).

4. **Pre-sale evidence > post-launch hope.** One of the blocks we saw caught via FounderCheck scoring: "50 people asked to pay, all 50 ghosted." Before any ZAO product spins up, get N=10 people who say "I'd pay for this" with a specific before-state trigger.

5. **Before-state trigger.** Your best-fit customer must describe a **recent, specific failure** and a **workaround they already tried**. If they can't, they're not your customer yet.

6. **Behavioral state classification.** A signal from someone mid-failure is worth more than a theoretical complaint. Applied to ZAO Music: the artist who just got dropped by their label is a hotter lead than a happy label-signed artist who "likes what we're doing."

## The Build-In-Public Loop (copy-paste)

From V3 Chapter 1 — the 6-step loop we should adopt as a formal skill:

```
1. Talk to someone in pain (real conversation, no pitch)
2. Capture their exact phrase, verbatim
3. Share that pain or insight publicly (cast, tweet, post)
4. Watch who self-identifies ("Wait, that's me")
5. Their reply becomes the next conversation
6. Product + message sharpen each cycle
```

## Concrete Integration Points

- `.claude/skills/build-public.md` — NEW. Runs the 6-step loop daily. Outputs a cast draft to `content/` and a pain log to `research/community/`.
- `.claude/skills/pain-log.md` — NEW. After every meeting, prompts for top 3 exact phrases; writes to `research/community/pain-log-{YYYYMM}.md`.
- `src/app/api/onboarding/` — the member profile flow should capture the 3 questions from FounderCheck-style prompts (before-state, workaround tried, pain phrase).
- `community.config.ts` — add `distributionPrinciples: string[]` that the AI copy skills read as hard constraints.
- `research/business/README.md` — promote this doc to the top of the GTM section.

## Specific Numbers

- **$50K MRR in 40 days** — ShipFast (Marc Louvion) via pure Twitter build-in-public.
- **1K → 45K Twitter followers** — his pre-launch audience build.
- **422K** Twitter impressions on ShipFast launch day.
- **$12K/month → $18.5M ARR** — Buffer's transparency arc (2013 → 2024).
- **$54M burned in 8 months → $3M revenue** — The Messenger, the anti-pattern.
- **444K downloads** — Artifact's total before shutdown despite Instagram founders.
- **<18 months** — Artifact's lifespan.
- **5** top ZAO subreddits worth scanning for distribution pain signal (Dog Food Labs pattern).

## What to Skip

- SKIP any "distribution is mainly paid ads" framing.
- SKIP the book's chapter-by-chapter outline as a blog series — cite and link, don't repost.
- SKIP the FarCon anecdote as a template — read it once to appreciate the plain-language pivot, then move on.

## Risks

- Build-in-public works for commodity builders. For ZAO Music artists, some content and strategy MUST stay private (licensing, master recordings). Calibrate transparency per entity.
- Pain phrases can be selection-biased if the sample is too small. N=10 minimum before treating as signal.

## Sources

- [Distribution Is Hard V3 — jlcolton](https://github.com/jlcolton/distribution-is-hard/blob/main/Distribution%20Is%20Hard%20V3.md)
- [FounderCheck mini-app on Farcaster](https://farcaster.xyz/miniapps/Qe6jQvs9RG_o/foundercheck)
- [Marc Louvion — ShipFast case study](https://shipfa.st/)
- [Buffer transparency timeline](https://buffer.com/open)
- [Peter Thiel — Zero to One](https://www.amazon.com/Zero-One-Notes-Startups-Future/dp/0804139296)
