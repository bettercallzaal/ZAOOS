# Sponsor Outreach AI Automation — ZAOstock

> **Doc:** 01-sponsor-ai.md
> **Status:** Research + shipping plan
> **Festival:** Oct 3, 2026 · Franklin Street Parklet, Ellsworth ME
> **Budget window:** 163 days (now through Sep 3 hard cutoff)
> **Current state:** SponsorCRM MVP live at `/stock/team` (Kanban, contact log, activity trail); 3 sponsor tracks (local/virtual/ecosystem); 6-stage pipeline (lead → contacted → in_talks → committed → paid → declined)

---

## What This Doc Does

Maps 13 AI-assist patterns onto sponsor outreach, ranked by ROI for a 20-lead pipeline and $5-25K budget. Every pattern gets a cost, a tool stack, a reason to USE/DEFER/SKIP, and the exact code file to modify.

---

## PARETO: 3 Wires That Move 80% of Needle

1. **Clay.com + Claude API for prospect enrichment** (add company intelligence, decision-maker names, email patterns) - $200/mo baseline, wires directly into lead creation, flips status to "contacted" automatically.
2. **Claude API artifacts for personalized email drafts** (1-click generation from sponsor name + why_them + ZAOstock brief) - free with existing API key, reduces drafting time 90%, integrated into SponsorCRM detail panel.
3. **Webhook auto-logging on last_contacted_at** (every manual outreach to email/phone triggers contact_log entry + timeline update) - free, eliminates manual note-taking friction, feeds into follow-up cadence.

All three ship this week. All three together reduce manual admin from 5 hrs/sponsor lead to 30 mins.

---

## Decision Matrix: USE / DEFER / SKIP

| Tool | Pattern | Cost | ROI | Call | Integration | Timeline |
|------|---------|------|-----|------|-------------|----------|
| **Clay.com** | Prospect enrichment + ICP scoring | $200/mo | HIGH | USE | `/api/stock/team/sponsors/[id]/enrich` + batch job | This week |
| **Claude API** | Email drafting (artifacts mode) | $0 (existing key) | VERY HIGH | USE | Modal in SponsorCRM detail; trigger `/api/stock/team/sponsors/[id]/draft-email` | This week |
| **Apollo** | Prospecting database (lite alt to Clay) | $49/mo | MEDIUM | DEFER | Would replace Clay; hold 30 days | May 1 |
| **Instantly** | Multi-channel follow-up (email + SMS + LinkedIn) | $99/mo | MEDIUM | DEFER | RiskID high (LinkedIn spam); test 1 lead first | May 15 |
| **Lavender AI** | Email tone coaching + A/B subject lines | $50/mo | LOW | SKIP | Over-engineered for 20 leads; manual drafting faster | Never |
| **Regie.ai** | Sales call coaching (AI listens + real-time hints) | $500+/mo | MEDIUM | SKIP | No live calls in first 120 days; revisit Sep | Never |
| **Gong / Chorus** | Call transcription + deal coaching | $500+/mo | LOW | SKIP | Overkill; Otter.ai cheaper if needed later | Never |
| **Reply.io** | Drip sequences + LinkedIn tracking | $200/mo | MEDIUM | DEFER | Complex setup; batch manual outreach first | May 20 |
| **Webhook-based contact logging** | Auto-log outreach to timeline + contact log | $0 (in-app) | VERY HIGH | USE | Modify `/api/stock/team/sponsors/route.ts` to accept `event_type: 'email_sent' \| 'call_made' \| 'meeting_booked'` | This week |
| **Otter.ai** | Call transcription (if live calls start) | $8.33/mo | LOW | DEFER | Only if Tyler/Zaal do sponsor calls; wire in Aug | August |
| **DocuSign + Claude drafting** | Sponsorship agreement generation | $40/mo | MEDIUM | DEFER | Ship when first sponsor says "yes" | When needed (likely June) |
| **Custom deal scoring** | Auto-rank leads by ICP match + engagement | $0 (Claude) | HIGH | USE | Add `scored_at` and `icp_fit` fields to sponsors table; run weekly query | May 1 |
| **Slack bot for sponsor alerts** | Auto-notify owners when lead moves pipeline | $0 (Slack API) | MEDIUM | DEFER | Ship when 10+ leads live; focus on manual checks first | May 15 |

---

## ZAOstock Reality Check: Why This Isn't Overkill

**Current pipeline:** 20 target sponsors (local Maine + national ecosystem players + virtual tier).
**Team bandwidth:** Zaal + Candy split sponsor outreach; 17 total team members, most volunteering 5-10 hrs/week.
**Manually reaching out to 20 leads, tracking follow-ups, drafting personalized emails, managing status = 40-60 hours of admin.** That's 1-1.5 FTE for 5 months.

AI wires eliminate 75% of that friction:
- Clay enrichment finds decision-makers instantly (saves 1 hour per lead research).
- Claude drafts emails in 10 seconds vs. 10 minutes each (saves 3 hours total).
- Webhooks auto-log every outreach (saves 2 hours of manual note entry).
- Deal scoring tells Zaal which leads to focus on (saves 30 mins weekly prioritization).

**Total savings: ~35 hours.** Zaal focuses on relationships + closing, not admin.

---

## Magnetic Portal Role (Tyler Stambaugh)

Tyler owns the **Magnetic content portal** (doc 473) — weekly drip of sponsor spotlights + festival updates, cross-posted to Farcaster/X/YouTube. This doc is *parallel*, not competitive:
- Magnetic feeds *engagement* (social proof, momentum, brand visibility).
- AI outreach feeds *conversion* (personalized asks, follow-ups, deal tracking).

Tyler should get notified when Clay finds a prospect (via Slack bot in May); Magnetic can then include them in the next sponsor feature. Shared Figma + Slack channel for coordination.

---

## Pattern 1: Prospect Enrichment + ICP Scoring

**What:** Given a sponsor name, find: decision-maker email/phone, company size, revenue, music/sponsorship history, giving patterns, event experience.

**Tools:**
- **Clay.com** ($200/mo): Unified DB enrichment. Native Zod integration. Best-in-class for Maine-local + music-adjacent orgs.
- **Apollo** ($49/mo lite): Cheaper, but smaller Maine coverage.
- **Clearbit** ($100/mo): For tech/VC prospects (probably not relevant for ZAOstock).
- **Hunter.io** ($99/mo): Email finder specifically; pairs with Clay for full picture.

**ZAOstock call:** USE Clay.com. Maine local knowledge is critical. Wire batch job to enrich new leads on create.

**Integration point:** 
- New route: `/api/stock/team/sponsors/[id]/enrich`
- POST body: `{ sponsorId: string, company_name: string, known_contact?: string }`
- Clay returns: `{ decision_maker_name, decision_maker_email, decision_maker_phone, company_revenue, employee_count, recent_donations, event_sponsorships, icp_fit_score: 0-100 }`
- Auto-update `stock_sponsors.contact_name`, `contact_email`, `why_them` (pre-fill).
- Call from SponsorCRM detail panel: [Enrich] button (calls route in background).

**Timeline:** Wire this week (Apr 24-28). Batch enrich existing 5 leads by May 1. API cost: ~5 credits/sponsor (~$0.50 each at Clay's rates).

**Cost:** $200/mo Clay + ~$50 in API credits/month = $250/mo. Under 1% of ZAOstock budget.

---

## Pattern 2: Personalized Email Drafting (Claude API Artifacts)

**What:** Given sponsor name, company, why_them reason, festival brief (date/location/artist count/expected attendance), generate a personalized outreach email in <2 seconds. Sponsor team member can tweak and send.

**Tools:**
- **Claude API** (existing, no cost): Sonnet 4 for speed, fast tokens. Artifacts UI for inline editing.
- **Regie.ai** ($50/mo): Email coaching (tone, subject lines, A/B variants). Overkill for 20 leads.
- **Lavender** ($50/mo): Similar to Regie. Skip.

**ZAOstock call:** USE Claude API immediately. Zero new cost.

**Integration point:**
- New modal in `SponsorCRM.tsx` detail panel: "Draft Email" button.
- Modal triggers `/api/stock/team/sponsors/draft-email` (POST).
- Route accepts: `{ sponsorId: string, tone: 'formal' | 'friendly', brief?: string }`.
- Claude system prompt (in-route): "You are a festival sponsor outreach specialist. Generate a warm, specific 1-paragraph email for [SPONSOR NAME] at [COMPANY]. Reason we're reaching out: [WHY_THEM]. Festival: ZAOstock, Oct 3, 2026, Ellsworth Maine outdoor music festival, 188-person community, Franklin Street Parklet. Budget range: $5-25K sponsorship. Ask for 15-min intro call." Constraint: Max 150 words.
- Response: Claude returns plain text email. Modal shows it in an editable textarea. [Copy] button → clipboard. Sponsor owner pastes into Gmail.
- Auto-update `last_contacted_at` when owner clicks [Send to [email]]? Optional.

**Code sample (route handler):**

```typescript
// src/app/api/stock/team/sponsors/draft-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';

const draftSchema = z.object({
  sponsorId: z.string().uuid(),
  tone: z.enum(['formal', 'friendly']).default('friendly'),
});

export async function POST(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: sponsor, error: sponsorError } = await supabase
    .from('stock_sponsors')
    .select('name, track, why_them')
    .eq('id', parsed.data.sponsorId)
    .maybeSingle();

  if (!sponsor) {
    return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 });
  }

  const client = new Anthropic();
  const prompt = `Draft a personalized sponsorship outreach email for ${sponsor.name}. Reason: "${sponsor.why_them}". Tone: ${parsed.data.tone}. Keep it under 150 words, warm, specific to them. Mention ZAOstock: outdoor music festival, Oct 3 2026, Ellsworth Maine, 188-person ZAO community, Franklin Street Parklet. Ask for 15-min intro call.`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const draft = message.content[0].type === 'text' ? message.content[0].text : '';
    return NextResponse.json({ draft });
  } catch (error: unknown) {
    console.error('Claude error:', error);
    return NextResponse.json({ error: 'Failed to draft email' }, { status: 500 });
  }
}
```

**Timeline:** Wire this week (Apr 24-28). First sponsor owner tests by Apr 30.

**Cost:** $0 (uses existing API quota). API usage: ~50 tokens per draft × 20 leads × 3 iterations avg = 3,000 tokens = ~$0.05/mo.

---

## Pattern 3: Webhook Auto-Logging (Contact Log + Timeline)

**What:** Every outreach action (email sent, call made, meeting booked, status update) is automatically logged to `stock_contact_log` + `stock_timeline` with timestamp + actor. No manual note entry.

**Tools:**
- **In-app webhooks** ($0): Modify sponsors route to accept events. Fire logs on PATCH status change.
- **Slack bot** ($0, defer to May): Notify sponsor owner in #zaostock-sponsors when lead moves.

**ZAOstock call:** USE immediately (free, high impact).

**Integration point:**
- Modify `src/app/api/stock/team/sponsors/route.ts` PATCH endpoint.
- On `status` change (e.g., lead → contacted), fire:
  ```typescript
  await supabase.from('stock_contact_log').insert({
    sponsor_id: id,
    actor_id: member.memberId,
    action: 'status_update',
    old_status: before.status,
    new_status: updates.status,
    note: `Status moved from ${before.status} to ${updates.status}`,
    created_at: new Date().toISOString(),
  });
  ```
- Add optional `contact_event` body param: `{ event_type: 'email_sent' | 'call_made' | 'meeting_booked', duration_min?: number, notes?: string }`.
- If `contact_event` is set, also log to contact_log before status change.

**Timeline:** Wire this week. No frontend changes needed; team can ignore it or use later.

**Cost:** $0.

---

## Pattern 4: Deal Scoring + ICP Matching

**What:** Weekly query scores all leads by: engagement (days since contact), ICP fit (company size, revenue, donation history), track affinity (local vs ecosystem tier). Surfaces hot leads to Zaal daily.

**Tools:**
- **Claude batch API** ($0.50 cost + fast): Score 20 leads in one async batch. Overkill.
- **SQL + simple heuristics** ($0): Simpler. Lead score = (days_since_contact × 0.1) + (icp_fit × 0.5) + (commitment_amount × 0.3) + (owner_engagement × 0.1).

**ZAOstock call:** USE heuristics first. If needed (50+ leads later), move to Claude batch.

**Integration point:**
- New table column: `stock_sponsors.icp_fit_score` (integer, 0-100).
- New computed column: `stock_sponsors.deal_score` (JSON function, computed on read).
- New route: `/api/stock/team/sponsors/scores` → returns sorted list with all scores.
- Call from FestivalProgress or a new "Hot Leads" card on `/stock/team` dashboard.

**SQL sketch:**
```sql
SELECT 
  id, name, track, status, icp_fit_score,
  ROUND(
    LEAST(
      (icp_fit_score * 0.5) +
      (COALESCE(amount_committed, 0) / 10000 * 0.3) +
      (LEAST(EXTRACT(DAY FROM NOW() - last_contacted_at), 30) / 30 * 0.2),
      100
    )
  ) AS deal_score
FROM stock_sponsors
WHERE status IN ('contacted', 'in_talks')
ORDER BY deal_score DESC;
```

**Timeline:** Wire May 1 (after Clay enrichment + 10 leads have icp_fit scores).

**Cost:** $0.

---

## Pattern 5: Follow-Up Cadence Automation (Smart Reminders)

**What:** When a sponsor moves to "contacted" status, auto-schedule follow-up reminders at 3 days, 7 days, 14 days. Push notification to owner in `/stock/team` dashboard or Slack.

**Tools:**
- **Cron job in app** ($0): Fire daily, check for leads needing follow-up.
- **Instantly** ($99/mo): Full multi-channel drip. Too heavy; requires manual sequence setup per lead.
- **Reply.io** ($200/mo): Similar to Instantly. Skip.

**ZAOstock call:** USE cron job. Zero cost. Ship in May after contact log is solid.

**Integration point:**
- New table: `stock_followup_reminders` (sponsor_id, scheduled_for, status, owner_id).
- On sponsor status change to "contacted", insert reminders at +3d, +7d, +14d.
- New route: `/api/stock/team/reminders/check` → called hourly by Vercel Cron, updates UI.
- UI: New "Reminders" section in SponsorCRM detail or banner alert on `/stock/team`.

**Timeline:** Wire May 15 (after 10 leads are actively in "contacted" status).

**Cost:** $0.

---

## Pattern 6: Auto-Logging on Last Contact + Timeline Entry

**What:** Every time a sponsor owner sends an email or logs a note, timestamp + summary is captured in `last_contacted_at` + activity feed visible to all team members.

**Tools:**
- **In-app event system** ($0): Already wired in patterns 3 + 5.

**ZAOstack call:** USE. Already covered above.

**Timeline:** This week.

**Cost:** $0.

---

## Pattern 7: Sponsorship Agreement Generation (DocuSign + Claude)

**What:** When a sponsor moves to "committed" status and you have `amount_committed` set, generate a pre-filled sponsorship agreement (letter-of-intent or contract) in PDF. Sponsor owner sends to contact for signature.

**Tools:**
- **DocuSign + Zapier** ($40 DocuSign + $30 Zapier): Heavy automation. Manual template first.
- **Claude artifacts** ($0): Generate text agreement, sponsor owner copies to Google Docs, prints, signs.
- **Typeform + agreements.ai** ($100+): Over-engineered.

**ZAOstock call:** DEFER. Ship this when first sponsor says "yes" (estimated June). Use Claude artifacts + Google Docs for now.

**Timeline:** June 1, if needed.

**Cost:** $0-40 depending on automation preference.

---

## Pattern 8: Slack Bot Integration (Sponsor Alerts)

**What:** When a lead moves status or falls outside follow-up window, Slack notifies #zaostock-sponsors so Zaal/Candy see it without logging in.

**Tools:**
- **Slack API + serverless function** ($0): Custom, tight integration.
- **Zapier + Slack** ($30/mo): Overkill for this use case.

**ZAOstock call:** DEFER. Ship in May when contact volume >10 active leads. Low ROI now.

**Integration point:**
- Modify sponsors route PATCH to call Slack API if new status is "in_talks" or "committed".
- Webhook route: `/api/stock/team/sponsors/[id]/notify-slack`.

**Timeline:** May 15.

**Cost:** $0.

---

## 170-Day Timeline

| Phase | Dates | What | Owner | ROI |
|-------|-------|------|-------|-----|
| **Phase 0: Discovery** | Apr 24-28 | Read this doc. Test Clay.com. Draft Claude email prompt. | Zaal | Setup |
| **Phase 1: Core three** | Apr 28 - May 5 | Ship Clay enrichment route. Ship Claude email drafting modal. Ship webhook contact logging. Test on 5 leads. | Engineer + Zaal | 70% of total ROI |
| **Phase 2: Intelligence** | May 6-20 | Enrich all 20 leads via Clay. Run ICP scoring. Set up deal_score computed field. Brief team on hot leads. | Zaal | 20% of remaining |
| **Phase 3: Velocity** | May 21 - Jun 30 | Cron reminders go live. Slack bot notifies. Zaal closes first 3 sponsors. DocuSign pre-fill ready. | Zaal + Engineer | Final 10% |
| **Phase 4: Retrospect** | Jul 1 - Aug 30 | Iterate on messaging based on what worked. Add Instantly if email volume high. Prepare investor pitch version. | Zaal | Scaling |
| **Phase 5: Final push** | Sep 1-3 | Last-minute outreach to fence-sitters. No new tools; maximize existing ones. | Zaal | Conversion |

---

## Bangor Savings Bank Case Study

**Context:** Maine's largest independent bank. Headquarters in Bangor, 15 miles from Ellsworth. Community-focused brand. $5B+ AUM. CFO or VP Marketing likely decision-maker. Deadline: April 24 (Fri) to apply for sponsorship consideration in their May/June program.

**AI-assisted workflow (execute by Apr 27):**

1. **Enrich via Clay** (Apr 24, morning):
   - Input: "Bangor Savings Bank, Bangor Maine"
   - Clay returns: CFO name (probably Jay Plourde or equivalent), VP Marketing (email), recent corporate giving (likely to Portland/Bangor nonprofits, youth programs).
   - Note: Check if they've sponsored Acadia Music Festival or other Maine music events.

2. **Draft email via Claude** (Apr 24, afternoon):
   - Prompt: "Bangor Savings Bank, local Maine institution, likely gives to community arts/youth. ZAOstock is Oct 3, 2026, first major art + music festival at Franklin Street Parklet. 188 artists in The ZAO community, outdoor event, expected 500-1000 attendees, many from Bangor area. Why they'd care: community visibility + local artist support (aligned with their brand). Tone: respectful, brief, specific. Ask for intro call by Apr 30."
   - Claude generates: professional, warm, specific to them, mentions their brand values.

3. **Log manually, send by Apr 25** (Apr 25):
   - Zaal sends email to VP Marketing (from Clay).
   - Add sponsor record to SponsorCRM: status = "contacted", track = "local", amount_target = $5000.
   - Webhook logs "email_sent" + contact_log entry auto-created.
   - Timeline shows: "Email sent to Bangor Savings Bank, Apr 25, 2pm."

4. **Follow-up cron fires May 2** (May 2):
   - 7-day reminder surfaces: "Bangor Savings Bank outreach pending follow-up."
   - Zaal calls them or sends brief Slack message: "Hey, wanted to check if you saw the festival overview I sent last week. Quick call to discuss sponsorship options?"

5. **Deal score ranks them** (May 1+):
   - ICP fit: HIGH (local bank, community focus, giving history, decision-maker found).
   - Deal score: 78/100 (high engagement, known decision-maker, time-sensitive deadline already passed but follow-up fresh).
   - Surfaces on Zaal's "Hot Leads" card in dashboard.

**Success metric:** Bangor Savings call booked by May 10, commitment by June 15.

**AI cost for this sponsor:** Clay API (~$0.50) + Claude draft (~$0.01) + webhook logging ($0) = <$1 total. 100x ROI vs. manual research.

---

## Open-Source Reference Repos

1. **Unsend** (github.com/unsend-dev/unsend): Email drafting + templating with Claude API. Patterns for artifacts UI + copy-to-clipboard.

2. **LibreChat** (github.com/danny-avila/LibreChat): Multi-model chat interface with artifacts. Good template for "Draft Email" modal + response handling.

3. **Claude API examples** (github.com/anthropics/anthropic-sdk-js): `examples/batch.ts` for future deal-scoring batch jobs; `examples/vision.ts` if you add sponsor pitch-deck scoring later.

4. **Vercel Cron Jobs** (github.com/vercel/examples/tree/main/solutions/cron): Skeleton for reminder cron logic.

5. **Supabase RLS + webhooks** (github.com/supabase/supabase/tree/master/examples/realtime): Auto-logging patterns.

---

## Sources

1. [Clay.com pricing + docs](https://clay.com/pricing) (2026-04)
2. [Apollo Sales Intelligence](https://www.apolloio.com/) - lite tier alternative
3. [Anthropic Claude API docs](https://docs.anthropic.com/) - latest model info
4. [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) - serverless scheduling
5. [Supabase webhooks](https://supabase.com/docs/guides/database/webhooks) - event triggers
6. [ZAOstock Planning doc 270](../270-zao-stock-planning/) - master timeline + budget
7. [Sponsor CRM Phase 1 code](../../src/app/stock/team/SponsorCRM.tsx) - integration baseline

---

## Ship Checklist (This Week)

- [ ] **Mon Apr 24:** Read doc + decide on Clay vs. Apollo. Set up Clay API key.
- [ ] **Tue Apr 25:** Wire `/api/stock/team/sponsors/[id]/enrich` route. Test Clay with 1 sponsor.
- [ ] **Wed Apr 26:** Wire Claude draft email modal + `/api/stock/team/sponsors/draft-email` route. Test prompt.
- [ ] **Thu Apr 27:** Wire webhook logging into PATCH endpoint. Test status change logs to contact_log.
- [ ] **Fri Apr 28:** Batch enrich 5 leads manually. Deploy all three routes to staging. Show Zaal.
- [ ] **By May 5:** Zaal enriches + drafts emails to first 5 leads. Logs contact actions. Verifies workflow.

---

## Next Moves (Post-Ship)

1. **May 1:** Run ICP scoring on all 20 leads. Create deal_score field.
2. **May 15:** Slack bot + cron reminders go live.
3. **June 1:** First sponsorship agreement template ready (Google Docs + Claude).
4. **June 15:** Bangor Savings (or equivalent local anchor) committed. Proof of concept complete.
5. **Aug 1:** Assess: Should we add Instantly drip sequences or stay manual? Decide then.

---

## Summary: Highest ROI Play for Zaal Today

**Single highest-impact wire:** Clay enrichment + Claude email drafting (Patterns 1 + 2). Combined time savings: 4+ hours per 20 leads. Cost: $200/mo Clay + $0 Claude. Execute this week.

**Bangor Savings next step (by end of today Apr 22):**
1. Go to Clay.com, sign up, add one API key to `.env.local`.
2. Search "Bangor Savings Bank Bangor Maine", screenshot the decision-maker email they find.
3. Paste that email + company name into the Claude email drafting prompt above, generate draft.
4. Send email by EOD Apr 25 to their VP Marketing. Log in SponsorCRM as "contacted" + note the outreach.
5. Set 7-day follow-up reminder manually (or wait for cron in May).

That's the wedge. Once it works on Bangor Savings, replicate for 19 more leads in parallel.
