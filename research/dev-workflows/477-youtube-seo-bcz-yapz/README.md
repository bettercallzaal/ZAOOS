# 477 - YouTube SEO for BCZ YapZ

> **Status:** Research complete
> **Date:** 2026-04-22
> **Goal:** Actionable rules + per-episode checklist for maximizing discovery of `@bettercallzaal` interviews on YouTube. Focus on structure below the description body: chapters, CTAs, subscribe links, ecosystem cross-links.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Chapters | USE them on EVERY ep - YouTube reports 11% watch-time lift. Must be 0:00 first, min 3 chapters, min 10 seconds each, ascending order. |
| Chapter phrasing | USE specific-question phrasing, NOT generic topic buckets. "Sociocracy explained" beats "Governance". Front-load the searchable keyword. |
| Chapter count for 25-30min interview | USE 8-10 chapters. <8 leaves viewers lost, >12 clutters the progress bar. |
| Description length | USE 250-400 words body + chapter block + links + hashtag footer. Research says 200-300 min, but the extra 100 helps for ZAO ecosystem keyword coverage (Farcaster, web3, music, Maine, etc). |
| First 2 lines of description | FRONT-LOAD with guest name + org + hook. Only 157 chars visible in mobile search snippet. |
| Tags | USE 12-15 tags. First 3 most important (YouTube weights heaviest). Lead with "BCZ YapZ", guest name, primary org. |
| Hashtags in description | USE up to 3 as the FIRST hashtags (they show above the title on watch page). Put the rest at the bottom. Max 15 hashtags total or YouTube ignores all of them. |
| Playlist | CREATE a "BCZ YapZ" playlist, add every ep on publish. Boosts session time. |
| End screens | USE 20sec end screens w/ "Subscribe" + "Next episode" + "ZAO OS link" cards on every ep. |
| Cards | ADD 2-4 cards at key chapter boundaries pointing to earlier BCZ YapZ eps that share the topic. Cross-link the catalog. |
| Cross-links in description | LINK at minimum: guest socials (Farcaster + X), guest project, thezao.com, thezao.com newsletter, the BCZ YapZ playlist, ZAO Stock if on-theme. |
| Thumbnail text | USE 2-3 big words max. Guest face left, BCZ branding right, 1 line hook across middle. |
| Title formula | USE `BCZ YapZ - Episode {N} w/{Guest} from {Org}`. Current pattern works - DO NOT change the brand prefix. |
| Title length | KEEP under 70 chars. YouTube truncates in search around char 60-70. |
| Publish day/time | USE Tuesday ~2pm ET (current cadence) - matches guest recording tempo. Don't fight the cadence. |
| Transcript (auto CC) | USE YouTube Studio auto-sync the `.md` transcript in `content/transcripts/bcz-yapz/`. Human-reviewed CCs outrank auto-generated for SEO. |

---

## Comparison of Options - Where to put chapters in the description

| Position | Pros | Cons | Verdict |
|----------|------|------|---------|
| Top (above body) | Visible without "Show more" click | Kills the hook sentence, blocks description algo | SKIP |
| Middle (after body, before links) | Narrative flow: hook -> story -> chapters -> links | Two "chapter boundaries" on the scroll, extra noise | SKIP |
| Bottom (just above hashtag footer) | Keeps hook on top, chapters still trigger YouTube chapter detection, links above feel cleaner | None significant | **USE** |

---

## The BCZ YapZ publish checklist (copy this for every episode)

### Before hitting Publish

1. **Title** - `BCZ YapZ - Episode {N} w/{Guest} from {Org}`. Under 70 chars. No emojis.
2. **Thumbnail** - guest face left, BCZ branding right, max 3 words of overlay text. 1280x720.
3. **Description body** (250-400 words)
   - Line 1-2: guest name + org + 1-sentence hook. This is what mobile shows in search.
   - Paragraph 2-3: guest bio + the story arc.
   - Paragraph 4: topics discussed (bullet list of 5-8 items, keyword-dense).
   - Links block: guest Farcaster + X + project website + thezao.com + Subscribe + Follow.
   - Closing hashtag line: 3-5 primary hashtags.
4. **Chapter block** (8-10 chapters, pasted at bottom of description just above final hashtag block)
   - First chapter MUST be `0:00`
   - Each chapter min 10 seconds
   - Ascending order
   - Chapter titles front-load keywords, phrase as "what the viewer learns" not "what topic"
5. **Tags** (12-15)
   - #1-3 most weighted: `BCZ YapZ`, `Better Call Zaal`, `{Guest Name}`
   - Mid-tier: `{Org Name}`, 2-3 topic terms, `The ZAO`
   - Long-tail: ecosystem terms (`Farcaster`, `Web3 Community`, `Maine Local Food`, etc)
6. **Playlist** - add to "BCZ YapZ" playlist.
7. **End screen** - 3 elements: Subscribe, Next video (prev ep OR thematic match), Link (thezao.com).
8. **Cards** - 2-4 cards at chapter boundaries pointing to thematic earlier episodes.
9. **Language** - set to English. Add auto-translate for Spanish (Nikoline/Hannah audience overlap).
10. **Comments** - turn on, sort newest first, pin guest's Farcaster handle as first comment.

### After publish (30 minutes later)

11. Verify chapters render on progress bar. If not, YouTube rejected format - fix timestamps.
12. Cross-post to Farcaster `/zao` channel via Firefly (covers X too). Use `/socials` skill.
13. Cross-post to Telegram ZAO group + Discord.
14. Update `content/transcripts/bcz-yapz/<date>-<slug>.md` frontmatter `youtube_url` + `youtube_title`.
15. Comment on the guest's most recent cast with the video link.

---

## Chapter generation rules (for producer - human or agent)

Given a transcript with inline `[00:00:00]` markers, generate chapters by:

1. **Scan for topic shifts.** Watch for phrases like "so let's talk about", "moving on to", question-style sentences from host. Each shift = candidate chapter.
2. **Collapse to 8-10 chapters** for a 25-30 min interview. Merge adjacent topic shifts under 90 seconds apart.
3. **Write chapter titles as specific-question answers.** Front-load keywords.
4. **Sanity check** - every chapter ≥ 10 seconds from prev. First is exactly `0:00`.
5. **Cite guest's own language** when possible. "The Plural Events format" > "Global events" because "Plural Events" is her brand term.

Future: bolt this into the BCZ 101 bot pipeline (doc 474) - ingest already has timestamped chunks, so chapter generation is a downstream LLM pass on the chunk boundaries.

---

## Chapter blocks for eps 15 / 16 / 17 (ready to paste)

### Ep 15 - Nikoline / Hubs Network (27 min)

```
Chapters:
0:00 Welcome + meet Nikoline from Hubs Network
0:50 Sociocracy, holacracy, and fractal governance
3:30 From Akasha Foundation to the Hubs Network
5:50 How physical hubs support each other across Europe
14:30 The Plural Events format - 12 cities, one conversation
17:30 Join the May 14 Plural Event as a local host
21:20 Polis and Agora Citizen for real group decisions
26:00 Residencies, the Berlin summit, and how to reach Hubs Network
```

### Ep 16 - Dish / Clanker (29 min)

```
Chapters:
0:00 Welcome + two Massholes talking tokens
1:00 Meet Jack Dishman - GameStop NFT era origins
6:00 From Paris blogchain to meeting Proxy in Boston
7:30 The Clanker origin story at a Farcaster meetup
9:30 V0 to V4 migrations + the LP locker save
11:00 V3.1 vaulting unlocks the Clanker project meta
15:00 Empire Builder, Crusty, and the alt-client ecosystem
18:00 Why blockchain is the verification layer for AI
22:00 Sophisticated rugs, fake teams, vibe-coded scams
25:00 In-feed primitives beat block explorers
28:30 How to reach Dish + ZAO Stock October invite
```

### Ep 17 - Hannah / Farm Drop (30 min)

```
Chapters:
0:00 Welcome + meet Hannah from Farm Drop
0:45 From Blue Hill to Barcelona, Mexico, Guatemala, Germany
2:30 Back to Maine via Healthy Acadia gleaning
3:30 Farm Drop origin - a Blue Hill senior project in 2011
6:00 Expansion to MDI, Portland, and Unity
10:30 Four regions of Maine + the L3C social business model
17:00 The Food for Health mutual aid program
21:00 Technology that serves community, does not replace it
22:30 Upcoming events - May 9 Reversing Falls, May 20 Grocery List
25:30 May 24 Soul Vendors fundraiser + Aug 6 Sassafras supporter event
28:00 15 years of volunteerism + how to join Farm Drop
```

---

## ZAO Ecosystem Integration

- Transcripts live at `content/transcripts/bcz-yapz/` - LLM pass to auto-extract chapters per doc 474 pipeline
- `~/.claude/skills/socials/skill.md` already has a YouTube section - extend with this chapter + end-screen checklist
- `src/app/api/publish/` routes (cross-platform posting) - future: auto-generate the Farcaster + X + Telegram + Discord broadcast from YouTube description body
- `community.config.ts` already has channel config - use for mentioning `/zao`, `/music`, `/build` channels in Farcaster distribution post

---

## Sources

- [YouTube Video Chapters help](https://support.google.com/youtube/answer/9884579?hl=en) - official rules: 0:00 start, min 3, min 10sec
- [YouTube SEO Optimization 2026 Guide](https://influenceflow.io/resources/youtube-seo-optimization-techniques-the-complete-2026-guide/) - 2026 SEO techniques
- [YouTube Chapter SEO (ALM Corp)](https://almcorp.com/blog/youtube-chapter-seo/) - chapter keywords as search queries
- [Learning Revolution YouTube SEO 2026](https://www.learningrevolution.net/youtube-seo/) - description word count + keyword placement
- [Banana Thumbnail 2026](https://blog.bananathumbnail.com/youtube-seo-2026/) - 11% watch-time lift number
- [Descript podcast show notes guide](https://www.descript.com/blog/article/how-to-write-podcast-show-notes-that-hook-new-listeners) - interview show notes format
- `~/.claude/skills/socials/skill.md` - existing ZAO voice + platform specs
- `research/agents/474-bcz101-bot-transcript-rag/` - future auto-chapter pipeline
