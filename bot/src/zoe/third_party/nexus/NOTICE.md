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

- The layered dedup: URL, exact title, arXiv id, content-word Jaccard above 0.6,
  or two or more shared title entities (proper nouns and dollar amounts). The
  stop-word and common-word lists and the 200-item cap are nexus's.
- The source-adapter interface (name, priority, `poll(signal)`).

## What was changed or left out

- Left out, on Zaal's 2026-10-08 ruling (vault item 64): the paid TypeSafe/Jev
  classifier, the Postgres tables, and the X API adapter.
- Changed: pure functions with no database. The caller passes the items already
  seen. Every drop records its reason and what it duplicated. arXiv ids are also
  read from the url, with the version suffix ignored.
