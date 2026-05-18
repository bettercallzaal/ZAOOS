---
topic: events
type: meeting-recap
status: research-complete
last-validated: 2026-05-18
related-docs: 611, 612, 662, 663, 668, 669
tier: STANDARD
---

# 670 - Iman Call May 18 - ZAO Craig + PizzaDAO Zambia + ZABAL Games Drop

> **Goal:** Lock in action items + summary from 2026-05-18 call with Iman covering three threads: (1) ZAO Craig live-transcribe + auto-todo bot idea, (2) PizzaDAO Zambia event Friday 2026-05-23 financing + sponsorship, (3) ZABAL Games signup drop scheduled Wednesday 2026-05-20.

## Key Decisions

| # | Decision | Owner | Status |
|---|----------|-------|--------|
| 1 | **BUILD ZAO Craig bot** — live audio capture + Whisper transcript + auto-extract todos. Eliminates the current 5-step flow (record - download - upload - transcribe - paste). Add as ZOE module or standalone Hermes-pattern bot. | Zaal | TODO, no doc yet, this doc is the seed |
| 2 | **ZAO Devz fronts PizzaDAO drinks budget (~$120)** ONLY if needed. PizzaDAO already covers $150 pre + $570 post = ~$720 strictly for pizza per their rules. WaveWarZ unable to wire $120 in 5-day window (Friday event). Float-then-reimburse approach blocked because PizzaDAO funds are pizza-only. | Iman | Sponsor hunt instead |
| 3 | **Iman to study RSVPizza repo** (PizzaDAO/rsv-pizza, open source). Use Claude to teach the stack + build PizzaDAO Zambia / Kingston brand identity on top. Reuse the patterns for WaveWarZ Zambia + future ZAO events. | Iman | In progress now |
| 4 | **ZABAL Games signup drops Wednesday 2026-05-20**, NOT Friday. Workshops run through June. Drop early so Friday PizzaDAO event becomes a live signup moment. | Zaal + Iman | Need signup form + group chat setup |
| 5 | **Proposal/pitch-deck system for ZAO sponsorships** — formal doc per sponsored activity. Defer for now, build later. RSVPizza may already have the patterns. | Iman to investigate | Parked |

## Thread 1 - ZAO Craig (Live Audio - Todo Bot)

### The Idea

Replace the current voice-memo - upload - transcript - extract-todos pipeline with a live capture bot. While Zaal + collaborator are talking, ZAO Craig:

1. Records audio in the room/call.
2. Streams to Whisper (or local Whisper.cpp on VPS).
3. Extracts action items in real time using ZOE's classifier (Ollama llama3.1:8b per [[project_ollama_local_llm]]).
4. Pushes todos to ZAO Coworking action tracker ([[project_cowork_zaodevz]]) or directly to ZOE's task list.
5. Posts a clean summary + transcript link at end of session.

### Why It Matters

- Removes 5 manual steps per recorded conversation.
- Captures decisions + commitments without anyone having to "remember to write that down."
- Tech already exists - Discord has Craig (open source, MIT), Whisper.cpp runs local, ZOE has the dispatch layer.

### Build Notes

- **Name reference:** "Craig" = the existing Discord audio recording bot (craig.chat - github.com/CraigChat/craig, MIT). ZAO Craig = adaptation for Telegram voice + in-person.
- **Pattern:** Hermes-pattern bot ([[project_hermes_canonical]]), runs on VPS, Claude CLI for the LLM brain via Max subscription ([[feedback_prefer_claude_max_subscription]]).
- **Input modes:**
  - Telegram voice messages forwarded to bot (easiest v1).
  - Live Telegram voice chat (Telegram Bot API does NOT support voice chat audio - this needs Telegram Client API / TDLib, not Bot API).
  - In-person device recording (Mac/iPhone) - upload via existing voice-memo path or new shortcut.
- **Pipeline:** audio - Whisper (local or OpenAI API) - llama3.1 classify (per [[project_ollama_local_llm]]) - extract todos with owner + when - post to cowork-zaodevz or ZOE.
- **Output:** copyable Telegram bubble (no header/footer per [[feedback_copyable_content_own_bubble]]) with the todo block, plus a transcript link.

### Decisions Pending (Before Doc + Build)

- v1 input: Telegram voice forward vs. local Mac recording vs. both?
- Where todos land: cowork-zaodevz tracker, ZOE task list, or both?
- Owner-detection: how does bot know "Iman will do X" vs "Zaal will do X" from a transcript with 2 voices? Speaker diarization (pyannote) or just LLM-guess from context?
- Privacy/consent prompt at session start?

### Next Step

Write the spec doc - tentative number 671 under `agents/`. Don't build until spec lands. Doc 670 (this doc) is the SEED; doc 671 = spec.

## Thread 2 - PizzaDAO Zambia Event - Friday 2026-05-23

### Budget Reality

| Line | Amount | Source | Notes |
|------|--------|--------|-------|
| Pre-event allocation | $150 | PizzaDAO | Released, not yet wired |
| Post-event allocation | ~$570 | PizzaDAO | Released only AFTER event closes |
| TOTAL PizzaDAO | ~$720 | PizzaDAO | Strictly pizza-only per their rules |
| Iman's full budget | $470 | PizzaDAO portion | Caters 40 attendees |
| Drinks | ~$120 | UNFUNDED | Needs sponsor |

### Attendees

- **40 people signed up.** Iman had to put a CAP. "People are excited."
- Program structured around ZAO Devz + the broader ZAO project.

### The Drinks Sponsor Problem

- Drinks ~$120, event is Friday (5 days out at time of call).
- WaveWarZ can't wire it - 5 days too short to surface a sponsor for an unknown-to-them project.
- PizzaDAO funds are PIZZA ONLY - can't be repurposed even with float-then-reimburse trick.

### Workaround Plan

- ZAO Devz fronts the drinks money if absolutely needed.
- Bigger play: Iman uses Claude to:
  1. Read the PizzaDAO/rsv-pizza repo end-to-end.
  2. Build PizzaDAO Zambia / Kingston brand identity on top of RSVPizza's open source flyer + page tooling.
  3. Pitch additional PizzaDAO HQ for drinks add-on (frame: "you're already spending $2-3k on bigger cities, $100 more for Zambia is high-leverage").
  4. Surface 1-2 additional sponsors leveraging the WaveWarZ Zambia angle.

### What ZAOOS Side Owes

- **Flyer for The ZAO** to share saying "we're part of PizzaDAO Zambia." Iman is creating this today.
- Spread the word once flyer is live - probably Wed 2026-05-20 same drop window as ZABAL Games (synergy).

## Thread 3 - ZABAL Games + Workshops

### Drop Schedule

- **Wednesday 2026-05-20:** Drop ZABAL Games signup publicly.
- **Friday 2026-05-23:** PizzaDAO Zambia event - use it as live signup moment, pull up the games page, get people in the group chat there.
- **June 2026:** Run workshops. Each workshop = a ZAO member or aligned project leads + offers their thing.

### Why Wednesday > Friday for Games Drop

- Friday already has PizzaDAO event energy - games drop separately would compete.
- Wednesday drop = 2 days of buzz building, then Friday becomes live activation moment.
- Quote: "It'll actually help better if it's running already for real, 'cause then we can just use that [traction]."

### Setup Needed Before Wednesday

| Item | Owner | Notes |
|------|-------|-------|
| Signup form for ZABAL Games | TBD | Probably reuse Lu.ma or build on RSVPizza fork |
| Group chat (Telegram?) | Zaal + Iman | Where signups land + community forms |
| Workshop signup ALSO | Iman | "Lead a workshop with your project / your brand / your offer" |
| Flyer / share assets | Iman | Doubles as PizzaDAO co-promo |

## Thread 4 - Sponsorship Proposal System (Parked)

Iman raised: should ZAO have a formal "drop a proposal" system for sponsored activities, even if it's just Zaal + Iman doing it now? Goal = record of intent + scope per sponsorship.

**Zaal's read:** RSVPizza probably has this pattern already (they make flyers + RSVP pages easy). Don't build new tooling - learn RSVPizza first, fork the patterns that fit, layer a ZAO version on top. Connects to existing entry-page work in [[doc 611]] (RSVPizza brand patterns) + [[doc 612]] (AutoCo LLC formation - the entity that would receive sponsorships).

**Decision:** Parked until after Iman finishes the RSVPizza repo deep-dive. Revisit in next sync.

## Next Actions

| # | Action | Owner | Type | By When |
|---|--------|-------|------|---------|
| 1 | Spec ZAO Craig bot (doc 671, under `agents/`) - input modes, pipeline, owner-detection, privacy | Zaal | Research doc | Before any code |
| 2 | Add "ZAO Craig" as TODO in [[project_cowork_zaodevz]] tracker (the action items table in this doc IS the source until the bot exists) | Iman / Zaal | Task | Today |
| 3 | Iman: spend 1+ hour on RSVPizza dashboard + repo (github.com/PizzaDAO/rsv-pizza), feed it to Claude as "teach me this" | Iman | Research | This week |
| 4 | Build ZAO flyer for PizzaDAO Zambia ("The ZAO is part of this") | Iman | Asset | Today / before Wed |
| 5 | Draft ZABAL Games signup page + group chat - decide platform | Zaal | Build | By Wed 2026-05-20 |
| 6 | Wednesday 2026-05-20: drop ZABAL Games signup publicly + cross-promo with PizzaDAO Zambia | Zaal + Iman | Launch | 2026-05-20 |
| 7 | Friday 2026-05-23: PizzaDAO Zambia event runs - use as live ZABAL Games activation | Iman | Event | 2026-05-23 |
| 8 | Resolve drinks sponsor for PizzaDAO Zambia - either ZAO Devz floats $120 OR Iman pitches PizzaDAO HQ for drinks-line add-on, leveraging WaveWarZ Zambia angle | Iman | Outreach | By Thu 2026-05-22 |
| 9 | June 2026: launch workshop series - sign up workshop leaders (community projects, ZABAL brands) | Iman + Zaal | Programming | June |
| 10 | After PizzaDAO event closes - confirm $570 post-event reimbursement landed; debrief what worked | Iman | Followup | Week of 2026-05-26 |
| 11 | Decide on formal sponsorship-proposal template - revisit after Iman's RSVPizza deep-dive | Zaal | Decision | After action 3 |
| 12 | Send Iman this transcript + summary (commit the doc, share link) | Zaal | Comms | Today |

## Also See

- [Doc 611](../../business/611-zaostock-brand-patterns-rsvpizza-iykyk/) - RSVPizza patterns already extracted for ZAOstock; Iman should start here before going to upstream repo
- [Doc 612](../../business/612-autoco-llc-formation/) - AutoCo / entity sponsorship receiving structure
- [Doc 654](../654-zabal-games-empire-v3-yerbearzerker-meeting/) - ZABAL Games strategy + Empire Builder V3 context
- [Doc 662](../../dev-workflows/662-zaocoworking-v2-v3-architecture/) - ZAO coworking action tracker - where ZAO Craig todos will land
- [Doc 668](../../agents/668-zaocoworking-bot-audit/) - ZAOcoworkingBot audit; ZAO Craig is the v2/v3 audio-input upgrade
- [Doc 669](../../agents/669-bonfires-everything-we-know/) - Bonfires knowledge corpus (companion knowledge layer ZAO Craig output could feed into)
- [project_iman_role](../../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_iman_role.md) - Iman context: songchaindao GH org owner, ZAO Devz lead, imanagent VPS 187.77.3.104
- [project_zoe_post_slate](../../../../../.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/project_zoe_post_slate.md) - ZOE post drafting pattern, related precedent for an LLM extracting structured content from voice

## Sources

- 2026-05-18 voice memo transcript (Zaal + Iman call) - source for this doc
- [PizzaDAO/rsv-pizza GitHub](https://github.com/PizzaDAO/rsv-pizza) - open source dashboard + page tooling, action item 3 target
- [CraigChat/craig GitHub](https://github.com/CraigChat/craig) - Discord audio recording reference for ZAO Craig naming + pattern (MIT)
- Doc 611 README - prior RSVPizza analysis
