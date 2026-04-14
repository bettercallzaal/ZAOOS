# 352 — COC Concertz Full Context: Show History, Artist Profiles, and Content Automation

> **Status:** Research complete
> **Date:** April 13, 2026
> **Goal:** Consolidate all COC Concertz context (shows, artists, links, community) into one reference doc for YouTube descriptions, content generation, and the knowledge graph

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Artist social links | POPULATE all artist socialLinks in Firestore NOW — currently mostly empty. Use the resolve-mentions API + manual research to fill twitter, farcaster, youtube, website, bluesky, lens for each artist |
| YouTube description automation | ADD a "YouTube Description" template to the existing newsletter builder at `/newsletter` — the infrastructure (AI generation, @mention resolution, copy buttons) already exists |
| Transcript upload | ADD a transcript upload field to the YouTube Description template — paste or upload .docx/.txt, AI generates description + timestamps + tags |
| Content hub | BUILD `/content` page that unifies newsletter builder, YouTube descriptions, and social posts into one promoter dashboard (v2) |
| Artist profile enrichment | USE the COC Concertz #4 transcripts as the primary source for artist bios — the transcript contains richer, more authentic context than any web search |

## COC Concertz Show History

| Show | Date | Artists | Venue | Status | YouTube |
|------|------|---------|-------|--------|---------|
| #1 | March 29, 2025 | AttaBotty, Clejan | Spatial.io metaverse | Completed | Playlist: PLAJfhSekeHMLPEd-PjFnuU_UZmXFR5kvA |
| #2 | October 11, 2025 | Tom Fellenz, Stilo World, AttaBotty | SaltyVerse Auditorium | Completed | Same playlist |
| #3 | March 7, 2026 | (not in codebase) | StiloWorld (Spatial.io) | Completed | — |
| #4 | ~April 2026 | Joseph Goats, Tom Fellenz, Stilo World | StiloWorld (Spatial.io) | Completed | Being uploaded now |
| #5 | TBD | TBD | TBD | Upcoming | — |

**Source:** `src/components/home/PastShows.tsx`, `src/components/home/VideoHighlights.tsx`

## Series Overview

**What:** COC Concertz is a recurring free live music event produced by the Community of Communities (COC), a Web3 initiative. Shows feature live performances, artist conversations, and experimental Web3 activations (proof-of-meet collectibles, cross-community collaboration, fundraising via Giveth).

**Where:** Simultaneously across Spatial.io metaverse venue (StiloWorld design by CyberNerdBaby), X Space, Twitch (bettercallzaal), TikTok, and YouTube.

**Who runs it:** BetterCallZaal (Zaal Panthaki), founder of The ZAO and COC Concertz.

**Tagline:** "Virtual Stages. Real Music."

**Site:** https://cocconcertz.com

**Farcaster channel:** /cocconcertz

**YouTube playlist:** PLAJfhSekeHMLPEd-PjFnuU_UZmXFR5kvA

## Artist Profiles (from transcripts + codebase)

### Joseph Goats

| Field | Value |
|-------|-------|
| Stage name | Joseph Goats (formerly Jose) |
| Real name | Jose Cabrera (rebranded to Joseph Goats) |
| Location | Caracas, Venezuela |
| Genre | Spanish-language singer-songwriter, acoustic, social impact music |
| Bio | Venezuelan singer-songwriter using music as a vehicle for social coordination and indigenous community support. Active in Web3 since the early metaverse concert wave. Works with the Waha indigenous community in the Venezuelan Amazon. Performs original songs in Spanish with themes of ecology, indigenous wisdom, and community building. |
| COC Shows | #4 (3-song live set from Caracas) |
| Key context | Rebranded from Jose to Joseph Goats for English-language audience. Performs original songs: No Winter Slam, Kama, Compass (Brujula). Active fundraiser for Waha community via Giveth. Connected to Live Earth April 22 activation. Philosophy: "finding your musical note" as both mathematical and personal. |
| Social links | **NEEDS RESEARCH** — Farcaster handle, X handle, Giveth page, YouTube all need to be confirmed and added to Firestore |
| Giveth | Active fundraiser for Waha community (sought $300 for solar panel + fridge) |
| Firestore slug | `joseph-goats` |

### Tom Fellenz

| Field | Value |
|-------|-------|
| Stage name | Fellenz (performs as Tom Fellenz) |
| Location | Not specified (US-based, mentioned vineyard performances) |
| Genre | Acoustic guitar, original compositions, contemplative/spiritual |
| Bio | Guitarist and composer who returned to live acoustic playing through metaverse stages. Performed at Metaverse Music Festival in Decentraland (March 2022). Technical failure at EasyCorner (December 2021) catalyzed his return to guitar. Works at OV Systems. Involved with Zoll and Company. |
| COC Shows | #2 (live set in SaltyVerse Auditorium), #4 (5-song acoustic set) |
| Key context | Songs: Setting the Scene, From Above (20 years in the making), Another Page Turned, In Quieter Times, A Tale of Fall. Connected to Meteorites, Token Smart, Third Planet communities. Building toward vineyard and live venue performances. Plays guitar "as conversation, not performance." |
| Social links | **NEEDS RESEARCH** — Instagram handle confirmed active, Farcaster, X need confirmation |
| Firestore slug | `tom-fellenz` |

### Stilo World (Stilo)

| Field | Value |
|-------|-------|
| Stage name | Stilo World / Stilo |
| Location | Los Angeles, CA (Hermosa Beach area) |
| Genre | Caribbean-influenced hip-hop and R&B |
| Bio | Caribbean-influenced hip-hop and R&B artist. Released debut album "Ambition." Host of StiloWorld and 150+ consecutive weekly VR concerts. Approaches artist readiness as core practice — "preparation meeting opportunity." Active vibe coder building tools for his own music workflow. |
| COC Shows | #2 (WaveWarZ Battle), #4 (full Ambition album live performance) |
| Key context | Album "Ambition" tracks: Together, Hero, I Want You to Stay, Paradise, Mama, Bonita, Save Me, Nothing to Lose. Announced March 19 show at Tennessee's Tavern, Hermosa Beach. Live collaborators: Mimi, Steve, Davey. Designed the StiloWorld Spatial.io venue used for COC Concertz. |
| Social links | website: stilo.world (may be stilos.world), all streaming platforms |
| Firestore slug | `stilo` |

### AttaBotty

| Field | Value |
|-------|-------|
| Stage name | AttaBotty |
| Genre | (from video highlights — performed at #1 and #2) |
| COC Shows | #1 (Intro + Flyin), #2 (Closing Set) |
| Social links | **NEEDS RESEARCH** |

### Clejan

| Field | Value |
|-------|-------|
| Stage name | Clejan |
| COC Shows | #1 (Intro) |
| Social links | **NEEDS RESEARCH** |

## Comparison: Content Automation Approaches

| Approach | Effort | Quality | Speed | Best For |
|----------|--------|---------|-------|----------|
| Manual (current) | High — write each description by hand | High — human voice, accurate | Slow — hours per show | One-off shows |
| Newsletter builder + YouTube template | Low — add 1 template to existing system | High — AI + human review | Fast — 5 min per video | Regular shows (USE THIS) |
| Full automation (transcript → upload → publish) | Medium — build upload pipeline | Medium — needs human timestamp correction | Fastest — near-zero manual work | Scale to 10+ shows |
| External tool (Descript, VidIQ) | Low setup | Medium — generic templates | Fast | If you don't want to build custom |

## YouTube Description Automation Plan

### Phase 1: Add YouTube Template to Newsletter Builder (NOW)

Add a new template "YouTube Description" to `src/components/newsletter/TemplateSelector.tsx`:

```typescript
{
  id: "youtube-description",
  name: "YouTube Description",
  description: "Generate SEO-optimized YouTube description with timestamps, tags, and artist links from show transcripts",
  icon: "▶",
}
```

New fields in `src/components/newsletter/TemplateInputs.tsx`:
- Show selector (existing)
- Artist selector (existing)
- **Transcript paste/upload field** (NEW — textarea or file upload for .docx/.txt)
- **Video duration** (NEW — input for total runtime, helps AI estimate timestamps)
- **Segment type** (NEW — Full Show / Artist Set / Intro / Outro)

AI generates:
- Hook line (first 100 chars, SEO-optimized)
- 3-4 paragraph description
- Timestamps starting at 0:00
- Comma-separated tags
- All in one copy-pasteable block

### Phase 2: Transcript Upload on Website (NEXT)

Add `/content/youtube` page where promoters can:
1. Upload transcript files (.docx, .txt)
2. Select show + artists from Firestore
3. AI generates all 4 descriptions (Full Show + per-artist)
4. Copy buttons per description (same pattern as newsletter social tabs)
5. Optional: save to archive (Arweave permanent storage)

### Phase 3: Direct YouTube Upload (FUTURE)

Use YouTube Data API v3 to:
- Upload video directly from the website
- Auto-fill title, description, tags, chapters
- Set thumbnail from Cloudinary
- Requires OAuth consent + YouTube API key

## COC Concertz Integration Points

| File | What to do |
|------|------------|
| `concertz.config.ts` | Add `youtube` config with playlist ID, channel URL |
| `src/components/newsletter/TemplateSelector.tsx` | Add "YouTube Description" template |
| `src/components/newsletter/TemplateInputs.tsx` | Add transcript field, video duration, segment type |
| `src/app/api/newsletter/generate/route.ts` | Add youtube-description template to TEMPLATES |
| `src/lib/types.ts` | Add Artist.socialLinks fields: bluesky, lens, giveth |
| Firestore `artists` collection | POPULATE socialLinks for all artists — currently mostly empty |

## Missing Data (Action Items)

### Artist Social Links to Find and Add

| Artist | Twitter/X | Farcaster | YouTube | Bluesky | Lens | Website | Other |
|--------|----------|-----------|---------|---------|------|---------|-------|
| Joseph Goats | ? | ? | ? | ? | ? | ? | Giveth profile |
| Tom Fellenz | ? | ? | ? | ? | ? | ? | Instagram confirmed |
| Stilo World | ? | ? | ? | ? | ? | stilo.world / stilos.world | All streaming platforms |
| AttaBotty | ? | ? | ? | ? | ? | ? | — |
| Clejan | ? | ? | ? | ? | ? | ? | — |

**Action:** Ask the user (Zaal) for these handles directly — they know the artists personally and the handles aren't findable via web search.

## Sources

- `concertz.config.ts` — site configuration, venue URLs, social links
- `src/components/home/PastShows.tsx` — show history (shows #1-3 hardcoded)
- `src/components/home/VideoHighlights.tsx` — YouTube video IDs for shows #1-2
- `src/components/admin/SeedArtists.tsx` — artist seed data with slugs and bios
- COC Concertz #4 transcripts (5 segments provided by user) — primary source for artist profiles
- [COC Concertz website](https://cocconcertz.com)
- [YouTube playlist](https://www.youtube.com/playlist?list=PLAJfhSekeHMLPEd-PjFnuU_UZmXFR5kvA)
