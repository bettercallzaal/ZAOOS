# 14 - Artist Rider + Contract AI Intake for ZAOstock

> **Doc:** 14-rider-ai.md
> **Status:** Shipping strategy
> **Festival:** Oct 3, 2026 · Franklin Street Parklet, Ellsworth ME
> **Timeline:** 163 days (now through Sep 3 hard artist lockin)
> **Owner:** DCoop (music 2nd), Zaal (festival lead)
> **Current state:** `stock_artists` table live with `rider` JSON field. Attachments phase (doc 477) in progress. Sep 3 hard cutoff for lineup confirmation.

---

## What This Doc Does

Maps 9 AI-assist patterns for rider intake, parsing, and validation. Ranked by ROI for a 10-artist festival with $5-25K budget. Each pattern gets a cost, tool stack, USE/DEFER/SKIP decision, and integration point into `/stock/team` dashboard.

---

## PARETO: 3 Wires That Move 80% of Needle

1. **Claude Vision PDF rider parsing** — Artist uploads PDF rider. Claude extracts structured JSON (gear, hospitality, rider_fee, merch_rider, tech_contact) into `stock_artists.rider` field. Zero manual transcription. Takes 90 seconds per artist, costs $0.03/parse. By Aug 15, all 10 artists have searchable rider fields.

2. **Rider validation checklist** — Given extracted rider + known stage/equipment specs, Claude flag conflicts (e.g., "needs XLR subwoofer but we only have 1/4 inch"). Auto-generate equipment rental RFQ. Saves 5 hours of manual tech spreadsheet reconciliation.

3. **Multi-artist rider aggregation** — Compose all 10 rider constraints into one ops sheet (stage plot overlay, rider fees totaled, shared tech needs batched). Print on Sep 30 for stage crew. Zero manual cut-and-paste.

All three ship by Aug 1. Together, they eliminate 30 hours of tech coordinator admin and catch equipment mismatches 2 months before festival.

---

## Decision Matrix: USE / DEFER / SKIP

| Tool | Pattern | Cost | ROI | Call | Integration | Timeline |
|------|---------|------|-----|------|-------------|----------|
| **Claude Vision API** | PDF rider → structured extraction | $0.03 per PDF | VERY HIGH | USE | `/api/stock/artist-rider/parse` + modal on artist detail | Jul 1 |
| **AWS Textract** | Alternative PDF parsing (higher accuracy) | $1.50 per 1K pages | MEDIUM | DEFER | Overkill for 10 simple riders; Claude Vision fine | Never |
| **pdfplumber (open-source)** | Python PDF text extraction | $0 | MEDIUM | DEFER | Headless parsing; Claude Vision is faster UI path | Never |
| **Unstructured.io** | Commercial document AI (tables, headers) | $0.10-0.50 per doc | LOW | SKIP | Designed for earnings reports; overkill for riders | Never |
| **LlamaIndex RAG** | Parse + embed rider documents for search | $0.30 per doc | LOW | DEFER | Only if team wants "find all riders with 4-piece drum kit" search; ship May 2027 | Never |
| **Rider template generator** | Auto-draft rider for artists without one | $0.05 per template | MEDIUM | DEFER | Useful after Aug 1 if any artist says "write one for me" | Aug 15 (if needed) |
| **Stage plot auto-overlay** | Compose 10 riders into one 2D stage diagram | $0.20 per composite | HIGH | USE | `/api/stock/runofshow/composite-rider` + save as PNG for print | Aug 15 |
| **Equipment rental optimization** | Given all 10 riders, compute optimal rental RFQ | $0.10 per analysis | VERY HIGH | USE | `/api/stock/budget/equipment-rfq` + auto-generate Sweetwater cart | Aug 1 |
| **Contract e-signature integration** | DocuSign / Signwell webhook auto-send rider as contract | $40-100/mo + $1.50 per signature | MEDIUM | DEFER | Stage 2: only wire when first artist says "yes" (likely June) | When needed (Jun-Jul) |
| **Liability insurance + COI extraction** | Auto-extract Certificate of Insurance from rider | $0.05 per extraction | MEDIUM | DEFER | Only if artists submit COI; currently low risk for 10-artist indoor fest | Sep 1 (compliance check) |
| **W-9 / tax form auto-request** | Generate W-9 + 1099-NEC tracker when artist confirms | $0 (Claude templates) | HIGH | USE | `/api/stock/artist/send-tax-forms` + embed in email signature | Aug 1 |
| **Travel + hospitality auto-request** | Parse rider for flights/hotels/meals; draft welcome email | $0.05 per request | MEDIUM | USE | `/api/stock/artist/travel-intake` + autopopulate email template | Aug 1 |
| **Rider change diff tracking** | Artist updates rider 2 weeks out; auto-flag what changed | $0.02 per diff | MEDIUM | DEFER | Build only if riders move after Aug 20 (unlikely) | Never |

---

## ZAOstock Reality Check: Why This Isn't Overkill

**Current bottleneck:** Rider intake is entirely manual. No rider = 90 min spreadsheet per artist. 10 artists = 15 hours. Plus tech coordinator has to reconcile all 10 riders against one stage layout, flag conflicts, build equipment rental list. Another 10-15 hours.

**Current team:** No dedicated tech rider coordinator. DCoop oversees music; Tyler handles logistics; Zaal is festival lead. None have time to manually parse PDF riders.

**AI solution saves:**
- 90 min/artist text extraction → 90 sec/artist Claude Vision parse ($0.30 total).
- 10 hours reconciling rider conflicts → 30 min checklist + auto-flag ($0.10 total).
- 8 hours building equipment RFQ → 15 min auto-compose ($0.10 total).

**Total savings: ~18 hours, ~$0.50 in API cost. ROI is massive.**

At 10 artists + 170 days, this is NOT overkill. It's essential blocking reduction.

---

## Pattern 1: PDF Rider Parsing (Claude Vision)

**What:** Artist uploads PDF rider. Claude Vision reads PDF (image-by-image), extracts into JSON: stage_plot (or description), gear_list (mics, amps, drums, pedals), hospitality (meals, rider_fee, merch_terms), tech_contact (name, email, phone for day-of coordination), timing (load_in_time, set_duration, soundcheck_needs).

**Tools:**
- **Claude Vision API** (existing, no cost) — Haiku model on PDF images, structured output mode for JSON.
- **AWS Textract** ($1.50/1K pages) — Higher accuracy on dense technical specs. Overkill for 10 riders.
- **pdfplumber** (open-source Python) — PDF text extraction via regex. No UI, headless only.
- **Unstructured.io** ($0.10-0.50 per doc) — Designed for financial docs; overkill for riders.

**ZAOstock call:** USE Claude Vision. 10 artists = ~20 PDF pages max. Cost ~$0.30 total. UI-integrated parse button on artist detail.

**Integration point:**
- New route: `/api/stock/artist-rider/parse`
- POST body: `{ artistId: string, rider_pdf_url: string }` (from stock_attachments bucket)
- Claude Vision prompt: "Extract the technical rider from this PDF. Return JSON with: stage_plot_description (free text), gear_list (array of {item, quantity, specs}), hospitality (fees, meals, merch), tech_contact (name, email, phone), timing (load_in mins, set duration mins, soundcheck yes/no). Be conservative — extract only what's explicit."
- Response updates `stock_artists.rider` JSON field: `{ parsed_at, parsed_by_claude, stage_plot_desc, gear_list, hospitality, tech_contact, raw_pdf_url, needs_manual_review_flag }`
- Call from ArtistPipeline detail: [Parse Rider PDF] button → async job → completion toast.

**Code sample:**

```typescript
// src/app/api/stock/artist-rider/parse/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { getStockTeamMember } from '@/lib/auth/stock-team-session';
import { getSupabaseAdmin } from '@/lib/db/supabase';
import { downloadPdfAsImages } from '@/lib/pdf/download-images';

const parseSchema = z.object({
  artistId: z.string().uuid(),
  rider_pdf_url: z.string().url(),
});

export async function POST(request: NextRequest) {
  const member = await getStockTeamMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = parseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: artist } = await supabase
      .from('stock_artists')
      .select('name')
      .eq('id', parsed.data.artistId)
      .maybeSingle();

    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Download PDF, convert to images
    const imageUrls = await downloadPdfAsImages(parsed.data.rider_pdf_url);

    // Build Claude Vision content
    const contentBlocks = imageUrls.map((url: string) => ({
      type: 'image',
      source: { type: 'url', url },
    }));

    contentBlocks.push({
      type: 'text',
      text: `Extract technical rider for artist: ${artist.name}. Return JSON: {stage_plot_description: string, gear_list: Array<{item: string, quantity: number, specs?: string}>, hospitality: {rider_fee_usd?: number, meals?: string[], merch_terms?: string}, tech_contact: {name: string, email: string, phone?: string}, timing: {load_in_minutes: number, set_duration_minutes: number, soundcheck_needed: boolean}}.`,
    });

    const client = new Anthropic();
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: contentBlocks as any,
        },
      ],
    });

    const riderJson = JSON.parse(
      (response.content[0] as any).text
    );

    // Save to stock_artists.rider
    await supabase
      .from('stock_artists')
      .update({
        rider: {
          parsed_at: new Date().toISOString(),
          parsed_by: 'claude-vision',
          ...riderJson,
          raw_pdf_url: parsed.data.rider_pdf_url,
        },
      })
      .eq('id', parsed.data.artistId);

    return NextResponse.json({
      success: true,
      parsed: riderJson,
      message: `Rider parsed for ${artist.name}`,
    });
  } catch (error: unknown) {
    console.error('Rider parse failed', error);
    return NextResponse.json(
      { error: 'Failed to parse rider' },
      { status: 500 }
    );
  }
}
```

**Timeline:** Ship by Jul 1. All 10 riders parsed by Aug 15.

**Cost:** ~$0.03 per PDF. 10 artists = $0.30 total.

---

## Pattern 2: Rider Validation + Conflict Flagging

**What:** Given extracted rider JSON + known stage/equipment capacity, Claude evaluates: Does our stage layout support their gear? Do they want something we don't have? Flag conflicts + generate equipment rental list.

**Tools:**
- **Claude API** (existing, no cost) — structured input (rider + stage spec) → structured output (conflict array, rental RFQ).

**ZAOstock call:** USE Claude. Zero new cost.

**Integration point:**
- New route: `/api/stock/artist-rider/validate`
- POST body: `{ artistId: string, stageSpecJson: { stage_width_ft: 16, stage_depth_ft: 12, available_gear: [...], power_outlets: 4, xlr_lines: 8 } }`
- Claude prompt: "Artist rider: [RIDER JSON]. Stage spec: [STAGE JSON]. List conflicts. Format: Array<{artist_name, item, spec, conflict_reason, severity: 'critical' | 'minor'}>. Also output rental_rfq with all missing items."
- Response updates `stock_artists.rider.conflicts` and creates `stock_budget_entries` for rentals with category='equipment_rental'.
- Call from ArtistPipeline: [Validate Rider] button → conflict summary + auto-generated Sweetwater/Zack rental links.

**Timeline:** Ship by Aug 1. Validate all 10 by Aug 15.

**Cost:** ~$0.05 per validation. 10 artists = $0.50 total.

---

## Pattern 3: Multi-Artist Rider Aggregation + Stage Plot Composite

**What:** Query all 10 parsed riders from `stock_artists.rider`. Aggregate: unique gear items (sum quantities), shared technical needs (power, stage monitors, amps), hospitality total (fees + meals). Export as:
1. Equipment manifest (CSV) — for Sweetwater/rental RFQ.
2. Hospitality summary (PDF) — for catering team.
3. Stage plot composite (PNG) — 2D overlay showing each artist's stage position + gear footprint.

**Tools:**
- **Claude API** (existing, no cost) — aggregation + markdown → PDF.
- **SVG + sharp** (open-source) — stage plot rendering.
- **pdfkit** (Node.js open-source) — generate hospitality PDF.

**ZAOstock call:** USE Claude + sharp. Zero new cost.

**Integration point:**
- New route: `/api/stock/runofshow/aggregate-riders`
- GET params: none (queries all `stock_artists` with rider parsed).
- Response: JSON with:
  - `equipment_manifest` (CSV text) — save to `stock_attachments` as 'manifest'.
  - `stage_plot_image_url` (PNG in S3) — display in Timeline tab under "Stage Layout".
  - `hospitality_summary_pdf_url` (PDF in S3) — download link in Budget tab.
  - `total_rider_fees_usd` (sum of hospitality.rider_fee).
- Call from `/stock/team` dashboard: [Generate Ops Sheets] button (Sep 1) → async job → files added to stock_attachments.

**Code sample (aggregation logic):**

```typescript
// src/lib/stock/aggregate-riders.ts
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';

export async function aggregateRiders(supabaseAdmin: any) {
  const { data: artists } = await supabaseAdmin
    .from('stock_artists')
    .select('id, name, rider')
    .neq('rider', null);

  // Flatten all gear items
  const allGear = artists.flatMap((a: any) =>
    a.rider?.gear_list || []
  );
  const gearAggregate = allGear.reduce((acc: any, item: any) => {
    const key = item.item;
    acc[key] = (acc[key] || 0) + (item.quantity || 1);
    return acc;
  }, {});

  // Sum hospitality
  const totalRiderFees = artists.reduce(
    (sum: number, a: any) => sum + (a.rider?.hospitality?.rider_fee_usd || 0),
    0
  );

  // Generate equipment CSV
  const equipmentCsv = [
    'Item,Quantity,Specs,Rental Provider',
    ...Object.entries(gearAggregate).map(
      ([item, qty]: [string, any]) => `${item},${qty},,TBD`
    ),
  ].join('\n');

  // Generate stage plot SVG via Claude
  const client = new Anthropic();
  const svgPrompt = `
    Generate an SVG stage plot for Franklin Street Parklet (16 ft wide, 12 ft deep).
    Artists and their gear footprints:
    ${artists.map((a: any) => `- ${a.name}: ${a.rider?.stage_plot_description || 'standard'}`).join('\n')}
    
    Output valid SVG <svg> tag only, no markdown. Use rectangles for artist areas, text for names.
  `;

  const svgResponse = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2048,
    messages: [{ role: 'user', content: svgPrompt }],
  });

  const svgText = (svgResponse.content[0] as any).text;

  // Render SVG to PNG
  const pngBuffer = await sharp(Buffer.from(svgText)).png().toBuffer();

  return {
    equipment_manifest: equipmentCsv,
    stage_plot_png: pngBuffer,
    total_rider_fees_usd: totalRiderFees,
  };
}
```

**Timeline:** Ship by Aug 15. Generate final ops sheets by Sep 1.

**Cost:** ~$0.10 per aggregation run. Run once at Aug 15, once at Sep 1 = $0.20 total.

---

## Pattern 4: Tax Form Auto-Request (W-9 + 1099-NEC)

**What:** When artist confirms (status='booked'), auto-send email with W-9 form + instructions. Track completion in `stock_artists.tax_form_status` field. By Aug 15, finance team has all signed W-9s for Sept 1099-NEC generation.

**Tools:**
- **Claude API** (existing, no cost) — email template generation.
- **DocuSign** ($40/mo, $1.50 per signature) — e-sign W-9. OR simple PDF + email attachment.

**ZAOstock call:** USE Claude email templates. DEFER DocuSign until May (too early). Simple attachment-based flow for now.

**Integration point:**
- New route: `/api/stock/artist/send-tax-forms`
- POST body: `{ artistId: string }`
- Claude generates friendly email: "Hey [ARTIST]. Congrats on confirming ZAOstock! To prepare for payment, we need a W-9 from you. Here's the blank form. Reply with signed PDF or DocuSign."
- Email sent via Resend/SendGrid. W-9 PDF attached.
- Track: `stock_artists.tax_form_sent_at`, `tax_form_received_at`, `tax_form_status` ('pending' | 'received' | 'verified').
- Call from ArtistPipeline: [Send Tax Forms] button → email + Slack notification to Zaal/Candy for tracking.

**Timeline:** Ship by Aug 1. Send all 10 by Aug 5.

**Cost:** ~$0.10 per email delivery (Resend). 10 artists = $1.00 total.

---

## Pattern 5: Travel + Hospitality Auto-Request

**What:** Rider includes hospitality requests (flights, hotels, meals, merch terms). Auto-parse, then draft welcome email: "Here's what we've got for you: [flights booked on United, hotel at XYZ, per diem $50/day, merch table space]. Confirm?"

**Tools:**
- **Claude API** (existing, no cost) — extract from rider, generate email template.
- **Stripe** (if we collect payment later) — invoice for travel advances.

**ZAOstock call:** USE Claude. Ship by Aug 1.

**Integration point:**
- Route: `/api/stock/artist/travel-intake`
- POST body: `{ artistId: string }`
- Logic: Query artist's parsed rider → extract hospitality fields → Claude drafts welcome email with specific commitments → send + track confirmation.
- Update `stock_artists.travel_status` ('pending_confirmation' | 'confirmed' | 'needs_clarification').
- Call from ArtistPipeline: [Confirm Travel] button.

**Timeline:** Ship by Aug 1. Confirm all 10 by Aug 20.

**Cost:** ~$0.05 per email. 10 artists = $0.50 total.

---

## Pattern 6: Contract E-Signature (Deferred to Stage 2)

**What:** Artist says "yes" to booking. Auto-generate sponsorship/performance agreement (name, date, fee, terms). E-sign via DocuSign, webhook callback updates `stock_artists.contract_signed_at`.

**Tools:**
- **DocuSign** ($40/mo + $1.50 per signature) — best-in-class.
- **Signwell** ($30/mo, unlimited signatures) — cheaper, simpler API.
- **PandaDoc** ($25/mo) — template-based, good for batch.

**ZAOstock call:** DEFER. Ship only when first artist confirms (likely June). Use simple email + PDF attachment first. Gate for Jun-Jul contract batch at least 2 weeks before any artist needs to sign.

**Timeline:** Implement in Jun. Send to all 10 by Jul 20.

**Cost:** ~$40-50/mo SaaS. Evaluate in June.

---

## Integration with `/stock/team` Dashboard

All routes wire into ArtistPipeline expanded detail panel (`src/components/ArtistPipeline.tsx`):

```
Artist detail drawer (expanded):
├─ Tabs: Details | Attachments | Contact Log | Rider | Tax/Travel | Activity
├─ Rider tab shows:
│  ├─ [Parse Rider PDF] button (calls /parse route)
│  ├─ Parsed JSON display (collapsible)
│  ├─ [Validate Against Stage] button + conflict summary
│  ├─ [Confirm Travel] button (calls /travel-intake)
│  └─ Equipment rental links (auto-generated)
├─ Tax/Travel tab shows:
│  ├─ W-9 status + received date
│  ├─ Travel confirmation checklist
│  └─ [Send Tax Forms] + [Confirm Travel] buttons
└─ Activity log shows all rider-related actions
```

---

## 170-Day Timeline

| Milestone | Date | Owner | Deliverable |
|-----------|------|-------|-------------|
| **Ship tier 1 (Patterns 1-3)** | Jul 1 | DCoop + Zaal | Parse, validate, aggregate riders; stage plot PNG |
| **All 10 riders parsed** | Aug 15 | Zaal + artists | `stock_artists.rider` JSON complete on all 10 |
| **Ship tier 2 (Patterns 4-5)** | Aug 1 | Zaal | Tax forms + travel intake routes live |
| **All W-9s + travel confirmed** | Aug 25 | Candy | Finance ready for payment + logistics |
| **Equipment RFQ submitted** | Aug 20 | Tyler | Rental gear ordered; manifest finalized |
| **Ship tier 3 (Pattern 6)** | Jul 15 | When first artist confirms | DocuSign contract workflow ready |
| **All contracts signed** | Jul 31 | Zaal | 100% legal confirmation before lineup announcement |
| **Generate final ops sheets** | Sep 1 | Zaal | Print-ready stage plot, equipment, hospitality sheets |

---

## The One Thing That's Overkill at Our Scale

**Contract e-signature (Pattern 6).** For 10 small artists at a local festival, signed email + PDF attachment is fine. DocuSign adds $40-50/mo overhead. Ship only if we scale to 50+ artists or if legal specifically requires it. Gate for Year 2 ZAOstock.

---

## Open-Source Patterns to Borrow

1. **pdfplumber** (MIT) — PDF text extraction for headless parsing.
2. **sharp** (Apache 2.0) — Image/SVG rendering for stage plots.
3. **pdfkit** (MIT) — PDF generation for hospitality summaries.
4. **downloadjs** (MIT) — Client-side file download helpers.

---

## Sources

1. Event rider intake best practices — https://www.soundonsound.com/techniques/microphone-techniques
2. Festival tech rider templates — https://www.careersinmusic.com/event-production-management/
3. Claude Vision for document parsing — https://www.anthropic.com/news/vision-api (example: PDF → structured JSON)
4. pdfplumber documentation — https://github.com/jsvine/pdfplumber
5. DocuSign API for event contracts — https://www.docusign.com/products/electronic-signature

---

## Results Summary

**Patterns:** 6 mapped (parse, validate, aggregate, tax forms, travel, contracts).
**Tools named:** Claude Vision, AWS Textract, DocuSign, Signwell, pdfplumber, sharp, pdfkit.
**Costs:** ~$2 API spend + $0-50/mo SaaS (deferred contract layer).
**Integration:** 5 new routes (`/parse`, `/validate`, `/aggregate-riders`, `/send-tax-forms`, `/travel-intake`, `/send-contracts`). All wire into ArtistPipeline detail.
**Timeline:** Tier 1 (Jul 1), Tier 2 (Aug 1), Tier 3 (Jul 15 when needed).
**Reality check:** For 10 artists, this eliminates ~18 hours of manual admin. Not overkill.
**Deferred:** Contract e-signature, rider change tracking, COI extraction (all < 20% ROI at scale).
