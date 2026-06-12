---
topic: dev-workflows
type: guide
status: research-complete
last-validated: 2026-06-11
related-docs: 844, 836
original-query: "Align CLAUDE.md files across all ZAO repos - one standard, consistent agent context everywhere."
tier: STANDARD
---

# Doc 843 - CLAUDE.md Alignment Standard

> **Goal:** One standard for every ZAO repo's `CLAUDE.md` so any AI coding agent (Claude Code, Cursor, etc) gets consistent, accurate context across the estate. Defines the two-layer model, the required sections, and a copy-paste [TEMPLATE.md](./TEMPLATE.md).

## The two-layer model

ZAO context lives in two layers. Do NOT duplicate layer 1 into layer 2 - that's
how drift starts.

| Layer | File | Holds | Scope |
|-------|------|-------|-------|
| 1. Global | `~/.claude/CLAUDE.md` | No-emoji / no-em-dash rules, **brand glossary** (WaveWarZ, COC Concertz, The ZAO, etc), graphify/socials skills | Every project, every machine |
| 2. Per-repo | `<repo>/CLAUDE.md` | What this repo is, stack, project map, security, boundaries, key files | One repo |

Layer 2 **references** layer 1 ("brand spellings: see global `~/.claude/CLAUDE.md`")
rather than copying it. The brand glossary has exactly one home.

## Required sections (every repo CLAUDE.md)

1. **What this is** - one paragraph. For ZAOOS-graduated repos, state the
   graduation lineage ("graduated from ZAOOS 2026-05-06").
2. **Stack** - one line, real versions.
3. **Project Map** - directory table with **live counts** (verify before
   writing; stale counts are the #1 drift, see Doc 841). Add a "verified YYYY-MM-DD"
   stamp.
4. **Security (Non-Negotiable)** - never-expose secrets, no `dangerouslySetInnerHTML`,
   Zod on input, RLS. Copy the ZAOOS block; trim to what the repo actually uses.
5. **Boundaries** - Always do / Ask first / Never do. Mirror from `AGENTS.md` if
   the repo has one (AGENTS.md is source of truth; CLAUDE.md mirrors it).
6. **Key Files** - the 5-10 files an agent must know.
7. **Estate pointer** - link to [Doc 844](../../infrastructure/844-zao-estate-map/)
   so any agent can see where this repo sits in the ecosystem.

## Rules

- **Counts must be verified, not guessed.** Run the count, stamp the date. Doc 841
  found 6 separate stale counts in ZAOOS docs (301 vs 302 routes, 279 vs 295
  components, etc). A wrong count erodes agent trust in the whole file.
- **No phantom paths.** Don't list a directory that doesn't exist (ZAOOS CLAUDE.md
  claimed a `contracts/` dir for months - it never existed).
- **AGENTS.md is source of truth where both exist.** CLAUDE.md mirrors it. If they
  drift, fix AGENTS.md first, then sync CLAUDE.md.
- **One glossary.** Brand spellings live in global `~/.claude/CLAUDE.md` only.

## Which repos need this (2026-06-11)

| Repo | Has CLAUDE.md | Action |
|------|---------------|--------|
| ZAOOS | yes | aligned 2026-06-11 (this PR) |
| ZAOcowork | yes | review against standard |
| ZAOcowork/research-dispatch | yes | review against standard |
| ZAOscout | no | add (graduated, keyless-fetch toolkit) |
| bcz-yapz | unknown (remote) | add on next touch |
| zpoidh | unknown (remote) | add on next touch |
| zlank | unknown (remote) | add on next touch |
| ZAOVideoEditor | unknown (remote) | add on next touch |
| CoCConcertZ | unknown (remote) | add on next touch |

Adopt opportunistically: when you next open a repo, drop in [TEMPLATE.md](./TEMPLATE.md)
and fill it. No need for a big-bang pass across all repos.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Align ZAOcowork CLAUDE.md to the standard | @Zaal | PR (that repo) | Next touch |
| Add CLAUDE.md to ZAOscout from TEMPLATE | @Zaal | PR (that repo) | Next touch |
| Drop TEMPLATE into each graduated repo as opened | @Zaal | PRs | Opportunistic |

## Also See

- [Doc 844](../../infrastructure/844-zao-estate-map/) - the estate map (which repos exist)
- [Doc 841](../../security/841-zaoos-over-audit-2026-06/) - found the doc drift this standardizes against
- [TEMPLATE.md](./TEMPLATE.md) - copy-paste starting point

## Sources

- [FULL] ZAOOS CLAUDE.md / AGENTS.md alignment, this PR, 2026-06-11
- [FULL] Local repo CLAUDE.md survey, 2026-06-11
