# Adapted: 99darwin/nexus (dedup + source-adapter shape)

`bot/src/zoe/radar-dedup.ts` is adapted from **github.com/99darwin/nexus**
(MIT License, "Copyright (c) 2026 Nexus Contributors"), from
`packages/agent/src/dedup.ts` and `packages/agent/src/sources/types.ts` at
commit `0a59cfc30887f94924f0426b8cef8ca6a7ff9d1a`. The repo is on Nick Saponaro's (99darwin) GitHub; its
LICENSE names "Nexus Contributors" as the copyright holder. The upstream
`LICENSE` is kept in this directory, unchanged.

Credit line, used at each use site (ZAOOS doc 2643, rank 3):

> Adapted from 99darwin/nexus (Nexus Contributors, MIT License), https://github.com/99darwin/nexus

## What was taken

- The dedup layers: URL, exact title, arXiv id, content-word Jaccard above 0.6,
  and shared title entities (proper nouns and dollar amounts). The stop-word and
  common-word lists and the 200-item cap are nexus's.
- The source-adapter interface (name, priority, `poll(signal)`).

## What was changed or left out

- Left out, on Zaal's 2026-10-08 ruling (vault item 64): the paid TypeSafe/Jev
  classifier, the Postgres tables, and the X API adapter.
- Stricter than nexus (three reviews of #3821): items are DROPPED only on exact
  identifiers (same link, same normalised title, same arXiv id), and two
  different arXiv ids never merge. Content similarity and shared names are
  reported as possible duplicates and the item is kept, because neither a word
  list nor a similarity threshold separated distinct items from true repeats.
  Content is compared only when both items have at least 8 significant words.
- Changed: pure functions with no database. The caller passes the items already
  seen. Every drop records its reason and what it duplicated. arXiv ids are also
  read from the url, with the version suffix ignored.
