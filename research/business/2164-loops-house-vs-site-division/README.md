# 2164 - Loops House vs zabalgamez.com: Division of Labor for ZABAL Gamez

**Date:** 2026-07-31
**Status:** Strategy (analysis + recommendation). Grounded in FIRSTHAND use of the live Loops House host dashboard (the ZABAL Gamez Finals event RK stood up) + the zabalgamez.com site. Zaal will refine with a recording; this is the "while you record, research how we use Loops House" pass.
**Owner:** Zaal
**Siblings:** [[project_zabal_games]], doc 2137 (August Finals), [[project_zabal_games_august_pipeline]], [[project_ryan_kagy]] (RK/Loops House founder), the zabalgamez.com repo (ZAODEVZ/zabalgames).

---

## Context

RK (Ryan, founder of **Loops House** - loops.house, an agentic hackathon platform) stood up a **ZABAL Gamez Finals** event on his platform for Zaal and is helping run it. This doc answers: what should Loops House do, and what should zabalgamez.com keep doing? The canonical August Finals model (Zaal, 2026-07-31): August = the July open-build submitters; two weeks of weekly tasks per track (Artist/Builder/Creator); top 2 per track go into 3-5 WaveWarZ battles for one winner per track; $500 USDC tiered pool; partners = The ZAO festivals team / Empire Builder / WaveWarZ / loops.house.

## What Loops House actually does (from the host dashboard, firsthand)

The **operational machinery of a hackathon event**, in one place:

- **Event landing editor** - tabs: Hero (banner, logo, and the **schedule**: Registration Deadline / Build Start / Build End-Submission Close / Results Announced, with timezone), About (tagline + description + tracks + eligibility), Speakers, **Submission Form**, Feedback, FAQ.
- **Sponsors** - add a sponsor (name + contact email) who gets a **dashboard, bounties, and JUDGING**; marketing partners are logo-only. (Set up: **The ZAO** as sponsor, Zaal's email active = the ZAO holds the judging seat.)
- **Participants** - people **self-enroll** after publish; the dashboard tracks registered count, locations, socials, join time. (Host does NOT bulk-add - see the gap below.)
- **Submissions** - participants submit per the submission form.
- **Winners flow** - after the judging period, sponsor-submitted picks surface for host review -> **one-click publish** to a public winners page. Set an end/results date to schedule the unlock.
- **Publish Event** - the go-live button (opens registration + makes the landing public).

In short: **register -> submit -> sponsor judges -> one-click winners.** Clean, purpose-built, low-effort. It is a real hosted platform, not a template.

## What zabalgamez.com does (the site)

The **full season front door + narrative + long tail** - ~40+ hand-built pages: the home/season card, `/content` (This Month), `/finals` (The Market Decides), `/enter`, `/submissions`, `/builder`, `/projects`, `/live`, `/recaps`, `/leaderboard`, `/graph`, `/clips`, `/board`, `/about`, and more. Plus Farcaster mini-app embeds on every page, the brand/design system, `llms.txt` for GEO, and the community story. It is owned, versioned, and infinitely customizable - but every page is hand-built and hand-maintained.

## The recommended split

**Use Loops House as the FINALS operational backend. Keep zabalgamez.com as the front door + story + everything-else. The site links OUT to the Loops House event for the three actions Loops House does better than a static page: enroll, submit, and see winners.**

| Job | Owner | Why |
|-----|-------|-----|
| Finals registration / enrollment | **Loops House** | Self-serve enroll + participant tracking is built-in; a static site can't hold state. |
| Per-week task submissions | **Loops House** | The submission form + per-participant records are the platform's core. Beats a Google Form or a manual board. |
| Judging + winner picks | **Loops House** | Sponsor (The ZAO) judging dashboard + one-click winners publish. No custom tooling to build. |
| Public winners page (results) | **Loops House** (canonical) -> mirror/link from the site | Loops House auto-publishes; the site can embed/link it so `/winners` stays on-brand. |
| The season STORY, tracks, arc, the "what is this" | **zabalgamez.com** | The narrative, brand, GEO (`llms.txt`), and Farcaster embeds are the site's strength. `/content` + `/finals` already tell it. |
| Workshops, projects, recaps, live, clips, graph, leaderboard | **zabalgamez.com** | The whole non-finals season lives here; Loops House is finals-only. |
| Farcaster mini-app / embeds / channel | **zabalgamez.com** | Deep Farcaster-native distribution the platform doesn't do. |

**Rule of thumb:** if it needs to *hold state per participant* (who registered, who submitted what, who won), it belongs on **Loops House**. If it is *narrative, brand, or the broader season*, it belongs on **the site**. The site is the front door that sends people INTO the Loops House finals for the stateful actions.

## Gaps / frictions found (feedback for RK)

1. **No host-side bulk import of participants.** ZABAL's model is "everyone who submitted in July is auto-in" (dozens of people). Loops House only supports self-enroll - so the pool has to individually register, which loses the "you're already in" magic. Ask RK for a host CSV/handle import, or a way to pre-seed the participant list.
2. **Farcaster-handle identity.** ZABAL's people are known by Farcaster handle, not email. If Loops House keys on email, there's an identity-mapping cost. A "connect Farcaster" enroll would fit ZABAL natively.
3. **Tracks as a first-class grouping.** The finals are per-track (Artist/Builder/Creator) with per-track winners. If Loops House modeled tracks (a submission belongs to a track, winners are per-track), it maps 1:1; otherwise it's manual.
   (Note: earlier "mentor pods" feedback is now moot - the canonical finals model is weekly-tasks + WaveWarZ battles, not pods.)

## Risks / considerations

- **Dependency + data ownership:** the finals' participant + submission data lives on Loops House (a third party). Fine for one season; if ZABAL scales, decide whether to export/own it. The site data stays in the repo (owned).
- **Two surfaces telling one story:** they must stay consistent. `/content` + `/finals` were reconciled to the canonical copy (weekly tasks + WaveWarZ battles) 2026-07-31 so the site and the Loops House About match. Keep them in sync when either changes.
- **Publish timing:** the Loops House "Publish Event" is Zaal's gated action - it opens public registration. The site can go live first (the story), then the event publishes when the schedule is final.

## Recommendation (one line)

Run the **Finals on Loops House** (enroll/submit/judge/winners), keep **everything else on zabalgamez.com** (story, season, brand, Farcaster), and have the site link into the Loops House event for the three stateful actions. Push RK for host bulk-import + Farcaster-handle enroll so the "July submitters are auto-in" model actually works.

## Source

Firsthand host-dashboard walkthrough of the live ZABAL Gamez Finals event on loops.house (2026-07-31), the zabalgamez.com repo, and Zaal's canonical finals copy. RK context: [[project_ryan_kagy]]. Awaiting Zaal's recording for his fuller vision.
