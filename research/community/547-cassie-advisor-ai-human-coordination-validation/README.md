---
topic: community
type: decision
status: research-complete
last-validated: 2026-04-28
related-docs: 263, 432, 458, 477, 502, 524
tier: STANDARD
---

# 547 — Cassie advisor session: AI-augmented community coordination as the bigger play

> **Goal:** Capture Cassie&rsquo;s strategic input from the 1:1 on 2026-04-28 and decide what to do with it. Headline: the team-coordination infrastructure being built for ZAOstock 2026 is the actual product, the festival is the proof.

## Key decisions (recommendations FIRST)

| Decision | Action | Owner | When |
|---|---|---|---|
| **Treat the dashboard + bot + announcement-pipeline system as a generalizable product, not festival scaffolding.** Festival is the wedge case. | Stop framing it as "ZAOstock infrastructure" internally. Start naming the system: provisional **&ldquo;Volunteer OS&rdquo;** (working title). | Zaal | This week, after spinout |
| **Cassie is in the loop as application-review advisor.** Recursive ask pattern: meeting transcript -> AI summary -> Cassie reviews specific applications/asks. | Send Cassie the next sponsorship/Fractured-Atlas application draft by **Tuesday May 5**. | Zaal | Next 7 days |
| **The "Resource → Volunteer" pipeline gets validated as a real model.** Resource = anyone helping from outside the team page; Volunteer = bio + photo + announced via @ZAOFestivals. Some people stay as Resources by choice. | Already shipped in [doc 502 spec](../../governance/502-zaostock-circles-v1-spec/) + standup [Apr 28 recap](../../events/_zaostock-hub/standups/2026-04-28.md). Document the bigger pattern here. | This doc | 2026-04-28 |
| **Tailored DMs > broadcast docs.** Cassie called this out: "people don't read shit." The pattern of "send each person what matters to them, link to the full doc for everything else" is correct. | Keep doing per-person DM tailoring. Don&rsquo;t pour energy into long broadcasts. | Zaal | Ongoing |
| **The AI/human balance is the moat.** Cassie's framing: "AI augmented support" (human gets the AI's intel, not the AI replacing the human). | When commercializing later, this is the positioning, not "AI that does it for you". | Zaal | Future product framing |
| **No premature tokenization on ZAO Festivals.** Tools change month-over-month; environment in 6 months is unknown. | Token plan stays parked until closer to event. | Zaal | Q3 2026 review |

## Background

Zaal had a 1:1 with **Cassie** (existing advisor, works with academics + scientists on translation/communication, has helped the ZAO before with positioning strategic info for non-experts) on Tuesday April 28 2026, ~30 min after the team standup.

The conversation was scheduled to align on how Cassie can plug into ZAOstock prep. It became something bigger: she validated that the team-coordination infrastructure (dashboard + Telegram bot + per-circle channels + announcement pipeline) is the strategically interesting thing, not the festival itself. Festival is the proof.

Cassie's specific value-add: she can act as the **application reviewer / external-eyes editor** in a recursive loop. Pattern:
1. Zaal records meetings, drops transcript into AI
2. AI drafts the next-step output (sponsorship app, Fractured Atlas paperwork, sponsor pitch, etc.)
3. Cassie reviews the specific asks/answers and edits for clarity/positioning
4. Zaal pays attention to the meetings instead of taking notes

That last point matters. It means Cassie&rsquo;s time is high-leverage and used at the *right* moment, not on every async update.

## What Cassie validated

### 1. The infrastructure is the bigger play

> "You're building a master blueprint for something that is going to be... you'll be able to sell that and commercialize that in ways that you don't even know possible right now."

Specifically she pointed at:
- The bridging of **AI efficiency** with **human connection**. Bank ad analogy: while everyone else is closing branches, one bank is opening more "because you want to come in and have a human connection." She extended this to the dashboard: it&rsquo;s using AI to organize people, but the actual outcome is in-person trust.
- **The volunteer-organizing problem is everywhere.** Academia, nonprofits, community events, music festivals. Most existing tools either over-rely on AI (people disengage) or under-use it (humans drown in coordination).

### 2. The "people don't read" problem is real

Cassie was direct: "in my experience, people don't read shit."

This is consistent with [doc 263 (Obsidian lean team model)](../../dev-workflows/263-obsidian-lean-team-model/) and the per-person DM tailoring pattern shipped in [doc 477 (ZAOstock dashboard Notion replacement)](../../events/477-zaostock-dashboard-notion-replacement/).

The fix Zaal is using and Cassie endorsed:
- Tailored short messages per person ("here&rsquo;s what matters to you")
- Link to the full doc/agenda for "everything else"
- Recursive AI loop so people can ask the bot questions instead of waiting for Zaal

### 3. AI augmentation > AI replacement

Cassie's reframe (verbatim):
> "It's not the AI supporting you. It's an individual getting the support that the AI would have, but it still has the human interface."

This is the **positioning** for any future commercialization of this stack. Not "AI handles your community" — "your community lead gets superpowered." The human stays in the loop.

### 4. ZAOstock Year 1 is local-first, tech-light

Zaal&rsquo;s decision (Cassie agreed): the festival itself is **a music event, not a tech demo**. WaveWarZ + cypher + streaming happen *around* it. Local Maine audience doesn&rsquo;t care about Web3, but they care about helping independent artists. Don&rsquo;t confuse the message.

This aligns with [doc 432 (ZAO master context, Tricky Buddha)](../../community/432-zao-master-context-tricky-buddha/) - **music first, community second, technology third**.

## Comparison: existing volunteer-org tools vs ZAOstock&rsquo;s stack

| Tool | Pricing | AI integration | Per-person DM tailoring | Public team page | Discord/TG native | Self-host |
|---|---|---|---|---|---|---|
| **Notion** | $10/user/mo | Plugins, no native loop | Manual | No public render | No | No |
| **Slack + Notion + Trello** | ~$15/user/mo combined | None | Manual | No | No | No |
| **GroupMe / WhatsApp + spreadsheet** | Free | None | Manual | No | No | N/A |
| **Bonfire** (Web3 community OS) | Free OSS | None native | Manual | Limited | Federated | Yes |
| **ZAOstock stack** | Free OSS, Supabase free tier | Bot + agents in DM | Yes, automated via bot | Yes (zaoos.com/stock) | Telegram native | Yes (Vercel + Supabase) |

Cassie&rsquo;s ask wasn&rsquo;t "is this competitive" — she said the *combination* of human-in-the-loop + AI organization is rare. Most tools pick one side.

## What this means for ZAOstock

| Action | Owner | When | Status |
|---|---|---|---|
| Send Cassie the next application/proposal draft for review | Zaal | Tuesday May 5 | Pending |
| Continue per-person DM pattern over broadcast | Zaal | Ongoing | Live |
| Start documenting the system itself as a product spec (separate from festival prep) | Zaal | After spinout (2026-04-29) | Queued |
| Don&rsquo;t over-explain Web3/crypto at the in-person event | Zaal | Day-of (2026-10-03) | Locked decision |
| Online-community-as-festival-companion as a real product surface | TBD | Year 2 planning | Future |

## What this means beyond ZAOstock

Cassie&rsquo;s push opens the door to a separate strategic thread Zaal already had pieces of:
- The **Volunteer OS** thesis: decentralized music community → repeatable as decentralized any-community.
- Her academic/nonprofit network is the natural early market once the ZAOstock proof is in the bag.
- This is the second time advisory input has flagged this commercialization angle (first was implicit in [doc 458 ZAO contribution circles](../../community/458-zao-contribution-circles/) modeled on Impactful Giving).

Recommendation: **don&rsquo;t pivot away from ZAOstock to chase this.** Ship the festival, document the system as you go, and let the post-festival debrief surface the productization path with real proof.

## Also see

- [Doc 432 — ZAO master context (Tricky Buddha)](../../community/432-zao-master-context-tricky-buddha/) — the music-first / community-second / tech-third ordering Cassie reinforced
- [Doc 263 — Obsidian lean team model](../../dev-workflows/263-obsidian-lean-team-model/) — earlier framing of the lean-team coordination problem
- [Doc 458 — ZAO Contribution Circles](../../community/458-zao-contribution-circles/) — Impactful Giving pattern, similar territory
- [Doc 477 — ZAOstock dashboard Notion replacement](../../events/477-zaostock-dashboard-notion-replacement/) — the system itself
- [Doc 502 — ZAOstock circles v1 spec](../../governance/502-zaostock-circles-v1-spec/) — circles + governance model
- [Doc 524 — ZAO agentic everything map](../../agents/524-zao-agentic-everything-live-archived-started-planned/) — current AI agent stack across the ecosystem
- [Standup recap 2026-04-28](../../events/_zaostock-hub/standups/2026-04-28.md) — the meeting just before this 1:1

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Draft + send next sponsorship application to Cassie for review | @Zaal | DM Cassie | Tuesday May 5 |
| Spin out zaostock repo + DB + domain (already-planned, this just locked the priority) | @Zaal | Code | Wednesday April 29 |
| Update memory file `project_zaostock_master_strategy` with "infrastructure is the product" framing | Claude | Memory | Today |
| Reference this doc in next ZAO Festivals X announcement thread (the kickoff thread already drafted) | @Zaal | Post | This week |
| Add Cassie to the ZAOstock public team page as advisor when she&rsquo;s ready | @Zaal | Dashboard | When she sends bio + photo |
| Re-validate this thesis post-festival debrief (October 10 milestone already on calendar) | @Zaal | Doc revisit | 2026-10-10 |
| File post-festival "what generalized" learnings as a separate doc (then 547-followup-2026-10) | @Zaal | New research doc | Mid-October 2026 |

## Sources

- **Primary:** Cassie 1:1 conversation transcript, 2026-04-28 (Zaal&rsquo;s recording, ~30 min). Local file with Zaal.
- **ZAO master context:** [research/community/432-zao-master-context-tricky-buddha/README.md](../../community/432-zao-master-context-tricky-buddha/README.md) (current as of 2026-04-17)
- **ZAOstock spinout decision:** [GitHub issue #339](https://github.com/bettercallzaal/ZAOOS/issues/339) — locked Wednesday spinout
- **Standup Apr 28 recap:** [research/events/_zaostock-hub/standups/2026-04-28.md](../../events/_zaostock-hub/standups/2026-04-28.md)
- **Bonfire as comparable Web3 community OS:** https://bonfirenetworks.org (federated, open source)
- **AI augmentation pattern (academic):** Stuart Russell, *Human Compatible* — &ldquo;AI helps humans pursue their objectives&rdquo; framing, last validated current as of 2024 publication updates.
- **&ldquo;People don&rsquo;t read&rdquo; pattern:** Common UX research finding — Nielsen Norman Group, &ldquo;How Users Read on the Web&rdquo; (1997, still cited; 79% scan, 16% read word-for-word). https://www.nngroup.com/articles/how-users-read-on-the-web/
