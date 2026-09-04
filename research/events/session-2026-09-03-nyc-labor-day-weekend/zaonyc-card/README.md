# The ZAO NYC card

Published artifact: `https://claude.ai/code/artifact/b278922b-3615-466d-ab8c-293553374f8c`
Source of record is `zaonyc.html` here (`documentation-in-repo.md`).
**Private until Zaal shares it** from the artifact's share menu.

## Why it exists

Zaal was about to spend a weekend telling people "send me the link" — and the link
was broken. `zaostock.com/sponsor` states **no dollar figure at all** (doc 1013):
the three sponsor tracks are described as "flexible," with no number anywhere. A
warm lead landing there learns nothing and gives nothing.

This is a surface he controls, publishable in an hour, without touching the site.

## What's on it

1. **The claim:** New York is not a new market for The ZAO, it is the first one.
2. **One stat**, the brand's own line from doc 1627: *"1,289 battles. Every artist
   earns."* Dated 2026-07-24, alongside 878.30 SOL and 188 onchain members.
3. **The NYC timeline** — 2018/19 JANGO UU, ZAO-PALOOZA Apr 2024, WaveWarZ
   Takeover 2025, ZAO NYC now. This is a genuine sequence, so it gets a sequence
   device; the years carry information rather than decorating.
4. **The ask, framed by its smallness:** *"A festival that costs $5,000."* Free to
   attend, fiscally sponsored, tax-deductible.
5. **A fifteen-second signup** writing to `data/zaonyc/signups/` via the `db`
   capability — hand someone the phone, they type a name, done.

## Claims discipline

- **No roster is claimed.** ZAO NYC has history and two co-leads, and the page says
  "Forming · September 2026" in its first line. The persona guardrail holds.
- **Every figure is dated on the page itself** (`state-claims.md`).
- **The stale ~$1.5K on-hand number is deliberately absent.** It is from
  2026-07-12 and nearly two months old; the ~$5K target is current per Zaal's own
  correction, so only that is printed. Zaal says the live gap out loud.
- **No silent success.** If the store is unavailable the page says so and tells the
  person to speak to Zaal directly, rather than showing a green tick and dropping
  the name (`silent-failure-guard.md`).

## Reading the signups back

The signups land in `data/zaonyc/signups/`. From a session with this artifact's URL,
`read_db` with `db_op: "list"` on that collection returns them — so the roster can
be pulled into the repo after the weekend rather than living only in the artifact.

## What was NOT built, and why

No deck. A founder standing in a loud room needs one screen someone reads in twenty
seconds, not slides. And no claim ZAO NYC cannot support — the temptation with a
brand page is to write the org you want; the whole value of the NYC lineage is that
it is true and checkable.
