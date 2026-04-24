---
topic: infrastructure
type: decision
status: complete
decision-made: 2026-04-24
tier: DISPATCH
related-docs: 502, 497, 498, 499, 500, 501
word-count: 420
---

# 503 - Loomio vs Native: Consensus Voting for ZAOstock Circles v1

## Decision

**LOOMIO (SaaS) + Telegram bridge (via outgoing webhooks + grammy bot logic).**

Owns the 48h silent-window consent flow, decision archive, structured voting (consent templates, objection handling). Native Telegram bot `/propose`, `/object`, `/claim` completes the UX. Hybrid = best of both worlds.

## Key Decisions

| Question | Decision | Rationale |
|---|---|---|
| Use Loomio or build native? | **LOOMIO + Telegram bridge** | Proven consent UX, battle-tested with 100+ coops, 48h silent window built-in. Zero facilitation training needed. Webhook outbound is trivial. No need to reinvent. |
| Pricing | $29/month (Starter, up to 30 members) → $49/month (Team, unlimited) after v1 | We hit 19 members + 1 bot account now. Stays on Starter until Y2. Nonprofit 25-50% discount likely available. |
| Telegram integration | **Custom bridge: Loomio webhook -> grammy bot -> TG thread** | No native Loomio Telegram bot exists (2026). But Loomio webhooks (Slack, Discord, Mattermost, Matrix) output HTML/Markdown. Our grammy bot reads webhook, posts proposal summary to TG, listens for /object replies, updates Loomio via API. |
| Data ownership | Loomio owns decision record + reasoning. We export CSV/JSON quarterly. | Clean separation: Loomio = source of truth for proposals/votes. TG bot = daily ops noise. |
| Migration cost | Low. Export as JSON, re-import if we ever switch to native. | Decision record is portable. 48 hours to stand up an alternative if Loomio fails. |
| Account model | 1 Loomio group for ZAOstock. Subgroups (1 per circle) for scoped discussions. | Matches spec. Keeps decision surface area per circle visible to that circle. |

## Loomio Capabilities (API v2, Oct 2023+)

- REST API: create discussions, polls, vote, list members, manage invites
- Webhooks: outbound to Slack, Discord, Teams, Matrix, Mattermost (+ custom Zapier-style webhooks)
- Consent proposal type with silence = yes, objection window
- Email participation: members vote via email reply without visiting platform
- 7 voting types: proposal, poll, ranked choice, score, dot, time, check
- Outcome tracking: each vote locked with reason, date, participant names
- Archive: full-text searchable, permanent record per decision
- SSO/SAML available on Private Host tier (USD 2K+/year custom pricing)

Limitations:
- No native Telegram bot (community-built Integram bot exists but not Loomio-endorsed, 2020s era)
- Outgoing webhooks only (Loomio sends; doesn't receive slash commands)
- Consensus template requires 48-72h manually set per proposal (easily templated)

## Comparison: Loomio / Native / Alternatives

| Dimension | Loomio SaaS | Native (Supabase + grammy) | Discourse + plugin | Notion + TG poll | Snapshot / AO |
|---|---|---|---|---|---|
| **48h silent window** | Built-in template | Write + test + maintain | Plugin exists, clunky | Manual, error-prone | No; blockchain voting theater |
| **Objection flow** | Structured; auto-notify | Code; risk of bugs | Poor | None | None |
| **Decision archive** | Permanent, searchable | We own it; migration cost | Forum mixed w/ chat | Blocks are docs, not decisions | On-chain, immutable, not soft consensus |
| **Onboarding friction** | 2 min per person. Invite link. | TG-native but no web UI | Forum login fatigue | Familiar to non-tech | Web3 wallet required |
| **Cost at 19 ppl** | $29-49/mo + discount | $0 (Supabase tier ~$25/mo) | $100-300/mo self-hosted | Free | Free / minimal |
| **Telegram integration** | Webhook -> grammy bridge | Native | None | Integrated | CLI only |
| **Multi-circle support** | Subgroups (✓ robust) | Scope tags (✓ works) | Categories (✓ works) | Folders (✓ manual) | N/A |
| **Facilitation quality** | Gold standard (2.5K stars GitHub, 10 yr coop) | DIY; lower UX bar | Forum, not designed for consent | Poll fatigue | Market theater |
| **Data portability** | Export JSON (simple) | Native Postgres (simplest) | XML export | API export | Immutable on-chain |

## Recommendation Per Criteria

1. **Onboarding non-tech teammates:** Loomio wins. Invite link = done. No Telegram account literacy required (many ZAOstock ops ppl are analog-first).

2. **Data ownership:** Native wins. But Loomio export is fast; switching cost is 48 hours one-time, not critical path.

3. **Cost at launch (19 ppl + 6 circles + ~10 proposals/month):** Native is cheaper ($25 Supabase base), Loomio is $29-49 but time savings > marginal cost.

4. **Facilitation + consent quality:** Loomio. It's the decision-making tool, not a side feature. Discourse/Notion are discussion tools with voting bolted on.

5. **Integration with existing grammy bot:** Hybrid. Loomio is the system of record. Grammy listens to Loomio webhooks, posts proposal summaries to TG, bridges `/object` back to Loomio API.

## Next Actions

1. **Trial (May 1):** Spin up free Loomio group (14 day trial). Add 5 team members. Run 1 practice consent decision ("Where should we hold the May 15 all-hands?"). Time the 48h silent window. Verify webhook to Discord test channel.

2. **Telegram bridge (May 5-15):** Write grammy middleware to listen for Loomio webhook, parse proposal (title, closing_at, options), post to TG group pinned thread, watch for `/object` replies in thread, POST back to Loomio API to update objections. PR against bot/ repo.

3. **Circle subgroups setup (May 20):** Create 6 Loomio subgroups (1 per circle). Assign circle coordinators as subgroup admins. Test invite-and-add flow.

4. **Upgrade decision (May 25):** If trial goes well, upgrade to $29/mo Starter. If no issues, keep for 6 months (until Aug 15 dry run). Evaluate cost vs. Team plan ($49/mo unlimited) by June 1.

5. **Audit decision log (monthly):** Export CSV, spot-check for missing reasoning, note any objections that were dropped. Feed back to coordinators.

## Sources

1. [Loomio docs: API v2](https://www.loomio.com/help/api2) - REST spec, consent templates
2. [Loomio GitHub](https://github.com/loomio/loomio) - 2537 stars, AGPL-3.0, Ruby/Vue, active (last commit Apr 9 2026)
3. [Loomio Chatbots + Webhooks](https://help.loomio.com/en/user_manual/groups/integrations/chatbots/index.html) - webhook outbound, Slack/Discord/Teams/Mattermost/Matrix docs
4. [Reddit: remote team leads, tools](https://www.reddit.com/r/productivity/comments/1rkmbd6/i_interviewed_30_remote_team_leads_about_their/) - Loomio feedback mixed but positive for orgs that use it for decisions, not chat
5. [Discourse vs Loomio comparison](https://selfhosting.sh/compare/loomio-vs-discourse/) - structured voting (Loomio 7 types) vs forum polls (Discourse basic)
6. [Concorder](https://concorder.net/) - alternative civic tech, consensus + surveys, not tested with ZAOstock size
7. [Praxis (OSS)](https://github.com/praxis-app/praxis) - GraphQL, TypeScript, proposals focus, federation roadmap, only 93 stars, younger than Loomio

## Glossary

**Consent proposal:** Silence = yes. Objection (harm-based) = proposal paused for amendment. No explicit upvote needed.

**Silent window:** 48h clock. If no objections by deadline, proposal auto-closes as approved.

**Webhook (outbound):** Loomio POSTs to URL when event occurs (new proposal, vote, objection). We listen and act.

**Subgroup:** Loomio org unit. Proposal scoped to 1+ subgroups. Decision not visible to non-members.

---

## Decision Log

- **2026-04-24 09:00 ET:** Loomio + Telegram bridge decided. Hybrid approach splits decision architecture (Loomio) from daily ops chat (Telegram). Trial May 1.
