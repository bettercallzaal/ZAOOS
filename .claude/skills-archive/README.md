# Retired project skills

A skill in `.claude/skills/` loads its name, and when the listing has room its
description, into every Claude Code session opened in this repo. These no longer
earn that. They are kept here, readable, and never loaded.

Same convention as the personal skills archive this follows: one row per
retirement, with what to use instead, when, and why. Nothing here was deleted.
To bring one back: `git mv .claude/skills-archive/<name> .claude/skills/<name>`.

Measured before retiring: loads between 2026-09-06 and 2026-10-06, counted from
the Claude Code transcripts on the Mac, both Skill-tool calls and typed
`/commands`. Method and numbers are in research doc
[2624](../../research/dev-workflows/2624-skills-estate-review/). Only that one
machine's transcripts were read.

| Skill | Use instead | Retired | Loads in 30 days | Last change | Why |
|---|---|---|---:|---|---|
| `catchup` | the session-start lane context, or `/handoff` to resume | 2026-10-06 | 0 | 2026-03-28 | Rebuilt context after `/clear`. Sessions now get it at start |
| `standup` | `/socials` | 2026-10-06 | 0 | 2026-03-28 | A tweetable build-in-public update from git activity |
| `morning` | nothing in this repo | 2026-10-06 | 0 | 2026-05-16 | A morning kickoff ritual |
| `reflect` | nothing in this repo | 2026-10-06 | 0 | 2026-04-02 | An end-of-day journal entry |
| `check-env` | `.env.example` and `npm run typecheck` | 2026-10-06 | 0 | 2026-03-27 | An env-var checklist |
| `fix-issue` | `/investigate` | 2026-10-06 | 0 | 2026-03-27 | Fix a GitHub issue by number |
| `new-component` | `.claude/rules/components.md` | 2026-10-06 | 0 | 2026-03-28 | A component scaffold. The rule file states the same conventions and loads by itself |
| `new-route` | `.claude/rules/api-routes.md` | 2026-10-06 | 0 | 2026-03-28 | An API route scaffold. Same: the rule file carries it |

Auto-proceeded by the Grill on 2026-10-06, override anytime. Not a ruling of Zaal's.

## Named for retirement and left in place

- `z`: `CLAUDE.md` lists `/z` among the key commands. It stays until that line changes.
- `fishbowlz`: `bot/REGISTRY.md` records it as the pointer to the graduated FISHBOWLZ repo.
