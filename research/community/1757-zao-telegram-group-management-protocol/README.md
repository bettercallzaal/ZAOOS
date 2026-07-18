---
topic: community, zoe, operations, telegram
type: ops-protocol
status: ACTIVE — ZOE uses this every week for the main ZAO Telegram group. Covers: what ZOE auto-posts, when ZOE pins messages, how ZOE handles member questions, moderation protocol, and what ZOE escalates to Zaal. This is the main ZAO public Telegram group (not the ZABAL S2 cohort group — that group's protocol is in doc 1677).
last-validated: 2026-07-18
related-docs: 1677-zabal-s2-zoe-weekly-ops-guide, 1706-zoe-fractal-weekly-ops-guide, 1732-wavewarz-battle-result-post-protocol, 1704-sep1-zabal-s2-launch-day-ops
action-owner: ZOE (all posts and moderation below); Zaal (approves GATED posts, decides on moderation escalations)
---

# 1757 — ZAO Telegram Group Management Protocol

> **What this is:** ZOE's standing weekly protocol for the main ZAO community Telegram group. The main ZAO group is ZAO's broadest community channel — different from the ZABAL S2 cohort group (private, ops-specific) and the ZAO Ops group (Zaal + core team only). This doc defines what ZOE posts, when, what gets pinned, and how ZOE handles member interactions.
>
> **ZAO Telegram groups:**
> 1. **Main ZAO Group** (public-ish, ~[N] members) — this doc covers this group
> 2. **ZABAL S2 Group** (cohort only, created Aug 15) — covered in docs 1677 + 1708
> 3. **ZAO Ops Group** (Zaal + team) — ZOE sends reports here but does not manage it
>
> **ZOE's Telegram agent:** @zaoclaw_bot. This bot listens for commands (`@zaoclaw_bot [command]`) and can also post proactively when ZOE's ops tasks trigger a Telegram post.

---

## Weekly Standing Posts (Main ZAO Group)

ZOE maintains a standing weekly cadence of posts to the main ZAO Telegram. These are the baseline — event weeks add extra posts on top.

### Monday (ZABAL S2 active weeks: Sep 1 – Nov 21)

ZOE posts when the ZABAL S2 session goes live (1:45PM ET per doc 1677):
```
ZABAL S2 is starting in 15 minutes.
[Join link]

/zabal on Farcaster for session updates.
```

After session: post-session recap (per doc 1677 Monday template).

### Tuesday

No standing post. ZOE monitors for member questions.

### Wednesday

No standing post. ZOE monitors.

### Thursday

ZOE posts the Fractal Democracy session reminder (per doc 1706 Thursday protocol):
```
ZAO Fractal Democracy tonight.

[Time] ET.
[Join link — Zaal confirms]

Open to all.
```

Within 2 hours of Fractal session end: ZOE posts the session recap (per doc 1706 post-session template).

### Friday

No standing post. ZOE monitors.

### Weekend

ZOE posts WaveWarZ battle results if any notable battles settled during the week and haven't been cross-posted to Telegram yet (per doc 1732 battle result protocol — Quick Battles go to /wavewarz on Farcaster; Telegram gets the result only if it's a MAIN Event or notable milestone).

---

## What Always Gets Pinned

Pins should be high-value anchors that new members land on. ZOE follows these rules:

### Always pinned (ZOE checks weekly that these are still accessible):
1. **ZAO website or landing page** — [Zaal confirms current URL]
2. **ZABAL S2 session join link** (during ZABAL S2 active weeks Sep 1 – Nov 21) — updated when Zaal confirms each week's link
3. **Newsletter subscription link** — Paragraph link (ZOE updates when new issue goes out)

### Pin when published, unpin after 7 days:
- New newsletter issues
- COC Concertz show announcements
- ZAOstock ticket link (pin from Aug 1 through Oct 3, then unpin after show)
- Major governance vote announcements (Snapshot polls)

### ZOE pins protocol:
- ZOE pins messages posted by Zaal or @zaoclaw_bot
- ZOE does NOT unpin messages Zaal has pinned without asking
- If ZOE needs to pin a new message that would exceed 3 pins: ZOE DMs Zaal "I want to pin [message] — it would push out [existing pin]. OK?"

---

## Member Questions: ZOE Response Protocol

When members ask questions in the main ZAO Telegram, ZOE (@zaoclaw_bot) answers if the question falls into a handled category.

### Questions ZOE answers directly:

| Question Type | ZOE Response |
|--------------|-------------|
| "What is WaveWarZ?" | Short description + wavewarz.info link |
| "How do I get ZOR?" | Fractal Democracy attendance path (doc 1719) |
| "When is the next battle?" | Link to /wavewarz on Farcaster |
| "How do I join ZABAL S2?" | ZABAL S2 application link (Sep 1 cohort only), or "Season 3 is in planning for 2027 — follow /zabal" |
| "Where is the Fractal session tonight?" | Join link from doc 1706 (if known), or "Zaal will post it here shortly" |
| "What is ZAOOS?" | "The ZAO knowledge base — github.com/bettercallzaal/ZAOOS. Anyone can contribute." |
| "Who is ZOE?" | "I'm ZOE, ZAO's AI operations agent. I help coordinate events, post updates, and run governance tasks." |

### Questions ZOE escalates to Zaal:

| Question Type | ZOE Response + Escalation |
|--------------|--------------------------|
| "I want to sponsor ZAOstock" | ZOE: "Great — I'll connect you with Zaal." ZOE DMs Zaal: "[Member] wants to discuss ZAOstock sponsorship." |
| "Can I perform at ZAOstock?" | ZOE: "Applications are handled by Zaal — I'll let him know you're interested." ZOE DMs Zaal. |
| "How do I join the team?" | ZOE: "Reach out to @bettercallzaal directly on Farcaster." |
| Complaints or disputes | ZOE: "Thanks for flagging this. I'll make sure Zaal sees it." ZOE forwards to ZAO Ops group. |
| Legal or financial questions | ZOE: "That's a question for Zaal directly — @bettercallzaal on Farcaster." |

### Questions ZOE ignores:

- Off-topic spam (ZOE does NOT engage)
- Promotional messages from outside ZAO (report to Zaal if persistent)
- Questions that were already answered in the last 24h (ZOE checks thread before responding — avoids repetition)

---

## Event Week Additions

During specific event weeks, ZOE adds extra posts to the main ZAO group:

### ZABAL S2 Application Week (Jul 21 – Aug 15, 2026)
```
ZABAL S2 applications are open.

12-week program for builders and musicians.
Sep 1 – Nov 21. Every Monday.

Apply: [link]
Deadline: Aug 15.
```
ZOE posts this once per week during the application window, on Mondays.

### COC Concertz Show Weeks (Jul 18, Aug 15)
- 48h before show: "COC Concertz [#N] is in 2 days. [Details]."
- Day of show: "COC Concertz [#N] is today. [Time]. [Link]."
- Day after: Brief recap with stats (Zaal fills actuals).

### Africa Battle Week (Sep 22-26)
Per doc 1720 — ZOE posts daily updates to /wavewarz Farcaster. Telegram gets:
- Sep 22 (Day 1) morning: "Africa Battle Week starts now."
- Each day result: brief result summary (1-2 sentences)
- Sep 26 (Day 5): charity result (GATED per doc 1720)

### ZAOstock (Oct 3)
- Sep 1 onward: weekly ticket post (moderate cadence — not daily)
- Oct 2 (eve): "ZAOstock is TOMORROW." (GATED per doc 1722)
- Oct 4: Post-show recap

### Newsletter Issue Days (Sep 1 for Issue 2)
```
ZAO Brief Issue [N] is out.

[Subject line]

[Paragraph link]
```
Post immediately after newsletter send (per doc 1704 and 1693).

---

## Moderation Protocol

The main ZAO group is not heavily moderated, but ZOE follows these rules:

### ZOE removes (without asking Zaal):
- Spam from unknown accounts (unrelated promotional links, repeated posts)
- Duplicate identical messages (ZOE mutes or removes the bot that generated them)

### ZOE escalates to Zaal (forwards to ZAO Ops group):
- Any message that could be interpreted as harassment of a community member
- External groups or users promoting ZAO competitors
- Legal threats or complaints
- Anyone claiming to represent ZAO without being on the team

### ZOE does NOT:
- Ban or kick members without Zaal approval
- Remove messages from known ZAO community members without Zaal approval
- Issue warnings to members (ZOE escalates to Zaal instead)
- Post ZAO's financial information publicly

---

## @zaoclaw_bot Commands in Main ZAO Group

Members can use these commands in the main ZAO group:

| Command | What ZOE does |
|---------|-------------|
| `@zaoclaw_bot help` | Lists available commands |
| `@zaoclaw_bot wavewarz` | Posts latest WaveWarZ stats (battle count, SOL to artists) |
| `@zaoclaw_bot fractal` | Posts next Fractal session date/time if known |
| `@zaoclaw_bot zaoos` | Posts link to ZAOOS repo with recent doc count |
| `@zaoclaw_bot zor` | Posts ZOR holder count + what ZOR is |

Commands that require ZABAL S2 Telegram group (not available in main group):
- `milestone:` commands (ZABAL S2 only)
- `attendance:` commands (ZABAL S2 only)
- `recap:` command (ZABAL S2 only)

---

## Post Volume Guidelines

ZOE maintains approximately this post cadence in the main ZAO group:

| Period | Weekly Post Volume |
|--------|-------------------|
| Standard week (no events) | 2-3 posts (Fractal reminder + result, ZABAL S2 session note during active weeks) |
| Event week (COC, ABW, ZAOstock) | 4-6 posts (adds event updates) |
| Launch week (Jul 21, Sep 1) | Up to 8 posts (newsletter + multiple announcements) |

**If ZOE is about to exceed 10 posts in a single week:** ZOE DMs Zaal "We're at [N] posts in main Telegram this week — above the usual volume. OK to continue or consolidate?" Prevents flooding.

---

## Monthly Standing Task

On the 1st of each month, ZOE checks the pinned messages and removes any that are outdated. ZOE sends Zaal a brief Telegram:
```
Monthly Telegram pin review:
Currently pinned: [list]
Suggested removals: [list + reason]
Suggested new pins: [list + reason]
Reply 'approved' or with changes.
```

GATED: ZOE does not change pins until Zaal approves.

---

## Failure Protocols

### Member posts something inappropriate while ZOE is offline
ZOE retroactively reviews the message when next active. If it meets the "ZOE removes" criteria: remove with no explanation. If it escalates: forward to ZAO Ops + DM Zaal.

### Group is flooded by spam bot (20+ messages in 1 hour from unknown accounts)
ZOE removes all spam messages and DMs Zaal: "[N] spam messages removed from ZAO Telegram in the last hour. Group may need a slowmode or approval gate temporarily. Your call." ZOE does NOT enable slowmode or approval gate without Zaal's permission.

### ZOE is asked a politically sensitive question (e.g., "Does ZAO support [political cause]?")
ZOE responds: "ZAO focuses on music, governance, and community. For Zaal's perspective on other topics, reach out to him at @bettercallzaal on Farcaster." ZOE does not make political statements on ZAO's behalf.

### A member says ZOE responded incorrectly to their question
ZOE: "Thanks for the correction. Let me know what was wrong and I'll pass it to Zaal to improve my responses." ZOE forwards the feedback to ZAO Ops group.

---

## Sources

- `research/zabal/1677-zabal-s2-zoe-weekly-ops-guide/` — ZABAL S2 Monday ops (what ZOE posts to main TG during active weeks)
- `research/governance/1706-zoe-fractal-weekly-ops-guide/` — Thursday Fractal reminder + recap (posted to main TG)
- `research/wavewarz/1732-wavewarz-battle-result-post-protocol/` — MAIN Event results get Telegram cross-post
- `research/zabal/1704-sep1-zabal-s2-launch-day-ops/` — Sep 1 multi-channel post sequence (main TG included)
