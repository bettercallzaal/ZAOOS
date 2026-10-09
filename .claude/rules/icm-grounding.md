# ICM Grounding - the ZAO agent kit's source of truth

The ICM boxes (useicm.com) are the canonical AI-readable definition of every ZAO brand and project. History: `research/dev-workflows/2649-rules-history/archive/icm-grounding.md`; docs 1016, 1021.

**Before working on, describing, or generating anything for a ZAO brand/project, GROUND on its ICM box first.**

- **Read (unauthenticated):** `https://useicm.com/api/objects/<id>/llm.txt` with browser headers (`User-Agent: Mozilla/5.0 ...`, `Origin: https://useicm.com`, `Referer: https://useicm.com/`); plain curl gets 403.
- **Box ids:** `~/.zao/private/icm-registry.json`. Ids are reliable; its `content` field is a stale mirror - curl the endpoint for truth.
- **Write (Zaal-gated - publishing public content):** `PUT /api/objects/<hash>/llm.txt` with `{"body": "<markdown>"}` and `Authorization: Bearer <api_key>` from `~/.zao/private/icm-keys.json` (never print/commit). Verify by re-fetching and byte-comparing. Repo copy of each body: `research/identity/icm-boxes/`.
- The `icm` CLI, `zao-icm.py` and `/icm` skill were absent from this Mac on 2026-08-19 and never git-tracked; check with `command -v` before relying on them.
- A subagent doing brand work is handed the relevant box's content in its prompt.

**ICM is upstream.** A site's `llms.txt`, JSON-LD, pitch copy and social bios are generated from the box, not hand-written in parallel. If the box and a downstream surface disagree, the box wins - update the surface, or if the box is stale, update the box first, then the surface.
