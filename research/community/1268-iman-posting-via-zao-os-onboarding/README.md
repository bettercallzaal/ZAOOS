---
topic: community
type: guide
status: ready-to-use
created: 2026-07-17
board-task: c9655dc3
related-docs: 897, 898, 987, 1261
owner: Iman (executes) + Zaal (grants access)
deadline: 2026-07-23 (Wed session)
---

# 1268 -- Iman Posting via ZAO OS: Onboarding Guide

> **How to use:** This doc gives Iman a step-by-step posting workflow using existing ZAO OS tools. All drafting is AI-assisted; Iman approves before anything posts. Zaal grants accounts per the checklist below.

---

## What Iman Posts (Scope)

| Platform | Account | Cadence | Content |
|----------|---------|---------|---------|
| Farcaster | @zol (ZAO on Farcaster, FID 19640) or @bettercallzaal | Daily | ZAO updates, ZABAL Games, WaveWarZ, COC Concertz events |
| LinkedIn | Zaal's personal LinkedIn | 3x/week Tue-Wed-Thu 8-10am ET | Build-in-public posts (see doc 1261+987 for rules) |
| X (@bettercallzaal) | Zaal's X account | 2-3x/week | Cross-post from Farcaster; ZAO/WaveWarZ moments |
| Instagram @zaoconcertz | New account | 1-3x/week | Reels from COC Concertz + WaveWarZ battle clips |

**Who approves:** Iman DRAFTS, Zaal APPROVES before posting. Nothing goes live without Zaal's review unless explicitly authorized in advance.

---

## Drafting Tools

### Tool 1: zaalcaster LinkedIn Drafter

**What it does:** The zaalcaster Farcaster client has a built-in LinkedIn post drafter (API endpoint, not UI-based). Given a topic + supporting facts, it writes a LinkedIn post in Zaal's voice following 2026 LinkedIn best practices (600-1200 chars, hook in line 1, no hashtags, link in first comment).

**How to call it:**

```bash
# From the zaalcaster directory (or via the Daily tile in the zaalcaster UI)
curl -X POST https://zaalcaster.vercel.app/api/digest \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "linkedin",
    "topic": "WaveWarZ crossed 1,245 battles and 524 SOL volume -- artists get 1% of every trade instantly",
    "facts": "1,245 battles total as of July 17, 2026. 524.15 SOL lifetime volume (~$39K at current prices). 9.07 SOL direct to artists (not counting staker payouts). 98.5% ecosystem payout rate. 921 unique songs."
  }'
```

**Returns:** A full LinkedIn post draft, copy-paste-ready. Iman reads it, edits if needed, sends to Zaal for approval.

**Voice rules (from docs 987, 898):**
- First person, no hype, no emojis, no hashtags
- Opens with a specific result or contrarian take ("When an artist sells their music on Spotify...")
- 600-1200 characters, short paragraphs
- Link goes in the FIRST COMMENT on LinkedIn, not the post body

### Tool 2: Firefly (Farcaster + X)

**What it does:** Firefly is a Farcaster client. Iman can draft a cast in Firefly and either post directly (Farcaster) or cross-post to X.

**Farcaster defaults:**
- Channel: `/zabal` for ZABAL Games content, `/wavewarz` for WaveWarZ, `/zao` for governance
- Open with `ZM` on its own line, then a blank line, then the hook (brand rule from doc 898)
- No emojis, no em dashes, no hashtags (channels replace hashtags)

**X cross-post rule:** Link must go in the FIRST REPLY (not the cast/post body). X penalizes ~50% reach for posts with external links.

### Tool 3: ZOE Telegram (for Zaal's review)

**What it is:** ZOE is the ZAO OS AI concierge, accessible via Telegram `@zaoclaw_bot`. Zaal uses ZOE to review drafts.

**Workflow:**
1. Iman writes a draft (via zaalcaster API or manually)
2. Iman pastes the draft into a shared doc, message, or the ZOE bot (Zaal-auth-locked currently -- see access note below)
3. Zaal reviews in ZOE or Telegram, approves or edits
4. Iman posts

**Note:** ZOE is currently auth-locked to Zaal's Telegram ID. For Iman to have his own ZOE channel, Zaal must add Iman's Telegram ID as an authorized user (blocked until ZAOS multi-user is built; interim: share drafts via Telegram DM or shared note).

### Tool 4: Postiz (scheduling)

**What it does:** Postiz is the cross-platform scheduling tool. Connected to Farcaster and @bettercallzaal X (LinkedIn connection pending, YouTube pending).

**Iman workflow:**
1. Draft approved by Zaal
2. Iman adds to Postiz scheduling queue at the approved time slot
3. Postiz auto-posts at the scheduled time

**Posting time slots (from doc 987):** LinkedIn: Tue/Wed/Thu 8-10am ET. Farcaster: any time, 1-2/day max.

---

## Account Access Checklist

These are the accounts Zaal must grant Iman access to before he can post:

| Account | Status | Action Needed |
|---------|--------|---------------|
| Postiz dashboard | [to confirm: Iman has access?] | Zaal invites Iman to Postiz workspace |
| @bettercallzaal X | [to confirm: shared login or Postiz-connected] | Confirm Postiz connection is live; X auto-posts via Postiz |
| @bettercallzaal LinkedIn | [to confirm: Zaal approves LinkedIn posts] | Iman drafts via zaalcaster API; Zaal pastes and posts manually (or Postiz LinkedIn connection once set up) |
| Farcaster (ZOL account FID 19640 or Zaal's account) | [to confirm: which FID Iman posts as] | Zaal grants Iman custody of ZOL casting key OR Iman uses his own FID and @mentions @zol |
| @zaoconcertz Instagram | New account -- create first (board task 12d09c84, gated) | Zaal creates account, grants Iman access, connects to Postiz |
| @zaoconcertz TikTok | New account (board task d7e7140d, gated) | Same |
| zaalcaster LinkedIn drafter API | API at zaalcaster.vercel.app | No key needed (open endpoint); Iman can call it directly |

---

## Weekly Posting Workflow (3 LinkedIn + daily Farcaster)

### Monday (planning)
- Pull the week's content sources: upcoming ZABAL workshop, WaveWarZ battle results, ZAO Fractal recap
- Use zaalcaster LinkedIn drafter to generate 3 draft posts (1 per source)
- Send drafts to Zaal for review (Telegram DM or shared doc)

### Tuesday (LinkedIn post 1)
- Post the approved LinkedIn draft at 8-10am ET
- Reply to the first comment with the relevant link (Eventbrite, GitHub, WaveWarZ link)
- Reply to any comments within the first hour
- Cross-post the strongest line to Farcaster (/zabal or /wavewarz channel) -- no link needed

### Wednesday (LinkedIn post 2)
- Same as Tuesday with draft #2
- Cross-post Farcaster version

### Thursday (LinkedIn post 3)
- Same with draft #3

### Daily (Farcaster/X)
- 1 short cast per day on Farcaster (workshop announcement, battle result, behind-the-scenes)
- Cross-post 2-3 per week to X via Postiz

---

## Brand Voice Checklist (Iman reads before every post)

- [ ] No emojis anywhere
- [ ] No em dashes (use hyphens)
- [ ] No "excited to announce" openers
- [ ] No hashtags on LinkedIn; channel-only on Farcaster
- [ ] Lead with a specific result or contrarian take, not the event title
- [ ] Link in the FIRST COMMENT on LinkedIn and X, not the post body
- [ ] Ends with a genuine question or invitation to reply
- [ ] Zaal-approved before posting

**Example hook (do this):**
> "WaveWarZ artists get paid 1% of every trade, instantly to their wallet. That is not a royalty. That is a trade split. Here is what that means for a 100-SOL battle..."

**Not this:**
> "Excited to announce that WaveWarZ has crossed 1,000 battles! Check out our platform..."

---

## Content Sources for Iman

| Source | What to pull | How often |
|--------|-------------|-----------|
| WaveWarZ stats (wwtracker) | Battle count, SOL volume, artist payouts, new songs | Weekly |
| ZABAL Games recaps (data/recaps.json) | Workshop highlights, guest names, what was built | After each session |
| COC Concertz show | Show date, artist lineup, WaveWarZ battle results | Monthly |
| The ZAO Fractal | Week number, what was decided, top-ranking contributors | Weekly (Monday) |
| zaalcaster / ZLANK | Open-source updates, FarHack 2026 context | On notable updates |

---

## Related Docs

- [Doc 987](../../cross-platform/987-linkedin-personal-brand-playbook/) -- LinkedIn posting rules, 90-day arc, hook formulas
- [Doc 1261](../../cross-platform/1261-linkedin-profile-copy-july2026/) -- LinkedIn profile copy (paste before posting)
- [Doc 897](../897-zao-social-posting-playbook/) -- Farcaster + X mechanics and hook formulas
- [Doc 898](../898-zaal-brand-voice-posting/) -- Zaal's brand voice (ZM opener, rally close, hard rules)
