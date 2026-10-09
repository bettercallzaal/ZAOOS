# docs/daily - the ZOE nightly files, and the one date rule

Four files land here every night from the ZOE nightly processing run (a Claude
Code cloud scheduled session, 10 PM Eastern by design, see
`docs/superpowers/specs/2026-04-13-zoe-daily-intelligence-pipeline-design.md`
section 9): `YYYY-MM-DD-captures.md`, `YYYY-MM-DD-briefing.md`,
`YYYY-MM-DD-newsletter.md`, `YYYY-MM-DD-tasks.md`.

## The date rule (card 9919, 2026-10-08)

The cloud host's clock is UTC. At 23:08 Eastern it already reads the next day.
Every nightly PR from #3668 to #3798 named its captures file after the UTC date
and its briefing after the UTC date plus one, so the captures were dated a day
that had not started in Maine and the briefing was two days ahead (#3750, opened
2026-10-06T03:08:58Z on Monday 5 October Eastern, wrote `2026-10-06-captures.md`
and `2026-10-07-briefing.md`).

- `captures` carries the Eastern calendar day the run belongs to.
- `briefing`, `newsletter` and `tasks` carry the next Eastern day.
- A run before 06:00 Eastern still belongs to the evening before.

Never take the date from `date`, `new Date()` or `toISOString()` on the host.
Take it from the helper, which computes in `America/New_York`:

```bash
node scripts/zoe/nightly-dates.mjs
# {"captures":"2026-10-08","briefing":"2026-10-09","capturesWeekday":"Thursday","briefingWeekday":"Friday","tz":"America/New_York"}
```

Regression test on the exact failing instants:
`npx vitest run scripts/__tests__/nightly-dates.test.ts`.

## The line the routine prompt needs

The routine's prompt is not in this repo (it is a scheduled cloud session on the
account that owns it; the routine list on the thezao account was empty on
2026-10-08). Whoever edits that prompt adds this, verbatim:

> Before writing any file under docs/daily, run
> `node scripts/zoe/nightly-dates.mjs` and use its `captures` date for the
> captures file and its `briefing` date for the briefing, newsletter and tasks
> files. Do not derive dates from the system clock.

Until that line is in the prompt, the files will keep landing one day ahead;
this README and the helper make the fix a one-line paste rather than a rewrite.
