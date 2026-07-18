# 1574 — ZAO Newsletter: Paragraph + ZOE Integration Guide (Jul 2026)

**Type:** TECHNICAL-GUIDE  
**Topic:** Technology  
**Status:** ACTIVE — Newsletter Issue 1 sends Jul 21. This doc is the ongoing ops guide for ZOE-assisted newsletter drafting and publishing on Paragraph.xyz. Zaal writes the intro; ZOE assembles the rest.

---

## Newsletter Platform

**Platform:** Paragraph.xyz (@bettercallzaal)  
**Publication:** The ZAO Observer (or ZAO Weekly — confirm name before Issue 1)  
**Frequency:** Monthly (target: 1st of each month or following major event)  
**Current subscribers:** [ZOE fetches from Paragraph dashboard — fill before Issue 1]

**Newsletter cadence:**
- Issue 1: Jul 21 (COC #8 date + ZAOstock Eventbrite + WaveWarZ stats + ZAO updates)
- Issue 2: Sep 1 (ZABAL S2 launch + ZAOstock lineup reveal)
- Issue 3: Oct 5 (ZAOstock post-event recap)
- Issue 4: Nov 21 (ZABAL S2 graduation + Dec Annual Report preview)

---

## ZOE's Role in Newsletter Production

ZOE handles 70% of each issue. Zaal handles 30%: the personal intro, any exclusive news, and final approval.

**ZOE tasks (7 days before send):**
1. Pull WaveWarZ stats from `/api/public/stats`
2. Pull ZAOOS doc count from GitHub API
3. List any ZAOOS docs merged in the past 30 days that are "community-shareable" (not internal ops)
4. Pull ZAOstock RSVP count from Eventbrite API
5. List any new partner activations (from doc 1343 partner tracker)
6. Draft the Stats Snapshot section
7. Draft the What's Happening section from ZAOOS recent docs
8. Draft the ZAOstock update section
9. Send draft to Zaal via Telegram (private message) for review

**Zaal tasks (48 hours before send):**
1. Write personal intro (100-200 words — tone: newsletter from a founder, not a press release)
2. Review ZOE's draft sections
3. Add/remove items
4. Approve or request revision in Telegram reply

**ZOE tasks (1 hour before send):**
1. Copy final content into Paragraph draft
2. Set subject line and preview text
3. Send test email to zaalp99@gmail.com
4. Wait for Zaal "send it" reply
5. Publish + send via Paragraph

---

## Newsletter Template Structure

### Issue template:

```
Subject: [MAIN HOOK] — The ZAO Observer #[N]
Preview: [One sentence hook]

---

Hey [First Name] 👋

[ZAAL PERSONAL INTRO — 100-200 words]
What we've been up to this month, honest tone, 1-2 personal details.

---

📊 ZAO + WaveWarZ This Month

• WaveWarZ battles: [API totalBattles] total (+[delta] since last issue)
• Total volume: [API totalVolume] SOL
• Artist payouts: [API artistPayouts] SOL to losing artists
• ZAOOS documents: [GitHub API count]
• ZAOstock RSVPs: [Eventbrite count]

---

🎵 What's Happening

[ZOE DRAFTS 3-5 BULLETS from recent ZAOOS docs / partner updates / upcoming events]

• [EVENT/UPDATE 1]
• [EVENT/UPDATE 2]
• [EVENT/UPDATE 3]
• [EVENT/UPDATE 4 if needed]
• [EVENT/UPDATE 5 if needed]

---

🏖️ ZAOstock Update (Oct 3, Ellsworth ME)

[ZOE DRAFTS 1 paragraph on ZAOstock progress]

Tickets: [Eventbrite URL]
[RSVP count milestone trigger: if ≥50 RSVPs → "We're [N]% of the way to our goal"]

---

🎙️ From the Community

[ZOE DRAFTS 1-2 community member spotlights if doc 1564 spotlight program is live]
OR [Zaal adds a quote from a recent interaction]

---

🔗 Useful Links

• WaveWarZ: wavewarz.info
• ZAOstock: [Eventbrite URL]
• ZABAL S2 Applications: [Tally form URL — if applicable]
• ZAO on Farcaster: warpcast.com/bettercallzaal
• ZAOOS: github.com/bettercallzaal/ZAOOS

---

Thanks for being part of ZAO 🙏

— Zaal

P.S. [ZOE leaves blank; Zaal fills with something specific to that issue]
```

---

## Paragraph API Integration (ZOE)

Paragraph doesn't have a public API for drafting. ZOE uses the following workaround:

**ZOE method for stats pull:**
```typescript
// Pull WaveWarZ stats
const stats = await fetch('https://wavewarz.info/api/public/stats').then(r => r.json())

// ZOE formats for newsletter
const statsBlock = `
• WaveWarZ battles: ${stats.totalBattles} total
• Total volume: ${stats.totalVolume.toFixed(3)} SOL
• Artist payouts: ${stats.artistPayouts.toFixed(4)} SOL to losing artists
`
```

**ZOE method for ZAOOS doc count:**
```typescript
// GitHub API — count merged PRs to main in last 30 days
const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
const prs = await fetch(
  `https://api.github.com/repos/bettercallzaal/ZAOOS/pulls?state=closed&base=main&since=${sinceDate}&per_page=100`,
  { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}` } }
).then(r => r.json())
const newDocs = prs.filter(pr => pr.merged_at > sinceDate).length
```

**Paragraph publishing method (ZOE manual steps — no API):**
ZOE cannot directly publish to Paragraph. ZOE sends Zaal a fully formatted Markdown draft via Telegram. Zaal pastes into Paragraph editor and publishes. If Hurricane builds a Paragraph API wrapper: ZOE could auto-draft but Zaal still approves before send.

**Send time:** 9:00 AM EST, 1st or 2nd of month (except Issue 1 = Jul 21 special launch).

---

## Newsletter Issue 1 Spec (Jul 21, 2026)

Issue 1 is the launch issue — COC #8 date announcement + ZAOstock Eventbrite live.

**Subject:** "COC Concertz #8 Date Announced — ZAOstock Tickets Are Live | The ZAO Observer #1"  
**Preview text:** "Maine's first on-chain music festival just opened tickets. Here's what we've built."

**Sections:**
1. **Zaal intro:** personal note on COC #7 (first live WaveWarZ audience vote — Jul 18), what that means
2. **Stats snapshot:** WaveWarZ Jul 17 stats (1,245 battles, 523.991 SOL, 9.0988 SOL to artists)
3. **COC #8 announcement:** date + format + artist recruitment open (paste COC announcement from doc 1511)
4. **ZAOstock:** "Tickets are live — [Eventbrite URL] — October 3, Ellsworth ME"
5. **ZABAL S2:** "Applications open Aug 1 — [Tally form URL when ready]"
6. **Community:** ZOE leaves for Zaal (quote from COC #7 attendee if available)

**Distribution:**
- Send via Paragraph (primary)
- ZOE posts newsletter link to X @bettercallzaal, Farcaster /zao, Telegram ZAO within 1 hour of send

---

## Subscriber Growth Strategy

**Target:** 200 subscribers by ZAOstock (from current baseline — ZOE checks before Issue 1)

**Growth levers:**
1. ZAOstock RSVP flow: add newsletter opt-in checkbox on Eventbrite (doc 1386)
2. ZABAL S2 application form: add newsletter opt-in checkbox (doc 1510)
3. ZOE weekly Telegram pin: "Missed it? Read the newsletter: [Paragraph link]"
4. Twitter/X: ZOE posts newsletter link Monday after each send

**Growth tracking (ZOE, in 7PM EOD report):**
- Subscriber count checked 7 days after each issue
- Open rate checked 48h after each issue
- Milestone targets: 50 (after Issue 1), 100 (after Issue 2), 150 (after Issue 3), 200 (ZAOstock)

---

## ZOE Automation Table

| Trigger | ZOE Action |
|---|---|
| 7 days before newsletter send date | Pull stats, pull ZAOOS recent docs, draft newsletter sections, send draft to Zaal via Telegram |
| 48 hours before send | Remind Zaal: "Newsletter Issue #[N] send in 48h. Draft in your Telegram." |
| After Zaal approves | Confirm "Final version ready — copy below. Paste into Paragraph and publish." |
| After Paragraph send | ZOE posts newsletter link to X + Farcaster + Telegram |
| 7 days after send | Pull subscriber count delta + open rate, add to 7PM EOD report |
| Monthly | Alert Zaal if subscriber count is below target pace |

---

## Related Docs

- 1497 — ZAO Newsletter Issue 1 Content Brief (Jul 21 issue-specific content spec)
- 1407 — ZAO Newsletter Calendar + Strategy (full year editorial calendar)
- 1499 — ZOE Daily Ops Report Spec (newsletter subscriber count in 7PM EOD report)
- 1386 — ZAOstock In-Person Ticket Welcome Sequence (newsletter opt-in at Eventbrite checkout)
- 1510 — ZABAL S2 Application Form Spec (newsletter opt-in in ZABAL form)
- 1468 — ZOE Daily Operations Manual (newsletter production in ZOE monthly tasks)
