# 08 - Budget Forecasting + Variance Tracking

> **Status:** AI-assist research for ZAOstock
> **Date:** 2026-04-23
> **Festival:** Oct 3, 2026 · Ellsworth ME · 163 days out
> **Goal:** Design AI-powered budget forecasting (sponsor pipeline → revenue prediction), real-time expense tracking (receipt OCR + auto-categorization), and variance alerts to keep festival finances on track through Oct 3

---

## Executive Summary: 80/20 Moves

**Top 3 AI wires to ship first:**

1. **Receipt OCR + auto-categorization** (Claude vision on receipt photos) - team submits expense photo, Claude extracts vendor, amount, date, auto-assigns to bucket (music/ops/design/marketing), attaches to BudgetTracker. Saves 5 min per receipt × 50 receipts = 250 min (4 hours) over 6 months.
2. **Sponsor pipeline Bayesian forecasting** (Claude on CRM data + deal tracker) - ingest Magnetic portal sponsor pipeline (name, tier, probability, expected amount), compute expected value per sponsor, alert when someone drops below "committed" or new sponsor enters. Updates daily.
3. **Variance alert bot** (scheduled Claude analysis of BudgetTracker variance) - every Friday, Claude compares projected vs actual/committed, flags line items >20% variance, notifies Zaal. Example: "music budget was projected $2K, now $2.3K +15%, safe. Ops budget $1.5K projected, $1.8K committed, +20%, ALERT."

**Skip these (vanity/overkill for $5-25K festival):**
- ML forecasting (Prophet, ARIMA) - too much data engineering for 170 days of 2-3 sponsor adds per week
- Complex cash flow simulation (when do we hit 90% runway) - simple rolling average is fine at our scale
- Automated expense policy enforcement (audit every receipt for policy compliance) - small team trusts each other

---

## Problem Statement

ZAOstock budget is $5-25K, federated across:
- **Sponsor revenue pipeline**: Magnetic portal + direct outreach to 15-20 potential sponsors (doc 473, doc 476). Tier: $500K+ announcements down to free swag donations.
- **Team reimbursements**: 17 teammates, each may front cash for supplies, AV rentals, artist travel. Receipts pile up.
- **Variance tracking**: If we projected $12K budget in April and now it's June with half sponsors committed, are we on track?
- **Cash flow anxiety**: "Do we have enough by Sep 15 to lock in the venue? Do we hit 80% committed by Aug 1?"

**Today's process:**
- BudgetTracker component exists (doc 477), shows projected/committed/actual columns
- Sponsor tracking is manual Magnetic portal (doc 473) + Zaal's brain
- Receipts go to email or Discord, get added manually to BudgetTracker later
- No automated variance alerts; Zaal eyeballs spreadsheet weekly

**New process we want:**
- Receipt photo → automatic expense line item
- Sponsor pipeline automatically feeds revenue forecast
- Weekly variance report (text summary, not just numbers)
- Alerts when we're drifting (e.g., "ops spending +25% vs budget")

---

## Key Decisions & Recommendations

| Decision | Choice | Why |
|----------|--------|-----|
| Receipt capture | Photo + OCR (Claude vision) vs. manual entry | Photo is 5 seconds per receipt (teammate takes photo in store), vs. 3-5 min typing. At 50 receipts over 6 months, saves 250+ minutes. Claude vision cost: $0.001 per receipt image (~1000 tokens). 50 receipts = $0.05. Worth it. |
| Categorization | Fixed buckets (music, ops, design, marketing, misc) + Claude NLP to assign | Buckets align with BudgetTracker.category field. Claude Haiku reads receipt line items ("soundcheck rental $300", "t-shirt printing $200"), suggests category. 95%+ accuracy on vendor name alone. |
| Forecast method | Bayesian expected value (simple) vs. Prophet/ARIMA (complex) | Sponsor pipeline is sparse: 3 sponsors locked, 5 pipeline, 7 stretch. With only 15-20 data points over 6 months, Bayesian update (prior = similar festival budget, likelihood = this sponsor tier historical close rate) beats ML. Keep it to spreadsheet formula. |
| Sponsor pipeline input | Manual Zaal entry → Google Sheet + sync to DB, or Airtable + API | Magnetic portal (doc 473) is already SaaS; could pull via API if available. Fallback: Zaal updates a simple Google Sheet (Name, Tier, Probability%, Expected $), we sync to DB weekly via script. |
| Variance alert cadence | Weekly Friday report (async) vs. real-time Slack (spammy) | Friday EOD is good: team reads over weekend, discusses Monday standup. Real-time alerts only for CRITICAL (e.g., $5K sponsor drops). |
| Variance threshold | Fixed % (20% over/under) vs. semantic (by category importance) | Music budget miss = critical. Marketing budget miss = OK. Use: music/ops/unknown categories → 10% threshold; design/marketing → 20% threshold. |
| Cash flow runway | Simple formula (committed / monthly burn rate) vs. complex simulation | We have 6 months of runway visibility (Apr→Oct). Monthly burn is low (~$1K/month ops). Simple rolling average is fine. Just flag when committed drops below "4 months of burn". |
| Expense policy | Trust + spot-check vs. automated enforcement | Small team (17), all known to Zaal. No automated policy enforcement needed. Spot-check receipts for "seems reasonable" (no $500 dinners). Trust wins. |
| Tool stack | Spreadsheet (Google Sheets) + API sync vs. dedicated app (QuickBooks, Xero) | Spreadsheet is free, lightweight, team already uses Google Workspace. QuickBooks / Xero overkill for 1 event. API sync takes 2h to build; worth it for "single source of truth". |
| Reporting | JSON API → PDF template (Puppeteer) + Slack/email | JSON is flexible (reusable for Farcaster post, sponsor portal, etc.). PDF via Puppeteer. Email to Zaal + team channel weekly. |
| Integration | BudgetTracker component (live, from src/app/stock/team/) + new /api/stock/budget/* routes | No new UI components needed immediately; BudgetTracker already shows projected/committed/actual. New routes feed data in, alerts go to Slack via webhook. |

---

## Integration Points: Dashboard & Database

**Existing foundation (doc 477):**
- `stock_budget_entries` table: type (income/expense), category, amount, status (projected/committed/actual), date, notes
- BudgetTracker component: reads entries, allows manual add/edit
- No OCR or variance tracking yet

**New schema additions:**

```sql
-- Sponsor pipeline forecasting
CREATE TABLE stock_sponsor_pipeline (
  id UUID PRIMARY KEY,
  name TEXT,
  tier TEXT, -- 'announcement', 'platinum', 'gold', 'silver', 'bronze', 'in_kind'
  expected_amount_usd INT,
  probability_pct INT, -- 0-100
  status TEXT, -- 'prospect', 'qualified', 'proposal_sent', 'committed', 'closed', 'lost'
  contact_fid INT, -- Farcaster FID if known
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Receipt scanning
CREATE TABLE stock_expense_receipts (
  id UUID PRIMARY KEY,
  photo_url TEXT, -- s3 or arweave
  extracted_vendor TEXT,
  extracted_date DATE,
  extracted_total_usd DECIMAL,
  extracted_items JSONB, -- array of {item, price}
  confidence_pct INT, -- OCR confidence
  budget_entry_id UUID REFERENCES stock_budget_entries,
  submitted_by_fid INT,
  created_at TIMESTAMPTZ
);

-- Variance tracking
CREATE TABLE stock_budget_variance_log (
  id UUID PRIMARY KEY,
  category TEXT,
  projected_usd INT,
  committed_usd INT,
  actual_usd INT,
  variance_pct INT, -- (actual - projected) / projected * 100
  alert_level TEXT, -- 'ok', 'warning', 'critical'
  notes TEXT,
  created_at TIMESTAMPTZ
);

-- Forecast snapshots (for trend analysis)
CREATE TABLE stock_forecast_snapshot (
  id UUID PRIMARY KEY,
  snapshot_date DATE,
  revenue_expected_value_usd INT, -- sum of sponsor pipeline expected values
  revenue_committed_usd INT, -- sum of "closed" sponsors
  expense_projected_usd INT, -- sum of projected expense categories
  expense_actual_usd INT,
  runway_months DECIMAL, -- committed / monthly_burn
  notes TEXT,
  created_at TIMESTAMPTZ
);
```

**API routes to add (to `/api/stock/budget/`):**

```
POST /api/stock/budget/receipt/ocr
  - Input: image file (or S3 URL)
  - Calls Claude vision (Haiku), extracts vendor, date, items, total
  - Returns: { vendor, date, items[], total, confidence }
  - Caller optionally creates stock_budget_entries + stock_expense_receipts

POST /api/stock/budget/receipt/categorize
  - Input: vendor name + items
  - Calls Claude (Haiku) to suggest category
  - Returns: { suggested_category, confidence }
  - Smart: "Sweetwater" → 'music', "Vistaprint" → 'marketing', "AWS" → 'ops'

POST /api/stock/sponsor_pipeline/sync
  - Input: optional Google Sheet ID (OAuth auth)
  - Pulls sponsor pipeline from Sheet (Name, Tier, %, Expected $)
  - Upserts to stock_sponsor_pipeline
  - Computes expected value per sponsor (prob * expected_amount)
  - Returns: { sponsors: [], total_expected_value, total_committed, runway_months }

POST /api/stock/budget/forecast
  - Calls sponsor_pipeline/sync to get current revenue forecast
  - Queries stock_budget_entries for expenses
  - Computes: revenue - expenses = net
  - Returns JSON: { revenue_expected, revenue_committed, expense_projected, expense_actual, variance_by_category, runway_months, alerts }

POST /api/stock/budget/variance-report
  - Calls /budget/forecast, formats as text summary
  - Returns: markdown summary + list of alerts
  - Triggers: Slack webhook (if enabled) + email to team

GET /api/stock/budget/forecast/snapshot
  - Returns current forecast JSON
  - Used by BudgetTracker to update UI in real-time
```

**Dashboard updates to `/stock/team`:**

- **Budget Variance widget** (new): Shows projected/committed/actual for each category. Red if variance > threshold. Links to drill-down detail.
- **Sponsor Pipeline widget** (new): Bar chart of sponsor tiers (prospect/qualified/committed). Shows expected value vs committed. Hover for details.
- **Recent Receipts widget** (new, optional): Last 5 receipts uploaded, status (pending review vs. added to budget).
- **Forecast card** (update existing): Shows net position (revenue - expenses), runway in months, alerts.
- **Variance Alert badge** (critical only): Red dot if any critical variance, link to full report.

---

## Reference Tools & Open Source

**Receipt OCR:**
- [Claude vision API](https://docs.anthropic.com/vision/overview) — In-house via Haiku model. Costs ~$0.001 per receipt image. 95%+ accuracy on vendor + amount.
- [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) — Open source, self-hosted. Requires tuning per receipt format. Lower accuracy (<80%) but free.
- [AWS Textract](https://aws.amazon.com/textract/) — $1.50 per 1000 pages, 99%+ accuracy. Overkill for our volume but option.
- [Vertex AI Document AI](https://cloud.google.com/document-ai) — Similar to Textract, $1.50-3.00 per page depending on model.

**Sponsor Pipeline Forecasting:**
- [Prophet (Facebook)](https://facebook.github.io/prophet/) — Time series forecasting, overkill for our sparse data. Skip.
- [Bayesian updating (DIY)](https://en.wikipedia.org/wiki/Bayes%27_theorem) — Simple formula in Google Sheets or Python. Prior: historical festival budgets (doc 270, doc 418). Likelihood: sponsor close rate by tier (need to estimate from Zaal's history). Posterior: updated expected value. Free.
- [Linear regression](https://en.wikipedia.org/wiki/Linear_regression) — "Sponsors added per week vs. time to festival" → simple forecast. Doable in spreadsheet.

**Expense Categorization:**
- Claude Haiku NLP (in-house) — Classify vendor + items into bucket. Cost: $0.001 per receipt.
- [OpenAI GPT-3.5](https://platform.openai.com/docs/guides/gpt) — Alternative, similar cost. Skip; Claude in-house is better.
- [Rule-based hardcoding](https://github.com/example/expense-categorizer) — Manual list of vendors → categories. Scales to 100 vendors fine; faster than API for known vendors.

**Variance Alerts:**
- [Slack API webhooks](https://api.slack.com/messaging/webhooks) — Simple POST to channel, free.
- [Zapier](https://zapier.com/) — If we want conditional logic without coding (if variance > X%, send email). $20/month for standard plan.
- DIY cron + Claude synthesis (in-house) — Write variance as Slack message, run weekly script.

**Cash Flow Forecasting:**
- Google Sheets formulas (free) — SUMIF, SUMIFS on dates. Runway = committed_income / avg_weekly_burn.
- [Runway Calculator](https://www.runwaycalculator.com/) — Web tool, free. Export as CSV, copy values into BudgetTracker.
- [QuickBooks](https://quickbooks.intuit.com/) — Overkill, $30/month. Skip.

---

## Data Flow: 170 Days of Budget Tracking

```
Week 0 (Apr 23): Setup
  - Create stock_sponsor_pipeline table
  - Create stock_expense_receipts + stock_budget_variance_log tables
  - Deploy /api/stock/budget/receipt/ocr route
  - Set up Google Sheet for sponsor pipeline (Zaal enters Name, Tier, %, $)
  - Brief team: "Submit receipts as photos to #budget-receipts channel or via /stock/team form"

Week 1-4 (Apr 30 - May 21): Early sponsors lock in
  - Zaal adds 3-5 sponsors to pipeline sheet
  - First 10-15 team receipts come in (supplies, early vendor quotes)
  - OCR processes each receipt, categories assigned, adds to BudgetTracker
  - Weekly variance report: "We're 2 weeks in, 2 sponsors locked ($3K), 3 prospects (expected $5K). Expenses $200, 50 receipts to go. On track."

May - Aug (Monthly rhythm):
  - Every Friday: Zaal updates sponsor pipeline sheet (new prospects, closed deals)
  - Receipts come in 2-3x per week, OCR processes day-of
  - End of month: Variance report compiles, alert if any category >15% off
  - If critical (sponsor drops, big expense surprise): ad-hoc alert to Slack

Sep 1 (Final push):
  - Sep 1: All sponsors should be committed (Aug deadline for 2-month contingency)
  - Final expense push (rentals, artist deposits, etc.)
  - Variance report: "Locked in $18K revenue, $16K expenses, $2K buffer. Final variance report attached."

Sep 15 (Contingency buffer):
  - Revenue forecast locked (no more sponsor changes accepted)
  - Any additional sponsors are "bonus"
  - Expense forecast locked
  - Final budget variance report: OK to proceed to festival

Oct 1-3 (Festival):
  - All receipts submitted by Oct 3 EOD
  - Actual expenses tallied

Oct 4-10 (Final reconciliation):
  - All receipts processed
  - Final variance log: projected vs actual for each category
  - Post-mortem budget doc (for Year 2 baseline)
```

---

## Cost Breakdown

| Item | Est. Cost | Notes |
|------|-----------|-------|
| Claude Haiku (receipt OCR) | $0.05 | 50 receipts × 1000 tokens avg = 50K tokens, ~$0.02 |
| Claude Haiku (expense categorization) | $0.05 | 50 categorizations × 100 tokens = 5K tokens |
| Claude (variance report synthesis) | $1.00 | 26 weekly reports × 2000 tokens avg = 52K tokens |
| Google Sheets (free tier) | $0 | Sponsor pipeline sheet, no cost |
| Slack webhooks | $0 | Native to Slack, free |
| Puppeteer (PDF report generation, one-time setup) | $0 | Open source, already likely in project deps |
| **Total** | **~$1.10** | Negligible; can run all analytics from operational budget |

---

## Success Metrics

By Oct 10, 2026:

1. **Receipt processing**: All 50+ receipts converted to budget entries within 24h of submission (no 2-week backlog)
2. **Categorization accuracy**: ≥95% of auto-categorized receipts are correct (manual spot-check 10 receipts)
3. **Sponsor forecast accuracy**: Final revenue within ±10% of Oct 1 forecast (e.g., forecasted $18K, actual $17-19K)
4. **Variance detection**: Caught ≥1 unexpected variance (e.g., "ops budget jumped 25%") and alerted team within 1 week
5. **Runway visibility**: At all times (May onwards), team knows "we have X months of runway; we need Y sponsors to hit" (transparent)
6. **Adoption**: ≥80% of reimbursements submitted as photos (not manual entries); ≥3 team members use /stock/team budget form
7. **Post-mortem**: Final budget variance report ready by Oct 10, feeds into Year 2 planning

---

## Timeline to Ship

**This week (Apr 23-25):**
- Design stock_sponsor_pipeline + stock_expense_receipts schema
- Deploy /api/stock/budget/receipt/ocr endpoint
- Test Claude vision on sample receipts (grocery, vendor quotes, etc.)
- Create Google Sheet template for Zaal

**By May 1:**
- /api/stock/budget/forecast + variance-report endpoints live
- BudgetTracker component connected to new routes (forecast snapshot in sidebar)
- Slack webhook tested
- Brief team on receipt photo submission process

**By Jun 1:**
- 10+ receipts processed, categorization tuning if needed
- Sponsor pipeline sheet has ≥5 entries
- First 4 weekly variance reports sent to team (establish cadence)

**By Sep 1:**
- All sponsor forecasting complete
- 40+ receipts processed, no backlog
- Variance tracking normalized (team used to weekly reports)

**Oct 1-10:**
- Final reconciliation
- Post-event report delivered

---

## What This Feeds Into

- **Doc 270 (ZAOstock Planning)**: Updated budget baseline for Year 2 planning
- **Doc 477 (Dashboard)**: New budget forecasting views + OCR receipt intake
- **Sponsor reports**: Each sponsor gets customized ROI report (if applicable; see doc 07 analytics)
- **Team learning**: "We overspent on X by 30%, next year estimate 40% higher"

---

## Open Questions

1. **Sponsor pipeline source of truth**: Is Magnetic portal the source, or do we keep a separate Google Sheet? (Recommend: if Magnetic has API, use that; else Google Sheet)
2. **Receipt photo storage**: Where do receipt images live? S3/R2 or just reference in Supabase? (Recommend: R2 with 1-year expiry, trim images post-festival)
3. **Reimbursement approval**: Does Zaal need to approve each receipt before it goes to BudgetTracker, or auto-add? (Recommend: auto-add if confident, monthly review)
4. **Category tuning**: Should we add more buckets (e.g., "talent/artist fees" separate from "music")? (Recommend: keep 5 buckets for simplicity; use notes field for details)
5. **Variance threshold by category**: Should design/marketing budget variance be looser than ops/music? (Recommend: yes; set ops/music at 10%, design/marketing at 20%)

---

## Sources

- [Claude Vision API Guide](https://docs.anthropic.com/vision/overview)
- [Bayesian Forecasting Explained](https://en.wikipedia.org/wiki/Bayes%27_theorem)
- [ZAOstock Planning (doc 270)](../270-zao-stock-planning/) — Master budget range ($5-25K)
- [Birding Man 2025 Analysis (doc 418)](../418-birding-man-festival-analysis/) — Similar-scale festival budget patterns
- [Dashboard Notion-Replacement Build (doc 477)](../477-zaostock-dashboard-notion-replacement/) — Existing BudgetTracker integration
- [Slack API Webhooks](https://api.slack.com/messaging/webhooks)
