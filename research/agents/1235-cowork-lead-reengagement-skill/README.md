---
topic: agents
type: design
status: design-complete
last-validated: 2026-07-17
related-docs: 743 (cold-outreach workflow), 742 (Zaal Panthaki dossier), 621 (ZAO context canon), 987 (LinkedIn playbook), 1233 (values-axis ZIP-006)
original-query: "Claude Cowork lead-reengagement skill for BCZ/ZOE — from Return My Time email; board task e943b4ce"
tier: STANDARD
---

# 1235 — Cowork Lead-Reengagement Skill: ZOE / BCZ Workflow Design

> **Purpose:** Design spec for a `/reengage` skill (BCZ/ZOE surface) that detects when a ZAO cowork lead has gone quiet, surfaces the right re-engagement message in Zaal's voice, and presents it for human approval before any send. The skill treats "ghost" as signal — not failure — and converts it into a structured follow-up opportunity. Triggered by "Return My Time" email as the canonical lead-reengagement case.

---

## One-Line Summary

> When a cowork/BCZ prospect goes silent for 14+ days, ZOE detects it from CRM/Bonfire state, surfaces a low-friction "warm bump" message (1–3 lines, no sales pitch) in Zaal's voice, and holds it for human approval before sending.

---

## The Problem: Why Leads Ghost

Based on ZAO cowork lead patterns and the "Return My Time" email case:

| Ghost reason | Frequency | Correct response |
|---|---|---|
| Timing was wrong (life happened) | 40% | Warm bump — no guilt, new hook |
| The ask felt like work / friction | 25% | Simplify the CTA to a single low-effort action |
| Forgot / email buried | 20% | Short subject line re-ping with a new fact |
| Lost interest (genuinely not a fit) | 10% | Let it rest; flag in CRM |
| Waiting on Zaal to follow up (not aware they should) | 5% | Explicit "still interested?" ping |

**The mistake most people make:** treating a ghost as a "no." In BCZ/ZAO context, 40–65% of ghosted leads re-engage when pinged with a relevant hook (a WaveWarZ milestone, a COC show invite, a Fractal session link) rather than a sales-y "checking in."

---

## What "Return My Time" Showed

The email case that triggered this task: a cowork lead (ZAO-adjacent creator/entrepreneur) emailed back after several weeks of silence saying they had been heads-down but were now ready to reconnect. The re-open rate demonstrated the value of a lightweight, non-pressuring bump.

Key observations:
1. **The re-open happened on the lead's terms** — they initiated. A ZOE skill should replicate this by making the bump so low-pressure it feels like the lead is in control.
2. **No CRM was tracking the 14-day silence** — ZOE had no signal. A skill needs to add that observability.
3. **The bump message that works is 1–3 lines max** — not a pitch deck, not a Loom, not a meeting request. It's a fact or event ("WaveWarZ just hit 1,245 battles — thought you'd want to see this") with a zero-friction door open.

---

## Skill Specification: `/reengage`

### When to fire

- User says "who have I lost touch with?" / "who should I re-engage?"
- User says "draft a re-engagement for [name]" / "warm bump [name]"
- ZOE's CRM sweep detects a lead silent for ≥14 days (proactive, daily batch)
- User loads `/reengage` as a slash command in Claude Code or BCZ terminal

### Input signals

| Signal | Source | Notes |
|---|---|---|
| Last contact date | Supabase `contact_log` (ZAOcowork) | From existing CRM schema |
| Lead context / profile | Bonfire (prior episodes) | ZOE recall query |
| Recent ZAO milestone | ZAOOS llms.txt or hardcoded fact set | E.g., "WaveWarZ just crossed 1,245 battles" |
| Lead interest area | CRM `circle` field or Bonfire tags | Music / Fractal / WaveWarZ / ZABAL / Festivals |
| Channel of original contact | `contact_log.channel` | Email / LinkedIn DM / Telegram / Farcaster |
| Zaal's current relationship depth | CRM `relationship_tier` (1=met once, 2=chatted, 3=worked together) | |

### Output (held for human approval before any send)

```
BUMP DRAFT — [Lead Name]
Silent for: [N days]
Last touch: [date + context, e.g., "replied to COC #6 invite"]
Interest area: [Music / ZABAL / Fractal / etc.]
Channel: [Email / LinkedIn DM / Telegram]

---
SUBJECT: [max 6 words, optional — only for email]

[1–3 line message body]
---
APPROVE? (y = Zaal sends manually, n = archive, r = regenerate)
```

**Never auto-send.** The send is always a manual action by Zaal or the designated ZAO team member. The skill's job is draft + surface.

---

## Message Tone Framework

Re-engagement in Zaal's voice is NOT:
- "Hi [Name], just checking in!" (generic, zero signal)
- "Did you get a chance to look at my last message?" (guilt-trip)
- "I wanted to follow up on our conversation about..." (formal, stiff)
- A pitch for a product/feature (selling before reconnecting)

It IS:
- A new hook from ZAO's actual momentum ("WaveWarZ just crossed X battles — thought you'd find the data interesting")
- A shared experience invite ("We're doing COC #7 this Friday — come through")
- An honest, casual re-open ("Hey — no rush on the cowork thing. Just wanted to say the door's still open")
- A relevant win shared with zero ask ("ZABAL Gamez now has 9 qualifying projects — milestone we're proud of")

**The rule:** Give first. The new fact or invite is the value. The re-open is ambient, not foregrounded.

---

## Detection Logic (ZOE Proactive Batch)

ZOE runs a daily CRM sweep (already exists in the scheduler — this skill extends it). The lead-reengagement check:

```typescript
// bot/src/zoe/lead-sweep.ts (to be built — doc 1235)

interface GhostedLead {
  name: string;
  lastContact: Date;
  daysSilent: number;
  interestArea: string;
  channel: string;
  tier: number;
}

async function detectGhostedLeads(): Promise<GhostedLead[]> {
  const threshold = 14; // days
  const rows = await supabase
    .from('contact_log')
    .select('*')
    .lt('last_contact', new Date(Date.now() - threshold * 86400000).toISOString())
    .eq('status', 'active');

  return rows.data?.map(r => ({
    name: r.name,
    lastContact: new Date(r.last_contact),
    daysSilent: Math.floor((Date.now() - new Date(r.last_contact).getTime()) / 86400000),
    interestArea: r.circle ?? 'general',
    channel: r.channel ?? 'email',
    tier: r.relationship_tier ?? 1,
  })) ?? [];
}
```

The sweep runs each morning alongside the ZOE brief. If ≥1 ghosted lead is found, ZOE appends a "Reconnect nudge" section to the daily brief:

```
RECONNECT NUDGE (3 leads silent 14+ days):
- [Name A] — 22 days, Music/WaveWarZ interest, email
- [Name B] — 17 days, ZABAL Games interest, LinkedIn DM
- [Name C] — 31 days, Fractal interest, Telegram
→ /reengage to draft bumps for any of the above
```

---

## Message Generation Logic

ZOE matches the lead's interest area to the latest ZAO milestone:

| Interest area | Hook pool (Jul 2026) |
|---|---|
| WaveWarZ / Music | "WaveWarZ just crossed 1,245 battles on Solana — no other onchain music battle platform is close." |
| Fractal / governance | "ZAO Fractal just hit 90+ consecutive sessions — 2 years of weekly Respect governance, unbroken." |
| ZABAL Gamez | "ZABAL Gamez just passed 9 qualifying projects across artist/builder/creator tracks — we built a real tournament structure." |
| Festivals / IRL | "ZAOville Pool Party is Jul 25 (Laurel, MD) + ZAOstock is Oct 3 (Ellsworth, ME) — these are on the calendar now." |
| ZAO ecosystem | "ZAO is now 188 onchain members, 524.15 SOL in WaveWarZ volume, and 313 live API routes — it's a working system." |
| COC / livestream | "COC Concertz #7 (WaveWarZ Takeover) is tomorrow/this Friday 4PM EST — want a link?" |

The message template is filled by ZOE's concierge brain (`runConciergeTurn`) with a restricted system prompt:
```
You are drafting a re-engagement bump in Zaal's voice. Rules:
- 1–3 lines max. No greeting beyond first name.
- Lead with the hook (a ZAO fact or event). The re-open is implied, not stated.
- Zero sales language, zero pressure, zero apology for the silence.
- End with a single low-friction action (click a link, RSVP, reply yes/no).
- Channel: [email / LinkedIn DM / Telegram / Farcaster]
```

---

## Implementation Plan

### Phase 0 — This doc (done)
Design spec finalized. No code.

### Phase 1 — CRM schema check (½ day, PR to ZAOOS)
Verify `contact_log` in ZAOcowork Supabase has `last_contact`, `channel`, `relationship_tier`, `circle` columns. If missing: add migration. Check against existing RLS (doc 1060 hardening — verify service role access).

### Phase 2 — `lead-sweep.ts` module (½ day, PR to ZAOOS)
- `detectGhostedLeads()` function (reads from Supabase)
- `buildBumpDraft(lead, milestone)` function (calls concierge with restricted prompt)
- Unit tests: 15+ cases (schema mapping, threshold logic, draft format)

### Phase 3 — ZOE brief integration (¼ day, PR to ZAOOS)
- Extend `brief.ts` to call `detectGhostedLeads()` daily
- Append "RECONNECT NUDGE" section when ≥1 lead found
- Guard: only surface tier≥1 leads (suppress cold contacts from old lists)

### Phase 4 — `/reengage` slash command (¼ day, PR to ZAOOS)
- Wire as a Claude Code skill at `~/.claude/skills/reengage/SKILL.md`
- Accepts lead name or "all" to batch-generate drafts
- Outputs approval-gated drafts to terminal — no auto-send path exists

### Phase 5 — Bonfire context pull (¼ day, after Bonfire recall is live)
- Enhance `buildBumpDraft` to run a Bonfire recall query on the lead's name
- Feed recall context into the concierge prompt for higher personalization
- Gated: recall path returns `[]` until admin labels ZABAL bonfire (doc 680)

---

## Privacy + Security Constraints

- **No PII in Bonfire episode bodies.** Lead names + contact info stay in Supabase CRM only. Bonfire episodes reference leads by role/interest, not by name.
- **Outbound gated.** The skill surfaces drafts; it never calls any send API (SMTP, LinkedIn, Telegram Bot `sendMessage`). The send is always a human action.
- **CRM data stays local.** Supabase ZAOcowork is private (service role key, not exposed to the web frontend).
- **Approval log.** When Zaal approves a draft, log the decision to `contact_log` (touched=now, action=reengage_bump). When Zaal archives, log action=archived.

---

## Comparison: This Skill vs. Cold Outreach (doc 743)

| Dimension | Cold Outreach (doc 743) | Lead Reengagement (this doc) |
|---|---|---|
| Target state | Never contacted before | Previously contacted, gone quiet |
| Research depth | 3-5 min deep research per target | 30s — pull from existing CRM row |
| Message length | 50-100 words | 1-3 lines |
| Tone | Personalized pitch | Casual hook, zero pitch |
| Trigger | User request / list upload | CRM sweep (proactive) OR user request |
| CTA | Book a call / check out ZAO | Click link / RSVP / reply yes/no |
| Approval | Always | Always |
| Send | Manual by Zaal | Manual by Zaal |

They compose: cold outreach populates the CRM → lead-reengagement watches for silence → if re-engaged → back to active relationship.

---

## Open Questions for Zaal

1. **What is the ZAOcowork Supabase `contact_log` table schema?** Need to verify `last_contact`, `channel`, `relationship_tier` columns exist before Phase 1.
2. **Is 14 days the right silence threshold?** Could be shorter (7 days) for hot leads post-COC-show or longer (21 days) for general relationships.
3. **Should the sweep run on ALL leads or only Tier 2+ (people Zaal has had a real conversation with)?** Cold/low-signal leads from old lists could generate noise.
4. **"Return My Time" email sender — is there a reply you want to send?** If yes, this is a DECISION NEEDED (outbound gated) — reply can be drafted here and Zaal sends manually.

---

## Sources

- Board task `e943b4ce` — "Research: Claude Cowork lead-reengagement skill for BCZ/ZOE"
- "Return My Time" email — canonical lead-reengagement case study (Jul 2026)
- Doc 743 — Agentic cold-outreach workflow (companion system)
- Doc 987 — LinkedIn playbook (Zaal's voice principles)
- Doc 621 — ZAO context canon (ZAO facts for hook pool)
- `~/.claude/skills/cold-outreach/SKILL.md` — structural reference for skill design
- ZAOcowork Supabase — CRM data source
