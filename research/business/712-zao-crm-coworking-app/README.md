---
topic: business
type: decision
status: research-complete
last-validated: 2026-09-20
superseded-by:
related-docs: "692, 650, 668, 679, 2516, 2433"
original-query: "the next thing we should build is a ZAO CRM /zao-research this idea to include into the coworking app"
tier: DEEP
---

# 712 — ZAO CRM: a relationship layer for the cowork tracker

> **Goal:** Decide what a "ZAO CRM" should be and how it bolts into the cowork tracker (ZAODEVZ/ZAOcowork) - scoped, buildable, not a Salesforce clone.

> **RE-RESEARCHED 2026-09-20 (DEEP), four months after the original STANDARD pass.
> The central recommendation survived and is stronger. Three supporting claims did
> not.** Read "What changed" before acting on anything below.

## What changed, 2026-05-22 to 2026-09-20

| Original claim | Status | What is true now |
|---|---|---|
| The five CRM tables "all sit empty, 0 rows", so a ZAO CRM is "~60% wiring up tables that exist" | **CONTRADICTED** | Doc `dev-workflows/2433-mcp-connectors-together` measured `contacts` at **1,198 rows** on 2026-08-28. Something filled it in the intervening three months. The "start clean, backfill nothing" plan below is no longer safe to run. |
| "ZAO already has the capture surfaces" - auto-logging is the differentiator and the reason to build rather than buy | **DEAD** | Folk shipped native Fireflies transcript-to-contact logging 2026-04-14 and autonomous AI Fields 2026-02-03. Attio shipped Call Intelligence and native meeting-recording sync (2026-02-25, 2026-08-25). HubSpot's Fall '26 Spotlight, **2026-09-16**, pitches a "self-updating Smart CRM... completely touchless." The incumbents shipped our differentiator. |
| Folk is "free <200 contacts", so the objection is paying $20/user/mo | **CONTRADICTED** | Folk has **no free tier at all** as of 2026-09-20. 14-day trial, then $24/user/mo annual minimum. Folk also moved toward sales shape - Pipeline and Deals are core on every tier. |
| Build into the cowork tracker, do not buy | **REAFFIRMED, and stronger** | Every hosted and self-hosted option surveyed drifted further toward sales-pipeline shape in four months, not away from it. See decision 1. |
| Folk-style relationship-first, not Attio, not HubSpot | **HOLDS as philosophy**, one caveat | Attio is now the most agent-ready hosted option and still has a real free tier (3 seats, 50,000 records, MCP included at every tier). It is the fallback if a polished UI ever outweighs living in someone else's schema. |

**One thing the original doc did not mention at all: consent.** Auto-logging what
people say is a legal question, not only a product one. See decision 5.

## Key Decisions (recommendations first)

| # | Decision | Why |
|---|---|---|
| 1 | **Keep the CRM in the Postgres ZAO already runs. Do not adopt a CRM product, hosted or self-hosted.** | 1,000-2,000 contacts is trivial for Postgres; none of the five open-source CRMs surveyed exists to solve a scale problem we have. Every option surveyed is built around Accounts -> Contacts -> Opportunities, so we would fight the schema to force a flat typed-contacts model into it. Self-hosting adds a service with its own DB, auth, upgrade cadence and backup story - the opposite of glue-first. And an agent can already read and write our own tables with no new integration layer. |
| 2 | **Audit the 1,198 rows BEFORE building anything on them.** Who wrote them, when, from where. | The original plan said "backfill nothing (start clean)". That plan was written when the table held 0 rows. If those rows are the output of an earlier import or scrape, they may already contain systematic false merges, and a reconciliation would inherit them as ground truth. This is now the first task, ahead of any migration. |
| 3 | **Reconcile four surfaces before adding a fifth.** `~/zao-vault/people/*.md`, `~/zao-vault/people/github/*.jsonl` (written by `zao-gh-crm`, built 2026-09-19), the Supabase `contacts` table, and this doc's design. | Measured 2026-09-20: none of them knows the others exist, and nobody has counted the overlap. The same person may exist three times. Work is tracked in the private repo `bettercallzaal/zao-crm`, scoped explicitly as a reconciler rather than a fifth store. |
| 4 | **Matching is deterministic-first with a human review queue. No entity-resolution platform.** | At ~2,000 records all-pairs comparison is seconds on a laptop. Splink, Zingg and dedupe all target 100M+ rows on Spark/DuckDB backends. A false merge is far more damaging and harder to undo than a false split, so the default posture is to suggest, never to auto-merge. |
| 5 | **If we auto-log calls, consent is designed in, not assumed.** Announce recording and get an audible yes on every call. | Maine is a one-party consent state, but under *Kearney v. Salomon Smith Barney* courts have applied the stricter all-party rule to a whole call when any participant sits in a state like California, Illinois, Massachusetts or Washington. Our artists and sponsors are not all in Maine. A bot's name in the attendee list is explicitly not consent in strict states. |
| 6 | **The remaining real differentiator is narrower than the original claim, and it is worth naming honestly.** | Not "we capture touches and they do not" - that is solved. It is that an agent can make the CRM writes end to end. Attio, HubSpot, Folk and Twenty all shipped MCP servers in 2026, so even that is no longer unique; what is ours is the combination with a community-workflow capture surface tuned to artists, sponsors and volunteers. That is a product-shape claim, not a capability claim. |

## The four surfaces, measured 2026-09-20

| Surface | Holds | Written by | State |
|---|---|---|---|
| `~/zao-vault/people/*.md` | One markdown note per person, frontmatter carries `crm: pending` | By hand, by whichever session is talking to Zaal | Live. Three records added on 2026-09-20 alone |
| `~/zao-vault/people/github/*.jsonl` | GitHub accounts, followers, starred repos | `~/bin/zao-gh-crm refresh`, 1,324 lines | Live, built 2026-09-19 |
| Supabase `contacts` | **1,198 rows** | **UNKNOWN - not established** | Inherited from doc 2433, not re-measured. The Supabase MCP exposed only `authenticate` to the seat that wrote this |
| This doc's design | The schema below | 2026-05-22 | Premise corrected above |

## Matching rules, if and when reconciliation runs

**Tier 1, deterministic:** exact match on a normalized non-role email, or a GitHub
handle or ENS name the person has **explicitly written in their own note**. Auto-suggest
into a one-click confirm queue. Not a silent write.

**Tier 2, everything else, always human review:** fuzzy name, name plus org,
partial local-part, and any GitHub association not self-asserted.

Specific rules that came out of measurement rather than intuition:

- **Dot-stripping applies to `gmail.com` and `googlemail.com` ONLY.** Google's own
  help page states dots *do* change the address on Workspace and custom domains.
  Applying it universally would merge people who are genuinely different.
- **Role addresses never identify a person.** `info@`, `hello@`, `team@`, `support@`,
  `noreply@`. This bites immediately: `info@thezao.com` is exactly that shape and is
  the address every ZAO connector authenticates as.
- **A non-match on email must not veto an otherwise well-supported merge.** One human
  legitimately holds several addresses - ZAO's own principal operates from at least two,
  which is the root cause of the split-mailbox problem measured the same day.
- **Name alone is never sufficient.** This is precisely the failure that produced a
  wrong link in the first hand-built GitHub CRM pass.

**Reversibility under the never-delete rule:** do not merge in place. Keep an
append-only crosswalk - `{person_id, source_store, source_record_id, match_key_used,
confidence, decided_by, decided_at, status: active|superseded}`. A merge is a new
active row; an unmerge marks the prior row superseded and inserts a replacement.
Nothing is deleted in the crosswalk or in any source store.

### On the "never auto-link a GitHub account to a person" rule

That rule exists because a prior pass produced four errors, three from loose text
matching: a bare word counted as a mention, a substring tied one account to another
person's file, a first-name match linked the wrong people. **Keep it hard for inferred
links.** But it currently also blocks a handle someone wrote in their own frontmatter,
which is a first-party claim rather than a guess. Splitting those two cases is a
judgement for Zaal, not a settled finding.

## The market, re-measured 2026-09-20

| Option | Price | Free tier | Agent access | Fit |
|---|---|---|---|---|
| **Own Postgres** | $0 | n/a | Direct, no integration layer | **The pick** |
| Attio | $35-79/user/mo annual | Yes - 3 seats, 50,000 records | Official MCP, **included on every tier including Free** | The fallback if a UI is ever needed badly enough |
| Folk | $24/user/mo annual min | **None any more** | Official MCP, shipped 2026-07-09 | Philosophy still right, product drifted to sales |
| Clay | ~$134-167/mo, credit-metered | 500 actions/mo | Claygents | Not a CRM. GTM/outbound infra |
| Dex | $12-34/mo | None, 7-day trial | Zapier-flavoured, no MCP | Personal CRM, not team |
| Covve | $12-199/seat | - | - | A card scanner that feeds other CRMs |
| Monica (hosted) | $9/mo flat, unlimited contacts | 10 contacts | No MCP found | See the staleness flag below |

Open source, licences read from the actual LICENSE files rather than GitHub's classifier:

| Project | Stars | Last commit | Licence as the FILE reads | Notes |
|---|---|---|---|---|
| twentyhq/twenty | 57,147 | 2026-09-20 | AGPL-3.0 **plus commercial carve-outs** on files tagged `@license Enterprise` | GitHub API said `NOASSERTION` - **wrong**. Official MCP built into the product |
| odoo/odoo | 54,470 | 2026-09-16 | LGPL-3.0 core, file itself says bundled modules vary | API said `NOASSERTION` - **wrong**. A full ERP; wrong shape regardless of licence |
| monicahq/monica | 25,341 | **2025-08-30, 12.7 months stale** | AGPL-3.0 | The high-stars-stale-repo case. Not archived, 795 open issues - slowed, not dead |
| krayin/laravel-crm | 23,909 | 2026-09-14 | **MIT**, cleanest of the five | 23,909 stars against ~63 contributors - closer to one-vendor dependence than community |
| espocrm/espocrm | 3,376 | 2026-09-18 | AGPL-3.0 | Mature REST API, third-party MCP only |

**GitHub's licence classifier was wrong for exactly the two repos with non-trivial
licensing**, in both cases hiding real complexity. Read the file.

## Recommended data model

Unchanged from the original pass, except that the migration is no longer trivial
because the table is no longer empty. **Do not run this until decision 2 is done.**

```
contacts
  id            uuid pk
  type          text   -- sponsor | artist | volunteer | partner | venue | lead | press | member
  name          text not null
  project       text   -- zaostock | zaodevz | bcz | ...
  status        text   -- e.g. prospect | active | confirmed | cold
  handle        text   -- email / X / Telegram / phone
  circle_id     uuid references circles(id)
  owner_id      uuid references team_members(id)   -- who owns the relationship
  last_touch_at timestamptz
  notes         text
  metadata      jsonb default '{}'
  created_at    timestamptz default now()

tasks.contact_id   uuid references contacts(id)   -- a task can be "about" a contact
```

Keep `contact_log` (the touch history) and `meeting_notes` as-is.

**Still true from the original pass, and worth keeping:** the killer CRM-task pattern
is "next action linked to contact", and the cowork tracker is already a task system -
so adding a typed `contacts` object and a task-to-contact link *is* the CRM.

## v1 scope

- **FIRST: audit the 1,198 rows.** Provenance, then overlap against the vault notes
  and the GitHub jsonl files. Nothing else starts until this is answered.
- Then: migration for `tasks.contact_id`, and whatever the audit says about `contacts`.
- Web: a **Contacts tab** - list filtered by type and owner, detail view with linked
  open tasks and the `contact_log` timeline.
- Add-contact and log-a-touch: a web form, plus bot `/contact` and `/log`.
- Auto-log from the bot and the `/meeting` skill - **gated on decision 5's consent flow.**
- **Skip:** pipelines, deal stages, enrichment, email sequences, reporting dashboards.
  This rejection is more correct now than in May, not less.

## Also See

- [Doc 2516](../../dev-workflows/2516-canva-agent-permissions/) — the account-axis finding; a connector claim must name the account, which is why the four surfaces disagree
- [Doc 2433](../../dev-workflows/2433-mcp-connectors-together/) — where the 1,198 figure comes from
- Doc 692 — the unified Supabase schema this builds on
- Doc 650 — cowork-zaodevz, the team action tracker
- Docs 668 / 679 — ZAOcoworkingBot, the Telegram surface that would carry `/contact` and `/log`
- `bettercallzaal/zao-crm` (private) — the reconciler repo

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Authorize the Supabase connector so a seat can read `contacts` at all | @Zaal | OAuth | 2026-09-22 |
| Audit the 1,198 rows: who wrote them, when, from where. Shipped when the answer is written into `zao-crm` | @Zaal | Measurement | 2026-09-26 |
| Count the overlap between the vault notes, the GitHub jsonl files and `contacts`. Shipped when a number exists | @Zaal | Measurement | 2026-09-30 |
| Rule on splitting the never-auto-link rule: inferred links stay blocked, self-asserted handles get a fast path | @Zaal | Decision | 2026-09-30 |
| Decide whether auto-logging happens at all, given the consent constraint | @Zaal | Decision | 2026-10-10 |
| Verify the Otter.AI litigation detail against the court docket before it is cited as settled | @Zaal | Measurement | 2026-10-10 |
| Migration `tasks.contact_id`, only after the audit | @Zaal | PR to ZAODEVZ/ZAOcowork | 2026-10-17 |

## Sources

Re-research pass, 2026-09-20. Everything below was fetched this pass unless marked otherwise.

**Market, current pricing**
- folk.app/pricing [FULL, curl + HTML strip] — no free tier as of 2026-09-20
- folk.app/changelog/meet-folk-mcp [FULL, exa] — MCP shipped 2026-07-09
- attio.com/pricing [FULL, curl + strip] — free tier, MCP on every tier
- attio.com/changelog/2026/new-apps and /updates-to-developer-platform [FULL, curl + strip] — 2026-02-25, 2026-08-25
- clay.com/pricing, getdex.com/pricing, covve.com/pricing, monicahq.com/pricing [FULL, curl or exa]
- stocktitan.net mirror of HubSpot Fall '26 Spotlight [FULL, curl + strip] — 2026-09-16 "touchless" pitch
- ir.hubspot.com [FAILED — Cloudflare block; mirror used instead]
- knowledge.hubspot.com Notetaker duplicate-records notice [FULL, curl + strip] — vendor-acknowledged noise failure
- help.salesforce.com [FAILED — JS shell, no server-rendered body]

**Open source, licences from LICENSE files not the API field**
- twentyhq/twenty, odoo/odoo, monicahq/monica, krayin/laravel-crm, espocrm/espocrm [FULL, `gh api` plus `curl raw.githubusercontent.com`]
- Odoo 20 native-MCP-is-Enterprise-only [PARTIAL — WebSearch synthesis of three consulting blogs, no primary Odoo source. **Do not cite as fact without checking Odoo's release notes.**]

**Reconciliation**
- dedupeio/dedupe, moj-analytical-services/splink, J535D165/recordlinkage, zinggAI/zingg [FULL, `gh api` + raw LICENSE]
- support.google.com/mail/answer/7436150 [FULL, curl + strip] — dots ignored on gmail.com only, not Workspace
- Gmail plus-addressing [**NOT source-verified** — two attempts 404'd. Stated as well-established behaviour, flagged rather than dressed up]
- blog.opencorporates.com entity resolution for data aggregators [FULL, curl + strip]
- MDM unmerge-with-lineage pattern [PARTIAL — WebSearch summaries only]

**Consent and privacy**
- rcfp.org/reporters-recording-guide/maine [FULL, curl + strip] — Maine one-party
- legislature.maine.gov Title 15 §§709-710 [FULL]
- recordinglaw.com [FULL, exa] — Otter.AI litigation, **single-sourced, flagged**
- ico.org.uk and legislation.gov.uk on UK GDPR Art. 14 [FULL, exa]
- Maine LD 1822 died 2026-04-13 [FULL, exa, legislature tracker + mainemorningstar.com]

**Community**
- Arctic Shift `/api/posts/search` across r/selfhosted, r/nonprofit, r/CRM, r/smallbusiness [FULL, after working around a rate-limit false negative — the first pass returned zero hits for "donor" in r/nonprofit, which is implausible on its face; a control query confirmed the instrument was silently rate-limited rather than the subreddit being empty]
- hn.algolia.com search and item API [FULL, keyless JSON via curl]
- Reddit in the auto-logging pass [**FAILED** — `zao-fetch-reddit.sh` has no OAuth credentials on this machine and the browser fallback 403'd. Failure-mode frequency is **UNKNOWN**, not "none found"]
- r/CRM [FULL fetch, genuinely low-quality content — bot spam and score-0 self-promotion. Reported as a negative finding rather than dropped]

**Original 2026-05-22 pass, retained**
- 5050growth.com, makerstack.co, lightfield.app, crm.org comparisons [FULL at the time]
- `db/schema.sql` (thezao-tracker) [FULL at the time — the 5 empty tables. **This measurement is what has since gone stale.**]
