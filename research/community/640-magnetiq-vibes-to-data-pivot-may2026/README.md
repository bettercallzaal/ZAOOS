---
topic: community
type: decision
status: research-complete
last-validated: 2026-05-11
related-docs: [Doc 65 — ZABAL Partner Ecosystem, Doc 641 — Whop integration for Claude Code community]
tier: STANDARD
source: tyler-stambaugh-call-2026-05-11
---

# 640 — Magnetiq pivot: from "build community" to "vibes-as-data"

> Goal: capture Tyler Stambaugh's new Magnetiq positioning, shipping features, and the ZAO MAGNETIQ Telegram bot action item Zaal committed to this week.

## TL;DR (3 sentences)

Tyler is pivoting Magnetiq from "build your community" to "help you turn community vibes into data you can understand." Shipping batch-send feature to reduce notification fatigue. Zaal owes him: build a Telegram bot for dual-user research chat (Hermes pattern) to spec the ZAO-Magnetiq integration.

---

## Magnetiq's pivot: positioning shift

### OLD positioning
"Build your community" (generic, losing battle, competitive dead-end)

### NEW positioning
"Turn community vibes into data you can understand"

**Why the pivot:** Tyler observes that community organizers (like Zaal) run events, reward people, engage them deeply, then ask: "Am I wasting my time and money? Is this actually working?" Magnetiq's answer shifts from building tools to providing **data insight**. Vibes get quantified.

**The metaphor:** "You're putting out breadcrumbs with all the magnets you're doing. Use us as the anchor, the golden data source for your community activity."

---

## New features shipping

### Batch send (in flight)
UI pops on create: "Send to everybody? Yes/No." Batch multiple announcements, toggle "don't send email," fire all at once. Reduces notification fatigue.

### Data anchor
Magnetiq = single source of truth for community activity. Attendees scan QR, upload selfies, answer surveys, collect badges. Data stays in Magnetiq for orgs to import and analyze.

---

## ZAO MAGNETIQ telegram bot — the action item

**What Zaal owes Tyler:** "I gotta create a telegram bot for ZAO MAGNETIQ specifically, and give it the information you sent me. I'm going to create the bot with that, put it in a telegram chat with us, and then we can both chat to research this specific thing."

### Bot spec

| Aspect | Details |
|--------|---------|
| **Name** | ZAO MAGNETIQ (or similar) |
| **Pattern** | Hermes brain pattern (ref: `project_hermes_canonical`); dual-user research assistant |
| **Users** | Zaal + Tyler |
| **Purpose** | Research assistant for speccing ZAO-Magnetiq integration. Helps both: 1) Tyler understand ZAO use cases, 2) Zaal understand Magnetiq data + API architecture |
| **Context** | Tyler will send markdown files with Magnetiq data + API details via Telegram |
| **Entry point** | `bot/src/magnetiq/` (new folder following Hermes pattern) |
| **Build timeline** | This week |
| **Access** | Shared Telegram DM with Tyler (not a public bot) |

### What Tyler sends

Tyler goes into his local codebase to export Files/Docs for Magnetiq integration context. Zaal will receive links/markdown + load into the bot's knowledge base.

---

## Whop cross-pollination

Zaal plans Claude Code community on Whop (digital creators). Greg Gonzales is the Whop contact. Magnetiq + Whop could share distribution. See Doc 641.

---

## Background context

- **Farcaster hackathon win:** $1k first funding into ZAOstock Oct 3
- **Conference momentum:** ZAO mentioned in Rome this week
- **ZAOVille:** DMV event, July 2026, pre-ZAOstock test
- **Fiscal path:** Fail Often + New Media Commons partnership for tax-deductible donations

---

## Action items

| Action | Owner | By when |
|--------|-------|---------|
| Receive context files from Tyler | Tyler | This week (TG) |
| Build ZAO MAGNETIQ bot (Hermes pattern) | Zaal | This week |
| Load Tyler's context into bot KB | Zaal | After files arrive |
| Start dual-user research chat | Both | After bot ready |

---

## Next step TODAY

**Zaal should:** DM Tyler on Telegram asking him to send the Files/Docs links + markdown context for Magnetiq integration. Once received, Zaal can block 1-2 hours to build the bot using the Hermes pattern (ref: `bot/src/zoe/` as template).

**Estimate:** 2 hours to spin up dual-user bot + load context. Launch it, then collab with Tyler for spec iteration.

---

## Sources

- Call transcript 2026-05-11 (Zaal + Tyler Stambaugh), via Otter.ai
- Doc 65 — ZABAL Partner Ecosystem (Magnetiq background, Proof of Meet, Tyler contact)
- Memory: `project_hermes_canonical` (Hermes-brain bot pattern for ZAO)
- Magnetiq background from Doc 65: Flow blockchain, Dapper Wallet, POM badges, tyler@magnetiq.xyz
