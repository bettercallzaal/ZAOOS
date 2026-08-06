# Credit + Attribution - always name the source (OSS + music + anything we build on)

Zaal (2026-08-06): "as we use open source software we always include credits of
where something was found or who from - same with music."

The ZAO is a creator-first, fans-first org. Crediting the people and work we build
on is not a nicety - it is the ethos, it is often legally required, and it is how
relationships and reputation compound. No silent borrowing, ever.

## The rule (behavior-changing, all surfaces)

Whenever we ADOPT, VENDOR, ADAPT, or are INSPIRED BY someone else's work - open-source
code, a skill, a pattern, a library, a design, a track, a sample, a beat, an idea -
we CREDIT the source: WHERE it was found + WHO it is from (+ the LICENSE, for code).

### Open-source software / code / patterns / skills

- **Inline at the use site:** a comment naming the source - `adapted from owner/repo (LICENSE)`
  or `pattern from <author>, <repo>`. The reader of the code sees the origin.
- **In the research doc:** the Sources section names the repo, author, and license
  (this is already `research-grounding.md` - it doubles as attribution).
- **In the PR body:** name what we built on and its license.
- **Vendored code** (copied into the repo): keep its `LICENSE` file + a NOTICE of
  origin. Precedent: `gstack` is vendored with its MIT license + attribution
  ([[project_gstack_vendored]]).
- **Respect the license terms:** MIT / BSD / Apache require attribution; AGPL / GPL
  add share-alike obligations. Honor them. If a project's license is unclear, check
  BEFORE using it - do not adopt code we cannot legally + attributably use.

### Music / audio / creative work

- Every track, sample, beat, loop, cover, or artist's work we use gets the artist
  CREDITED - name + handle + link where possible. For a music org this is the whole
  point: credit the culture.
- On any PUBLISHED surface (a video, a post, a stream, a release, a set): the credit
  is VISIBLE, not buried in metadata.
- **Uncleared / unlicensed = do not publish.** If we cannot both credit it AND have
  the right to use it publicly, we do not use it publicly. (Sibling of the outbound
  gate - publishing someone's work without rights is irreversible + harmful.)

### Where the credit lives (by surface)

| Surface | Credit form |
|---------|-------------|
| Code | inline comment at the use site; `LICENSE` + NOTICE for vendored code |
| Research docs | Sources section (repo / author / license, or artist / track) |
| PRs | the body - what we built on + its license |
| Published content (posts, videos, releases, streams) | a VISIBLE credit line |
| ICM boxes / bios / partner lists | sources + partners named |

## Why

- **It is right.** Respect the creator - the ZAO ethos (creator-first, fans-first).
- **It is often legally required.** OSS licenses (MIT / CC / etc.) carry attribution
  clauses; music carries rights. Crediting is compliance, not just courtesy.
- **It compounds the network.** Crediting nickysap/99darwin, a sampled artist, or an
  OSS author is how relationships and reputation build - the ZAO way.

## Guards

- Attribution never leaks secrets or private PII - credit the PUBLIC identity/handle
  the work was published under, nothing more (`secret-hygiene.md`, `pii-hygiene.md`).
- Do not fabricate a source to look grounded - if the origin is genuinely unknown,
  say "origin unknown" rather than inventing one (`anti-fabrication.md`).

## Source

Zaal 2026-08-06. Live example the moment it was written: doc 2204 + the
cross-family-verification build both credit **99darwin/orchestrator (MIT)** and
**nickysap** as the source of the pattern. Siblings: `research-grounding.md`
(Sources = attribution), `secret-hygiene.md` / `pii-hygiene.md` (what a credit may
not expose), `anti-fabrication.md` (do not invent a source),
[[project_gstack_vendored]] (vendored-with-attribution precedent).
