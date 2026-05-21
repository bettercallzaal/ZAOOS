---
topic: community
type: decision
status: research-complete
last-validated: 2026-05-21
original-query: "AttaBotty livestream playbook and Z-and-AttaBotty Telegram bot spec from call (reconstructed)"
related-docs: [640-magnetiq-vibes-to-data-pivot, 274-zao-stock-team-profiles]
tier: STANDARD
---

# 642 - AttaBotty livestream playbook + Z-and-AttaBotty Telegram bot

> Goal: lock the livestream playbook Zaal gave AttaBotty + spec the "Z and AttaBotty" Telegram bot Zaal owes him for ongoing collaboration.

## TL;DR (3 sentences)

AttaBotty (William Carreras, producer/animator, ZAO Stock production lead) runs weekly livestreams of his in-character musical persona. Zaal advises: one high-quality stream per week (not three), multistream via StreamYard to YouTube first, embed player on attabotty.com as the primary CTA, cut intro/outro into shorts for social. Zaal owes: a Telegram bot (Hermes pattern, dual-user with AttaBotty) for streaming research, task automation, and VOD review.

---

## Stream playbook (Zaal's advice)

### Cadence
- ONE high-quality stream per week (not three per week)
- Full week between events to iterate, plan, produce
- Baseline stream: Monday 2026-05-11 at 7pm (comments OFF - Zaal driving to MA)

### Stream structure (45-60 min target)
- 5 min spoken intro: character origin, universe rules, what to expect from this week
- Music set (currently 3 original songs, expanding)
- Reflection / outro (2-3 min)
- Production value: live audio + visuals (AttaBotty's animated universe)

### Social shorts workflow
- Extract 15-30 sec clips from intro and outro
- Repurpose for Farcaster, X, Instagram, TikTok
- Tool: consider Descript or Opus Clip for batch shortification (TBD - don't add yet)

### Distribution architecture
- **Multistream engine:** StreamYard (sends to YouTube + Twitch + X simultaneously)
- **Primary CTA:** Embed YouTube player on attabotty.com/live or similar
  - YouTube is more accessible and archives indefinitely
  - Twitch deletes VODs after 90 days (unacceptable for evergreen catalog)
- **Direct share link for viewers:** Always YouTube
- **Tonight's stream (2026-05-11 7pm):** Comments OFF. Zaal watches VOD with AttaBotty next day/within 48 hours.

### One tool, not many
- AttaBotty already uses: NotebookLM + Google Docs/Sheets
- Stop adding new tools (Descript, Figma plugins, etc.) until core workflow locked
- Tool sprawl kills momentum

---

## "Z and AttaBotty" Telegram bot specification

Purpose: Replace ad-hoc messaging with structured collab space for stream production, research, task tracking.

| Aspect | Details |
|--------|---------|
| **Name** | "Z and AttaBotty" (or "Z + AttaBotty" if less chars) |
| **Pattern** | Hermes brain (ref: Doc 640, `project_hermes_canonical.md`) |
| **Users** | Zaal + AttaBotty (private, dual-user bot) |
| **Access** | Telegram private chat with both members |
| **Codebase** | `bot/src/attabotty/` (new module, sibling to `bot/src/zoe/`) |
| **Build timeline** | This week (by Mon 2026-05-18) |
| **Context to load** | AttaBotty's NotebookLM transcripts + stream SOPs + Zaal's livestream playbook (this doc) |

### Bot capabilities (MVP)

1. `/research <topic>` - research assistant for stream ideation, music context, production decisions
2. `/stream-review <youtube-url>` - auto-ingest VOD, suggest timestamp clips for shorts, flag best moments
3. `/workflow <next-monday>` - generate day-of-week checklist (Mon: prep topic, Tue-Wed: produce, Thu: setup StreamYard, Fri-Sat: final checks, Sun: rest)
4. `/task <text>` - add to shared task list (persist to Supabase if needed, simple JSON backup minimum)
5. `/context` - dump the current bot's knowledge base (playbook, stream goals, music catalog, etc.)

### Knowledge base bootstrap

When Zaal spins up the bot, it ingests:
- This playbook (642)
- NotebookLM transcript(s) AttaBotty drops (URL or pasted markdown)
- Prior stream notes (if any)
- Music metadata (song titles, themes, approx duration)

### Deployment
- Host on VPS 1 (31.97.148.88) via systemd service unit, same pattern as ZOE bot
- Telegram token: store in `~/.env` or bot/.env, never commit
- Supabase: optional (simpler = JSON log backup at `bot/logs/attabotty-{date}.json`)

---

## Funding strategy (medium-term)

### Empire Builder treasury (existing)
- 10% of $ZABAL token routed to Empire Builder
- Adds utility (marketplace / leaderboard), builds treasury, distributes via boosters
- Relevant for any monetization of AttaBotty merch, music NFTs, or stream sponsorships

### ZOUNZ subDAO + Nouns artisan fund (new ask)
- ZOUNZ = nounish subDAO Zaal created
- **CRITICAL AMBIGUITY:** the matching-fund program (claim: $10 contribution -> $50 match) is UNVERIFIED
  - Searched Nouns DAO docs, Prop House, Flows.wtf: no published program matching this ratio
  - Could be a pre-launch initiative, a Builder DAO grant, or a misremembered detail
  - **ACTION:** AttaBotty or Zaal must confirm the program name, URL, and match ratio BEFORE pitching
- If verified: create crowdfunding campaign (Gitcoin? Kickstarter? Custom?) with matched funding target
- Treasury use: production upgrades (lighting, audio equipment, animation tools, "willy-wonka style" aesthetic investments)

### Monetization angles (TBD)
- Whop membership tier: exclusive behind-the-scenes clips, early access to music drops, producer breakdowns (ref: Doc 641)
- Farcaster Frames: stream-to-NFT mint (1 NFT per stream, proof of attendance)
- Music distribution: streams -> Spotify/Apple Music via DistroKid + splits via 0xSplits (ref: music docs)

---

## Open questions / ambiguities flagged

| Term / Claim | Best interpretation | Confidence | Resolution |
|--------------|---------------------|-----------|------------|
| "Zhao artisan meeting place" | Possibly "ZAO artisan hub" or community space (TG/FC/custom) | Low | AttaBotty: which community are you in? Who else is there? |
| "Onagi livestream ideation" | A person with a handle "Onagi" (possibly Japanese, possibly "Onaji"?) | Very low | Get @handle or full name + how Zaal knows them |
| "Z and AdaBody" in transcript | Transcription typo for "Z and AttaBotty" | High | Flag: confirm bot name before building |
| "$ZABAL into Empire Builder" | Transcript said "ZAL" - assumed typo for $ZABAL | High | Already canon - never use "ZAL" |
| Matching fund $10:$50 | Nouns DAO artisan vertical? Builder DAO? Custom program? | Low | VERIFY before pitching to AttaBotty |
| AttaBotty website path | "attabotty.com/live" assumed; actual path TBD | Medium | Confirm: where should embed live? attabotty.com/live or /stream or custom? |
| NotebookLM transcripts | Will AttaBotty drop transcript URLs / markdown? | Medium | Confirm AttaBotty can/will share transcripts before bot launch |

---

## Action items for Zaal (carry forward)

| Action | Type | By when | Notes |
|--------|------|---------|-------|
| **CRITICAL: DM AttaBotty 2 clarifying questions TODAY** | Research | Today (2026-05-11) | See "Clarifying Questions" section below |
| Build "Z and AttaBotty" Telegram bot (Hermes pattern) | Engineering | Mon 2026-05-18 | Blocked until AttaBotty clarifies ambiguities |
| Receive NotebookLM transcripts from AttaBotty | Research | This week | Load into bot context |
| Identify "artisan meeting place" + intro more artisan projects | Community | This week | Follow up after bot launch |
| Add Onagi to Telegram chat with Zaal + AttaBotty | Community | This week | Stream ideation collaboration |
| Watch Mon 2026-05-11 7pm stream VOD + write post-stream review | Production | Within 2 days | Identify what to automate |
| Verify Nouns/nounish artisan fund program + match ratio | Research | Before mentioning to AttaBotty | WebSearch or direct Nouns DAO contact |
| Generate automation workflow for next Monday's stream | Production | By Mon 2026-05-18 | Playbook -> checklist |

---

## Clarifying questions for AttaBotty (DM TODAY)

**Question 1:** You mentioned an "artisan meeting place" for community — is this a Telegram group, Farcaster channel, or something else? Who runs it and what's the vibe? (Helps Zaal understand where to pitch your funding later.)

**Question 2:** Who is "Onagi" and how should Zaal reach them? Is that their Farcaster handle, X handle, or real name? (Zaal wants to loop them into your stream ideation chat.)

**BONUS (if answering):** What's the exact URL where you want the livestream embed? (e.g., attabotty.com/live, attabotty.com/stream, etc.)

---

## Cross-reference checklist

- [x] Hermes pattern bot spec (Doc 640 - Magnetiq bot): use as template for dual-user research assistant
- [x] Whop integration angle (Doc 641): potential membership tier for exclusive AttaBotty content
- [x] ZAO Stock team profile (Doc 274): confirms William Carreras (AttaBotty) background, NFTNYC + Art Basel experience, production skills
- [x] Empire Builder context: $ZABAL routing, treasury mechanics
- [ ] ZOUNZ governance research: TBD (no dedicated doc found; check governance/ folder or existing memory)
- [ ] Nouns artisan fund program: UNVERIFIED — flag for Zaal to confirm

---

## Sources

- Call recap transcript 2026-05-11 (NotebookLM-style, Zaal + AttaBotty)
- Doc 274: ZAO Stock team deep profiles (William Carreras / AttaBotty background)
- Doc 640: Magnetiq vibes-to-data pivot + ZAO MAGNETIQ bot spec (Hermes pattern template)
- Doc 641: Whop.com for ZAO Claude Code community (distribution platform, creator economics)
- [[project_hermes_canonical.md]] - bot architecture pattern
- Web search: Nouns DAO grants + artisan fund (UNVERIFIED — results inconclusive as of 2026-05-11)
- Memory: [[project_hermes_canonical]], [[project_zao_festivals_history]]
