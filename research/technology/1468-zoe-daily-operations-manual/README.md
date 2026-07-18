# 1468 — ZOE Daily Operations Manual (Jul 2026)

**Type:** TECHNICAL-REFERENCE  
**Topic:** Technology  
**Status:** CANONICAL — update when ZOE behaviors change; share with new ZOE contributors

---

## Overview

ZOE (ZAO Operations Engine) is ZAO's primary AI operations agent. ZOE handles social media, community coordination, newsletter sends, and platform monitoring — freeing Zaal to focus on relationships and strategic decisions. This doc is the authoritative reference for what ZOE does, how it's configured, and how to update it.

**Cost:** ~$50–100/month (doc 1447)  
**Model:** Claude Sonnet (primary) + GPT-4o (fallback)  
**Orchestration:** Configured via prompt + tools in the ZAO VPS stack (doc 207)

---

## ZOE's Daily Schedule

### Every Day (7:00 AM EST)

- **Morning briefing:** Check for new WaveWarZ battles started in the last 24h → post battle announcement to @wavewarz X if new MAIN battle is active
- **Farcaster health check:** Verify ZOE's Farcaster signer is still active (doc 894)
- **Battle status check:** If a battle is in "live" state, verify it closed correctly; alert Zaal if stuck

### Monday (Weekly Rhythm)

- **ZABAL standup ping:** Send weekly standup message to ZABAL participants in Telegram (during S1/S2 active periods)
- **WaveWarZ stats post:** Pull `/api/public/stats` → post weekly platform stats to @wavewarz X and Farcaster /wavewarz
- **Lapsed member check:** If any ZOR holder hasn't been active in 90 days, flag for Zaal's weekly review

### Thursday (Weekly Rhythm)

- **ZABAL check-in:** Send Thursday check-in reminder to ZABAL S1/S2 participants
- **Governance reminder:** Post Thursday governance session announcement to Farcaster /zao and Telegram (if Fractal Democracy session is scheduled)

### As-Needed Triggers

| Trigger | ZOE Action |
|---|---|
| MAIN battle opens | Post announcement X + Farcaster + Telegram (doc 1385 templates) |
| MAIN battle closes | Pull result → post artist earnings to X + Farcaster + Telegram |
| Quick battle closes | Post result to @wavewarz Farcaster only |
| Newsletter due | Fill data brackets → send to Zaal for review 2 days before (doc 1431 calendar) |
| Eventbrite ticket milestone (25/50/75/sold out) | Post urgency update (doc 1452 templates) |
| ZAOstock milestone | Post update across channels (doc 1432 calendar) |
| New ZABAL application received | Send auto-confirmation to applicant; weekly count report to Zaal |
| COC Concertz show night | Execute show-night posting cadence (doc 1371 playbook) |

---

## ZOE's Toolset

ZOE operates with the following integrations:

| Tool | Purpose | Auth |
|---|---|---|
| X API (Twitter v2) | Post + thread to @wavewarz, @bettercallzaal | OAuth 2.0 via ZAO VPS |
| Farcaster (Neynar) | Cast to /zao, /wavewarz, /cocconcertz, @wavewarz | Signer key (doc 894, rotate monthly) |
| Telegram Bot API | Post to ZAO Telegram, WaveWarZ Clippers Telegram | Bot token |
| WaveWarZ API | Pull stats, battle list, result data | Public endpoints (doc 1427) |
| Paragraph API | Draft + send newsletter | API key |
| Eventbrite API | Pull ticket count | API key |
| Arweave (Bundlr) | Archive show assets | Wallet key |

**Key constraint:** ZOE cannot approve spending, push to GitHub main, or send from personal accounts (@bettercallzaal) without explicit Zaal approval.

---

## ZOE's Approved Post Templates

ZOE uses pre-approved templates. Zaal approves new template types; ZOE can fill [BRACKETS] independently.

### Battle Announcement (MAIN)
```
🎵 MAIN BATTLE LIVE on WaveWarZ

[ARTIST_A] vs [ARTIST_B]

🎶 Current pool: [POOL_SIZE] SOL
⏳ Closes: [CLOSE_TIME]

Even the loser earns. Trade, vote, and earn on WaveWarZ.

→ wavewarz.info/battles/[BATTLE_ID]
```

### Battle Result (MAIN)
```
🏆 MAIN BATTLE RESULT

[WINNER] defeated [LOSER] on WaveWarZ

💰 [WINNER] earned: [WINNER_PAYOUT] SOL
💚 [LOSER] earned too: [LOSER_PAYOUT] SOL
📊 Total volume: [VOLUME] SOL

Both artists got paid. That's the ZAO way.

→ wavewarz.info/battles/[BATTLE_ID]
```

### Weekly Stats Post
```
📊 WaveWarZ Weekly Stats

🎵 Total battles: [BATTLE_COUNT]
💰 Total volume: [SOL_VOLUME] SOL
🎤 Artist payouts: [ARTIST_PAYOUT] SOL
📈 Trader claims: [TRADER_CLAIMS] SOL

The loser earns here.
→ wavewarz.info
```

### COC Show Night (T-30min)
Per doc 1371 — full playbook.

### Newsletter Issue (Every other Tuesday)
Per doc 1431 editorial calendar + individual issue pre-drafts.

---

## ZOE's Escalation Rules

**ZOE escalates to Zaal (via Telegram DM) when:**

1. A WaveWarZ battle has been "open" for > 72 hours without closing
2. A Neynar/Farcaster call fails 3 times in a row (signer rotation needed)
3. WaveWarZ API returns 5xx for > 30 minutes
4. A new WaveWarZ MAIN battle announces WITHOUT a matching Zaal message in the last 24h (possible duplicate post risk)
5. A ZABAL application comes in with an email already in the system (duplicate — flag for Zaal)
6. Eventbrite ticket sales STOP for > 7 days (alert for marketing check)
7. Any action that would cost > $0.10 (GATED — always confirm with Zaal first)

---

## ZOE's Content Limits

**Hard rules ZOE never breaks:**
- Never post from @bettercallzaal X account (that's Zaal's personal voice; only Zaal posts there)
- Never tag external journalists, press, or public figures without Zaal's explicit list approval
- Never quote external data sources without a link to the source
- Never post battle results from Quick or Community battles to X (Farcaster only)
- Never post more than 3 times in 24 hours to any single channel (except show nights — up to 6 posts allowed)
- Never repost the same content to X within 48 hours
- Never post about financial returns, "investment opportunities," or SOL prices with bullish framing

---

## ZOE's Monthly Rotation Tasks

**First day of each month:**
- Rotate Farcaster signer key if > 30 days old (doc 894)
- Pull WaveWarZ stats snapshot → update doc 1339 (ZAO Numbers)
- Send Zaal monthly summary: battles closed, social posts published, newsletter subscribers, tickets sold

**First day of each quarter:**
- Update ZAOOS root README with latest platform stats
- Flag any docs in research/ that have outdated statistics for Zaal review

---

## Configuration Reference

ZOE is configured via a system prompt + tool definition file on the ZAO VPS. Core configurable parameters:

| Parameter | Current Value | Change Via |
|---|---|---|
| Battle announcement delay | 0 min (immediate on open) | VPS config |
| Result post delay | 5 min after close (wait for full settlement) | VPS config |
| Newsletter draft lead time | T-48 hours | VPS config |
| Stats pull frequency | Daily 7AM | Cron job |
| Max X posts/day | 3 (6 on show nights) | System prompt |
| Escalation threshold (API failures) | 3 consecutive | VPS config |

**To update ZOE behavior:** Edit the system prompt in the VPS config file and restart the ZOE process. Always test with a dry-run post before enabling in production.

---

## ZOE vs ZAAL Responsibility Matrix

| Action | ZOE | ZAAL |
|---|---|---|
| WaveWarZ battle announcements | ✅ Fully automated | 🔔 Review weekly |
| Battle results posting | ✅ Fully automated | — |
| Weekly stats | ✅ Fully automated | — |
| Newsletter draft | ✅ ZOE drafts + fills data | ✅ Zaal approves + "From Zaal" section |
| Newsletter send | ✅ ZOE sends after approval | ✅ Zaal approves |
| COC show-night posting | ✅ ZOE executes playbook | ✅ Zaal runs Spatial.io + announces live |
| Artist DMs (COC #8 recruitment) | — | ✅ Zaal only |
| Press pitches | — | ✅ Zaal only |
| Grant applications | — | ✅ Zaal only |
| GitHub PR creation | — | ✅ Zaal / Claude Code |
| Twitter @bettercallzaal posts | — | ✅ Zaal only |
| Eventbrite milestone posts | ✅ ZOE executes templates | 🔔 Zaal reviews |
| ZABAL application confirmations | ✅ ZOE sends auto-confirm | 🔔 Weekly count report |

---

## Known Limitations

1. **ZOE cannot see X DMs** — artist recruitment and press pitches require Zaal
2. **ZOE cannot access Etherscan** — ZOR holder activity checks require Hurricane (or manual pull)
3. **ZOE cannot moderate** — community moderation in Telegram or Discord requires Zaal or Iman
4. **ZOE's Telegram bot is ZAO-global** — WaveWarZ Clippers Telegram has separate bot (t.me/wavewarzclipshq)
5. **ZOE cannot approve any spend** — all costs are GATED, even $0.01 API calls above the free tier

---

## Related Docs

- 1447 — ZAO AI Agent Fleet Overview (8-agent catalog, costs, Mirror Article 4 concept)
- 1385 — ZOE Social Media Playbook (full template library)
- 1371 — COC Show-Night Live Social Playbook
- 1431 — The ZAO Brief Newsletter Editorial Calendar 2026
- 1412 — ZAO Community Infrastructure Map (all channels)
- 894 — ZOL Launch Night (Farcaster signer setup)
- 207 — ZAO VPS Agent Stack Session Log
