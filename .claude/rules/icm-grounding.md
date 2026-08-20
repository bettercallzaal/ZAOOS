# ICM Grounding - the ZAO agent kit's source of truth

The **ICM boxes** (useicm.com) are the single, canonical, AI-readable definition of
every ZAO brand and project - 24+ live boxes (thezao, wavewarz, zabalgamez, sparkz,
zao-assistant, fractal, coc-concertz, zaostock, poidh, ...). They are the nervous
system of the agent kit: the upstream truth every agent and terminal reads so we
work from canonical facts, never stale copy or a hallucination.

## The rule (behavior-changing)

**Before working on, describing, or generating anything for a ZAO brand/project,
GROUND on its ICM box first.**

> **TOOLING STATUS 2026-08-19: the `icm` CLI, `zao-icm.py`, and the `/icm` skill
> are ALL ABSENT from this Mac, and none of them was ever git-tracked** (checked
> `~/bin`, `~/zaal-dotfiles/bin`, `~/.claude/skills`, plus git history in both
> repos - no commit ever contained them). They may still exist on another
> machine; on this one they do not. Use the two routes below, both verified
> working on 2026-08-19 when three boxes were published through them.

- **Read a box (unauthenticated):** fetch
  `https://useicm.com/api/objects/<id>/llm.txt` with BROWSER HEADERS - a plain
  curl gets 403. `User-Agent: Mozilla/5.0 ...`, `Origin: https://useicm.com`,
  `Referer: https://useicm.com/`.
- **Box ids:** `~/.zao/private/icm-registry.json` (name -> id map). NOTE it is a
  STALE MIRROR of content state - it lists boxes as empty that are live. Ids are
  reliable; its `content` field is not. Curl the endpoint for truth.
- **Write a box (Zaal-gated):** `PUT /api/objects/<hash>/llm.txt` with
  `{"body": "<markdown>"}` and `Authorization: Bearer <api_key>` from
  `~/.zao/private/icm-keys.json`. Verify by re-fetching and byte-comparing.
- A subagent doing brand work should be handed the relevant box's content as
  grounding in its prompt.

## ICM is UPSTREAM - generate outward, never drift

The box is the source; everything else is downstream and derived FROM it:

- A site's `llms.txt`, JSON-LD `schema.org/Organization`, pitch copy, and social
  bios should be generated from the box - not hand-written in parallel (that is how
  they drift). Real example (2026-07-27): `zao-website`'s `llms.txt` said "web3 music
  community and incubator" while the `thezao` box said "decentralized impact network
  / ZTalent Artist Organization, music-first" - drift, because nothing kept them in
  sync. Fix: derive downstream copy from the box, and when the truth changes, change
  the BOX first, then regenerate.
- If the box and a downstream surface disagree, the **box wins** - update the surface
  (or, if the box is what's stale, update the box via the `/icm` skill, then the
  surface). Never silently trust the drifted copy.

## Owning + editing boxes

- Reading a box is unauthenticated + safe (`icm <brand>` / the llm.txt API).
- Creating or editing a box is publishing public content = GATED (Zaal's explicit OK
  on the content first). Owner keys live at `~/.zao/private/icm-keys.json` (never
  print/commit). See the `/icm` skill + `research/identity/icm-boxes/` (the repo copy
  of each box's body, the source of truth for edits).

## Source

Doc 1016
(GEO) / doc 1021 (boxes as bot brains). Established as an agent-kit primitive 2026-07-27.
