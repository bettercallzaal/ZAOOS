# ICM Grounding - the ZAO agent kit's source of truth

mechanism: none yet (since 2026-10-23, #4155)

The ICM boxes are the canonical AI-readable definition of every ZAO brand and project. **Since Zaal's 2026-10-11 ruling the master copy is the `bettercallzaal/zao-icm` repo, folder `boxes/`, served at `https://context.thezao.com/<name>`** (recorded in `research/identity/icm-boxes/README.md`). useicm.com is a frozen legacy copy: never read it as current. History: `research/dev-workflows/2649-rules-history/archive/icm-grounding.md`; docs 1016, 1021.

**Before working on, describing, or generating anything for a ZAO brand/project, GROUND on its ICM box first.**

- **Read:** `curl https://context.thezao.com/<name>` (plain curl; 200 for `bettercallzaal` on 2026-10-21), or `boxes/<name>.llm.txt` in zao-icm on main. The old useicm read route (`https://useicm.com/api/objects/<id>/llm.txt` with browser headers) serves the frozen copy only.
- **Box names:** the file names in zao-icm `boxes/` (`<name>.llm.txt`). The ids in `~/.zao/private/icm-registry.json` belong to the frozen useicm copy.
- **Write (Zaal-gated - publishing public content):** a PR to zao-icm `boxes/`, never an edit here or a direct write to useicm. A box is public text, so that PR is Zaal's merge. The legacy useicm `PUT` (keys in `~/.zao/private/icm-keys.json`, never printed or committed) is Zaal's alone, for freezing that copy.
- The `icm` CLI, `zao-icm.py` and `/icm` skill were absent from this Mac on 2026-08-19 and never git-tracked; check with `command -v` before relying on them.
- A subagent doing brand work is handed the relevant box's content in its prompt.

**ICM is upstream.** A site's `llms.txt`, JSON-LD, pitch copy and social bios are generated from the box, not hand-written in parallel. If the box and a downstream surface disagree, the box wins - update the surface, or if the box is stale, update the box first, then the surface.
