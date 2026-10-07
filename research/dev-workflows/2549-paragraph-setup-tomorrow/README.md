---
topic: dev-workflows
type: decision
status: research-complete
last-validated: 2026-09-24
superseded-by:
related-docs: "2547, 2528, 2538, 2348, 944"
original-query: "ok lets submit this today and then reseach more so that we can use this for tommorrow (follow-up to doc 2547: what can we actually turn on or change in Paragraph tomorrow to improve the daily newsletter setup)"
tier: STANDARD
---

# 2549 - What to change in Paragraph tomorrow, and what it removes from the loop

> **Goal:** Turn doc 2547's map into a change list the zaoonparagraph lane can act on for the Day 268 edition. Every item is something that exists today, that we are not using, and that removes a known failure rather than adding a feature.

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| **Stop pasting into the agent chat. Create the draft directly.** | `POST /v1/posts` takes `markdown`, `title`, `subtitle`, `imageUrl`, `imageAlt`, `status`, `scheduledAt`, `sendNewsletter` (confirmed today in Paragraph's own OpenAPI spec, 44 paths). The CLI wraps it: `paragraph post create --title "..." --subtitle "..." --file ./draft.md`, package `@paragraph-com/cli` at **0.4.0**. This is the single highest-value change: it deletes the paste step, the agent-rewrite risk, the placeholder risk and the cover-number bug in one move, and it costs ZERO credits because "writing and publishing yourself doesn't use credits". |
| **Keep make-agent-paste.sh's guard, change its output** | The guard (refuse to emit while a `[FILL]`, `[CHECK]` or capitals line remains) is the part that has earned its keep. Point it at `paragraph post create` instead of at a clipboard block, and the same refusal now blocks a bad DRAFT rather than a bad paste. Keep the clip path as the fallback for days when the API is down. |
| **Send yourself the email before publishing** | `POST /v1/posts/{postId}/test-email` sends a test newsletter for a DRAFT post to the publication owner's address. Documented purpose: "previewing how a post will look as a newsletter before publishing". We have shipped 366 editions and never once looked at one as an email before it went. This is the check that would have caught the two-route rendering defect from the reader's side. |
| **Fill Brand voice, Social voice and Goals. They are persistent and we have never set them.** | Settings → Agent holds Goals (up to 20), Brand voice (up to 10,000 characters), Social voice, and Visual brand. The agent reads all of them "across every chat", including suggestions, scheduled tasks and social posts. Our entire rules block is re-pasted per chat today and dies with the chat; most of it belongs here instead. Paragraph's own doc even names our exact rule: "**Punctuation.** Habits worth keeping, especially em dashes. Drafts leave them out unless your voice says you use them." |
| **Fill Visual brand, and the cover problem changes shape** | Visual brand holds colours, fonts, spacing, corners, shadows and reference images, and the agent reads it "whenever it makes something visual", so covers and social cards come out looking like ours. That plus doc 2538's finding (the agent already matches your past published covers) is the durable fix for the two covers that came back carrying the previous day's number. Canva stays useful for the card we design; the brand settings stop the agent inventing a different look when it does make one. |
| **Socials become drafts in the library, not clipboard text** | `POST /v1/content` creates `tweet`, `linkedin`, `newsletter` and X Article pieces as DRAFTS, and Paragraph's own doc states "nothing is posted, emailed, or scheduled, and no draft you upload can go out without the writer sending it from the app". So the socials clip can become real drafts sitting in Content, grouped with the post, while the send stays Zaal's tap exactly as now. |
| **Do NOT enable automations or Playbook auto-publishing** | Unchanged from 2528 and 2547, and Paragraph's own approvals page is the clearest statement of why: "An enabled automation is standing authorization for the job, trigger and timing, capabilities, and connected account you confirmed", and "there are no global approval rules. Choosing one suggestion never authorizes future suggestions of the same kind." Suggestions are safe because each is a one-time choice. Automations are not. |
| **Scheduling is available and we have never used it** | `scheduledAt` (Unix ms, draft-only, max 30 days out, `null` cancels) with `sendNewsletter`, on create or update. The LinkedIn 06:45 send Zaal did by hand on 2026-09-21 is exactly this. |
| **What NOT to move** | The edition text itself stays markdown in the repo. Every rule that produced the last four clean editions came from the draft file and its header, not from Paragraph. The API changes how the draft REACHES Paragraph, not who writes it. |

## The change list, in the order that pays

| # | Change | Removes | Effort |
|---|---|---|---|
| 1 | `paragraph login --token $PARAGRAPH_API_KEY`, then `paragraph post create` from the draft file | The paste step, agent rewrites, placeholder leaks, wrong-day covers | 15 min |
| 2 | Point `automation/make-agent-paste.sh` at the CLI, keep the guard, keep the clip as fallback | A guard that only protects the fallback path | 30 min |
| 3 | `POST /v1/posts/{id}/test-email` before every publish | Publishing an email nobody has read as an email | 5 min |
| 4 | Fill Brand voice with the rules block, Social voice with the /socials rules, Goals with the three real ones | Re-pasting rules into every new chat, and rules dying with the chat | 30 min |
| 5 | Fill Visual brand from zaostock.com | The agent inventing a look when it makes anything visual | 15 min |
| 6 | Socials as `POST /v1/content` drafts grouped with the post | Clipboard text with no record in Paragraph | 45 min |
| 7 | Open the Campaigns tab (doc 2547's first action) | Arguing about CTR from the wrong tab | 5 min |

## What the API actually exposes, measured today

`https://raw.githubusercontent.com/paragraph-xyz/paragraph-sdk-js/main/openapi.json`, 44 paths. The ones that matter here:

| Path | Methods | Use |
|---|---|---|
| `/v1/posts` | `post`, `get` | Create the draft from markdown |
| `/v1/posts/{postId}` | `get`, `put`, `delete` | Update, schedule, publish, attach a cover |
| `/v1/posts/{postId}/test-email` | `post` | Send yourself the email, draft only |
| `/v1/content` | `post`, `get` | Socials and one-off emails as drafts |
| `/v1/content/{contentId}` | `get`, `patch` | Edit a social draft in place |
| `/v1/content/{contentId}/archive` and `/restore` | `post` | Retire a draft without deleting it |

`POST /v1/posts` required field: `title` only. Everything else optional, which is why a one-line create works.

## Open, and deliberately not resolved here

- The API rate limit contradiction (40 on the pricing page, 100 in the live header) is unchanged since 2026-09-21. It does not block any item above; a daily edition is a handful of calls.
- Per-action credit costs remain undisclosed, and remain irrelevant while we write our own drafts: the credit meter only moves for agent work.
- The two-route rendering defect (`@[slug]` vs `/writing/`) is still live and still unreported to Paragraph. Item 3 above would let us see it as a reader sees it.

## Also See

- [business/2547-paragraph-playbooks-map](../../business/2547-paragraph-playbooks-map/)
- [business/2528-paragraph-beyond-the-post-sept2026](../../business/2528-paragraph-beyond-the-post-sept2026/)
- [dev-workflows/2538-paragraph-ai-agent-workflow-improvements](../2538-paragraph-ai-agent-workflow-improvements/)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Install the CLI and log in with the existing API key, then create the Day 268 draft with `paragraph post create` instead of pasting it; report whether the draft matches the file byte for byte | @Zaal | Workflow change, zaoonparagraph lane executes | 2026-09-25 |
| Send a test email of the Day 268 draft to the owner address before publishing, and say what it looked like | @Zaal | Check | 2026-09-25 |
| Paste the standing rules block into Settings → Agent → Brand voice, and the socials rules into Social voice | @Zaal | Paragraph config | 2026-09-25 |
| Fill Visual brand from zaostock.com so anything the agent makes visually matches the festival look | @Zaal | Paragraph config | 2026-09-26 |
| Convert `automation/make-agent-paste.sh` to emit a `paragraph post create` command, keeping the placeholder refusal and the clip fallback | zaoonparagraph lane | PR | 2026-09-26 |
| Set the three Goals that are actually true right now (ZAOstock through 3 October, the daily bounty thread, subscriber growth) | @Zaal | Paragraph config | 2026-09-26 |

## Sources

- [Voice and memory](https://docs.paragraph.com/agent/voice-and-memory.md) - [FULL, method: curl. Goals, brand voice, social voice, visual brand, including the em-dash line]
- [Approvals](https://docs.paragraph.com/agent/approvals.md) - [FULL, method: curl. Suggestions are one-time, automations are standing authorization]
- [Inbox](https://docs.paragraph.com/agent/inbox.md) - [FULL, method: curl. Daily suggestion refresh on paid plans]
- [Developers: CLI](https://docs.paragraph.com/developers/cli.md) - [FULL, method: curl. Command surface, including `post create --file` and `content create --kind`]
- [Developers: content](https://docs.paragraph.com/developers/content.md) - [FULL, method: curl. Kinds, bodies, content groups, and the "nothing goes out without the writer" guarantee]
- [Paragraph OpenAPI spec](https://raw.githubusercontent.com/paragraph-xyz/paragraph-sdk-js/main/openapi.json) - [FULL, method: curl of raw JSON, 473 KB, 44 paths, parsed for request fields rather than read as prose]
- npm registry, `@paragraph-com/cli` - [FULL, method: `npm view`, version 0.4.0 as of 2026-09-24]
- [Plans and credits](https://docs.paragraph.com/account/plans-and-credits.md) - [FULL, method: curl. The zero-credit rule for self-publishing]
