# Bonfire Ingestion Pipeline

One-stop directory for piping content into the ZABAL bonfire with a
mandatory secret-scan gate. Built 2026-05-18 after the Phase 1 deploy
(doc 669) confirmed the live endpoint at
`POST https://tnt-v2.api.bonfires.ai/knowledge_graph/episode/create`.

## Files

| File | Role |
|---|---|
| `secret_scan.py` | Sensitive-info detector (API keys / tokens / PEM). Distinguishes template placeholders from real secrets. Exports `scan_text`, `sanitize_text`, `preflight`. |
| `pii_scan.py` | Third-party **PII** detector (phone / SSN / card / address / personal email / personal Telegram handle), allowlist-aware per `.claude/rules/pii-hygiene.md`. Same `scan_text` / `sanitize_text` / `preflight` API. Catches *structured* PII only — not names or free-text health disclosures (see doc 798). |
| `bonfire_client.py` | `IngestPipeline` class. v0.2: generates client-side UUID per episode, supplies via `uuid` field, captures in manifest. Runs BOTH the secret gate and the PII gate before every POST; HIGH hits from either block by default. Writes a manifest per run. |
| `ingest_brand_kit.py` | Pipes `bettercallzaal.com/brands.json` (31 brands) into bonfire, one episode per brand. |
| `ingest_github_readmes.py` | Pipes README files for every `bettercallzaal/*` repo (80 active). Public via raw.githubusercontent.com, private via GitHub API + `GITHUB_TOKEN`. |
| `ingest_research_library.py` | Pipes every `research/<topic>/<NNN>-<slug>/README.md` from ZAOOS (~670 active docs). Skips `_archive`, `_graph`, `_handoffs`. |
| `verify_manifest.py` | Walks a manifest and tries GET / expand for each episode UUID. Forward-compatible: GETs currently return 404 even for confirmed-by-dashboard episodes (Bonfires storage uses internal UUIDs that differ from supplied ones as of 2026-05-18); script will start working once the API surface matures. |
| `trigger_labeling.py` | Triggers `/labeling/hybrid` to populate the vector store so `/vector_store/search` becomes usable. Default = dry-run. Pass `--really` only after asking Joshua about cost / idempotency / runtime. |

## Secret-scan policy

Every episode body passes through `preflight()` before POST.

| Severity | Examples | Default action |
|---|---|---|
| HIGH | `sk-ant-*`, `ghp_*`, Telegram bot tokens, ETH private keys, PEM keys, mongo/postgres URLs WITH creds, env-assignments with high-entropy values | BLOCK (don't post) |
| MED | Iman VPS IP (187.77.3.104), RFC1918 private IPs, supabase project URLs | Log + post |
| LOW | personal-domain emails (gmail/icloud/etc), template placeholders (`KEY=your_key_here`, `KEY=xxxx`, `KEY=changeme`) | Log + post |

The `template_placeholder` classifier explicitly downgrades obvious
dummy values (`xxxx`, `your_key_here`, `<...>`, `changeme`, etc) from
HIGH to LOW so README setup-instructions don't trigger false positives.

To override the block on HIGH hits and post a sanitized version
(actual key replaced with `[REDACTED:pattern_name]`), pass `--sanitize`
to the ingest script.

## PII-scan policy

A second, independent gate (`pii_scan.py`) runs after the secret gate.
Distinct concern: secrets = credential theft; PII = third-party personal
data leakage. Severity is deliberately asymmetric — the graph legitimately
holds people, so emails/handles are flagged not blocked, and over-blocking
the 670-doc research-library ingest is the failure mode we avoid.

| Severity | Examples | Default action |
|---|---|---|
| HIGH | formatted phone `(555) 123-4567`, US SSN, Luhn-valid credit card, context-labeled DOB | BLOCK (don't post) |
| MED | non-allowlisted email, non-allowlisted personal Telegram handle (`@GCvlcnti`), street address | Log + post |
| (skip) | allowlisted emails (`zaal@thezao.com`, role emails) + bot handles (`@zabal_bonfire_bot`, `*_bot`) | ignored |

`--sanitize` redacts PII HIGH hits to `<redacted-phone>` / `<redacted-ssn>` /
`<redacted-cc>` and posts the cleaned body, same as the secret gate.

**Hard limitation:** regex catches structured PII only. A person's NAME or a
free-text sensitive disclosure ("diagnosed with X") is just words — this gate
will not catch it. The bot's human `Approve?` step is the backstop for those.
The full analysis + recommended LLM-classifier follow-up is in doc 798.

## Running an ingest

All scripts assume env vars from the bot's `.env`:

```bash
ssh root@<vps>
set -a; . /root/cowork-zaodevz/agent/.env; set +a
python3 scripts/bonfire-ingest/ingest_brand_kit.py
python3 scripts/bonfire-ingest/ingest_github_readmes.py
```

Env needed:
- `BONFIRE_API_KEY` (required - revealed via signed message at app.bonfires.ai)
- `BONFIRE_ID` (required - the ZABAL bonfire id)
- `BONFIRE_API_URL` (optional - defaults to `https://tnt-v2.api.bonfires.ai`)
- `GITHUB_TOKEN` (optional - lets the GitHub README ingester reach private repos)

## Manifests

Each run writes a JSON manifest to `~/.zaocoworking/ingest-<label>-<epoch>.json`
with the full list of (sent, blocked, failed, sanitized, pii_blocked) episodes + task ids.

## Adding a new ingest source

Pattern:

```python
from bonfire_client import IngestPipeline

p = IngestPipeline(label="research-library")
for doc in docs:
    p.ingest(
        name=f"research:{doc['number']}",
        body=build_episode(doc),
        source_description=f"zaoos-research:{doc['path']}",
    )
p.report()
```

The `IngestPipeline` handles preflight + POST + manifest writing.

## Related docs

- `research/agents/665-bonfires-deep-dive-zao-integration/` - entry point
- `research/agents/669-bonfires-everything-we-know/` - canonical hub
- `research/agents/673-zoe-bonfires-dialog-automation/` - Phase 2 spec
- `.claude/rules/secret-hygiene.md` - the broader secret-handling policy
  that informed `secret_scan.py`'s pattern list
- `.claude/rules/pii-hygiene.md` - the PII policy + allowlists that informed
  `pii_scan.py` (Rule 3 banned patterns, email + Telegram-handle allowlists)
- `research/agents/798-bonfire-graph-quality-audit/` - graph data-quality
  audit (confidence calibration, provenance, the PII-gate gap this closes)
