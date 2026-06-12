# CLAUDE.md - <REPO NAME>

> Copy this into a ZAO repo's root as `CLAUDE.md`, fill the angle-bracket slots,
> delete this quote block. Standard: research/dev-workflows/843 in ZAOOS.

## What this is

<One paragraph: what this repo does, who it serves. If it graduated from ZAOOS,
say so: "Graduated from ZAOOS <date>; clone-no-deps, stands alone.">

**Stack:** <e.g. Next.js 16, React 19, Supabase (RLS), Tailwind v4>

> Brand spellings (WaveWarZ, COC Concertz, The ZAO, ZABAL, etc): see global
> `~/.claude/CLAUDE.md`. Do not re-copy the glossary here.

## Project Map

> Counts verified <YYYY-MM-DD>. Re-verify before editing - stale counts erode trust.

| Directory | What | When to Read |
|-----------|------|-------------|
| `<dir>/` | <purpose> (<N> files) | <when> |

## Security (Non-Negotiable)

- **NEVER** expose server-only secrets (`<SERVICE_ROLE_KEY>`, `<API_KEY>`, `<SESSION_SECRET>`) to the browser
- **NEVER** use `dangerouslySetInnerHTML`
- All user input: validate with Zod `safeParse` before processing
- <DB> RLS on all tables; service role = server-side only

## Boundaries

> If this repo has an AGENTS.md, it is the source of truth - mirror it here.

**Always do:** <validate input, check session, use the `@/` alias, mobile-first>
**Ask first:** <DB migrations, new deps, env-var changes, config changes>
**Never do:** <commit secrets/.env, skip Zod, push directly to main>

## Key Files

- `<path>` - <what>
- `<path>` - <what>

## Where this sits in the estate

Part of the ZAO ecosystem - see the estate map:
`research/infrastructure/844-zao-estate-map/` in ZAOOS.
