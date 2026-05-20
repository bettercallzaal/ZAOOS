# Output Schema - /meeting Extraction

Single JSON object. All fields required except where noted optional.

## Schema

```json
{
  "meeting": {
    "date": "YYYY-MM-DD",
    "duration_min": 47,
    "title": "Iman call - ZAO Craig + PizzaDAO Zambia",
    "attendees": ["Zaal", "Iman"],
    "platform": "Telegram voice"
  },
  "project": "zao-devz | zaostock | zao-os | other",
  "decisions": [
    {
      "id": 1,
      "text": "Build ZAO Craig bot - live audio + Whisper + auto-extract todos",
      "owner": "Zaal",
      "status": "TODO",
      "confidence": "high"
    }
  ],
  "actions": [
    {
      "title": "Iman to study RSVPizza repo + build PizzaDAO Zambia brand on top",
      "owner": "Iman",
      "due": "2026-05-22",
      "category": "WaveWarZ Zambia",
      "confidence": "high"
    }
  ],
  "quotes": [
    {
      "speaker": "Iman",
      "text": "The code is ready for phase two in behavior"
    }
  ],
  "research_seeds": [
    "ZAO Craig live audio + Whisper + autotodo bot",
    "PizzaDAO sponsorship proposal format"
  ],
  "memory_updates": [
    {
      "slug": "project_zao_craig",
      "what": "Concept seed - live audio capture + Whisper + autotodo. Hermes pattern bot. Doc 670."
    }
  ]
}
```

## Enums

### `project` (top-level - routes the action tracker, see SKILL.md Phase 0)
- `zao-devz` - default. Actions -> cowork-zaodevz `data/actions.json`.
- `zaostock` - actions -> @ZAOstockTeamBot paste-block (ZAOstock Supabase, not GitHub).
- `zao-os` - actions stay in the recap doc table only.
- `other` - BCZ / WaveWarZ / misc. Recap doc table only.

The recap doc ALWAYS goes to ZAOOS `research/events/` regardless of project.

### `confidence` (every decision + action)
- `high` - explicit in transcript, clear owner, clear intent.
- `medium` - implied, or owner/scope slightly fuzzy.
- `low` - inferred, ambiguous owner, or garbled transcript span. Surfaced in the Phase 3 VERIFY block; never auto-written.

### `owner` (decisions + actions)
- `Zaal`
- `Iman`
- `Both`
- `ThyRev` (Thy Revolution / COC Concertz)
- `Samantha` (candytoybox / WaveWarZ)

Anything else: surface as `unknown` in Phase 3 confirm, ask Zaal.

### `category` (actions)
Must match cowork-zaodevz actions.json enum:
- `Site / Tech`
- `Ops`
- `Other`
- `WaveWarZ Zambia`
- `ZAO Devz`
- `Bounty`
- `Social`

### `status` (decisions)
- `TODO`
- `WIP`
- `DONE`

### `platform`
Free text. Examples: `Telegram voice`, `Google Meet`, `Zoom`, `Discord/Craig`, `Fathom`, `Riverside`, `in-person`, `phone call`.

## Field rules

| Field | Rule |
|---|---|
| `meeting.date` | ISO YYYY-MM-DD. If transcript has no clear date, use file mtime or ask user. Never invent. |
| `meeting.duration_min` | Integer. From Whisper duration or Fathom metadata. 0 if unknown. |
| `meeting.title` | 5-80 chars. Format: `<who> - <topic 1> + <topic 2>`. Use doc 670 as template. |
| `meeting.attendees` | Array of canonical first-names. `Zaal`, `Iman`, `Cassie`, `Hannah`, etc. Match existing memory slugs where possible. |
| `decisions[].text` | Verbatim where possible. No paraphrasing. Past tense for things decided in the call. |
| `decisions[].confidence` / `actions[].confidence` | `high` / `medium` / `low`. Required on every item. `low` -> Phase 3 VERIFY block, never auto-written. |
| `actions[].title` | Imperative verb-first. "Iman to X" or just "X". 10-120 chars. |
| `actions[].due` | YYYY-MM-DD or empty string. Never invent. If transcript says "by Thursday", convert to absolute date using meeting.date as anchor. |
| `quotes[].text` | Verbatim. 5-200 chars. Pick the load-bearing 3-8 quotes total. |
| `quotes[].speaker` | Match attendees list. |
| `research_seeds` | Topic strings (5-80 chars each). New ideas, follow-up questions, things worth a doc later. |
| `memory_updates` | Only NEW entities/concepts. Skip if it's already in `MEMORY.md`. Slug format: `project_<kebab-case>` or `feedback_<kebab-case>` or `user_<kebab-case>`. |

## Worked example - doc 670 (Iman call May 18)

Real example of what extraction looks like, sourced from `research/events/670-iman-call-may18-craig-pizzadao/README.md`:

```json
{
  "meeting": {
    "date": "2026-05-18",
    "duration_min": 47,
    "title": "Iman call - ZAO Craig + PizzaDAO Zambia + ZABAL Games",
    "attendees": ["Zaal", "Iman"],
    "platform": "Telegram voice"
  },
  "decisions": [
    {"id": 1, "text": "Build ZAO Craig bot - live audio + Whisper + auto-extract todos", "owner": "Zaal", "status": "TODO"},
    {"id": 2, "text": "ZAO Devz fronts PizzaDAO drinks budget (~$120) only if needed - WaveWarZ cannot wire in 5 days", "owner": "Iman", "status": "TODO"},
    {"id": 3, "text": "Iman studies RSVPizza repo - builds PizzaDAO Zambia / Kingston brand identity on top", "owner": "Iman", "status": "WIP"},
    {"id": 4, "text": "ZABAL Games signup drops Wednesday 2026-05-20, NOT Friday - Friday becomes live signup moment", "owner": "Both", "status": "TODO"}
  ],
  "actions": [
    {"title": "Pitch PizzaDAO HQ for ~$120 drinks add-on for Zambia event", "owner": "Iman", "due": "2026-05-22", "category": "WaveWarZ Zambia"},
    {"title": "Dive into github.com/PizzaDAO/rsv-pizza, feed to Claude, build PizzaDAO Zambia brand", "owner": "Iman", "due": "", "category": "WaveWarZ Zambia"},
    {"title": "Make and ship ZAO flyer for PizzaDAO Zambia (Fri May 23)", "owner": "Iman", "due": "2026-05-18", "category": "WaveWarZ Zambia"},
    {"title": "ZABAL Games signup form + group chat live", "owner": "Iman", "due": "2026-05-20", "category": "Bounty"}
  ],
  "quotes": [
    {"speaker": "Iman", "text": "The code is ready for phase two in behavior"},
    {"speaker": "Zaal", "text": "Imma make that bot after this meeting"},
    {"speaker": "Zaal", "text": "Zambia for $100 more is high-leverage vs $2-3k they spend on bigger cities"}
  ],
  "research_seeds": [
    "ZAO Craig live audio + Whisper + autotodo bot design",
    "PizzaDAO sponsorship proposal format / pitch-deck system",
    "RSVPizza repo patterns - what to clone for ZAO brands"
  ],
  "memory_updates": [
    {"slug": "project_zao_craig", "what": "Concept seed - live audio capture + Whisper + autotodo. Hermes pattern bot. Doc 670."}
  ]
}
```
