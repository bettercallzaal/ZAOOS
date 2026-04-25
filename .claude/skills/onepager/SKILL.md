---
name: onepager
description: Create a new ZAOstock one-pager (sponsor / partner / venue / city briefing). Asks for audience + purpose, drafts the markdown with frontmatter, saves to ZAO-STOCK/onepagers/, and surfaces the dashboard URL. Use when prepping a meeting, sponsor pitch, or partner briefing.
---

# /onepager - ZAOstock One-Pager Creator

Creates a new one-page briefing doc for sponsors, partners, venues, city contacts, or any external stakeholder. Saves as markdown to `ZAO-STOCK/onepagers/<slug>.md`. Renders at `/stock/onepagers/<slug>` on the dashboard.

## When to use

- Prepping for a meeting (city official, sponsor, venue manager)
- Drafting a sponsor pitch
- Partner briefing (Heart of Ellsworth, Wallace Events, Art of Ellsworth)
- Artist booking outreach
- Any "I need to send someone a clean one-page summary" moment

## Step 1: Gather context

If the user typed args (e.g. `/onepager Bangor Savings sponsor pitch`), use them. Otherwise ask:

1. **Audience** - who's reading this? Name + title + org. (e.g. "Roddy Ehrlenbach, Director of Parks/Rec, City of Ellsworth")
2. **Purpose** - what's the ask? One sentence. (e.g. "Lock $5K headline sponsor commitment with on-stage signage")
3. **Meeting date / send date** (optional) - when's the conversation? (e.g. "Tue 2026-04-28 5pm at City Hall")
4. **Visibility** - `internal` (default, requires login) or `public` (shareable URL no login)
5. **Reviewers** (optional) - who should review before sending? Default: just Zaal.

Skip questions the user already answered in the args.

## Step 2: Read the template

Reference doc: `ZAO-STOCK/onepagers/roddy-parks-rec.md`. Mirror that structure:
- H1 title (event + date)
- Blockquote: title line, contact, date, audience
- Section: **What it is** (1 paragraph + format + anchor partners line)
- Section: **Why this audience / venue** (1 paragraph - personal + relevant)
- Section: **Expected scale** (table or bullets - attendance, hours, format)
- Section: **What we bring** (bullets - production, insurance, crew, build-in-public)
- Section: **What we'd ask** (numbered list - the actual ask)
- Section: **What success looks like** (1 paragraph)
- Section: **Why now** (1 paragraph)
- Closer: "One ask above all: [the most important thing]"

Tighten for the audience. Sponsor pitch -> emphasize value to sponsor. Venue ask -> emphasize logistics. Artist booking -> emphasize lineup quality + payment terms.

## Step 3: Generate the slug

From audience + purpose: lowercase, hyphens, max 40 chars. Examples:
- "Roddy Ehrlenbach, Parks/Rec" + "permit" -> `roddy-parks-rec`
- "Bangor Savings" + "sponsor pitch" -> `bangor-savings-sponsor`
- "Wallace Events" + "tent partnership" -> `wallace-events-tents`

Check if slug already exists in `ZAO-STOCK/onepagers/`. If yes, append `-v2` or version suffix.

## Step 4: Build the frontmatter

```yaml
---
title: ZAOstock 2026 - <short title>
audience: <full audience line>
purpose: <one-sentence purpose>
meeting_date: <YYYY-MM-DD or omit>
meeting_location: <where, or omit>
date: <today YYYY-MM-DD>
status: draft
visibility: internal
version: 1
authors: Zaal
reviewers: <who reviews, or "Zaal" alone>
---
```

Status values: `draft` | `review` | `final` | `sent` | `archived`. Always start at `draft`.

## Step 5: Draft the body

Use ZAO + ZAOstock context from memory:
- Oct 3 2026, Franklin St Parklet, Ellsworth Maine
- The ZAO = ZTalent Artist Organization, music community, 188 members, 4 years building
- Anchor partners: Wallace Events (production), Heart of Ellsworth (community/Cara Romano), Art of Ellsworth (umbrella)
- 19-person volunteer crew across 8 circles (music/ops/partners/finance/merch/marketing/media/host)
- Aug 15 dry-run also planned ($900 budget, 50 invited)
- Build-in-public ethos
- Free admission, donations + sponsor support

Tone:
- Direct, grounded, no hype
- No emojis, no em dashes (hyphens only)
- No "thrilled" / "excited" / "amazing" filler
- Lowercase casual mixed with professional - match BetterCallZaal voice

## Step 6: Save the file

Write to `ZAO-STOCK/onepagers/<slug>.md`. Confirm success.

## Step 7: Report back

Tell user:
- File path saved
- URL on dashboard: `/stock/onepagers/<slug>` (will work after PR merge + deploy)
- Suggested next steps: review draft, ping reviewers, edit before sending

If reviewers were specified, optionally generate a copy-pastable Telegram DM asking them for feedback (similar to the Shawn ask in the Roddy 1-pager flow).

## Anti-patterns

- Don't write a 3-page doc. One page printed = ~600 words tops.
- Don't include sponsor amounts unless user explicitly says them.
- Don't fabricate attendance numbers - use range estimates and flag as "estimate" if unsure.
- Don't promise things that need legal review (insurance, indemnity language) - say "TBD" instead.
- Don't add status tracking columns or kanban-y stuff. This is a one-page narrative document.

## Examples

**Quick invocation:**
```
/onepager Bangor Savings, $5K sponsor pitch
```
-> ask remaining questions (meeting date? visibility?), draft, save to `bangor-savings-sponsor.md`.

**Full invocation:**
```
/onepager
```
-> ask all 5 questions, then draft + save.

**Args-rich invocation:**
```
/onepager Steve Peer, ZAOstock co-curator pitch, in-person Apr 30 at 430 Bayside, internal
```
-> save directly without asking.
