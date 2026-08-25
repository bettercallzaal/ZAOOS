---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-08-24
superseded-by:
related-docs: "2411, 2401, 2408"
original-query: "Learn how we build this into the obsidian stack ... Yes that and coworking board"
tier: STANDARD
---

# 2412 - Do not wire the dead MCP servers into the vault. They are empty.

> **Goal:** Zaal asked how the ten never-called MCP servers could feed the
> Obsidian vault and the cowork board instead of being disconnected. Opening each
> one first answers it.

## Key Decisions

| # | Decision | Why |
|---|----------|-----|
| 1 | **Build no ingest for Notion, Linear or Canva. They are not connected at all.** | Each exposes only `authenticate` / `complete_authentication`. There is no workspace behind them to sync. |
| 2 | **Build no ingest for Dropbox.** | Root contains **four items**: three Dropbox onboarding files from 2020 and one shared mount from 2024. Zero ZAO content. |
| 3 | **Build no ingest for Slack.** | The workspace has **one channel**, `#all-the-zao`, created by Zaal 2026-03-21. A workspace with one channel is a workspace nobody uses. |
| 4 | **Calendly is the one live finding, and it is a cleanup, not an integration.** | Two event types, one active since 2023. Meanwhile ZABAL Gamez books on **Cal.com**. Two schedulers, and the stale one has a live public link. |
| 5 | **The lever is the sources that already have data and are barely read - Gmail, Drive, and Discord, which has no MCP at all.** | Gmail was called 18 times in 30 days and Drive 15, against 1,786 for the browser. Those are full stores being under-read, which is the opposite problem from an empty store. |

## What is actually in each, measured 2026-08-24

| Server | Connected? | Contents | Worth an ingest? |
|---|---|---|---|
| **Notion** | **No** - auth stub only | nothing reachable | No |
| **Linear** | **No** - auth stub only | nothing reachable | No |
| **Canva** | **No** - auth stub only | nothing reachable | No |
| **Dropbox** | Yes | 3 Dropbox tutorial files (2020) + 1 mount "Outfit 14A" (2024) | **No** |
| **Slack** | Yes | **1 channel**, `#all-the-zao`, created 2026-03-21 | **No** |
| **Calendly** | Yes, as Zaal | 2 event types, 1 active (2023), 1 inactive WaveWarZ clone | Cleanup, not ingest |
| **grep.app** | Yes | n/a - fixed separately, see below | Already handled |
| **gitnexus, ECC memory, ECC sequential-thinking** | local plugins | n/a | CLAUDE.md already disables all three |

**This is the whole answer.** The ten servers are not underused pipes with data
sitting behind them. Seven are empty or unreachable, and the eighth was fixed by
a different change today.

An ingest built for any of them would be a pipeline that moves zero rows, and
would then need maintaining, monitoring and trusting. That is worse than nothing,
because a sync that always reports "no new items" is a check nobody reads
(`noisy-signal-guard.md`).

## The Calendly finding, which is real

- `calendly.com/zaalp99/30minmeeting` is **active**, created 2023-05-26, last
  touched 2026-03-18. Its description points people to `discord.thezao.com`.
- A second type, "Wavewarz 30 Minute Meeting", is **inactive**.
- The brand glossary records **Cal.com** as the ZABAL Gamez workshop slot booker
  (`cal.com/bettercallzaal/zabal-games-workshop-slot`).

So there are two schedulers, and the older one is publicly bookable. Nobody has
said which is canonical. That is a five-minute decision with an outward-facing
consequence, which makes it worth more than any of the integrations that prompted
this doc.

## What WOULD feed the vault and the board

Redirecting the question rather than dropping it. The sources with real volume
that are barely read (call counts from doc 2411, same 30-day window):

| Source | Calls | State |
|---|---:|---|
| **Gmail** | 18 | A full mailbox. Doc 2401 maps the capture ecosystem; email is not one of its streams. |
| **Google Drive** | 15 | Full. Meeting decks, docs, the ZAOstock material. |
| **Discord** | **no MCP at all** | The fractal bot, `ZAOpaperzBOT` (multi-server installable) and `zaoscribe` all live there. It is where the community is, and it is the only major surface with no read path for an agent. |

**Discord is the honest gap.** Everything else in this doc is an empty store; the
place with the most ZAO conversation in it has no agent read path whatsoever.

Both existing write paths already work and neither needs replacing:

- **The vault** takes captures through `inbox/` and the vault-organizer.
- **The board** has exactly one writer, `~/bin/zao-tracker`, 461 lines, five
  source prefixes (doc 2401). Anything new writes through it, not around it.

## Honest limits

- **Slack was probed by channel search for "zao"**, which returned one channel. A
  workspace could hold channels that do not match that term. The conclusion
  "nobody uses it" is strong but rests on one query.
- **Dropbox root only.** Deeper folders inside the "Outfit 14A" mount were not
  walked.
- **Connected-ness was read from the tool surface**, not from an auth attempt. A
  server exposing only `authenticate` is not connected for this session; it could
  be connected elsewhere.
- **Nothing here says Notion or Linear are bad tools.** It says there is nothing
  in them today. If Zaal starts using one, this doc is wrong the day he does.

## Also See

- [Doc 2411](../../dev-workflows/2411-tool-usage-audit-measured/) - the measurement that produced the ten-server list. **Unmerged as of 2026-08-24** (PR #3311)
- [Doc 2401](../../dev-workflows/2401-zao-capture-ecosystem-zoe-vault-tracker-bonfire/) - the capture ecosystem these would have to plug into
- [Doc 2408](../../community/2408-zao-teams-and-collaborators-audit/) - same shape: check the store before designing for it. **Unmerged** (PR #3307)

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Pick one scheduler. Deactivate the Calendly 30-minute type or retire the Cal.com link; done when only one public booking URL exists | @Zaal | Decision | 2026-08-26 |
| Disconnect Notion, Linear, Canva, Dropbox, Slack; done when they are off the MCP list | @Zaal | Config | 2026-08-28 |
| Scope a Discord read path - the one real gap. Done when a doc names the approach (bot vs MCP vs export) | @Zaal (Claude) | Research | 2026-09-05 |
| Re-probe Slack with a broader channel query before disconnecting, so the one-channel finding is not the only evidence | @Zaal (Claude) | Test | 2026-08-26 |

## Sources

- [FULL - measured 2026-08-24 via the live MCP tools] `Calendly users-get_current_user` (Zaal Panthaki, `zaalp99`, org resolved) and `event_types-list_event_types` (2 types, 1 active); `Slack slack_search_channels` query "zao" (1 channel); `Dropbox list_folder` on root, non-recursive (4 entries).
- [FULL - read from this session's tool surface] Notion, Linear and Canva expose only `authenticate` and `complete_authentication`.
- [FULL - doc 2411, same session] the 30-day call counts across 377 transcripts.
- [FULL - read 2026-08-24] the brand glossary's Cal.com row naming the ZABAL Gamez workshop slot booker.
