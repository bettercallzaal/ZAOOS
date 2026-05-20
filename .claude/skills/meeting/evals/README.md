# /meeting Skill Evals

Regression fixtures for the meeting-capture skill. Run these after editing `SKILL.md` or the extraction logic to confirm the skill still extracts correctly.

## How to run

Feed the fixture transcript to the skill in paste mode, then diff the extraction JSON against the expected shape below. This is a manual eval - no harness yet. Anthropic skill-creator recommends an `evals/` dir; this is the lightweight version.

## Fixture 1 - Iman call (doc 670)

- **Source transcript:** `research/events/670-iman-call-may18-craig-pizzadao/README.md`
- **Project:** ZAO Devz
- **Expected:** 4 decisions, ~4-8 actions, 3+ quotes. Owners only Zaal / Iman / Both. Decision about ZAO Craig bot must be present. Due dates: PizzaDAO pitch = 2026-05-22, ZABAL Games signup = 2026-05-20.
- **Pass criteria:** no hallucinated owner outside {Zaal, Iman, Both}; ZABAL date is 2026-05-20 not Friday; all 4 decisions present.

## Fixture 2 - Tanja Fractal Book call (doc 675)

- **Source transcript:** `research/events/675-tanja-fractal-book-call-may18/README.md`
- **Project:** ZAO OS / general (Fractal)
- **Expected:** 4 decisions, 7 actions, 5+ quotes. New person "Tanja" detected -> 1 memory_update (`project_tanja_fractal_book`). Owner "Tanja" appears (outside the core allowlist) -> must surface as a non-team owner, not silently dropped.
- **Pass criteria:** Tanja recognized as a new entity; memory_update proposed; the "Reference Book" project captured in research_seeds or memory; no invented due dates.

## What each fixture checks

| Check | Fixture 1 | Fixture 2 |
|---|---|---|
| Owner allowlist enforced | yes | yes (non-team owner surfaced) |
| Relative date -> absolute | yes (Thursday/Friday) | n/a |
| New-entity -> memory_update | n/a | yes (Tanja) |
| confidence field on every item | yes | yes |
| Project routing inferred | ZAO Devz | ZAO OS / general |
| No hallucinated action items | yes | yes |

## Adding a fixture

Every time `/meeting` processes a real meeting, that recap doc becomes a candidate fixture. Add it here with: source path, project, expected counts, pass criteria.
