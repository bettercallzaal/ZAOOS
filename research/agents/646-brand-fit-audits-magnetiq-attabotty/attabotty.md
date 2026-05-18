# AttaBotty brand-agent fit audit (2026-05-12)

## Brand reality (synthesized from research + transcripts)

AttaBotty is **William Stewart-Carreras**, a 20+ year electronic music producer and animator based in Jacksonville, FL, running AttaBotty Productions with his wife DaNici (Da'Nici Carreras, animator/2D artist). The "AttaBotty" persona is an in-character musical artist living in an animated universe with metaphorical visual storytelling. Zaal is incubating the character as a ZAO project - not just as a band, but as a full multimodal universe (livestream, NFTs, music, animation, merch potential). William/AttaBotty is a ZAO co-founder with 3,079 Respect points, NFTNYC/Art Basel veteran (10K+ NFTs sold, Base Onchain Registry featured), and ZAO Stock 2026 production lead (sound/staging/artist management).

**Brand pillars:** Kayfabe (in-character identity must stay protected), music production (original compositions expanding beyond initial 3-song setlist), animation/visual storytelling (hand-crafted 2D/3D art paired with audio), Web3 economics (NFT drops, DistroKid distribution, 0xSplits revenue splits), and Monday-night livestreaming via StreamYard (multistream to YouTube/Twitch/X with YouTube as primary archive).

**Active surfaces:** attabotty.com (website, live embed TBD), X/Twitter (@AttaBotty, 2,088 followers), Instagram (@attabotty), YouTube (music videos + livestream archive), TikTok (@attabotty), LinkedIn (founder bio). Farcaster profile exists but handle not confirmed via web. Livestream: Monday 7pm, currently 45-60 min format with 5-min intro, 3-song set (growing), 2-3 min reflection/outro. StreamYard multistreams to YouTube + Twitch + X simultaneously; comments OFF on stream (Zaal reviews VOD within 48 hrs).

**Setlist + production stage:** Currently 3 original songs. Notable past work: "The Bone Zone" (2017, IT movie inspired, hand-drawn animation), "Run Babay" (remix of 8-year-old son's original), "TikTok Girl" (2021), "Butterflies" (2020, DaNici art). Archive spans 2006-present (humbler work pre-2012). New production: "Cipher" = release #1 under ZAO Music DBA (DCoop/GodCloud/Iman team). Stream production stage: live audio + animated visuals from AttaBotty's universe (not generic stock backgrounds).

**Funding posture:** Empire Builder treasury (10% of $ZABAL routed to EB, adds utility via marketplace/leaderboard, distributes via boosters). ZOUNZ subDAO + Nouns artisan match-fund pitch ($10 -> $50 match - UNVERIFIED as of 2026-05-11, no published program found). Potential: Whop membership tier (exclusive behind-the-scenes clips, early music drops, producer breakdowns). Farcaster Frames (stream-to-NFT mint, 1 NFT per stream as proof of attendance). Music distribution via DistroKid + splits via 0xSplits.

---

## Bot scope (what it ships TODAY per persona.md + commands.ts)

**Persona summary in 5 bullets:**
1. Private Telegram collab bot for Zaal + AttaBotty (dual-user, not fan-facing, not moderator).
2. Replaces ad-hoc DM scroll. Captures ideas, tasks, clips, and facts in Supabase without losing them.
3. Runs research passes (Opus) on stream topics, music context, production decisions. Respects NotebookLM as AttaBotty's preferred tool.
4. Stays in-character voice. Never breaks AttaBotty's kayfabe in a way that leaks to public feeds.
5. Terse, no emojis, no em-dashes. Addresses Zaal by name, AttaBotty as the character name (or real name if corrected).

**Commands available:**
- `/research <topic>` - Opus research pass on stream ideation, music context, production decisions (output to Telegram, max 3800 chars).
- `/idea <text>` - Log an idea to Supabase (min 4 chars).
- `/task <text>` - Log a task (min 4 chars).
- `/tasks` - List open tasks (max 20).
- `/done <id>` - Mark task done (first 8 chars of ID from /tasks).
- `/clip <url> <note>` - Log a clip-worthy moment with URL + optional note.
- `/fact <statement>` - Teach the bot a fact about the team/project (min 6 chars). Bot persists facts and "respects them going forward."
- `/context` - Dump current knowledge base (facts, tasks, allowlist, persona path, daily summary cron).
- `/summary` - Run daily summary now (also fires daily on cron).
- `@mention` or reply - Reactive brain call (chat-tier, shorter context than /research).
- `/start`, `/help` - Help text.
- `/whoami` - Debug: bot name, chat ID, user ID, username.

**Cost guardrails:** /research triggers Opus at ~$0.003-0.01 per call (research kind, ~1-3 min). Daily summary runs on cron (exact schedule TBD, likely off-peak). Chat replies use brainReply() at shorter context. No spend caps mentioned in code; assumes human approval needed before bot is permitted to call Opus.

**Memory model:** Supabase tables for ideas, tasks, clips, facts, messages. Messages table logs all chat (both user + bot replies). No streaming-specific tables yet (VODs, clips suggestions, setlist history, sponsor outreach log). Facts are taught via /fact and persisted as strings in a `facts` table. Tasks have open/closed state. Clips link to YouTube URLs + optional notes.

---

## Brand-fit deltas (gaps + over-builds + wrong notes)

### Gaps (brand has need, bot misses it)

| # | Brand need | Why bot misses it | Fix | Priority |
|---|-----------|-------------------|-----|----------|
| 1 | Monday stream pre-flight checklist | No /stream-prep command to run Zaal's playbook checklist before 7pm go-live | Add `/stream-prep` command: reads persona.md playbook, generates checklist (topic confirmed? StreamYard config ready? Audio test done? Intro script locked? Outro reflection idea logged?). Output 5-point checklist with yes/no gates | P1 |
| 2 | VOD ingest + clip suggestion | No automatic or manual VOD fetch workflow. Bot can't suggest clip timestamps for shorts (15-30 sec from intro/outro) | Add `/vod <youtube-url>` command: fetch YouTube transcript via API, suggest 3-5 timestamp ranges (intro hook, setlist highlight, outro reflection), log to clips table | P1 |
| 3 | Kayfabe detection on public messages | No guard against bot accidentally breaking kayfabe in Telegram replies if message leaks to X/Farcaster | Already private-only by design (chatGate checks chat_id allowlist), but persona.md should reinforce: "Never explain the real person behind AttaBotty's character in a message that could be screenshot/shared." Add explicit rule to persona.md | P2 |
| 4 | Setlist iteration history | No tracking of song evolution, cover versions, tempo changes, or production notes per track | Add `/setlist` command: display current 3 songs + metadata (duration, release date, production stage, samples/inspiration). Add `/track-update <song-id> <note>` to log iterations. Table: setlist (id, title, duration_sec, is_original, production_stage, last_updated, notes) | P2 |
| 5 | Stream metadata capture | No structured logging of stream date, theme, mood, audience reaction, technical notes | Extend /task to capture stream meta. Add `/stream-log <date> <theme> <mood> <notes>` to log post-stream debrief (vibe, technical issues, next week's direction) | P2 |
| 6 | Sponsor/partnership outreach log | No tracking of brand inquiries, partnership offers, or Whop tier setup progress | Add `/partner <company> <offer-type> <status>` to log sponsor/merch/Whop inquiries. Table: partners (id, company, offer_type, status, last_contact, notes, created_at). Helps Zaal track who to follow up with | P3 |
| 7 | NotebookLM transcript integration | Persona mentions "bring them into context" but no /transcript command to ingest + index AttaBotty's NbookLM URLs | Add `/transcript <url-or-markdown>` command: ingest NotebookLM transcript URL (or pasted markdown), index into memory, reference in /research and /context dumps. This is AttaBotty's preferred tool - bot should treat it as knowledge base, not optional | P1 |

### Over-builds (bot does X, brand doesn't need it yet)

| # | Bot feature | Why premature | Recommendation |
|---|-------------|---------------|----------------|
| 1 | `/context` dumps all facts + tasks + allowlist | AttaBotty isn't a public-facing bot; these dumps are for 2-person debugging, not external comms | Keep it. Useful for Zaal to see what bot knows at any point. No over-build risk in private chat. |
| 2 | `/idea` command (saveIdea) | Brand needs /task (action items) more than /idea (brainstorm stash). No evidence yet that Zaal/AttaBotty need separate idea-capture table. | Keep it, but de-prioritize. /idea could become noise if not actively reviewed. Suggest Zaal aliases /idea to /brainstorm or marks it "ideation only" in help. Not a blocker. |
| 3 | Reactive @mention brain calls | Bot replies to @mention in-chat for 2-person conversations. Could get noisy if Onagi joins + 3-way chat balloons. | Keep it as-is. Hermes pattern expects this. When Onagi joins (if they do), persona.md gets updated with their name. Current scope (Zaal + AttaBotty) supports @mention chatter. |
| 4 | Daily summary cron (exact schedule TBD) | Playbook doesn't mention daily digest cadence. If Zaal reviews VOD within 48 hrs, is a daily auto-summary useful? | Keep cron but ask: what time should daily summary fire? Morning before stream prep? Night of? Off-peak (2am)? Suggest parameterize cfg.dailySummaryCron in config, not hardcode. |

### Voice / persona drift (CRITICAL for AttaBotty - kayfabe risk)

| # | Persona claim | Reality | Edit needed |
|---|---------------|---------|-------------|
| 1 | "Never break kayfabe in a way that leaks to public feed" (line 15, persona.md) | Bot is private-only Telegram. No public surface. But persona should clarify: which AttaBotty identity is "the character" and which is the real human? | Line 14: Change "Address the artist as 'AttaBotty' (the character) by default, but use real-name context if Zaal corrects you" to "Refer to the in-character persona as 'AttaBotty' in all chat replies. Use William/real-name context ONLY if Zaal explicitly corrects you mid-conversation. Never volunteer the real person's name - let Zaal control that boundary." |
| 2 | Persona says bot "supports that" (kayfabe, line 15) but doesn't define what "support" means | How does a private Telegram bot affect a Monday livestream's kayfabe? The bot isn't on-stream. | Add new line after line 15: "Support means: never explain AttaBotty's character mechanics/universe rules to third parties. If Zaal asks bot to clarify a lore point for the stream intro, bot stays consistent with prior lore (via /context facts). Never invent new lore - ask Zaal first." |
| 3 | Reference docs mention "Doc 642: AttaBotty livestream playbook" but persona doesn't explain what playbook details bot must know | Bot loads persona.md but playbook (Doc 642) is a separate document. Does bot have access to it? How? | Line 50: Change "Doc 642: AttaBotty livestream playbook + this bot spec" to "Doc 642: AttaBotty livestream playbook (one stream per week, Monday 7pm, 45-60 min, YouTube primary archive). This bot spec is in the same doc." + ensure bot initial context load includes playbook summary in boot logic |
| 4 | Bot has no notion of "which AttaBotty audience" - livestream (public), Telegram (private), X posts (public with clips from public stream) | Messaging tone differs: livestream intro is in-character and mystical; X posts might be behind-the-scenes clips (meta); Telegram is strategic planning (human). | Line 12: Add "You live in Zaal + AttaBotty's private planning space. Never speak as if you are AttaBotty addressing the public. Your voice is strategic + terse. Zaal and AttaBotty's voices are theirs to control on public surfaces (livestream, X, YouTube)." |

### Missing brand facts the bot should know

| # | Fact | Source | Add to persona.md or seed in /fact |
|---|------|--------|-------------------------------------|
| 1 | William Stewart-Carreras = AttaBotty (real name for records). DaNici (Da'Nici Carreras, animated) = wife, co-founder AttaBotty Productions | Doc 229, 274 (team profiles, archived + indexed) | Seed via `/fact William Carreras is the person behind AttaBotty. DaNici is his wife and animation/design partner. Both are ZAO co-founders.` at bot boot. |
| 2 | AttaBotty's music archive spans 2006-present; "humble beginnings" pre-2012. Current setlist = 3 originals. Cipher = first ZAO Music DBA release. | Doc 274, 642 (team profile, playbook) | Seed via `/fact AttaBotty's music archive: 2006-present. Pre-2012 = early work. Current setlist: 3 originals. Cipher is the first ZAO Music release (team: DCoop, GodCloud, Iman).` |
| 3 | Onagi = TBD. Possible collaborator for stream ideation. Exact identity (TG handle, X, name) unconfirmed. | Doc 642 (playbook, open questions) | Seed via `/fact Onagi: TBD - possible stream collaborator. Zaal to confirm handle + role.` Mark as tentative, revisit when Zaal clarifies. |
| 4 | "Artisan meeting place" = TBD (Telegram group? Farcaster channel? in-person?). Zaal referenced it; AttaBotty didn't clarify. | Doc 642 (open questions) | DO NOT seed yet. Wait for AttaBotty to answer. When answered, add via `/fact AttaBotty's artisan meeting place: [TBD - describes community they're part of].` |
| 5 | Nounish artisan match-fund: $10 -> $50 match ratio UNVERIFIED. No published program found (Nouns DAO, Prop House, Builder DAO). | Doc 642 (open questions, research notes) | Seed via `/fact Nounish artisan match-fund: $10 -> $50 match (UNVERIFIED - Zaal to confirm program name + URL before pitching to AttaBotty).` Flag in persona.md line 28 as UNVERIFIED. Bot must refuse to quote ratio to AttaBotty until Zaal confirms. |
| 6 | ZAO Stock Oct 3 2026 = flagship event. AttaBotty = production lead (sound/staging/artist mgmt). DaNici = visual design + animation. | Doc 274, 476 (team profiles, ZAO Stock recaps) | Seed via `/fact ZAO Stock Oct 3 2026: flagship festival in Ellsworth, Maine. AttaBotty: production lead. DaNici: visual design + animation + stage aesthetics.` |

### Open clarifications already listed in persona.md (audit + suggest defaults)

**Current open questions (persona.md lines 56-66):**

1. **Who is Onagi? (TG handle, X, or real name?)**
   - Confidence: Very low (transcription may have mangled "Onaji" or it's a real handle).
   - Sensible default: "Onagi = TBD collaborator, likely involved in stream ideation or music production."
   - Suggested default in bot: Bot should NOT mention Onagi to AttaBotty until Zaal confirms. If Onagi joins the Telegram chat, bot notes the addition but doesn't assume role/relationship.
   - **Ask first:** "Zaal, is Onagi definitely joining the stream collab chat? If so, what's their role (beat-maker, idea contributor, Twitch mod for other streams?)?"

2. **What "artisan meeting place" did Zaal reference? (TG group, Farcaster channel, in-person?)**
   - Confidence: Low (vague context).
   - Sensible default: "AttaBotty has a community of peer artists they meet with regularly; location/platform TBD."
   - Suggested default in bot: Bot should ask "Are you part of a dedicated artist group or channel? That helps Zaal understand where to pitch collaborations." If answer is "yes," log it via `/fact`.
   - **Ask first:** "Zaal, when you pitch the nounish match-fund to AttaBotty, ask: 'Are you part of an artisan community (TG, Discord, Farcaster, in-person)?' This helps shape how to market funding."

3. **Where on attabotty.com should the live YouTube player embed? (/live? /stream? custom?)**
   - Confidence: Medium (Zaal proposed /live but not confirmed).
   - Sensible default: `attabotty.com/live` (follows common SaaS pattern, easy to remember, mirrors "go live" language).
   - Suggested default in bot: Bot suggests "/live" when asked, but defers to AttaBotty's preference (e.g., /stream if he's already built a /stream page).
   - **Ask first:** "AttaBotty, which URL should the live player embed on? /live is standard, but tell us if you prefer something else."

4. **Will AttaBotty share NotebookLM transcripts for the bot's context?**
   - Confidence: Medium (persona mentions "bring them into context" but no commitment from AttaBotty).
   - Sensible default: "Bot expects NotebookLM transcript URLs. AttaBotty can paste URLs or markdown clips. Bot indexes them for /research and /context."
   - Suggested default in bot: Add `/transcript <url>` command with hint: "NotebookLM transcripts help me understand your stream themes + music context. Drop URLs or pasted text here."
   - **Ask first:** "AttaBotty, are you comfortable sharing NotebookLM transcripts (URLs or pasted text) with this bot? I'll use them for research context, not re-publish them."

5. **Confirm spelling: is the bot name "Z and AttaBotty" or "Z and AdaBody"?**
   - Confidence: High (transcription typo likely; canon = "AttaBotty" everywhere).
   - Sensible default: **"Z and AttaBotty"** (or "Z + AttaBotty" if Telegram char limit needs it).
   - Suggested default in bot: Use "Z-and-AttaBotty Bot" internally (cfg.name = "z-and-attabotty"). Display name in help: "I am the Z and AttaBotty Bot."
   - **Ask first:** None needed - this is typo correction. Finalize name in bot config once.

6. **The $10:$50 nounish match-fund - which specific program? (Prop House? Builder DAO? Nouns Artisan?)**
   - Confidence: Very low (no published program found via web search).
   - Sensible default: "Nounish funding via a matching grant program (exact details TBD pending Zaal research)."
   - Suggested default in bot: Line 28 (persona.md) flags it UNVERIFIED. Bot refuses to quote ratio to AttaBotty. Instead, bot says: "Zaal mentioned a nounish match-fund opportunity. Let me check the latest details before we pitch it."
   - **Ask first (CRITICAL):** "Zaal, before you pitch the nounish match-fund to AttaBotty: (a) What is the exact program name? (b) Where is it documented (URL)? (c) Is the $10:$50 ratio correct, or is it different? (d) Who runs it (Nouns DAO, Builder DAO, Flows.wtf, other)?" Doc 642 marks this as UNVERIFIED research task - prioritize before pitching.

---

## Stream production gaps (Monday-night livestream context)

### Pre-stream checklist the bot should run

The playbook (Doc 642, lines 21-50) describes cadence + structure, but no day-of checklist. Suggested `/stream-prep` output:

```
STREAM PREP FOR MONDAY 7pm
-----------
Topic: [AttaBotty to fill in or bot fetches from /tasks]
Intro script locked? [Y/N]
Outro reflection logged? [Y/N]
Audio test done (mic + headphones)? [Y/N]
StreamYard config verified (YouTube + Twitch + X)? [Y/N]
Internet connectivity OK? [Y/N]
Animated visuals ready? [Y/N]
Setlist confirmed (3 songs, order, timing)? [Y/N]

NEXT STEPS:
- Enable StreamYard multistream 6:55pm
- Comments OFF on YouTube stream
- Zaal to watch VOD within 48 hrs
- Clip extraction TBD (Descript or manual)
```

### Mid-stream: how does bot stay quiet but capture clips?

Bot is private Telegram. During Monday 7pm stream, AttaBotty and Zaal are LIVE (not in Telegram). Bot should:
- Remain silent (no auto-messages during stream).
- If Zaal is watching and wants to tag moments: Zaal DMs bot `/clip <timestamp> <note>` or `/clip <youtube-url#t=XXX> <note>` to mark timestamps in real-time.
- Bot logs clip notes to Supabase clips table immediately.
- Post-stream (within 48 hrs), Zaal runs `/vod <url>` to auto-suggest clip points.

**Implementation note:** Add hint to /clip help: "During stream, tag moments with /clip https://youtube.com/watch?v=XXX#t=123 <note>" or "Post-stream, use /vod to fetch full VOD + AI-suggest clip timestamps."

### Post-stream: VOD review prompts, clip-suggestion workflow

**Workflow (Doc 642, line 45 + implied):**
1. Stream ends 7:45-8pm (Monday).
2. YouTube VOD auto-publishes (StreamYard handles this).
3. Within 48 hrs, Zaal watches VOD + runs `/vod <youtube-url>`.
4. Bot fetches transcript (YouTube API), suggests 3-5 clip ranges (intro hook, setlist highlight, outro reflection, wild moments).
5. Bot logs suggestions to clips table with timestamps.
6. Zaal uses Descript or manual cuts to extract 15-30 sec shorts for Farcaster/X/Instagram/TikTok.
7. (Future: auto-shortification tool TBD, not adding yet per playbook line 37).

**Current gap:** No VOD ingest workflow in commands.ts. Suggested implementation:
- `/vod <url>` command.
- Fetch YouTube video transcript via YouTube Data API (requires YouTube API key in .env).
- Extract transcript + metadata (duration, upload date).
- Pass to Opus: "Suggest 5 clip-worthy timestamp ranges from this stream transcript. Return: [start_time, end_time, snippet, why_clip_worthy]."
- Log suggestions to clips table.
- Return to Telegram in terse format (~10-15 lines).

---

## Recommended persona.md diff

**Line 14 (voice section):**
```diff
- Address Zaal by name. Address the artist as "AttaBotty" (the character) by default, but use real-name context if Zaal corrects you.
+ Address Zaal by name. Refer to the in-character persona as "AttaBotty" in all Telegram replies. Use William/real-name context ONLY if Zaal explicitly corrects you mid-conversation. Never volunteer the real person's name—let Zaal control that boundary.
```

**After line 15 (new rule):**
```diff
+ - When AttaBotty's character is discussed, use the in-character voice (mystical, artistic, universe-focused). When William/the human is discussed, use clear professional tone. Zaal will signal which context applies.
+ - You live in a private planning space. Never speak as if you are AttaBotty addressing the public. Your voice is strategic + terse for production planning. Zaal and AttaBotty's voices are theirs to control on public surfaces (livestream, X, YouTube).
```

**Line 20 (under "What you care about"):**
```diff
+ - NotebookLM transcripts (AttaBotty's preferred ideation tool - index them for /research context)
+ - AttaBotty's real identity (William Stewart-Carreras) and family (DaNici/Da'Nici = wife, animator + design partner)
```

**Line 28 (existing, but add bold warning):**
```diff
- Nounish artisan match-fund pitch ($10 -> $50 match, UNVERIFIED - confirm before quoting)
+ Nounish artisan match-fund pitch (UNVERIFIED: $10 -> $50 match ratio, program name, and administrator unknown as of 2026-05-12. **Refuse to quote ratio to AttaBotty until Zaal confirms via web research or direct contact.**)
```

**Line 28.5 (new hard rule):**
```diff
+ - Never quote the nounish match-fund $10:$50 ratio to AttaBotty or anyone else until Zaal confirms the program name, URL, and administrator.
```

**Line 50-54 (reference docs):**
```diff
- Doc 642: AttaBotty livestream playbook + this bot spec
- Doc 640: Magnetiq sibling bot
- Doc 641: Whop play (relevant: AttaBotty private rooms)
- Doc 644: ZAO agent stack canon (you are an instance)

+ Doc 642: AttaBotty livestream playbook (one stream/week, Monday 7pm, YouTube primary, clips for shorts). This bot spec is in the same doc.
+ Doc 640: Magnetiq sibling bot (reference for Hermes pattern + team-bot architecture).
+ Doc 641: Whop integration (potential membership tier: exclusive clips, early drops, producer breakdowns).
+ Doc 644: ZAO agent stack canon (you are a Hermes-pattern instance).
+ Doc 229: AttaBotty (William) & DaNici profile (archived, full background).
+ Doc 274: ZAO Stock team profiles (confirms William's 20+ year music + animation experience, NFTNYC/Art Basel veteran).
```

**After line 66, new section "Telegramd context to load at boot":**
```diff
+ ## Context to load at bot initialization
+
+ When this bot starts, load these facts via the memory layer (or seed them):
+ - "William Carreras = real person. AttaBotty = in-character musical persona. Both are the same human. DaNici = wife, animator/designer."
+ - "AttaBotty's music archive: 2006-present. Pre-2012 = early work. Current setlist: 3 original compositions (expanding). Cipher = first ZAO Music release (team: DCoop, GodCloud, Iman)."
+ - "Monday stream structure: 5-min in-character intro, 3-song music set, 2-3 min reflection/outro. Target 45-60 min total."
+ - "Distribution: StreamYard multistreams to YouTube (primary/archive) + Twitch + X simultaneously. Comments OFF. Zaal reviews VOD within 48 hrs."
+ - "Shorts workflow: Extract 15-30 sec clips from intro/outro for Farcaster/X/Instagram/TikTok (tool TBD, not added yet)."
+ - "Onagi = TBD collaborator (identity/role unconfirmed). Zaal to provide details."
+ - "Artisan meeting place = TBD (Telegram/Farcaster/in-person community AttaBotty is part of). Zaal to clarify."
+ - "Nounish match-fund = UNVERIFIED ($10:$50 ratio, program name, administrator all unknown as of 2026-05-12). DO NOT quote ratio until confirmed."
+ - "Whop membership tier (future): exclusive behind-the-scenes clips, early music drops, producer breakdowns."
+ - "ZAO Stock Oct 3 2026: flagship festival. AttaBotty = production lead. DaNici = visual design + animation."
```

---

## Recommended new commands or command tweaks

### Critical (P1 - unblock bot effectiveness)

| Command | Why | Spec |
|---------|-----|------|
| `/stream-prep` | Playbook prescribes pre-flight checklist but no automation. Zaal/AttaBotty manually verify 6+ items each Monday. | **Spec:** Read persona.md playbook + prior stream logs (via /context facts). Generate 8-item yes/no checklist: (1) topic chosen, (2) intro locked, (3) outro reflection logged, (4) audio tested, (5) StreamYard config verified, (6) internet OK, (7) visuals ready, (8) setlist confirmed. Output as terse bullet list. Estimated duration: 3 min prep Monday 6pm. |
| `/vod <youtube-url>` | VOD workflow (Doc 642) has no bot implementation. Zaal manually watches 45+ min stream then manually cuts clips. Bottleneck = no AI-suggested timestamps. | **Spec:** Fetch YouTube transcript via YouTube Data API. Extract 5 clip-worthy ranges (intro hook, setlist highlight, outro reflection, unexpected moments, emotional peak). Return format: `[00:05-00:45] Intro hook: "..." // start stream strong`, etc. Log suggestions to clips table with URL + timestamp ranges. Max output 15 lines. Cost ~$0.01-0.03 per VOD (transcript fetch = API call, Opus = analysis). |
| `/transcript <url-or-markdown>` | Persona says "bring [NotebookLM transcripts] into context" but no command. AttaBotty uses NotebookLM for stream ideation; bot can't read it yet. | **Spec:** Accept NotebookLM URL (e.g., notebooklm.google.com/notebooks/...) or pasted markdown. Index into memory (store as fact or separate transcripts table). Reference in /research context (Opus can cite it). Return "Transcript indexed for stream research context." Help text: "NotebookLM is your ideation tool—drop transcripts here so I can reference them in /research." |

### High-value (P2 - ship within 1 week)

| Command | Why | Spec |
|---------|-----|------|
| `/setlist` | No tracking of setlist evolution. Current = 3 originals. Need to log song iterations, production stage, duration for planning. | **Spec:** Display current setlist (song title, duration, year, production stage). Optional: `/track-update <song-id> <note>` to log iteration. E.g., "/setlist \n1. Song A (3:45, original, 2024, mix in progress) \n 2. Song B (4:12, original, 2026, recorded) \n 3. Song C (3:30, cover, 2025, live test pending)." Table: setlist (id, title, duration_sec, is_original, year, production_stage, last_updated, notes). |
| `/stream-log <theme> <mood> <notes>` | Post-stream debrief logging. Playbook says Zaal reviews VOD in 48 hrs but doesn't capture reflection (what worked, what didn't, next week's direction). | **Spec:** Log date, theme (topic of stream), mood (vibe/energy), technical notes (audio glitches, timing, viewer count if available), next week's direction. Table: stream_logs (id, date, theme, mood, technical_notes, next_direction, created_at). Helps Zaal/AttaBotty iterate faster. Example: "/stream-log Cyberpunk theme, mystical/dark, audio latency 2min mark, next: faster song transitions". |
| `/partner <company> <offer-type> <status>` | No tracking of sponsor/merch/partnership inquiries. Playbook mentions Whop tier (future) and funding (Empire Builder, nounish match-fund) but no log of who's reached out. | **Spec:** Log incoming brand inquiries (company name, offer type: sponsorship/merch/distribution/partnership, status: new/interested/negotiating/declined/done). Table: partners (id, company, offer_type, status, last_contact_date, notes, created_at). Helps Zaal prioritize + avoid redundant pitch responses. |

### Medium-value (P3 - nice-to-have, post-launch)

| Command | Why | Spec |
|---------|-----|------|
| `/kayfabe` | Persona says "support AttaBotty's in-character voice" but no explicit lore guide. Useful as AttaBotty universe expands. | **Spec:** Dump known lore facts about AttaBotty character (animated universe rules, origin story if established, tone guide for intro/outro). Built from /facts + persona.md. Helps keep stream intros consistent. E.g., "/kayfabe \n Universe: cyberpunk-mystical, animated world, unnoticed+imperceptible sounds.\n Tone: introspective, visual-metaphor-rich, character-driven." |
| `/clip-suggest` | /vod suggests timestamps; /clip-suggest could proactively review last stream for missed opportunities. | **Spec:** Auto-fetch last stream URL (if logged), run /vod logic, return top 3 clip suggestions. Passive: runs on request. Could escalate to cron for off-peak analysis (e.g., Tue 2am = VOD auto-analyzed). Not critical; /vod + manual Zaal review sufficient for launch. |

### For AttaBotty SPECIFICALLY - verify these belong

**Already in scope (YES):**
- `/stream-prep` - YES (matches playbook intent, unlocks Mon pre-flight).
- `/vod <url>` - YES (completes VOD workflow, critical gap).
- `/clip-suggest` - MAYBE (passive; /vod + manual review may be enough initially).
- `/kayfabe` - NICE-TO-HAVE (universe grows over time; not urgent for week 1).
- `/setlist` - YES (production planning, needed as setlist expands beyond 3 songs).

**Out of scope (NO):**
- `/fan-contest` - No. Bot is private only. No fan-facing features.
- `/merch-design` - No. AttaBotty + DaNici handle visuals, not bot.
- `/nft-mint` - No. Finance/contracts handled externally (0xSplits, DistroKid). Bot tracks progress, doesn't execute.
- `/auto-shorts` - No. Playbook says "tool sprawl kills momentum." Descript/Opus Clip TBD - don't add until AttaBotty asks.

---

## Memory schema suggestions

**Current tables (commands.ts + memory.ts):**
- ideas (id, bot, created_by, text, created_at)
- tasks (id, bot, created_by, text, is_done, created_at)
- clips (id, bot, created_by, url, note, created_at)
- facts (bot, fact_text, created_at)
- messages (bot, chat_id, message_id, from_id, from_username, text, is_bot_reply, created_at)

**AttaBotty-specific tables to add:**

| Table | Columns | Purpose |
|-------|---------|---------|
| `setlist` | id, bot, song_title, duration_sec, is_original, year, production_stage, notes, created_at, updated_at | Track AttaBotty's growing setlist, iterations, production status. Helps plan stream sets. |
| `stream_logs` | id, bot, stream_date, theme, mood, technical_notes, next_direction, created_at | Post-stream debrief. Zaal logs what worked/didn't after each Monday stream. |
| `transcripts` | id, bot, url, source (NotebookLM/other), indexed_at, full_text (or NULL if too large) | Index AttaBotty's NotebookLM transcripts for /research context. |
| `partners` | id, bot, company, offer_type (sponsorship/merch/distribution/partnership), status (new/interested/negotiating/declined/done), last_contact_date, notes, created_at | Track sponsor/Whop/distribution inquiries. |
| `stream_clips` | id, bot, stream_date, start_timestamp, end_timestamp, youtube_url, why_clip_worthy, status (suggested/logged/extracted/posted), created_at | Log /vod suggestions + manual clips. |

**Optional but useful:**

| Table | Purpose |
|-------|---------|
| `bot_context_versions` | Versioned snapshots of persona.md + knowledge facts (for rollback if Zaal corrects bot logic). |
| `stream_metrics` | Stream date, duration, viewer count (if available), chat sentiment (if available), youtube_like_count, etc. Helps measure growth. |

---

## Pre-launch checklist (AttaBotty-specific, before tokens land)

Before shipping, before any $ZABAL / NFT / Whop / funding is committed:

- [ ] **Kayfabe locked:** Confirm bot will never leak William's real name publicly. Test: run bot, mention William, verify bot says "AttaBotty" in reply. Zaal to correct if needed.
- [ ] **NotebookLM integration ready:** AttaBotty provides test NotebookLM URL (or pasted transcript). Bot indexes it successfully. /research can cite it.
- [ ] **Stream playbook loaded:** Bot has read/understood Doc 642. /stream-prep generates accurate checklist. Zaal runs /stream-prep Mon 6pm on May 18 (week 2 stream), confirms format + usefulness.
- [ ] **VOD workflow tested:** Zaal runs /vod on Monday May 11 archived stream (if available) or test YouTube URL. Confirms /vod suggestions are clip-worthy (not random timestamps). Refine prompt if needed.
- [ ] **Allowlist locked:** Only Zaal + AttaBotty can use bot. If Onagi joins, role is confirmed first. No accidental third parties.
- [ ] **Spelling canon:** All references use AttaBotty (not AdaBody). $ZABAL, ZOUNZ, Whop, Farcaster correct. Scan persona.md + commands output text for typos.
- [ ] **Nounish match-fund researched:** Zaal resolves Doc 642 open question #6 (program name, URL, $10:$50 ratio confirmation). Bot persona.md gets "VERIFIED" stamp + bot can quote ratio to AttaBotty.
- [ ] **Daily summary cron configured:** Set to off-peak time (suggest 2am EST, or ask Zaal). Test one run manually.
- [ ] **Telegram token + Supabase access secured:** .env has valid TELEGRAM_BOT_TOKEN + Supabase credentials. No leaks to git. Test table inserts (idea/task/clip/fact) work end-to-end.
- [ ] **Production lead (AttaBotty) sign-off:** Zaal shows AttaBotty this bot's capabilities (help text, /context dump, persona.md voice). AttaBotty approves voice + scope. Any tweaks requested before deploy.
- [ ] **VPS 1 deploy tested:** Bot starts via systemd unit. Responds to /start, /help, /task, /research. Supabase writes succeed. Logs don't expose secrets.
- [ ] **Persona.md diffs applied:** All recommended edits from this audit are in place. Bot's prompt uses updated persona.

---

## 3 highest-value next moves (ranked)

### 1. (CRITICAL THIS WEEK) Resolve the 6 open clarifications in Doc 642 + persona.md

**Why #1:** All other work depends on AttaBotty answering these. Bot can't function at full capacity with UNVERIFIED claims (nounish match-fund) or ambiguous references (Onagi, artisan meeting place).

**Actions:**
- Zaal DMs AttaBotty TODAY (2026-05-12): "Quick clarification round for your Telegram bot - 6 questions, 5 min to answer."
- **Question 1:** "Who is Onagi? TG handle, X handle, or name? Are they definitely joining our stream collab chat?"
- **Question 2:** "You mentioned an 'artisan meeting place.' Is that a TG group, Farcaster channel, Discord, or in-person crew? Who runs it?"
- **Question 3 (bonus):** "Which URL should the live stream embed on your site? /live, /stream, or something custom?"
- **Question 4 (for later, post-stream):** "Can you share NotebookLM transcripts (URLs or pasted text) with the bot? I'll use them for research context."
- **Question 5 (for Zaal's research, not AttaBotty):** Zaal researches nounish artisan fund on Nouns DAO forum, Prop House, Builder DAO, Flows.wtf. Goal: confirm program name, administrator, URL, $10:$50 ratio. **If ratio is wrong, bot persona.md gets updated with correct ratio. If program doesn't exist, Zaal + AttaBotty pivot to different funding angle.**

**Timeline:** Today (2026-05-12) DM sent. Answers expected by end of week (2026-05-15). Bot persona.md updated Tuesday (2026-05-13 or later once answers land).

### 2. (P1 - launch week) Build `/stream-prep` + `/vod` commands

**Why #2:** These two commands unblock the Monday stream workflow. Without them, AttaBotty + Zaal continue manual checklist + manual VOD review (no improvement from bot). With them, bot saves 30-45 min per week of repetitive work.

**Actions:**
- Implement `/stream-prep`: read persona.md playbook, output 8-item checklist (topic? intro locked? audio tested? StreamYard ready? etc.). Test Monday 6pm, May 18. Zaal confirms format.
- Implement `/vod <youtube-url>`: fetch transcript, suggest 5 clip ranges, log to clips table. Test on May 11 archived stream (if available) or create test VOD. Cost estimate: ~$0.02-0.05 per run (YouTube API + Opus). Zaal confirms clip suggestions are useful (not noise).
- Deploy both to VPS 1 by Monday May 18 (second stream).

**Timeline:** Design/code this week (2026-05-12 to 2026-05-15). Test/refine (2026-05-15 to 2026-05-18). Deploy live Monday 6pm May 18.

### 3. (P2 - ship before funding pitch) Resolve nounish match-fund verification + add `/partner` tracking

**Why #3:** Before Zaal pitches funding to AttaBotty (or anyone else), the $10:$50 match-fund ratio must be verified. If it's wrong, bot (and Zaal) look unprepared. `/partner` command lets Zaal track all incoming brand inquiries (Whop, sponsors, distribution deals) so nothing falls through cracks as AttaBotty gets popular.

**Actions:**
- Zaal research: confirm nounish artisan match-fund program name, URL, administrator, exact ratio. (Timeline: by end of week, 2026-05-15.)
- If ratio is correct, update persona.md line 28 to "VERIFIED: $10:$50 match via [program name] ([URL])."
- If ratio is wrong or program doesn't exist, update persona.md + Zaal + AttaBotty discuss alternative funding (Gitcoin, Kick starter, custom crowdfunding, direct NFT drops).
- Implement `/partner` command: log company + offer type + status. Table: partners (company, offer_type, status, notes, last_contact, created_at). Test by running `/partner Whop membership_tier interested 2026-05-18` + checking table.
- Deploy before Zaal pitches Whop/sponsorships to external brands.

**Timeline:** Nounish research by Fri 2026-05-15. `/partner` code + deploy by Mon 2026-05-20 (before sponsorship outreach intensifies).

---

## Summary

**The Z-and-AttaBotty Bot (PR #503) is architecturally sound.** It uses Hermes pattern correctly, scopes to private Telegram, and includes a strong persona.md with explicit kayfabe protection. However, **brand-fit gaps exist:**

1. **Kayfabe risk (medium):** Persona mentions protecting AttaBotty's in-character voice but doesn't clarify which identity (William vs. character) the bot uses in replies. Recommend tightening line 14 + adding explicit rule: "Never volunteer William's real name. Let Zaal control that boundary."

2. **Workflow automation missing (high):** Playbook prescribes pre-stream checklist + VOD review workflow, but bot has no `/stream-prep` or `/vod` commands. AttaBotty + Zaal manually execute these steps each week. Recommend P1 implementation.

3. **NotebookLM integration missing (high):** Persona says "bring [transcripts] into context," but no `/transcript` command exists. AttaBotty's preferred ideation tool is inaccessible to bot. Recommend P1 implementation.

4. **Unverified funding claims (critical):** Persona quotes nounish artisan match-fund $10:$50 ratio without source. No published program found. Recommend Zaal verify before bot mentions it to AttaBotty, or flag in bot as UNVERIFIED + refuse to quote ratio until confirmed.

5. **Open ambiguities (medium):** Doc 642 lists 6 clarifying questions (Onagi, artisan meeting place, embed URL, transcripts, bot name spelling, match-fund details). Persona.md surfaces these but doesn't propose defaults. Recommend Zaal ask AttaBotty today; bot persona.md gets updated Tuesday with answers.

**Most important persona.md edit:** Line 14, change "Address the artist as 'AttaBotty' (the character) by default, but use real-name context if Zaal corrects you" to "Refer to the in-character persona as 'AttaBotty' in all Telegram replies. Use William/real-name context ONLY if Zaal explicitly corrects you mid-conversation. Never volunteer the real person's name—let Zaal control that boundary."

**Top open clarification to ask first:** "Who is Onagi? (TG/X handle or real name?) Are they definitely joining the stream collab chat?" This unblocks chat membership + stream ideation scope.
