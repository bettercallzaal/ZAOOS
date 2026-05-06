# content/

Transcripts, long-form writing, and raw content artifacts captured from ZAO-ecosystem streams, podcasts, interviews, and events. Source of truth for retrieval, repurposing (newsletter, socials, docs), and downstream RAG/agent training.

## Why this folder exists

- Stream recordings live in `Movies/` or cloud. They are huge, opaque, and not query-able.
- Research docs live in `research/`. Those are analyses, not raw transcripts.
- Content for bots (BCZ 101 bot, ZOE knowledge) needs clean, structured text with metadata.
- Single canonical location means tooling (grep, RAG indexers, newsletter drafts, socials skill) always knows where to look.

## BCZ YapZ graduated 2026-05-06

The BCZ YapZ archive (`/bcz-yapz` page, 18 transcripts, ingest scripts, YouTube description templates, link map, gaps sidecar) graduated to its own repo on 2026-05-06: `github.com/bettercallzaal/bcz-yapz`. Live at https://bczyapz.com.

Code, content, and templates were deleted from this repo per the monorepo-as-lab graduation pattern. The `/bcz-yapz` route now 301-redirects to bczyapz.com (see `next.config.ts`). The global skill `bcz-yapz-description` was repointed to the new repo path.

Research docs about the show stay here as institutional memory:
- [Doc 477 YouTube SEO](../research/dev-workflows/477-youtube-seo-bcz-yapz/)
- [Doc 490 Archive page](../research/dev-workflows/490-bcz-yapz-archive-page/)
- [Doc 533 POIDH bounty](../research/community/533-poidh-clipup-bounty-bcz-yapz-hannah/)
- [Doc 569 Bonfire ingest](../research/identity/569-yapz-bonfire-ingestion-strategy/)

## Layout

```
content/
  transcripts/
    zoes/                  # Future: ZOE'S show
    spaces/                # Future: X Spaces / Farcaster spaces
    cyphers/               # Future: cypher sessions
  templates/               # Fill-in templates for downstream artifacts
  writing/                 # Future: essays, newsletter archives, longform
  media-refs/              # Future: pointers to video/audio in Movies/cloud
```

One transcript = one file. Filename convention: `YYYY-MM-DD-<guest-slug>-<org-slug>.md`.

## Transcript frontmatter schema

Every transcript file begins with YAML frontmatter. Required fields in bold. For full field-by-field reasoning, see [research/agents/474-bcz101-bot-transcript-rag/](../research/agents/474-bcz101-bot-transcript-rag/).

```yaml
---
title: "BCZ YapZ w/Nikoline"        # display title
show: "BCZ YapZ"                    # show/series name
episode: 14                         # optional sequential number
guest: "Nikoline"                   # primary guest name
guest_org: "Hubs Network"           # guest affiliation
guest_links:                        # social / web handles
  - "farcaster: @nikoline"
  - "x: @nikoline"
  - "web: hubsnetwork.org"
host: "Zaal"
date: 2026-04-14                    # recording date (ISO)
published: 2026-04-21               # optional release date
duration_min: 27                    # approximate length
format: "video-podcast"             # video-podcast | audio | space | cypher
language: "en"
topics:                             # for faceted search
  - governance
  - sociocracy
  - hubs-network
  - akasha
  - barcelona
  - community-building
keywords:                           # long-tail terms for RAG
  - holocracy
  - fractal-governance
  - ethbarcelona
entities:                           # named orgs / people / projects mentioned
  orgs: ["Hubs Network", "Akasha Foundation", "Nasha Hub"]
  people: ["Lorenzo"]
  projects: ["Web3 Privacy Now", "Plural Events"]
source:
  video: "Movies/bcz stream/BCZyapz/nik/bcz yapz w_nikoline.mp4"
  docx: "Movies/bcz stream/BCZyapz/nik/bcz yapz w_nikoline.docx"
  stream_platform: "livepeer"       # if streamed
  recording_id: "2747926607-..."    # optional
summary: "One-sentence elevator..."
action_items:                       # optional: calls-to-action from episode
  - "Visit hubsnetwork.org"
  - "Attend May 14 plural event"
status: "raw"                       # raw-undated | raw | cleaned | annotated
youtube_url: "https://www.youtube.com/watch?v=XXXXXX"  # required when status != "raw-undated"
youtube_video_id: "XXXXXX"                            # required when status != "raw-undated"
thumbnail_override: null                              # optional - custom thumbnail path
---
```

Status enum:
- `raw-undated` - converted from source but date/topics/entities not yet enriched (filename-only metadata). `youtube_url`, `youtube_video_id`, and `published` may be omitted.
- `raw` - dated + guest + org filled; topics auto-tagged
- `cleaned` - human edited (fix typos, speaker labels, remove filler)
- `annotated` - LLM pass extracted entities, action_items, summary confirmed

Body is the transcript text, timestamp-prefixed where available. Start with an H2 `## Transcript` separator so tooling can split frontmatter from body.

## Query patterns

### Find by topic
```bash
grep -lR "topics:" content/transcripts/ | xargs grep -l "governance"
```

### Find episodes mentioning an entity
```bash
grep -R "Farm Drop" content/transcripts/
```

### List guests by date
```bash
grep -hR "^guest:" content/transcripts/
grep -hR "^date:" content/transcripts/
```

### Load into RAG (future - BCZ 101 bot)
- `/agents/graphify` skill ingests markdown + frontmatter, produces knowledge graph
- BCZ 101 bot pipeline: chunker reads each transcript, strips timestamp markers, creates ~350-token passages with ~15% overlap, embeds with OpenAI `text-embedding-3-small`, upserts to Supabase `bcz101_chunks` table. Frontmatter lands in `bcz101_episodes` as filter metadata. Pattern forked from `atenger/gmfc101`.

## Authoring a new transcript

1. Source file (docx / vtt / srt / txt) -> convert to plain text
   - docx: `textutil -convert txt input.docx -output /tmp/out.txt`
   - vtt: strip timing if redundant, keep leading timestamp per turn
2. Create `content/transcripts/<show>/YYYY-MM-DD-<guest>-<org>.md`
3. Paste transcript under `## Transcript`
4. Fill frontmatter - guest, org, date, topics (3-8 tags), entities, source paths
5. Write one-sentence `summary:` and up to 3 `action_items:`
6. Commit with message `content: add transcript <show> <guest> <date>`

## Current inventory

BCZ YapZ inventory moved to https://github.com/bettercallzaal/bcz-yapz (see `content/transcripts/` in that repo). Other shows TBD.

## Roadmap

- [ ] Auto-extract entities + topics via LLM pass (see doc 474)
- [ ] Index into Supabase pgvector for BCZ 101 bot (pattern from `atenger/gmfc101`)
- [ ] Cross-link transcripts to research/ docs and big wins
- [ ] Newsletter/social auto-draft from `summary` + `action_items`
- [ ] ZOE ingest: subscribe to this folder, surface new episodes in dashboard

## Related

- BCZ 101 bot + transcript RAG blueprint: [research/agents/474-bcz101-bot-transcript-rag/](../research/agents/474-bcz101-bot-transcript-rag/)
- Content pipeline (video -> transcript -> post): [research/community/432-zao-master-positioning/](../research/community/432-zao-master-positioning/)
- Socials skill: `~/.claude/skills/socials/skill.md`
- Graphify skill: `~/.claude/skills/graphify/SKILL.md`
