---
topic: business
type: research
status: research-complete
last-validated: 2026-08-20
superseded-by:
related-docs: 1066, 2303, 2189, 1270, 429
original-query: "Fold the newsletter craft research + Paragraph MCP operational learnings from the Day 230/231 finals edition into a numbered doc; canonical operational home is the zaoonparagraph amalgam."
tier: STANDARD
---

# 2348 - Newsletter craft + Paragraph MCP operations: what the finals edition proved

> **Goal:** Record, as ZAOOS institutional memory, what the Day 230/231 Final
> Six edition (published 2026-08-19, paragraph.com/@thezao) established about
> newsletter craft and about operating Paragraph headlessly - and point at the
> canonical operational docs so this never drifts into a second source of truth.

## The one-line answer

**The whole edition was assembled without touching the editor** - text, three
inline images, cover, callout, CTA button, links, two tweet embeds - via the
Paragraph MCP plus the publication's AI agent, and the craft rules that shaped
it are now code-adjacent artifacts (twelve rules, an announcement skeleton, a
node catalogue from six live publications), all merged to the zaoonparagraph
repo as the single home.

## Where the canonical material lives (do not duplicate it here)

Repo: github.com/bettercallzaal/zaoonparagraph, main (amalgam merged
2026-08-18, PRs #40 #41):

| Artifact | Path |
|---|---|
| THE TWELVE craft rules + announcement skeleton (21 fetched sources) | `docs/craft-research.md` |
| Mode C MCP playbook (params, image laundering, embeds, traps) | `docs/mode-c-mcp-playbook.md` |
| Tiptap node catalogue from 6 live publications | `docs/paragraph-node-catalogue.md` |
| Day 230 worked example | `docs/case-study-day230.md` |
| Voice corrections log | `docs/voice-guide.md` |
| The estate map + next builds | `docs/amalgam-map.md` |

## What this run established (the memory worth keeping in ZAOOS)

1. **The MCP replaces the browser for everything but publishing.** get-post /
   update-post (params `id` + `bodyJson` - the wrong name is silently ignored),
   send-test-email, get-publication, analytics. Verified working end-to-end on
   a real edition. Publishing remains Zaal's tap, by design and by rule.
2. **The agent's image trap:** images attached to the Paragraph AI chat are
   inserted as its own sandbox paths (`/mnt/workspace/uploads/...`) - rendered
   in the editor, broken in email. The fix that works: launder each file
   through the cover uploader to mint a real `papyrus_images` URL, then rewrite
   srcs via MCP. Check every image src before trusting a draft.
3. **Rich nodes render in email:** callout (info box), customButton,
   horizontalRule, figure/figcaption, link marks - all verified in the
   published Day 231 edition. Tweet embeds carry editor-built `tweetData`;
   never hand-author them - paste URLs via the agent or the editor.
4. **Craft that moved the edition:** per-finalist receipt lines built from the
   live submissions API (never adjectives), track-vs-track subsections each
   led by its matchup card, prizes/dates boxed in a callout, the roll call of
   all 15 entrants, casts embedded as social proof.
5. **The estate consolidated:** zaoonparagraph unarchived and made the amalgam
   home; July dailies (days 190-194) triaged unpublishable and archived with
   reasons; the overnight cron's discarded-output bug found and fixed
   (zabalnewsletterbuilder PR #14 - cron generated into a thrown-away HTTP
   response; now persists to `newsletter_state` auto-draft keys).
6. **Live numbers at time of writing** (all from MCP fetches 2026-08-18/19):
   publication `DB7iU1HMVzTT9bI4ec6X`, 595 subscribers; Day 231 published
   2026-08-19 with images, callout, button and both embeds intact.

## Findings

1. Headless Paragraph operation is production-real, with two hard edges
   (param names, sandbox image paths) now documented where operators look.
2. Craft research plus a node catalogue from real publications beats style
   intuition - every enrichment in the shipped edition traces to a fetched
   example or a fetched fact.
3. The single-home amalgam decision (Zaal, 2026-08-18) ended the four-repo
   drift; ZAOOS keeps the memory, zaoonparagraph keeps the operations.

## Also See

- [Doc 2303](../2303-newsletter-daily3-pipeline-audit/) - the daily-3 automatable-vs-voice line
- [Doc 1066](../1066-zaoonparagraph-buildout/) - the original buildout plan
- [Doc 2189](../../cross-platform/2189-paragraph-brand-growth-playbook/) - brand growth playbook
- [Doc 1270](../../identity/1270-zao-newsletter-paragraph-canonical-jul2026/) - canonical newsletter reference
- [Doc 429](../429-paragraph-agents-launch-apr2026/) - the MCP/agents launch this operationalizes

## Next Actions

| Action | Owner | Type | By When |
|---|---|---|---|
| Merge zabalnewsletterbuilder PR #14 so the 6am cron stages a loadable draft | @Zaal | Merge | 2026-08-21 |
| Doc 2303 follow-ups as their own cards: 3pm existence guard, LinkedIn/Telegram variants, real win-candidates feeding the cron | @Zaal | Decision | 2026-08-24 |
| Say what "Borker" referred to so the scheduling comparison (card e5cd8fd8) can close | @Zaal | Answer | 2026-08-21 |

## Sources

- zaoonparagraph docs/ on main - **[FULL]** authored + merged this run (PRs #40, #41)
- Paragraph MCP live calls (get-post, update-post, get-publication, get-subscriber-count, send-test-email) - **[FULL]** run against the real publication 2026-08-18/19
- zabalgamez.com/api/submissions?feed=projects + /data/points-roster.json - **[FULL]** fetched for the edition's facts
- Six live Paragraph publications' post json via MCP - **[FULL]** node catalogue basis, credited in-repo
- zabalnewsletterbuilder PR #13/#14 + live zaoos.com probes - **[FULL]** the cron bug and its fix
