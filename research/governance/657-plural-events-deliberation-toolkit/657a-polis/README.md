---
topic: governance
type: guide
status: research-complete
last-validated: 2026-05-21
related-docs: 657, 056, 058
tier: STANDARD
parent-doc: 657
---

# 657a — Polis

> **Goal:** Use Polis as the "wrap-up" deliberation tool at any ZAO event where you want to surface latent cross-cutting consensus after a regular facilitated discussion.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Use Polis for Maine Plural Event wrap-up | YES, last 15 minutes | Jess Scully's exact prescription. No login required. Browser-only. Free. OSS. |
| Use Polis for The ZAO Farcaster channel governance | YES via embed | Members already gated by Neynar; Polis-as-iframe in /thezao channel discussion thread |
| Use Polis as primary tool for paid client deliberation work | NO | Use Context Engine or dembrane for that — Polis is bare-bones, lacks integrated audio. Polis is great for the "after-conversation crystallization" stage only. |

## How It Works

Three buttons: agree / disagree / pass. Anonymous. No account creation. Participants vote on **seed statements** submitted by other participants. Algorithm clusters voters into opinion groups, then surfaces:
1. **Majority consensus** — what most agree on
2. **Cross-cutting consensus** — what holds across opposing clusters (the "plural majority" magic)
3. **Group-divisive statements** — what splits clusters

Participants are encouraged to **submit new seed statements** as the conversation evolves and to **re-vote** as new statements appear. Jess Scully on the call: "It is a cyclical sort of experience over the course of half an hour."

## Iconic Use Case

Taiwan 2015 — Uber vs. taxi conversation. Audrey Tang (then digital minister) ran Polis. Surface split: anti-Uber vs. pro-Uber, two roughly equal camps. Below the surface: **92% of all participants agreed** on the underlying safety + liability + insurance outcomes they wanted, regardless of who provided the ride. Policy got built on the 92% answer.

## Use Pattern Recommended By RadxChange For Live Events

1. Run a regular facilitated 45-min discussion (no tool).
2. Last 15 min: open Polis on a screen / shared link / QR.
3. ~5 min: each participant writes 1-2 seed statements based on what came up in the room.
4. ~10 min: everyone agrees / disagrees / passes on all statements; cycles back to add more if inspired.
5. After the event: keep the Polis open for asynchronous late-joiners.

## What Polis Won't Do

- Doesn't transcribe / record audio — that's dembrane's job.
- Doesn't generate seed statements from a meeting recording — that's Context Engine's job.
- Doesn't do strength-of-preference voting (use RadxChange QV for that).
- Doesn't give cluster groups human-readable names (Agora Citizen does that with AI).

## Strengths

- Zero login friction — biggest plus for a one-off event.
- Battle-tested at population scale (Taiwan policy, Bowling Green Kentucky, Australian state-level deliberations).
- Open source (AGPL). You can self-host. compdemocracy.org maintains it.
- Surfaces the "plural majority" structure — the original tool for this concept.

## Limitations

- Bare-bones UI; some participants don't get how to engage without prompting.
- No native i18n out of the box.
- Self-hosting requires real DevOps (PostgreSQL + Node + math service); managed pol.is exists but unclear uptime guarantees in 2026.
- Seed statements need facilitator pre-seeding for any group < 30 people, otherwise the bootstrap is awkward.

## Cost

Free. OSS. Self-hosted instances run on a small VPS; managed pol.is.tw instance is free for civic use.

## ZAO Integration Path

Lowest effort: link to a hosted Polis conversation from a Farcaster cast + The ZAO channel. The browser-only nature means no Neynar SIWN integration needed.

Higher effort: build a Polis-on-Farcaster Mini App that embeds a Polis conversation inside the Farcaster client. Out of scope for Phase 1.

## Sources

- [Polis (compdemocracy)](https://compdemocracy.org/polis/) — canonical project page
- [Polis Wikipedia](https://en.wikipedia.org/wiki/Pol.is) — history + iconic case studies
- [Polis on Hacker News](https://news.ycombinator.com/item?id=46992815) — community discussion
- [Polis academic paper / ProQuest](https://www.proquest.com/scholarly-journals/polis-scaling-deliberation-mapping-high/docview/2610037205/se-2)
- [Opportunities and Risks of LLMs with Polis — arxiv 2306.11932](https://arxiv.org/abs/2306.11932)
- Meeting transcript with Jess Scully's Polis walkthrough — `research/governance/657-plural-events-deliberation-toolkit/README.md`
