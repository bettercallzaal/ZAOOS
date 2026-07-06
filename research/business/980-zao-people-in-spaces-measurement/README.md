---
topic: business
type: guide
status: research-complete
last-validated: 2026-07-06
superseded-by:
related-docs: 978, 979
original-query: "ZAO Numbers - people in spaces - measure who is actually in the ZAO Spaces (X Spaces + recurring calls) so attendance becomes a real, citable number"
tier: STANDARD
---

# 980 - ZAO Numbers: people in Spaces (measurement framework)

> **Goal:** Turn "how many people are in our Spaces" from a vibe into a citable number. This doc does NOT invent attendance figures - there is no capture system today, so no honest number exists yet. It ships the framework: what to measure, where the data lives, and the smallest step to start capturing it.

## The honest finding: ZAO is not capturing this data

ZAO runs Spaces daily - from [Doc 979](../../events/979-yozf-calendar-priority-events/): WaveWarZ Spaces (midday + evening, daily), OP Fractal (Thursdays), COC Spaces (Thu/weekend). That is 10-14 Spaces a week. **None of them are being measured.** The [[project_logesh_songjam]] memory states it plainly: "WaveWarZ loses data by not capturing Spaces." Every Space happens, the listeners show up, and the number evaporates when the room closes.

So the correct answer to "ZAO Numbers - people in Spaces" today is: **unknown, because uncaptured.** Any specific attendance figure currently in circulation is a guess. The task is not to report a number - it is to stand up the capture so the number becomes real.

## What to measure (the framework)

Four metrics, in order of how much they matter:

| Metric | What it is | Why it matters |
|--------|-----------|----------------|
| **Peak concurrent listeners** | Max in the room at once | The headline "how big" number; the one to cite |
| **Unique attendees / week** | Distinct people across all Spaces in a week | Reach - deduped, the honest community-size proxy |
| **Recurring attendees** | People who show up 3+ weeks running | The real core; this is who ZAO actually is |
| **Space -> holder conversion** | Attendees who later hold Respect / join the allowlist | The only metric that ties Spaces to the [Doc 978](../978-zao-numbers-framing/) governance numbers |

The fourth is the one worth building toward: it connects the ambient Spaces (Doc 979 Tier-2) to the 156 on-chain holders (Doc 975), and proves Spaces are a funnel, not just noise.

## Where the data lives (and the honest access limit)

- **X (Twitter) Spaces native analytics** - the host account sees per-Space listener counts + replays after each Space ends. This is the primary source. **It requires Zaal's X/host-account login, which I cannot access in-session.** This is why no live number is in this doc.
- **X Spaces transcription/capture tooling** - the [[project_logesh_songjam]] memory identifies an auto-transcription tool (~$10-15/mo) as a real wedge precisely because ZAO is losing this data. NOTE: the SongJam partnership is **paused as of 2026-07-02** - do not feature SongJam/SANG as a current ZAO partner. The open-source tech exists, but treat the capture problem as ZAO's to solve, not a SongJam-branded solution.
- **Manual capture** - the zero-cost start: after each Space, the host jots peak listeners into a sheet/tracker. Ugly but real, and it beats zero.

## The smallest step that produces a real number

Do not build a system first. For the next two weeks, **log peak-concurrent-listeners for each ZAO Space by hand** (the host sees it live). Fourteen days x ~2 Spaces/day = ~28 data points. That alone turns "unknown" into a defensible range, and tells you whether an automated capture tool is even worth building. Measure by hand, then automate what proves worth automating.

## Also See

- [Doc 978](../978-zao-numbers-framing/) - the numbers framing; a captured Spaces number would slot into its "community size" section as a distinct, honest metric.
- [Doc 979](../../events/979-yozf-calendar-priority-events/) - the standing-Spaces inventory (which rooms to measure).
- [[project_logesh_songjam]] - the data-loss finding + the transcription-tool wedge (and the paused-partner caveat).

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Hand-log peak concurrent listeners for every ZAO Space for 14 days (host sees it live); dump into a sheet | @Zaal | Ops | 2026-07-20 |
| Pull the X Spaces native per-Space analytics from the host account for the last 30 days to backfill a baseline | @Zaal | Data | 2026-07-20 |
| After 2 weeks of manual data, decide whether an auto-capture tool (~$10-15/mo) is worth building | @Zaal | Decision | 2026-08-03 |
| Once a baseline exists, add "unique weekly Spaces attendees" to Doc 978 as a citable metric | @Zaal | Edit | 2026-08-10 |

## Sources

- [FULL] [Doc 979](../../events/979-yozf-calendar-priority-events/) - the standing ZAO Spaces inventory (what rooms exist to measure).
- [FULL] [[project_logesh_songjam]] memory - the "WaveWarZ loses data by not capturing Spaces" finding, the transcription-tool wedge, and the 2026-07-02 partnership-paused caveat.
- [FAILED] Live per-Space attendance numbers - require Zaal's X/host-account login, not accessible in-session. This is why the doc ships a framework + a manual-capture start rather than figures. Marked as the first Next Action to unblock.
