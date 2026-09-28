---
topic: infrastructure
type: decision
status: research-complete
last-validated: 2026-09-28
superseded-by:
related-docs: "infrastructure/313-metaverse-3d-virtual-world-zao"
original-query: "the best CAD / scene-description format to work with AI for a shareable, draggable event site layout (parklet festival), where an LLM can read and write the layout file directly and non-technical team members can rearrange it in a browser"
tier: STANDARD
---

# 2572 - The best AI-writable format for a shareable event site layout

> **Goal:** Pick the file format and tool for a ZAOstock parklet layout that an LLM can read and write directly, that Steve, Candy, Tom and DCoop can rearrange in a browser, and that can exist before 3 October 2026.

## Key Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **The source of truth is a compact YAML site spec in `zao-vault`, NOT a CAD file.** | Raw Excalidraw JSON for a 50-node diagram is about **100 KB / 25,000 tokens**; the equivalent SDK code is about **2 KB / 500 tokens**, a 50x compression (drawmode). An LLM editing the rich format also produces structurally broken output, because the format carries non-obvious invariants - bound text needs TWO elements, arrows need bidirectional `boundElements` and `endBinding` references. **Do not make the model write the format the renderer reads.** |
| 2 | **USE OnePlan's free tier as the team-facing surface**, at oneplan.io. | It is the only option measured here that is PURPOSE-BUILT for event site plans: to-scale drag and drop, real-time collaboration, share by link, no install. Free tier caps at **25 objects**, which is enough for one parklet. Zero build time, and five days out that is the whole argument. |
| 3 | **USE Excalidraw as the AI-writable mirror** if the spec must round-trip through a model. | `.excalidraw` is plain JSON, free, browser-based, collaborative, and it has the deepest agent tooling of any option: at least **five independent MCP servers / agent skills** exist for it (see Sources). tldraw is a close second with official AI documentation. |
| 4 | **SKIP glTF, USD, DXF, OpenSCAD and every true CAD format.** | They solve fabrication and rendering, not collaborative placement. None is hand-editable by a non-technical person in a browser, and an LLM writing DXF or USD is writing a format with no error feedback until it fails to open. |
| 5 | **SKIP 3D entirely for the layout question.** | 3D answers "what does it look like from the street" - sightlines, signage height, stage backdrop. It is the wrong tool for "where does the Jenga go". Doc 313 covers the 3D/metaverse direction separately. |

## The core finding, and it is architectural rather than a product pick

Every mature AI-diagram project measured here converged on the same pattern independently: **an LLM should write a small semantic spec, and a deterministic compiler should produce the rich format.**

- **drawmode** (`emrul/drawmode`, published 2026-04-20) states it outright: the official Excalidraw MCP "sends raw JSON to the LLM... this blows up context windows... and the LLM still produces broken output". Its answer is a TypeScript SDK the model writes against, with **Graphviz doing layout** and WASM validating the result. It also ships `draw_describe`, a decompiler that turns existing `.excalidraw` JSON back into compact code, "so agents never need to read raw JSON".
- **`ddarmon/excalidraw-tools`** takes the same shape without the code layer: the model writes a `diagram.spec.json` of `nodes` and `edges`, and `excalidraw-tools build` emits valid `.excalidraw`. Its README says the point is that "you never have to write raw `.excalidraw` JSON by hand".
- **`duhman/excalidraw-mcp`** wraps the same idea in higher-level verbs - `nodes_compose`, `layout_flow`, `layout_swimlanes`, `layout_polish` - plus `scene_validate` and a `scene_quality_gate` before export.
- **`m9810223/tldraw-m9810223`** describes its own design as "tools take primitive args, return ids or `ok`. The full JSON only enters context when you call `get_shape` deliberately."
- **tldraw's official AI documentation** recommends sending the model **both** a screenshot and structured shape data, "because the image shows spatial relationships and styling, and the structured data gives exact text and positions".

For a parklet this is not a theoretical concern. A site plan is perhaps 20 objects. The spec is under 60 lines of YAML and any model can rewrite it correctly; the rendered scene is thousands of lines it would corrupt.

## The blocker is a tape measure, not software

**Measured 2026-09-28: the parklet has no recorded dimensions anywhere in the estate.** `docs/plans/production-plan-2026-10-03.md` in `ZAODEVZ/ZAOstock` carries no footprint, no measurements and no site diagram; `docs/site/` is about the website, not the site. A grep across `zao-vault/projects`, `meetings`, `notes` and `decisions` for parklet plus any dimension word returns only prose references to the location.

So **no format choice matters until six numbers exist**: parklet length and width, stage footprint and which end it occupies, stage-front to far edge, the street edge line, power drop positions, and fixed obstacles. Plus one overhead photograph to trace, which is already on the 28 September task list as a drone shot.

A layout everyone agrees on that is the wrong size is worse than no layout.

## Comparison

| Option | LLM reads/writes it | Non-technical browser editing | To scale | Free | Time to first useful artifact |
|---|---|---|---|---|---|
| **YAML site spec + compiler** | **Trivially** | No, on its own | Yes, by construction | Yes | Hours |
| **OnePlan** | No public write path found | **Yes, purpose-built** | **Yes** | Free to 25 objects | Minutes |
| **Excalidraw** | Yes, via 5+ MCP tools | Yes | Only if you enforce it | Yes | Hours |
| **tldraw** | Yes, official AI docs | Yes, embeddable | Only if you enforce it | Yes (MIT-era licence must be checked per version) | Hours |
| **SVG by hand** | Yes | Poor | Yes | Yes | Hours |
| **glTF / USD / DXF** | Badly | No | Yes | Yes | Days |

## The recommended shape for ZAOstock

1. `zao-vault/projects/zaostock-parklet-layout.yaml` - about 40 lines: a `site` block with real dimensions, then an `objects` list of `{id, label, x, y, w, h, kind}`. Versioned, diffable, and any lane can edit it.
2. A static `/layout` page on zaostock.com rendering that YAML top-down to scale, with the **ZAOSTOCK Assets PNG set** as the object art - it already contains `festival_canopy_tent_booth`, `folding_lawn_chair_striped`, `vintage_guitar_amplifier`, six directional signs, and the merch and food signs. Drag writes back updated coordinates.
3. OnePlan in parallel for the team, if the page is not ready in time. The YAML remains the record either way.

The asset set is the reason this is cheap: the icons are already drawn, already on brand, and already on the machine.

## Contradiction and limits, stated

- **No source was found that tests any of these formats specifically for event site planning with an LLM in the loop.** Every AI-diagram source measured here is about software architecture diagrams and flowcharts. The compression and brittleness findings transfer because they are about the FORMAT, not the subject matter; the layout-quality findings (Graphviz routing, swimlanes, arrow bending) do not transfer at all, because a site plan has no edges to route.
- **OnePlan's free-tier object cap of 25 is from its own marketing page and was not tested.** If the parklet plan needs more than 25 objects, that limit is the first thing to hit.
- **No licence file was read for tldraw or Excalidraw in this pass.** Hard Requirement 13 says a licence claim reads the LICENSE file; this doc therefore makes no licence claim beyond "free to use in a browser", which is observable.

## Also See

- [infrastructure/313-metaverse-3d-virtual-world-zao](../313-metaverse-3d-virtual-world-zao/) - the 3D direction, which is a different question from layout.
  **Cited by path, not by number, deliberately: `313` resolves to FIVE documents** in this library - one in `infrastructure/` and four in `music/` (ElevenLabs voice changer, TikTok/Reels AI music marketing, ElevenLabs Scribe v2, AI music production workflows). A bare "doc 313" is not a citation.

## Next Actions

| Action | Owner | Type | By When |
|--------|-------|------|---------|
| Measure the parklet: 6 numbers plus one overhead photo, written into `zao-vault/projects/zaostock-parklet-layout.yaml` | @Zaal | Measurement | 2026-09-28 |
| Create the YAML site spec from those measurements, committed to zao-vault | @Zaal (lane drafts) | Commit | 2026-09-29 |
| Build `/layout` on zaostock.com rendering the YAML to scale with the ZAOSTOCK PNG assets, drag writes coordinates back | @Zaal (Zaostock lane) | PR | 2026-10-01 |
| Decide OnePlan yes/no as the fallback team surface after seeing the 25-object cap against the real object count | @Zaal | Decision | 2026-09-30 |

## Sources

- [tldraw - AI integrations](https://tldraw.dev/docs/ai) - [FULL, method: exa web_search highlights] official docs; the send-both-screenshot-and-structured-data recommendation
- [emrul/drawmode](https://github.com/emrul/drawmode) - [FULL, method: exa web_search highlights] published 2026-04-20; the 25,000-token vs 500-token measurement and the Code Mode argument
- [ddarmon/excalidraw-tools](https://github.com/ddarmon/excalidraw-tools) - [FULL, method: exa web_search highlights] spec-to-diagram CLI plus an Agent Skill
- [duhman/excalidraw-mcp](https://github.com/duhman/excalidraw-mcp) - [FULL, method: exa web_search highlights] higher-level authoring verbs, `scene_validate`, `scene_quality_gate`
- [m9810223/tldraw-m9810223](https://github.com/m9810223/tldraw-m9810223) - [FULL, method: exa web_search highlights] 26-tool headless `.tldr` MCP; the token-cost design note
- [OnePlan](https://www.oneplan.io/) - [PARTIAL, method: WebSearch result summary only; the site itself was not fetched] free tier and 25-object cap are from the search summary of its own pages, not verified against the live pricing page
- [GoodEvent free floor plan tool](https://www.goodevent.com/free-tools/how-to-make-professional-event-floor-plans-for-free) - [PARTIAL, method: WebSearch result summary only]
- Local: `ZAODEVZ/ZAOstock` `docs/plans/production-plan-2026-10-03.md` - [FULL, read on disk] contains no dimensions, which is this doc's blocking finding
