# content/

Transcripts, long-form writing, and raw content artifacts captured from ZAO-ecosystem streams, podcasts, interviews, and events. Source of truth for retrieval, repurposing (newsletter, socials, docs), and downstream RAG/agent training.

## Why this folder exists

- Stream recordings live in `Movies/` or cloud. They are huge, opaque, and not query-able.
- Research docs live in `research/`. Those are analyses, not raw transcripts.
- Content for bots (BCZ 101 bot, ZOE knowledge) needs clean, structured text with metadata.
- Single canonical location means tooling (grep, RAG indexers, newsletter drafts, socials skill) always knows where to look.

## Layout

```
content/
  transcripts/
    bcz-yapz/              # Better Call Zaal YapZ podcast
      YYYY-MM-DD-<guest>-<org>.md
    zoes/                  # Future: ZOE'S show
    spaces/                # Future: X Spaces / Farcaster spaces
    cyphers/               # Future: cypher sessions
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
---
```

Status enum:
- `raw-undated` - converted from source but date/topics/entities not yet enriched (filename-only metadata)
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
grep -hR "^guest:" content/transcripts/bcz-yapz/
grep -hR "^date:" content/transcripts/bcz-yapz/
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

### BCZ YapZ / BCZ Yaps (16 transcripts, 1 pending)

Canonical dates are **YouTube publish dates** from `@bettercallzaal` channel (verified via `yt-dlp` on 2026-04-22). Recording dates may differ by a few days to weeks.

| Ep | Publish | Guest | Org | YouTube |
|----|---------|-------|-----|---------|
| 1 | 2025-08-22 | Deepa | GrantOrb | [3vUAFwXqdeo](https://youtu.be/3vUAFwXqdeo) |
| 2 | 2025-10-14 | Rich Bartuc | PowerPacks Diamondhands Club | [AOcp8Jpyw3k](https://youtu.be/AOcp8Jpyw3k) |
| 3 | 2025-10-19 | Yoni Dubz | - | [HopaeW7POis](https://youtu.be/HopaeW7POis) |
| 4 | 2025-11-30 | Rock Opera | - | [43GPWLE6W5Q](https://youtu.be/43GPWLE6W5Q) |
| 5 | 2025-12-11 | Daya | Flix.Fun | [9ePU4qEc67Y](https://youtu.be/9ePU4qEc67Y) |
| 6 | 2025-12-16 | Sven | Incented | [O7-1weR0Qog](https://youtu.be/O7-1weR0Qog) |
| 7 | 2026-01-05 | Yerbearserker | Empire Builder | [EH-FWD7ySKk](https://youtu.be/EH-FWD7ySKk) |
| 8 | 2026-02-11 | Diviflyy | Empire Builder | [0tyVpLGVxkA](https://youtu.be/0tyVpLGVxkA) |
| 9 | 2026-02-23 | SNAX (snax.eth) | Pizza DAO | [4CpblYpIO8Q](https://youtu.be/4CpblYpIO8Q) |
| 10 | 2026-02-23 | GIU (Juliano) | Pinetree | [loSOniPcJx0](https://youtu.be/loSOniPcJx0) |
| 11 | 2026-03-18 | Roaring Sensei | - | [DIeav3o8t9M](https://youtu.be/DIeav3o8t9M) |
| 12 | 2026-03-18 | Saltorious.eth | Among Traitors | [0Tevgpr5TUQ](https://youtu.be/0Tevgpr5TUQ) |
| 13 | 2026-03-25 | Ali | Inflynce | [WTyafqHKQqM](https://youtu.be/WTyafqHKQqM) |
| 14 | 2026-04-01 | Jordan | Ryft | [IbhHxFR4yxE](https://youtu.be/IbhHxFR4yxE) |
| 15 | 2026-04-22 | Nikoline | Hubs Network | publishing 2026-04-22 |
| 16 | 2026-04-22 | Dish (Jack Dishman) | Clanker | publishing 2026-04-22 |
| 17 | 2026-04-22 | Hannah | Farm Drop | publishing 2026-04-22 |

Not recorded:
- EyeTeaJohnny 2026-03-24 - episode was postponed

Ground truth source: `yt-dlp "https://www.youtube.com/watch?v=<ID>" --print "%(upload_date)s | %(title)s"` - re-run to refresh when new episodes publish.

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
