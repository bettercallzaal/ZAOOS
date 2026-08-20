---
topic: dev-workflows
type: audit
status: research-complete
last-validated: 2026-08-19
superseded-by:
related-docs: "2317, 2318, 2319, 2320, 2321"
original-query: "Write the pass-record doc for the OneNote 142/142 vault routing pass (organizer lane, 2026-08-18/19). Original claim of doc 2321 collided with the WaveWarZ Base platform handoff; audit ordered a fresh reservation-scanned number. (reconstructed)"
tier: QUICK
---

# 2324 - OneNote Vault Routing Pass: 142/142, 0 dropped

> **Goal:** Permanent record of the organizer lane's full OneNote-mirror routing pass through ~/zao-vault - what was routed where, the run-2 promotion outputs, the CRM execution, and the doc-number collision that delayed this doc.

## Key Decisions

| Decision | Verdict | Why |
|---|---|---|
| Route destination model | USE the 5-way split (notes / archive+reason / grill / crm / research) from templates/note-frontmatter.md | 142/142 routed with 0 dropped across 13 iterations; no destination category was missing |
| Uncertain items | NEVER guess owners; park in handoffs/GRILL-QUEUE.md | All 3 held-back ambiguities (curators "Yes"/"Jen", "BBA Member-") resolved correctly by Zaal within a day; guessing would have produced wrong CRM rows |
| CRM writes from a read-only pane | USE the cowork REST pattern (service key in ~/.zao/zao.env) or queue to handoffs/queues/crm-pending.json | Supabase MCP INSERT fails with 25006 read-only transaction; the queue-then-execute path shipped 66 inserts + 4 updates with zero duplicates |
| Doc numbering | RUN the full Step 3 reservation scan + Step 7.5 re-check, number in branch name | This doc's first claim (2321) collided with the WaveWarZ Base handoff (merged PR #3157); scan on 2026-08-19 gave 2324 |

## The pass, by the numbers

- **142/142** OneNote-mirror notes routed, **0 dropped**, over **13 loop iterations** (2026-08-18 night through 2026-08-19 early morning).
- Destinations: **93** notes (kept/enriched in place or promoted), **35** archive-with-reason, **7** grill questions, **4** CRM preps, **3** research-doc leads.
- Size ladder held: batches of ~14 small files first, then the deep pile (155-3167 line files: zao-cards at 3168 lines, zao-data-parent at 1623) taken 3-6 at a time with real reads.
- Sensitive files (therapy-notes, affirmations with an EAP block) stayed on the batch-5 security-hold list; credentials found in zao-cards were redacted to ~/.zao/private/ (chmod 600, never in git).

## Run 2 promotion outputs (grill-approved 2026-08-19 morning)

| Output | Where | Content |
|---|---|---|
| Identity kit | zao-vault notes/bio.md, notes/socials-map.md, notes/zao-faq.md | Canonical bios (first/third person, operator intro, Eliances 3G), 5-brand handle tables, cleaned FAQ - every section cites its OneNote source |
| Affiliations import | CRM (cowork Supabase, contacts table) | 66 inserts + 4 updates executed 2026-08-19 via REST after dupe-check against 1133 existing contacts; includes the Mozay Calloway dupe-merge (kept 2a2062a6, deleted 66c97a99) |
| Songs worked-examples | ~/.zao/clipboard/songs-options.md | 3 concrete options (newsletter segment, ZAO Rotation page mock, 3 ask drafts) built from the 40-track weekly song log; decision parked with Zaal |
| New Friendship Media resolution | CRM row 78398b10 | Web lookup: it is New Friendship Tech, founder Eric "MOTIVATE" Spivak (DJ + rapper, LA, 30+ events, 20,000+ attendees) - already a CRM contact since 2026-06-29 |
| ZAO-PALOOZA roster | zao-vault notes/zaopalooza-submissions.md | 23 artists + handles + submitted tracks from the submissions Google Doc; 20 already in CRM, 1 new insert (Artikyoul8) |

## The doc-number collision (why this doc is 2324, not 2321)

The organizer lane's IN-FLIGHT row claimed **doc 2321** for this pass, but 2321 was concurrently claimed and merged by the WaveWarZ Base platform handoff (research/wavewarz/2321-wavewarz-base-platform-handoff, PR #3157). The pass doc itself was never branched or PR'd, so the claim was invisible to other lanes' collision scans - the exact failure mode zao-research v2.6 warns about: **a claim that is not a pushed ws/research-NNNN-* branch does not reserve anything.** Two other collisions happened the same way on 2026-08-18. Fix applied here: full three-way scan (merged dirs on origin/main = 2323, in-flight branches = 2323, open-PR titles = 2301) -> 2324, number in the branch name, re-checked at commit time.

## Also See

- [Doc 2317](../2317-obsidian-claude-personal-os-stack/) - the frontmatter contract this pass routed against
- [Doc 2319](../2319-handoff-workflow-audit/) - the handoff/lane system the organizer brief runs in
- [Doc 2320](../2320-logging-obsidian-capture-completeness/) - the logging mandate this pass logged under
- [Doc 2321](../../wavewarz/2321-wavewarz-base-platform-handoff/) - the doc this pass collided with

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Merge this PR so the routing pass has a merged record (shipped when PR merged) | @Zaal | PR review | 2026-08-22 |
| Pick a songs option from ~/.zao/clipboard/songs-options.md (shipped when choice lands in a lane brief) | @Zaal | Decision | 2026-08-26 |
| Add "number must be in a pushed branch within the same session as the IN-FLIGHT claim" to the organizer brief template (shipped when brief updated in zao-vault) | @Zaal | Vault edit | 2026-08-26 |

## Sources

- [zao-vault daily/2026-08-19.md](https://github.com/bettercallzaal/zao-vault/blob/main/daily/2026-08-19.md) [FULL - local file, read directly] - iteration-by-iteration routing log
- [zao-vault handoffs/GRILL-QUEUE.md](https://github.com/bettercallzaal/zao-vault/blob/main/handoffs/GRILL-QUEUE.md) [FULL - local file] - 19 morning verdicts + the 3 held-back ambiguities and their resolutions
- [zao-vault handoffs/organizer.md](https://github.com/bettercallzaal/zao-vault/blob/main/handoffs/organizer.md) [FULL - local file] - founding brief with both runs' gaps-found sections
- [PR #3157 - WaveWarZ Base platform handoff (doc 2321)](https://github.com/bettercallzaal/ZAOOS/pull/3157) [FULL - verified via gh api and merged dir on origin/main] - the colliding doc
- Cowork Supabase contacts table [FULL - queried via MCP + REST, 2026-08-19] - dupe-check ground truth (1133 rows pre-import)
