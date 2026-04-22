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

### BCZ YapZ (16 episodes)

Dated:
- 2026-04-14 - Nikoline / Hubs Network
- 2026-04-22 - Dish (Jack Dishman) / Clanker
- 2026-04-22 - Hannah / Farm Drop

Undated (need date + topic enrichment pass):
- Deepa / GrantOrb (ep1)
- Rich (ep2)
- Diviflyy / Empire Builder (ep7)
- Yerb (ep7 - possibly misnumbered, two ep7s on file)
- Ali, Flix Fun, Jordan, Rockopera, Roaring Sensai, Saltorius, Snax, Sven, Yoni

13 undated transcripts sit in `content/transcripts/bcz-yapz/undated-*.md`. Rename to `YYYY-MM-DD-<slug>.md` after date is known. Only canonical filename convention is the dated one.

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
