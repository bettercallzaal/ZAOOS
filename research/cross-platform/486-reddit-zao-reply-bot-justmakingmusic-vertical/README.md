# 486 — Reddit Reply Bot for ZAO + JustMakingMusic as a Distribution Vertical

> **Status:** Research complete
> **Date:** 2026-04-23
> **Goal:** Scope a ZAO reply bot that engages Reddit threads about independent music / music distribution / DAW tools — using JustMakingMusic-style organic accounts as the distribution wedge — without tripping Reddit anti-spam, PRAW ToS, or our own brand guard rails.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|---|---|
| Build a Reddit reply bot for ZAO? | USE, constrained — **assist, not autonomous-post**. Bot drafts replies into ZOE's Telegram; Zaal (or a human ZAO member) approves/sends via a personal Reddit account. This is the only pattern that survives Reddit's anti-spam stance. |
| Platform? | USE **PRAW** (Python) or **snoowrap** (Node/TS). TS keeps us in-stack. |
| Accounts? | USE **individual ZAO member accounts**, never a branded "TheZAO" account. Reddit aggressively removes brand accounts that reply in niche subs. Each member posts in their voice. |
| JustMakingMusic as a vertical to mimic? | USE the **shape** (cross-posted to `r/Songwriting`, `r/audioproduction`, `r/podcast`, `r/ContentCreators`, `r/AoristAudioFAQ`) as a map of the independent-musician Reddit graph. They're running a podcasting resource play. We can run a "release your first track on Farcaster" play into the same subs. |
| Legal risk? | Low if humans send. High if automated + undisclosed. Follow [Reddit ToS 2.5](https://www.redditinc.com/policies/user-agreement) — bots must be disclosed. Treat this as "augmented outreach," not "reply bot." |
| Target subs? | USE the 6 JustMakingMusic ran through: `r/Songwriting`, `r/audioproduction`, `r/podcast`, `r/ContentCreators`, `r/AudioProductionTools`, `r/AoristAudioFAQ`. Add `r/WeAreTheMusicMakers`, `r/makinghiphop`, `r/edmproduction`, `r/IndieDev` for breadth. |

## Comparison of Options

| Approach | Automation level | Risk | Cost | ZAO fit |
|---|---|---|---|---|
| **Draft-to-Telegram, human sends** | Assist | Low | $0.10/day LLM | **Pilot this** |
| Auto-post via PRAW | Full auto | High (shadowban, ToS) | Low | SKIP |
| Manual only, no bot | None | None | Time | Baseline |
| Paid outreach on Reddit Ads | Full auto (ads) | Low | $$$ | Not our wedge |
| OP-led partnerships (sub mods) | Human | Low | Time | Complement |

## Required Safeguards

1. **Disclosure.** If automated, post must say so. Better: never auto-post.
2. **Rate limits.** Max 3 replies/day per account. Max 1 per sub per day.
3. **No link-first replies.** Helpful answer first; link in a reply-to-reply only if asked.
4. **Account age gate.** Reddit auto-filters accounts <30 days old in most music subs. Use accounts older than 30 days with karma >100.
5. **No DM outreach** as the first move — Reddit treats that as harassment very quickly.
6. **Ban the word "ZAO" in the first 2 sentences** — leads with value; brand on the second beat.

## The JustMakingMusic Vertical

Confirmed posts (from Reddit JSON scrape, 2026-04-23):
- `r/AoristAudioFAQ` — welcome + FAQ posts
- `r/ContentCreators` — "Free Resource For First Time Podcasters"
- `r/audioproduction` — same resource cross-post
- `r/podcast` — same resource cross-post
- `r/u_JustMakingMusic` — personal stream: "Working on my own guitar arrangement", "New track out today", "I guarantee to make your work better or you don't pay anything"
- `r/Songwriting` — "New track out into the world today"
- `r/AoristAudioFAQ` — "Why the Smartest Podcasters Use YouTube as Their Secret Monetization Hack"

Playbook they're running: build credibility as an individual musician first, then drop resources that cross-promote their services, then cross-post high-value explainers to adjacent subs. Max 5 upvotes per post — low current traction, so this is an early-stage playbook not a proven one. Copy the **shape**, not the numbers.

## ZAO Reply Bot — Draft Spec

```
Input:
  - Watched subs (10)
  - Keywords: "music distribution", "drop my track", "BMI vs ASCAP",
             "best DAW for", "I just got dropped by my label", etc.
Flow:
  1. Cron every 15 min — fetch new posts in watched subs
  2. Classifier (Claude Haiku): is this a pain post worth replying to?
  3. If yes: generate a draft reply using Zaal's or a ZAO member's voice
  4. Push draft to Telegram via ZOE
  5. Human reviews, edits, sends from their own Reddit account
  6. Log: sub, postid, draft, final, outcome
  7. Weekly reflection: what got upvoted? what got removed?
```

## Concrete Integration Points

- `src/lib/publish/reddit.ts` — NEW file for reddit snoowrap client (read-only for scanning, never auto-post).
- `src/app/api/cron/reddit-scan/route.ts` — NEW cron endpoint.
- `src/lib/agents/runner.ts` — add a `reddit-scout` agent class that uses the Matricula 4-layer loop (doc 484) scoped to read-only + draft-only.
- `scripts/seed-reddit-watchlist.sql` — list of 10 subs and their keyword rules.
- `community.config.ts` — add `redditWatchlist: string[]` with the 10 subs.
- `.claude/rules/reddit-conduct.md` — NEW. The 6 safeguards above, enforced.
- `research/cross-platform/README.md` — add this doc as the reddit strategy anchor.

## Specific Numbers

- **10** subs in pilot watchlist.
- **3/day** max replies per member account.
- **>30 days** account-age gate.
- **>100** karma floor for reply accounts.
- **15-min** scan cadence.
- **$0.05–$0.10/day** estimated LLM cost per scout (Haiku classifier + Sonnet drafter).
- **~6** JustMakingMusic cross-post subs confirmed via reddit JSON fetch.

## What to Skip

- SKIP a ZAO-branded Reddit account. Gets nuked.
- SKIP auto-posting from day 1.
- SKIP "reply to every mention of 'music'" — too broad; context-free replies are the definition of spam.
- SKIP merging this with XMTP DM outreach until Reddit pilot shows signal.

## Sources

- [Reddit User Agreement (2.5 disclosure)](https://www.redditinc.com/policies/user-agreement)
- [Reddit self-promotion guidelines](https://www.reddit.com/wiki/selfpromotion/)
- [u/JustMakingMusic profile](https://www.reddit.com/user/JustMakingMusic/)
- [snoowrap TypeScript Reddit client](https://github.com/not-an-aardvark/snoowrap)
- [PRAW Python Reddit API wrapper](https://praw.readthedocs.io/)
