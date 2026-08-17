---
topic: business
type: audit
status: research-complete
last-validated: 2026-08-17
superseded-by:
related-docs: 944, 1066, 2304
original-query: "Newsletter/Paragraph pipeline - audit the ZABAL newsletter daily-3 flow, propose what is automatable vs Zaal-voice, doc it. No publishing."
tier: STANDARD
---

# 2303 - The daily-3 pipeline: what is already a machine, what must stay a voice

> **Goal:** Audit the ZABAL newsletter daily-3 flow stage by stage and draw the automatable-versus-Zaal-voice line from what the code already enforces, not from taste. Nothing published.

## The one-line answer

**Two of the seven stages are already code, three more are safely automatable as draft-preparation, and exactly two are Zaal-voice by design and should never be automated** - the final prose pass and every send. The pipeline's own runbook already says so: *"Do NOT auto-post - Zaal posts them himself."*

## The pipeline, stage by stage

Source of truth: `NEWSLETTER-UPDATE.md` at the root of `bettercallzaal/zabalnewsletterbuilder` (local `~/Desktop/repos/zabalnewsletterbuilder`, live at zabalnewsletterbuilder.vercel.app, published at paragraph.com/@thezao). Read in full this run.

| # | Stage | Today | Verdict |
|---|---|---|---|
| 1 | Pick the issue (theme + 3 wins) | Manual, from the `/` pipeline dashboard | **AUTOMATE the candidate list.** The board's due-today items and the week's merged PRs are machine-readable; ZOE can stage "tomorrow's 3 win candidates" nightly. Picking among them stays Zaal |
| 2 | Compose the 3 win blocks | Manual in `/builder`, from a starter draft | **HYBRID - automate the starter, never the final.** The composer already pre-fills; a nightly ZOE pre-draft per win (build, number, person, link) raises the floor. The finishing pass IS the product's voice |
| 3 | Voice gate | **Already code**: `lib/score.ts`, 14 checks, 0-100, pass >= 80 | Done. This is the pattern the rest should copy - the machine grades, the human writes |
| 4 | Platform variants | **Already code**: `lib/variants.ts` - `toFarcaster` (<=1024 chars), `toXThread` (<=280/post) | Done. Extending to LinkedIn/Telegram variants is a small PR the file itself invites |
| 5 | Publish to Paragraph | Manual paste to paragraph.com/@thezao | **Technically automatable, deliberately GATED.** Publishing is outbound; the tap is Zaal's. The right automation is everything up to the paste |
| 6 | Socials generation | `/socials` skill -> `/clipboard` page, 7 platforms in posting order | **Already semi-automated; keep the human send.** The runbook is explicit: generate, never auto-post |
| 7 | Feed the 5pm show | The issue IS the ZM script (doc 2304: if it does not exist at 4pm, that is the emergency) | **AUTOMATE the existence check**: a 3pm tick that verifies today's issue exists and pings if not - a deadline guard, not a writer |

## Where the line is, and why it is exactly there

The voice grader is the proof that this pipeline already knows the answer. `score.ts` encodes fourteen mechanical facts about the voice - opens with "ZM.", 250-480 words, a real number, a link, no emojis/hashtags/em-dashes, no work-day time phrases, no hype words, signs off as the ZABAL Team - and **still requires a human to hit 80+.** The checks are necessary, not sufficient: what they cannot grade is whether the sentence sounds like Zaal. That is the line. **Everything that can be checked mechanically is automatable; the residue the grader cannot see is the newsletter.**

The same logic gates the sends. Stage 5 and the seven posts in stage 6 are outbound surfaces (`feedback_social_posting`, the runbook's own no-auto-post rule). The Paragraph API could push a post today - and should not, because a wrong automated send is irreversible in exactly the way a wrong draft is not.

## What to build (all draft-side, nothing outbound)

1. **Nightly win-candidate stager** - ZOE assembles tomorrow's 3 candidate wins from the board + merged PRs, each pre-shaped as build/number/person/link, written into the builder's draft store. Zaal picks and rewrites. (This is the "wire ZOE to auto-draft issues" idea already noted in the project memory - adopted; its sibling "push finished issue to Paragraph" is rejected here as gated.)
2. **The 3pm existence guard** - today's issue exists and scores >= 80, or Zaal gets pinged with the gap named. Protects the 5pm show dependency (doc 2304's invariant-one).
3. **Two more variant targets** in `lib/variants.ts` (LinkedIn with its one-line context rule, Telegram) - closes the gap between the composer's tabs and the 7-platform posting order.

## State observations, sources named

- The builder repo's last commit is **2026-07-09** (`git log`) - five weeks quiet. For a finished tool that is fine; it does mean the 13-passes-in-a-day energy of Jul 1 stopped at v1, and the three builds above are the natural v2.
- `grep -c` for the seeded issue patterns in `lib/issues.ts` returned 0 with two probes - the seed structure differs from what the memory describes. Not investigated further; the dashboard is the operative view either way.
- **Live Paragraph state was unreachable this run** - the Paragraph MCP is disconnected in this session, so subscriber counts, recent-post cadence, and whether the daily-3 is currently being published on schedule are all **[FAILED]**, not asserted. The audit is of the pipeline, not of adherence to it.

## Findings

1. The automatable/voice split is already encoded in the repo - grader and variants are code, prose and sends are human. The audit's job was mostly to say it out loud.
2. Three draft-side builds close the real gaps: candidate staging, the 3pm guard, two variants.
3. The one dependency that makes automation urgent is the 5pm show - the newsletter is its script, so a missed issue is now a missed show.
4. Whether the daily cadence is actually being kept could not be verified without Paragraph access - flagged, not guessed.

## Also See

- [Doc 944](../../dev-workflows/944-newsletter-growth-deliverability-playbook/) - growth + deliverability
- [Doc 1066](../1066-zaoonparagraph-buildout/) - the Paragraph buildout
- [Doc 2304](../../media/2304-zm-show-runbook/) - the 5pm show this pipeline scripts

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Approve the three draft-side builds (stager, 3pm guard, variants) - all PR-able, nothing outbound | @Zaal | Decision | 2026-08-20 |
| Reconnect Paragraph access and check the actual publish cadence against the daily-3 design | @Zaal | Manual | 2026-08-20 |
| Keep stage 5 + 6 sends human permanently - record it as settled so no future automation pass reopens it | @Zaal | Merge of this doc | 2026-08-18 |

## Sources

- `~/Desktop/repos/zabalnewsletterbuilder/NEWSLETTER-UPDATE.md` - **[FULL]** read from disk, all 14 sections; the publish, socials, grader and variants details quoted from it.
- `git log` on the builder repo - **[FULL]** last commit `4b0e105`, 2026-07-09.
- Project memory `project_zabalnewsletterbuilder` - **[FULL]** the repo map and the two open ideas, one adopted one rejected above.
- Live Paragraph (paragraph.com/@thezao) - **[FAILED]** the Paragraph MCP is disconnected this session; no live cadence or subscriber claim is made anywhere in this doc.
- `lib/issues.ts` probes - **[PARTIAL]** two greps returned 0; structure not investigated further.
