# 477 - BCZ YapZ YouTube Description + Timestamp Template

> **Status:** Design complete, Phase 1 templates shipped
> **Date:** 2026-04-22
> **Goal:** Standardize BCZ YapZ YouTube descriptions for archive-first RAG ingestion, long-tail SEO discovery, and guest amplification. Ship a fill-in template today, follow with a `/bcz-yapz-description` skill that auto-renders descriptions from transcript files.

---

## Key Decisions / Recommendations

| Decision | Recommendation |
|----------|----------------|
| Reader priority | RANK as B (BCZ 101 bot / RAG) > A (SEO discovery) > C (guest amplification) > D (casual viewer). Template optimizes for structured machine-parseable entities first, long-tail keywords second, guest credit third. |
| Structure style | USE hybrid - prose + chapters + visible "Mentioned in this episode" block + tags (hybrid C). Description is self-contained as a RAG record without needing the repo. |
| Chapter depth | USE 10-15 chapters per ~27-30 min episode. Floor 8, ceiling 18. One per major topic shift, 60s minimum gap. |
| Link policy | INCLUDE guest links + every named project/org link + host/series block (policy C). Maximum collab juice per description. |
| Voice | USE Zaal first-person. "I sat down with {Guest} to talk ..." Brand consistency for RAG style-matching later. |
| Generation workflow | SHIP template first (Phase 1), build `/bcz-yapz-description` skill next (Phase 2). Backlog undated transcripts without blocking. |
| Zone ordering | USE story-first order: Hook -> Description -> Chapters -> Mentioned -> Host/Series -> Tags. |
| Char budget | TARGET 2,500-3,000 chars in body (YouTube max 5,000). Tags 500 chars max combined, lives in YT tags field not description. |
| Farcaster handle for Zaal | USE `@zaal` (NOT `@bettercallzaal`). X + YouTube stay `@bettercallzaal`. |
| Farcaster channel for ZAO | USE `/zao` at https://farcaster.xyz/~/channel/zao (confirmed 2026-04-22). |

## Reader Priority Stack

| Rank | Reader | What they need from description |
|------|--------|---------------------------------|
| 1 | BCZ 101 bot + future RAG agents | Structured entities (people, projects, orgs), summary, topic keywords, links. Description alone = retrieval record. |
| 2 | YouTube / Google search | First 100 chars keyword-dense, chapters with content labels (not "Part 1"), long-tail terms in prose. |
| 3 | Guest amplification | Prominent guest-links block at top-of-Zone-5 so the guest sees their credit + can reshare. |
| 4 | Casual viewer (deprioritized) | Hook + story prose handle this as a side-effect. Not the primary optimization target. |

## Zone Structure (story-first order)

```
ZONE 1 - HOOK (first 100 chars, visible in YouTube search + mobile preview)
BCZ YapZ w/ {Guest}: {one-line pitch}. {keyword_1}, {keyword_2}.

ZONE 2 - DESCRIPTION (Zaal first-person, 3 paragraphs, 800-1100 chars total)
P1: "I sat down with {Guest} ({role @ org}) to talk {core_topic}." Context on who they are + why this convo.
P2: What we actually covered - 3 to 5 concrete beats from the ep, grounded, named projects/people, no hype.
P3: Why it matters for ZAO, builders, or musicians + the through-line.

ZONE 3 - CHAPTERS (10-15, format: "mm:ss - Title", first MUST be 0:00)
0:00 - Welcome + who is {Guest}
{mm:ss} - {topic shift 1}
...
{mm:ss} - Outro + where to find {Guest}

ZONE 4 - MENTIONED IN THIS EPISODE (bot-parseable block)
People: {name (@handle)}, {name (@handle)}
Projects: {Project} - {url}, {Project} - {url}
Orgs: {Org} - {url}, {Org} - {url}

ZONE 5 - GUEST + HOST/SERIES BLOCK
Follow {Guest}:
- Farcaster: @{handle}
- X: @{handle}
- {project}: {url}

BCZ YapZ
Playlist: {playlist_url}
Farcaster: @zaal
X: @bettercallzaal
YouTube: @bettercallzaal

THE ZAO
Site: https://thezao.com
Farcaster channel: /zao (https://farcaster.xyz/~/channel/zao)

ZONE 6 - TAGS (NOT in description body - lives in YouTube tags field)
{guest}, {guest_alias}, {guest_org}, BCZ YapZ, BetterCallZaal, {topics}, {keywords}, The ZAO, Farcaster, web3, web3 music
```

## Chapter Extraction Rules

Transcripts in `content/transcripts/bcz-yapz/*.md` carry inline `[HH:MM:SS]` markers every few seconds. Rules for reducing that stream to 10-15 YouTube chapters:

| Rule | Detail |
|------|--------|
| Target count | 10-15 chapters per ~27-30 min episode |
| Floor / ceiling | 8 min / 18 max |
| Minimum gap | 60 seconds between chapters (YT requires >=10s, but <60s reads cluttered and hurts RAG anchoring) |
| First chapter | MUST be `0:00`. Title `Welcome + who is {Guest}` or similar intro |
| Last chapter | Outro / CTAs, usually last 1-2 min |
| Title length | Under 50 chars (YT display cap on some devices) |
| Title style | Content-specific. Use actual project, org, or topic names. NEVER "Part 1", "Topic 2", "Discussion" |
| Timestamp rounding | Round DOWN to preceding 5-second mark. `[00:12:47]` -> `12:45` |
| Format | `mm:ss - Title` (single space, single dash, single space). One timestamp per line. No blank lines between chapters. |

**Detection heuristic (priority order):**
1. New named project / org / person enters the conversation.
2. Zaal transition phrase ("let's talk about", "tell me about", "switching gears", "one last thing").
3. Guest starts a new story arc (origin, pivot, what-we-built, what's-next).
4. Explicit question from Zaal that changes the subject.

**Deep anchors stay in the transcript file, not the description.** The per-paragraph `[HH:MM:SS]` markers give BCZ 101 bot fine-grained retrieval; YouTube chapters serve human navigation only.

**Worked example (Dish ep, `2026-04-22-dish-clanker.md`, 29 min):**

```
0:00 - Welcome + who is Dish
1:10 - GameStop NFT era, original crypto on-ramp
3:45 - Capsule Social, Blogchain, Paris detour
5:55 - From AI home-repair bot to Clanker
...
```

## Zaal + Brand Handles Reference

| Platform | Handle | Link |
|----------|--------|------|
| Farcaster (Zaal) | `@zaal` | https://farcaster.xyz/zaal |
| X / Twitter (Zaal) | `@bettercallzaal` | https://x.com/bettercallzaal |
| YouTube (Zaal) | `@bettercallzaal` | https://youtube.com/@bettercallzaal |
| Farcaster channel (ZAO) | `/zao` | https://farcaster.xyz/~/channel/zao |
| Web (ZAO) | https://thezao.com | - |

## Comparison: Template Approaches Considered

| Approach | Zone order | Pros | Cons | Picked? |
|----------|-----------|------|------|---------|
| Story-first | Hook -> Desc -> Chapters -> Mentioned -> Host -> Tags | Reads like a host note, Zaal voice wins first impression | Chapters sit below ~150 char mobile fold | YES |
| SEO-first | Hook -> Chapters -> Desc -> Mentioned -> Host -> Tags | Chapters above fold, max click-to-moment | Feels like a dumped index, not editorial | no |
| Mobile-aware hybrid | Hook + 1-line -> Chapters -> Desc -> Mentioned -> Host -> Tags | Chapters above fold + story below | More complex, splits the Zaal voice | no |

## Comparison: Chapter Depth Options Considered

| Depth | Count for 27-30 min ep | Pros | Cons | Picked? |
|-------|------------------------|------|------|---------|
| Light | 5-7 | Cleanest look | Weak RAG anchors | no |
| Medium | 10-15 | Strong SEO + readable + decent RAG | Adds ~15 lines to description | YES |
| Heavy | 20-30 | Max RAG anchors | Description gets long, cluttered | no |
| Two-layer | 8-10 main + 20+ deep in sidecar | Both audiences served | Extra file per ep, overkill given transcript markers already exist | no |

## Phase 1 - Templates Shipped

Files written in this pass:

| File | Purpose |
|------|---------|
| `content/templates/bcz-yapz-youtube-description.md` | Fill-in template with `{{placeholder}}` notation |
| `content/templates/bcz-yapz-youtube-tags.txt` | Tags template (500 char budget, goes in YouTube tags field) |

Fill the templates manually per episode for now. Phase 2 automates this.

## Phase 2 - `/bcz-yapz-description` Skill Spec

**Location:** `~/.claude/skills/bcz-yapz-description/skill.md`

**Invocation:** `/bcz-yapz-description 2026-04-22-dish-clanker`

**Steps:**
1. Read `content/transcripts/bcz-yapz/{arg}.md`. Parse frontmatter + body.
2. Pull `guest`, `guest_alias`, `guest_org`, `guest_links`, `topics`, `keywords`, `entities`, `summary`, `action_items` directly from frontmatter (no AI needed).
3. Scan body for `[HH:MM:SS]` markers. Apply chapter-extraction heuristic above. AI picks 10-15 boundaries + names them using named-project / topic-shift signals from 200 chars of surrounding context.
4. AI writes the 3 Zaal-voice paragraphs, grounded to transcript content only. Uses `summary` as P1 seed.
5. Resolve project/org URLs via `content/templates/bcz-yapz-link-map.json` (new file - ZAO-known entity URLs; flags unknown ones in a `gaps.md` sidecar).
6. Render template. Validate: char budget, 10-15 chapters, first chapter 0:00, tags <=500 chars, handle correctness.
7. Output: description + tags written to `content/youtube-descriptions/bcz-yapz/{date}-{guest-slug}.md` + copied to clipboard via `/clipboard` skill.
8. Queue a note for BCZ 101 bot ingestion (hook to be defined in doc 474).

## Phase 3 - Backlog Plan (13 undated transcripts)

Do NOT block shipping on dating. Order of attack:

1. **Dated episodes first (Phase 1 template):**
   - 2026-04-14 - Nikoline / Hubs Network
   - 2026-04-22 - Dish (Jack Dishman) / Clanker
   - 2026-04-22 - Hannah / Farm Drop

2. **Undated 13:** Ali, Flix Fun, Jordan, Rockopera, Roaring Sensai, Saltorius, Snax, Sven, Yoni, Deepa, Rich, Diviflyy, Yerb. Ship description using `undated-{slug}.md` as filename seed. Leave `episode:` and `published:` fields as `TBD`. When YouTube publish date lands, rename transcript + re-stamp description header.

3. **Link-map gaps:** Unknown project URLs flagged in `content/templates/bcz-yapz-link-map.gaps.md`. Fill when convenient.

## Out of Scope (Explicit Non-Goals)

- YouTube Data API v3 direct upload (covered by doc 353 Phase 2 for COC).
- Auto-generated Shorts / Reels / TikTok clips (use Opus Clip separately per doc 353).
- Cross-post to X / Farcaster / Bluesky (use `/socials` skill).
- Thumbnail generation.
- Video title formatting (separate concern - may revisit).

## Success Criteria

- Any future BCZ YapZ episode goes from "transcript in repo" to "description + tags on clipboard" in one command (Phase 2).
- Description alone is enough for BCZ 101 bot to retrieve entities + topics for that episode without needing the repo (Zone 4 guarantee).
- Every description passes validators: char budget, chapter count, first chapter 0:00, tags <=500, handle correctness, no emoji, no em dash.
- Zaal first-person voice stays consistent across all episodes.

## Numbers Worth Remembering

| Metric | Value | Source |
|--------|-------|--------|
| YouTube description hard max | 5,000 chars | YouTube 2026 |
| Target description body | 2,500-3,000 chars | Doc 351 |
| First 100 chars visible in search | yes | YouTube 2026 |
| Mobile description collapse | ~150 chars before "Show more" | YouTube 2026 |
| Tags total max | 500 chars combined | YouTube 2026 |
| Chapter title display cap | 50 chars | YouTube 2026 |
| Minimum chapters for markers to activate | 3 | YouTube Help |
| Minimum video length for chapters | 10 min | YouTube Help |
| Chapter markers search correlation | 43.7% of searches on chaptered videos | BananaThumbnail 2026 |
| Indexing speed with chapters | 2x vs without | BananaThumbnail 2026 |
| BCZ YapZ episodes in inventory | 16 (3 dated, 13 undated) as of 2026-04-22 | `content/README.md` |

## ZAO OS Integration

| File | Purpose |
|------|---------|
| `content/transcripts/bcz-yapz/*.md` | Source transcripts with rich frontmatter + inline `[HH:MM:SS]` markers |
| `content/README.md` | Transcript schema + inventory |
| `content/templates/bcz-yapz-youtube-description.md` | Phase 1 description template (this doc ships it) |
| `content/templates/bcz-yapz-youtube-tags.txt` | Phase 1 tags template (this doc ships it) |
| `~/.claude/skills/bcz-yapz-description/skill.md` | Phase 2 skill (future) |
| `~/.claude/projects/-Users-zaalpanthaki-Documents-ZAO-OS-V1/memory/user_social_handles.md` | Canonical handle memory - updated 2026-04-22 to lock `/zao` channel |
| `research/cross-platform/351-youtube-description-seo-concert-transcripts/` | COC Concertz sibling template this doc extends |
| `research/cross-platform/353-youtube-content-pipeline-automation/` | Pipeline automation reference |
| `research/agents/474-bcz101-bot-transcript-rag/` | Downstream RAG consumer of the structured descriptions |

## Sources

- [BCZ YapZ channel (YouTube)](https://youtube.com/@bettercallzaal)
- [The ZAO Farcaster channel](https://farcaster.xyz/~/channel/zao)
- [Doc 351 - COC Concertz YouTube description SEO](../../cross-platform/351-youtube-description-seo-concert-transcripts/)
- [Doc 353 - YouTube content pipeline automation](../../cross-platform/353-youtube-content-pipeline-automation/)
- [Doc 474 - BCZ 101 bot transcript RAG](../../agents/474-bcz101-bot-transcript-rag/)
- [VidIQ - YouTube Description Best Practices 2026](https://vidiq.com/blog/post/youtube-video-descriptions/)
- [BananaThumbnail - YouTube SEO 2026 Timestamps](https://blog.bananathumbnail.com/youtube-seo-2026/)
- [YouTube Help - Chapter requirements](https://support.google.com/youtube/answer/9884579)
