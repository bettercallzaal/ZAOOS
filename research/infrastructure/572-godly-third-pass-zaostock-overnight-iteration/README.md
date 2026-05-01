---
topic: infrastructure
type: guide
status: research-complete
last-validated: 2026-04-30
related-docs: 570, 571
tier: STANDARD
---

# 572 — Godly Third Pass + Festival Microsites Overnight Iteration

> **Goal:** Pull patterns from Lusion + Cosmos + festival microsites (DDD Palermo, Joy From Africa, Mirage Festival, London Soundtrack) for overnight ZAOstock /test iteration. Building while Zaal sleeps.

## Key Decisions

| # | Move | Source | Target | Complexity | Status |
|---|---|---|---|---|---|
| 1 | Hover tilt 3-6° on cards (lineage, partners, team mosaic) | Joy From Africa (6° hover tilts on nominee portraits) | `/test` | S | Tonight |
| 2 | "Scroll to explore" eyebrow + scroll indicator near hero bottom | Lusion ("scroll to explore", "CONTINUE TO SCROLL") | `/test` | S | Tonight |
| 3 | Animated gradient background layer (CSS-only, infinite loop) | Mirage Festival ("infinite background gradient animation") | `/test` | S | Tonight |
| 4 | Sponsor/partner-tag marquee row (chip pills scrolling like Cosmos client logos) | Cosmos (logo bar repeats 5x infinite scroll) | `/test` | S | Tonight |
| 5 | Tag chips on lineage cards (`IRL • NYC • 12 artists` style) | Lusion Featured Work tags | `/test` | S | Tonight |
| 6 | Split-screen asymmetric color gradient | DDD Palermo (sunset coral ↔ Tyrrhenian teal) | `/test` Crossroads section | M | Future |
| 7 | Lenis-driven parallax | DDD Palermo, Festivent | `/test` | L | Future, needs lib |
| 8 | GSAP letter-offset reveal animation | Joy From Africa Monument Grotesk slams | `/test` hero | L | Future, needs lib |
| 9 | Sticky bottom ticket button (kept on screen always) | DDD Palermo | already shipped | DONE | Glass dock covers |
| 10 | prefers-reduced-motion respect on all animations | All festival sites | `/test` | S | Tonight |

## Ship-Tonight Set (5 moves)

Confined to S complexity = pure CSS + small React state, no new deps:
1. Tilt cards
2. Scroll-to-explore eyebrow
3. Animated background gradient
4. Tag chips marquee
5. Reduced motion respect

Estimated diff: ~150 lines across 2-3 components + 1 new component.

## Sources

- [Lusion](https://www.lusion.co/) — verified 2026-04-30. 3D studio. Source for "scroll to explore" pattern + work grid tags.
- [Cosmos](https://www.cosmos.so/) — verified 2026-04-30. Pinterest-for-creators. Source for masonry image grid + infinite logo marquee.
- [Tatem Studio](https://www.tatem.studio/) — fetch 503; revisit later.
- [Endless](https://endless.land/) — fetch 503; revisit later.
- [Joy From Africa awards site](https://www.refs.gallery/projects/joy-from-africa) — verified 2026-04-30. 6° tilt + GSAP letter-offsets + Monument Grotesk + electric amber accent.
- [DDD Palermo](https://www.refs.gallery/projects/digital-design-days-x) — verified 2026-04-30. Sunset coral ↔ Tyrrhenian teal split-screen gradient.
- [Mirage Festival 2020](https://www.martin-laxenaire.fr/mirage-festival-2020.html) — verified 2026-04-30. Infinite background gradient + retro-futuristic marquees.
- [London Soundtrack Festival site case study](https://baxterandbailey.co.uk/work/london-soundtrack-festival-website/) — verified 2026-04-30. Code-driven SVG animation patterns.
- [Festivent (Awwwards)](http://awwwards.com:8080/sites/festivent) — verified 2026-04-30. Preloader + scrollable gallery + parallax.

## Action Bridge

| Action | Owner | Type | By When |
|---|---|---|---|
| Ship moves 1-5 (S complexity) overnight | @Claude | PR | Tonight |
| Move 6 (split-screen gradient) | @Claude | Follow-up PR | Post-birthday |
| Moves 7-8 (Lenis + GSAP) | @Zaal/Designer | Eval | Post-birthday |

## Also See

- [Doc 570 — first godly pass](../570-zaostock-landing-redesign-godly-festival-patterns/)
- [Doc 571 — second godly pass + donate + birthday](../571-godly-second-pass-zaostock-iteration-2/)
