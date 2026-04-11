# Doc 314 - Music Metadata, ISRC Codes & AI-Generated Music Distribution (2026)

**Date:** 2026-04-11
**Status:** Complete
**Scope:** Comprehensive guide to music identification codes, metadata best practices, AI disclosure standards, copyright registration, PRO policies, and web3 metadata for AI-assisted music distribution.

---

## Table of Contents

1. [ISRC Codes](#1-isrc-codes)
2. [ISWC Codes](#2-iswc-codes)
3. [UPC/EAN Codes](#3-upcean-codes)
4. [Streaming Discovery Metadata](#4-streaming-discovery-metadata)
5. [DDEX AI Disclosure Standard](#5-ddex-ai-disclosure-standard)
6. [Apple Music Transparency Tags](#6-apple-music-transparency-tags)
7. [DistroKid AI Policy](#7-distrokid-ai-policy)
8. [US Copyright Registration for AI Music](#8-us-copyright-registration-for-ai-music)
9. [Publishing Rights and Ownership](#9-publishing-rights-and-ownership)
10. [PRO Registration (ASCAP/BMI/SESAC)](#10-pro-registration-ascapbmisesac)
11. [Mechanical Royalties for AI Music](#11-mechanical-royalties-for-ai-music)
12. [Metadata Best Practices](#12-metadata-best-practices)
13. [Common Metadata Mistakes](#13-common-metadata-mistakes)
14. [Metadata Management Tools](#14-metadata-management-tools)
15. [Credits and Liner Notes for AI Tracks](#15-credits-and-liner-notes-for-ai-tracks)
16. [Blockchain-Based Music Metadata](#16-blockchain-based-music-metadata)
17. [ZAO Relevance](#17-zao-relevance)

---

## 1. ISRC Codes

**What:** International Standard Recording Code - a unique 12-character alphanumeric identifier for individual sound recordings (tracks). Managed globally by IFPI.

**Format:** `CC-XXX-YY-NNNNN` (Country code - Registrant code - Year - Designation code)

**Why you need them:**
- Required by every major DSP (Spotify, Apple Music, Tidal, Amazon Music, etc.)
- Tracks royalties across platforms globally
- Links a recording to its rights holders
- One ISRC per recording - never reuse across songs
- Different versions (remix, live, remaster) each need their own ISRC

**How to get them:**

| Method | Cost | Best For |
|--------|------|----------|
| Through your distributor (DistroKid, TuneCore, CD Baby) | Free (included) | Most indie artists |
| US ISRC Agency (usisrc.org, operated by RIAA) | $95 one-time registration fee | Labels wanting their own registrant code |
| National ISRC agency in your country | Varies by country | International artists |

**Key rule:** If your distributor assigns ISRCs, use theirs. If you switch distributors, keep the original ISRCs - do NOT let the new distributor assign new ones for the same recordings.

---

## 2. ISWC Codes

**What:** International Standard Musical Work Code - a unique identifier for musical compositions (the underlying work, not the recording). Managed by CISAC.

**Format:** `T-NNNNNNNNN-C` (always starts with T, 9-digit work number, 1-digit check digit)

**Key distinction:** ISRC = the recording. ISWC = the composition. One composition can have multiple recordings (covers, remixes), each with its own ISRC but sharing the same ISWC.

**When you need one:**
- When registering compositions with a PRO (ASCAP, BMI, SESAC)
- For sync licensing deals
- For cross-border royalty collection
- When multiple parties share publishing rights

**How to get one:**
- ISWCs are assigned automatically when you register your work with a PRO
- In the US, ASCAP is the official ISWC issuance agency
- You can request an ISWC from ASCAP even if you're not a member
- Required info: title, all contributors (composers, arrangers, authors), their IPI/CAE numbers, role codes, and work classification code

**IPI/CAE Number:** Each songwriter/composer gets an IPI (Interested Party Information) number when they join a PRO. This is your personal identifier in the global publishing system.

---

## 3. UPC/EAN Codes

**What:** Universal Product Code (12-digit, North America) / European Article Number (13-digit, international). Identifies a release (single, EP, album) rather than individual tracks.

**Why you need one:**
- Required for any release distributed to DSPs
- Links all tracks in a release together
- Used by physical retailers for barcodes
- Needed for chart tracking

**How to get them:**

| Method | Cost | Best For |
|--------|------|----------|
| Through your distributor | Free (auto-assigned) | Most indie artists |
| GS1 (gs1.org) direct purchase | ~$250 initial + $50/year membership | Labels with physical distribution |

**Important warnings:**
- Do NOT buy from third-party UPC resellers - they sell codes that may not be properly registered
- If buying directly, only buy from GS1
- For digital-only releases, let your distributor handle this

---

## 4. Streaming Discovery Metadata

Platforms use these fields to power algorithmic recommendations, playlist placement, and search:

### Core Discovery Fields

| Field | Purpose | Notes |
|-------|---------|-------|
| **Genre** (primary + secondary) | Algorithm categorization, playlist routing | Tag based on sound, not audience. Don't use mood words here. |
| **Subgenre** | Finer algorithmic targeting | More specific = better algorithmic matching |
| **Mood** | Algorithmic playlists (Chill, Focus, Workout, etc.) | Choose dominant mood. "Melancholic," "Upbeat," "Chill" feed directly into editorial playlists. |
| **BPM/Tempo** | Playlist matching (workout, study, etc.) | Accurate BPM matters for tempo-based playlists |
| **Key** | DJ tools, harmonic mixing playlists | Musical key of the track |
| **Energy** | Intensity classification | Low/Medium/High - affects workout and mood playlists |
| **Lyrics language** | Regional discovery, language-specific playlists | Critical for non-English content |
| **Explicit flag** | Content filtering | Incorrect flags = removed from clean playlists or restricted markets |
| **ISRC/UPC** | Cross-platform linking | Ensures consistent identity |
| **Release date** | New Music Friday, Release Radar | Pre-release scheduling matters for editorial consideration |
| **Credits** | Artist linking, cross-discovery | Producer, songwriter, featured artist credits all create linkages |

### Platform-Specific Metadata

- **Spotify:** Canvas (looping video), songwriter credits, Spotify for Artists profile data
- **Apple Music:** Spatial Audio flag, Dolby Atmos flag, lyrics timing, Apple Digital Masters badge
- **YouTube Music:** Video metadata, chapters, descriptions
- **TikTok/Instagram:** Sound page metadata, clip start point

---

## 5. DDEX AI Disclosure Standard

**What:** DDEX (Digital Data Exchange) is the industry standards body for music supply chain data. In September 2025, they published an AI disclosure framework that Spotify, Apple, and others adopted.

**How it works:**
- Labels, distributors, and music partners submit standardized AI disclosure metadata alongside track deliveries
- The disclosure specifies WHERE AI was used in the creation process:
  - AI-generated vocals
  - AI-generated instrumentation
  - AI-generated composition
  - AI-generated lyrics
  - AI in post-production (mixing, mastering)
- The standard supports nuanced, spectrum-based disclosure rather than binary "AI / not AI"

**Why it matters:**
- Spotify adopted DDEX AI disclosure as its official framework (September 2025)
- Apple Music's Transparency Tags align with DDEX fields
- Proactive disclosure is now the safest distribution strategy - platforms reward transparency
- Undisclosed AI content that gets detected by platform systems risks removal

**Current status (April 2026):**
- Voluntary but increasingly expected
- Distributors like DistroKid, TuneCore, and CD Baby have integrated DDEX AI fields into their upload flows
- Deezer uses automated AI detection to verify disclosures
- Industry trend is moving toward mandatory disclosure

---

## 6. Apple Music Transparency Tags

**Launched:** March 4, 2026

**Four tag categories:**
1. **Artwork** - AI-generated album artwork (static and motion graphics)
2. **Track** - AI-generated sound recordings
3. **Composition** - AI-generated music compositions or lyrics
4. **Music Video** - AI-generated visual elements

**Implementation:**
- Tags are submitted by distributors as part of the DDEX delivery to Apple
- Currently described as "optional" - "if omitted, none is assumed"
- Apple's newsletter to industry partners called them a "delivery requirement" - signaling future mandatory enforcement
- No automated detection or verification - relies on distributor self-reporting

**Key implications:**
- Apple places disclosure responsibility on the content supply chain (labels/distributors), not at the platform level
- This contrasts with Deezer's automated AI-detection approach
- Creates infrastructure for mandatory disclosure in the future
- Indie artists should proactively tag AI involvement through their distributor

---

## 7. DistroKid AI Policy

**As of 2026:**
- Upload flow includes an AI disclosure checkbox - must be checked if ANY part of the track used AI (composition, vocals, instrumentation, production)
- The disclosure is passed through to DSPs as metadata
- DistroKid runs automated AI detection on ALL uploads
- If AI characteristics detected but checkbox not checked: track flagged for review
- Confirmed undisclosed AI content: removed, repeat offenders face account suspension
- If you disclose honestly: detection results are used for verification, not rejection

**Metadata requirements for AI tracks:**
- Artist Name: Your name or brand (NOT the AI tool name)
- Songwriter/Composer: List yourself
- Producer: List yourself, optionally note AI tool in parentheses (e.g., "Produced using Suno AI")
- At minimum: 1 performer credit + 1 producer credit
- Do NOT list "Suno," "ChatGPT," or "Udio" as creators

**Other distributors (2026 comparison):**
- **TuneCore:** Similar AI checkbox, no automated detection
- **CD Baby:** AI disclosure required, manual review for flagged content
- **Ditto Music:** AI acceptance varies by DSP requirements
- **LANDR:** Integrated AI creation tools with built-in disclosure

---

## 8. US Copyright Registration for AI Music

### The January 2025 Ruling (Part 2 Report)

The US Copyright Office published its definitive guidance on AI copyrightability:

**Copyrightable (with human authorship):**
- Lyrics you write yourself
- Melodies you compose (hummed, played, notated)
- Substantial modifications to AI output (restructuring, layering, arrangement decisions)
- Works where AI is used as a tool in a larger human creative process
- Vocal performances recorded over AI-generated instrumentals

**NOT copyrightable:**
- Purely prompt-generated music with no further human creative input
- "Prompts alone do not provide sufficient human control to make users of an AI system the authors of the output"
- Text-prompt-only generation enters the public domain immediately

### Registration Process

1. **Document your creative process** - save project files, drafts, prompt iterations, editing history
2. **Register at copyright.gov** - file through the Electronic Copyright Office (eCO) system
3. **Standard registration fee:** $65 (single work, single author, online filing) or $85 (standard application)
4. **Disclosure requirement:** You MUST disclose AI-generated content in your application
5. **Identify human-authored elements** - specify which parts you created vs. AI-generated
6. **Processing time:** 3-8 months typical

### Practical Test

The Copyright Office evaluates whether the human's contributions are "sufficiently creative" and whether the human exercised "meaningful control" over the expressive elements.

**Strong case:** "I wrote all lyrics, composed the chord progression, arranged the structure, and used Suno to generate backing instrumentation that I then edited, mixed, and produced."

**Weak case:** "I typed a prompt into Suno and downloaded what it generated."

---

## 9. Publishing Rights and Ownership

### When Human Writes Lyrics + AI Generates Music

**Your lyrics are your strongest ownership anchor.** Lyrics are classified as literary works under copyright law (US, Canada, UK, EU) and receive independent protection.

**What you can claim:**
- Full copyright on human-written lyrics
- Copyright on any melodies you compose
- Copyright on arrangement decisions, structural choices, mixing/production decisions
- Publishing rights on the human-authored portions

**What you likely cannot claim:**
- Copyright on purely AI-generated instrumental elements (unless substantially modified)
- Composition copyright on AI-generated melodies you didn't modify

### Publishing Splits in Practice

| Scenario | Your Claim | Notes |
|----------|-----------|-------|
| You write lyrics, AI generates all music | Lyricist share (typically 50% of composition) | Register as lyricist with your PRO |
| You write lyrics + compose melody, AI arranges | Full composition (lyrics + melody) | AI arrangement is a tool, like using a session musician |
| You write lyrics + substantially edit AI melody | Full composition (with disclosure) | Document your edits thoroughly |
| AI generates everything, you select and edit minimally | Weak claim, possibly none | High risk of non-registration |

### The "Meaningful Human Authorship" Test

Ask: "Did I shape the words and sounds reflecting my intent?" If yes, you have a claim. The starting point matters less than the human decision-making that shapes the final work.

**Practical steps:**
- Keep detailed records of your creative workflow
- Save AI prompts, drafts, edits, and mixing sessions
- Use version control on your project files
- Write original lyrics whenever possible - this is your strongest ownership lever

---

## 10. PRO Registration (ASCAP/BMI/SESAC)

### Joint Policy (October 2025)

ASCAP, BMI, and SOCAN announced aligned policies for AI-assisted music:

**Accepted:** Musical compositions that combine AI-generated elements with elements of human authorship ("partially AI-generated works")

**NOT accepted:** Compositions entirely created using AI tools with no human creative contribution

### Registration by PRO

| PRO | Membership Fee | AI Policy | ISWC Issuance |
|-----|---------------|-----------|---------------|
| **ASCAP** | Free to join | Accepts partially AI-generated works; human must be a credited writer | Official US ISWC agency |
| **BMI** | Free to join | Same aligned policy as ASCAP | Through ASCAP |
| **SESAC** | Invitation-only | Follows same framework but selective membership | Through ASCAP |
| **AIMPRO** (new) | TBD | First PRO specifically for AI music; accepts fully AI-generated works | Own system |

### How to Register an AI-Assisted Work

1. Join a PRO (ASCAP or BMI for most US-based creators)
2. Register the work through the PRO's online portal
3. List yourself as songwriter/composer
4. Disclose AI involvement per the PRO's policy
5. Provide IPI numbers for all human contributors
6. The PRO assigns an ISWC automatically

### Important Limitation

You can only be affiliated with one PRO at a time. If you join AIMPRO for fully AI-generated works, you cannot simultaneously collect from ASCAP or BMI for your human-authored works.

---

## 11. Mechanical Royalties for AI Music

### How Mechanical Royalties Work

Mechanical royalties are generated when a composition is reproduced - through streams, downloads, or physical copies. In the US, the Mechanical Licensing Collective (MLC) administers blanket mechanical licenses for streaming.

### AI Music and Mechanicals

**If your composition qualifies for copyright (has meaningful human authorship):**
- You earn mechanical royalties from streams/downloads like any other composition
- Register with the MLC (themlc.com) to collect
- Your distributor handles the mechanical license for digital distribution

**If your composition is fully AI-generated (no copyright):**
- No composition copyright = no mechanical royalty claim
- The sound recording may still generate master-side revenue (from the distributor)
- But the composition side has no claimant

### Current Challenges (2026)

- No clear framework for "influence-based" royalties (compensating training data artists)
- Platforms like Deezer deprioritize fully AI-generated tracks in royalty pools
- YouTube blocks monetization for "factory-made" content lacking human input
- The industry is moving toward requiring traceable metadata and clear licensing terms

### Revenue Streams for AI-Assisted Music

| Revenue Type | Who Collects | AI Music Eligible? |
|-------------|-------------|-------------------|
| **Master royalties** (streaming) | Distributor | Yes, if distributed |
| **Mechanical royalties** (composition) | MLC / publisher | Only if copyrightable |
| **Performance royalties** (radio, live, public) | PRO (ASCAP/BMI) | Only if registered with PRO |
| **Sync licensing** (TV, film, ads) | Publisher or directly | Stronger with human-written lyrics |
| **Neighboring rights** (international) | SoundExchange | Yes, for sound recordings |

---

## 12. Metadata Best Practices

### The Master Checklist

**Before upload:**
- [ ] Consistent artist name spelling across ALL releases and platforms
- [ ] Correct ISRC for each track (or let distributor assign)
- [ ] UPC for the release (or let distributor assign)
- [ ] All contributor credits: songwriters, producers, featured artists, engineers
- [ ] Genre tags based on SOUND, not audience or aspirational placement
- [ ] Mood tags matching dominant emotional character
- [ ] Accurate BPM
- [ ] Correct musical key
- [ ] Lyrics uploaded (with timing if supported)
- [ ] Language tag set correctly
- [ ] Explicit content flag accurate
- [ ] AI disclosure completed honestly
- [ ] Cover art matches metadata (text on art = metadata text)
- [ ] Release date set with enough lead time for editorial consideration (4+ weeks ideal)

### Genre Tagging Strategy

- Primary genre: the dominant sound
- Secondary genre: the closest adjacent sound
- Do NOT tag based on what playlists you want to be on
- Do NOT use mood words (chill, dark, uplifting) in genre fields
- Algorithms detect mismatches - listeners who don't find what they expected skip, damaging your engagement metrics

### Maximizing Discovery

- **Lyrics:** Upload complete, accurate, timed lyrics. Spotify, Apple Music, and Amazon all use lyrics for search.
- **Credits:** Every credited contributor creates algorithmic linkage to their fan base
- **Consistency:** Same artist name, same formatting, same capitalization everywhere
- **Pre-save campaigns:** Drive early engagement signals that boost algorithmic promotion
- **Canvas (Spotify):** Looping video increases stream-through rate by ~5%

---

## 13. Common Metadata Mistakes

### The 9 Killer Mistakes

1. **Misspelling artist or track names** - Fragments your catalog across platforms. "John Smith" and "John Smth" become two different artists.

2. **Wrong or missing ISRC codes** - Reusing codes confuses royalty systems, causes underpayment or misattribution.

3. **Incorrect artist credits** - Missing producers, featured artists, or songwriters prevents proper linking and royalty distribution.

4. **Genre misclassification** - Wrong genre = wrong algorithmic audience = high skip rate = deprioritized by algorithms.

5. **Release title formatting issues** - Don't manually add "EP," track numbers, or version info to titles. Let metadata fields handle formatting.

6. **Incorrect release dates/territories** - Wrong timing derails promo campaigns. Missing territories reduces first-week metrics.

7. **Cover art inconsistencies** - Text on artwork must match metadata exactly. Poor quality or non-compliant images risk DSP rejection.

8. **Special characters and emojis in titles** - Break search functionality. A fan typing "Love Song" won't find your track if the title has decorative unicode.

9. **Missing language/transliteration** - Non-Latin titles need transliteration for global discoverability.

### Prevention

- Maintain a master spreadsheet for all releases
- Copy-paste artist names instead of retyping
- Review everything before submission
- Fix errors immediately when discovered
- Communicate credits with collaborators before release

---

## 14. Metadata Management Tools

### Analytics and Lookup Tools

| Tool | What It Does | Cost |
|------|-------------|------|
| **Musicstax** | Key, tempo, similarity recommendations, Spotify popularity analytics. Added Tidal in 2026. | Free tier + paid plans |
| **Tunebat** | BPM, key, loudness, energy, danceability lookup for any track. Metadata API available. | Free lookup, API is paid |
| **Songstats** | Performance analytics across 20+ platforms. 2026: Radiostats AI tracks 50,000+ radio stations. Notification speed cut to minutes. | Paid plans starting ~$5/mo |
| **Soundcharts** | Professional music data analytics, 47 music data APIs. Label/publisher grade. | Enterprise pricing |
| **Chartmetric** | Chart tracking, playlist monitoring, audience analytics | Enterprise pricing |

### AI-Powered Tagging Tools

| Tool | What It Does |
|------|-------------|
| **Bridge.audio** | AI auto-tagging for genre, mood, vocals, instrumentation. Webhook delivery. |
| **Cyanite** | AI music analysis - mood, genre, BPM, key, instrumentation detection |
| **Muso.AI** | Verified music credits and analytics platform |

### ISRC/UPC Lookup Tools

| Tool | What It Does |
|------|-------------|
| **ISRC Finder** (tools4music.com) | Free ISRC lookup for any song |
| **Musicfetch UPC Finder** | Free UPC lookup for releases |
| **ISRC.com** | Official ISRC FAQ and resources |

---

## 15. Credits and Liner Notes for AI Tracks

### 2026 Best Practices

**Credit line format:**
```
Composed by [Your Name]
Produced by [Your Name] (using [AI Tool Name])
Lyrics by [Your Name]
```

**Example:**
```
Composed by Zaal Panthaki
Produced by Zaal Panthaki (using Suno AI v4)
Lyrics by Zaal Panthaki
Mixed and mastered by [Your Name / Engineer]
```

### What to Include in Metadata

- **Songwriter/Composer:** Your name (human creator)
- **Producer:** Your name, with optional AI tool note in parentheses
- **Performer:** Your name or artist project name
- **AI Tool Credit:** In liner notes or description field, NOT as a creator
- **AI Disclosure:** Via DDEX fields / distributor checkbox

### What NOT to Do

- Do NOT list AI tools as songwriters, composers, or performers
- Do NOT list AI tool names as the artist
- Do NOT omit AI disclosure to avoid detection
- Do NOT claim sole human authorship if the track is substantially AI-generated

### Embedded Metadata

When exporting your final track, embed:
- AI tool name and version
- Dataset reference (if known/applicable)
- License terms of the AI tool used
- Your authorship attribution

---

## 16. Blockchain-Based Music Metadata

### The Promise

When metadata is stored on-chain:
- It becomes permanent and tamper-proof
- No label can erase credits or rewrite history
- Rights splits are transparent and automatically enforced
- Smart contracts can automate royalty distribution
- Provenance chain is verifiable

### Current Solutions (2026)

| Platform/Protocol | What It Does |
|-------------------|-------------|
| **Bridg3** | Chain-agnostic tool that receives DDEX-compliant metadata from traditional industry and redelivers to Web3 platforms |
| **OnChain Music** | Web3 music licensing, sync, and blockchain distribution |
| **Sound.xyz** | Music NFTs with on-chain metadata and splits |
| **Catalog** | On-chain music publishing with rich metadata |
| **Spinamp** | Aggregates on-chain music across protocols |

### DDEX + On-Chain Integration

The emerging pattern:
1. Traditional DDEX metadata delivered to DSPs (Spotify, Apple Music, etc.)
2. Same metadata (or expanded version) written on-chain via smart contracts
3. On-chain metadata includes rights splits, licensing terms, AI disclosure
4. Smart contracts automatically distribute royalties based on on-chain splits
5. Web3 platforms read on-chain metadata for discovery and attribution

### Relevance to ZAO

ZAO OS already has:
- Respect-weighted curation (could weight on-chain metadata)
- ZOUNZ NFT infrastructure on Base
- Cross-platform publishing pipeline
- Music player with multi-platform support

Potential integration: on-chain music metadata for ZAO artist releases, with Respect scores influencing curation weight and AI disclosure baked into the on-chain record.

---

## 17. ZAO Relevance

### For ZAO Artists Releasing AI-Assisted Music

**Minimum viable metadata checklist:**
1. Get ISRC codes (through your distributor)
2. Get UPC for each release (through your distributor)
3. Register compositions with ASCAP or BMI
4. Disclose AI involvement honestly via distributor checkbox + DDEX fields
5. Write your own lyrics for strongest ownership position
6. Document your creative process (prompts, edits, mixing decisions)
7. Register copyright at copyright.gov for works with meaningful human authorship
8. Use consistent artist name and metadata across all platforms

**For the ZAO OS platform:**
- Music metadata fields in the player could display AI disclosure tags
- Respect-weighted curation could factor in AI transparency
- On-chain metadata via ZOUNZ could create permanent, verifiable credits
- Cross-platform publishing could include AI disclosure in Farcaster/Bluesky posts about new releases

---

## Sources

- [Unchained Music - ISRC Guide](https://www.unchainedmusic.io/blog-posts/the-comprehensive-guide-to-isrc-codes-what-they-are-how-to-get-them)
- [TuneCore - ISRC Codes](https://www.tunecore.com/guides/all-you-need-to-know-about-isrc-codes)
- [FWD Music - ISRC vs UPC 2026](https://fwdmusic.com/en/news/isrc-vs-upc-codes-music-distribution)
- [ISWC.org - Get an ISWC](https://www.iswc.org/get-iswc)
- [ASCAP - ISWC FAQ](https://www.ascap.com/help/registering-your-music/iswc-number-work-codes-faq)
- [Songtrust - ISRC vs ISWC](https://blog.songtrust.com/isrc-iswc-song-registration-tips)
- [Orphiq - UPC/EAN Codes](https://orphiq.com/resources/upc-ean-codes-music)
- [Spotify - AI Protections Announcement](https://newsroom.spotify.com/2025-09-25/spotify-strengthens-ai-protections/)
- [TechCrunch - Spotify AI Policy](https://techcrunch.com/2025/09/25/spotify-updates-ai-policy-to-label-tracks-cut-down-on-spam/)
- [9to5Mac - Apple Music Transparency Tags](https://9to5mac.com/2026/03/04/apple-music-introduces-metadata-tags-to-disclose-ai-generated-content/)
- [TechCrunch - Apple Music AI Tags](https://techcrunch.com/2026/03/04/apple-music-to-add-transparency-tags-to-distinguish-ai-music-says-report/)
- [MusicTech - Apple Transparency Tags](https://musictech.com/news/industry/apple-music-transparency-tags-ai/)
- [Music Business Worldwide - Apple AI Tags](https://www.musicbusinessworldwide.com/apple-music-launches-ai-transparency-tags-but-only-if-labels-and-distributors-choose-to-declare-them/)
- [DistroKid Help - AI Tools](https://support.distrokid.com/hc/en-us/articles/41182362733715-Can-I-Upload-Music-Made-With-AI-Tools-to-DistroKid)
- [Undetectr - DistroKid AI Policy 2026](https://undetectr.com/blog/distrokid-ai-policy-2026)
- [Jam.com - AI Music Copyright 2026](https://jam.com/resources/ai-music-copyright-2026)
- [US Copyright Office - AI and Copyright](https://www.copyright.gov/ai/)
- [Rimon Law - Copyright Office AI Guidance](https://www.rimonlaw.com/how-copyright-office-guidance-applies-to-music-that-includes-ai-generated-material/)
- [ASCAP/BMI - AI Registration Policy Alignment](https://www.ascap.com/press/2025/10/10-28-ai-registration-policies)
- [BMI - AI Registration Policies](https://www.bmi.com/news/entry/ascap-bmi-and-socan-announce-alignment-on-ai-registration-policies)
- [Jack Righteous - Lyrics and AI Ownership](https://jackrighteous.com/en-us/blogs/ai-writing/lyrics-ai-music-ownership-what-creators-can-claim-in-2026)
- [Soundverse - Credit AI Music Properly](https://www.soundverse.ai/blog/article/how-to-credit-ai-music-properly-1416)
- [iMusician - 9 Common Metadata Mistakes](https://imusician.pro/en/resources/blog/the-most-common-metadata-mistakes)
- [Orphiq - Metadata Best Practices](https://orphiq.com/resources/music-metadata-best-practices)
- [Revelator - Genre Metadata Guide](https://revelator.com/blog/genre-metadata-best-practices)
- [WIPO - Royalties in the Age of AI](https://www.wipo.int/en/web/wipo-magazine/articles/royalties-in-the-age-of-ai-paying-artists-for-ai-generated-songs-73739)
- [Making A Scene - Music Metadata on Blockchain](https://www.makingascene.org/music-metadata-on-the-blockchain-fixing-a-broken-system/)
- [CoinTelegraph - Web3 Music Metadata](https://cointelegraph.com/news/web3-can-help-artists-and-companies-manage-music-metadata-b2b-music-exec)
- [OnChain Music](https://onchainmusic.com/)
