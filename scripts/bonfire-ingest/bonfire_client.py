#!/usr/bin/env python3
"""
Thin Bonfires API client + ingest pipeline with mandatory secret-scan gate.

Use from any ingest script:

    from bonfire_client import IngestPipeline

    p = IngestPipeline(label="brand-kit")
    for brand in brands:
        p.ingest(
            name=f"brand:{brand['id']}",
            body=build_brand_episode(brand),
            source_description=f"bcz-brand-kit:{brand['id']}",
        )
    p.report()

Behavior:
- Every episode body passes through secret_scan.preflight() before POST.
- HIGH severity hits block the POST + log to a quarantine file.
- MED / LOW hits log but don't block (caller can opt into sanitize mode).
- All POSTs target the verified /knowledge_graph/episode/create endpoint.
- Spool-style: full manifest of (sent, blocked, failed) written to disk.

Env: BONFIRE_API_KEY, BONFIRE_ID, BONFIRE_API_URL (default tnt-v2.api.bonfires.ai).
"""

import json
import os
import time
import urllib.error
import urllib.request
import uuid as _uuid

import secret_scan
import pii_scan


class IngestPipeline:
    def __init__(self, label, sanitize=False, dry_run=False):
        self.label = label
        self.sanitize = sanitize  # if True, redact HIGH hits + send sanitized; else block
        self.dry_run = dry_run

        self.api_key = os.environ.get("BONFIRE_API_KEY")
        self.bonfire_id = os.environ.get("BONFIRE_ID")
        self.api_url = os.environ.get("BONFIRE_API_URL", "https://tnt-v2.api.bonfires.ai")
        if not self.api_key or not self.bonfire_id:
            raise SystemExit("[ingest] BONFIRE_API_KEY or BONFIRE_ID missing from env")

        self.now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self.epoch = int(time.time())
        self.results = {
            "sent": [], "blocked": [], "failed": [], "sanitized": [], "pii_blocked": [],
        }

    def ingest(self, name, body, source_description, reference_time=None, source="text"):
        """Single-episode ingest. Returns dict with status info."""
        # Mandatory pre-flight scan
        scan = secret_scan.preflight(body, label=name)
        high = scan["summary"].get("HIGH", 0)

        if high > 0:
            if not self.sanitize:
                self.results["blocked"].append({
                    "name": name,
                    "source_description": source_description,
                    "high": high,
                    "med": scan["summary"].get("MED", 0),
                    "low": scan["summary"].get("LOW", 0),
                    "hits": scan["hits"],
                })
                print(f"  [BLOCKED] {name}: {high} HIGH-severity hits - not posting")
                for h in scan["hits"]:
                    if h["severity"] == "HIGH":
                        print(f"             - {h['pattern']:24s} {h['excerpt']}")
                return {"status": "blocked", "high_hits": high}
            else:
                # Sanitize mode: redact + send the cleaned version
                body, _ = secret_scan.sanitize_text(body)
                self.results["sanitized"].append({"name": name, "high": high})
                print(f"  [SANITIZED] {name}: {high} HIGH-severity hits redacted")

        # MED / LOW hits are reported but not blocked
        if scan["summary"].get("MED", 0) > 0 or scan["summary"].get("LOW", 0) > 0:
            for h in scan["hits"]:
                if h["severity"] in ("MED", "LOW"):
                    print(f"  [{h['severity']}] {name}: {h['pattern']} {h['excerpt']}")

        # Second gate: PII scan (sibling to the secret gate, distinct policy).
        # Catches structured third-party PII — phone / SSN / card / address /
        # personal email / personal Telegram handle. HIGH blocks; MED logs.
        # Does NOT catch names or free-text health disclosures (regex can't) —
        # the bot's human "Approve?" step remains the backstop for those.
        # See scripts/bonfire-ingest/pii_scan.py + doc 798.
        pii = pii_scan.preflight(body, label=name)
        pii_high = pii["summary"].get("HIGH", 0)
        if pii_high > 0:
            if not self.sanitize:
                self.results["pii_blocked"].append({
                    "name": name,
                    "source_description": source_description,
                    "high": pii_high,
                    "med": pii["summary"].get("MED", 0),
                    "hits": pii["hits"],
                })
                print(f"  [PII-BLOCKED] {name}: {pii_high} HIGH-severity PII hits - not posting")
                for h in pii["hits"]:
                    if h["severity"] == "HIGH":
                        print(f"             - {h['pattern']:26s} {h['excerpt']}")
                return {"status": "pii_blocked", "pii_high_hits": pii_high}
            else:
                body, _ = pii_scan.sanitize_text(body)
                self.results["sanitized"].append({"name": name, "pii_high": pii_high})
                print(f"  [PII-SANITIZED] {name}: {pii_high} HIGH-severity PII hits redacted")
        if pii["summary"].get("MED", 0) > 0:
            for h in pii["hits"]:
                if h["severity"] == "MED":
                    print(f"  [PII-MED] {name}: {h['pattern']} {h['excerpt']}")

        # v0.2 - generate a client-side UUID per episode + supply via the
        # `uuid` field on CreateEpisodeDirectRequest. The Bonfires API accepts
        # pre-assigned UUIDs (per OpenAPI). Capturing it in the manifest lets
        # us verify episodes later via /knowledge_graph/episode/{uuid} once
        # the API surface stabilises. NOTE as of 2026-05-18: GET by UUID
        # still returns 404 even seconds-to-minutes after POST - Bonfires
        # may store under an internal-only UUID that differs from the
        # supplied one. We capture the UUID anyway because it's the only
        # stable handle we have + future API maturity may make it queryable.
        episode_uuid = str(_uuid.uuid4())

        # Build the request
        req = {
            "bonfire_id": self.bonfire_id,
            "name": f"{name}:{self.epoch}",
            "episode_body": body,
            "source": source,
            "source_description": source_description,
            "reference_time": reference_time or self.now,
            "uuid": episode_uuid,
        }

        if self.dry_run:
            print(f"  [DRY-RUN] would POST {name} ({len(body)}c) uuid={episode_uuid[:8]}...")
            return {"status": "dry-run", "uuid": episode_uuid}

        # POST
        url = f"{self.api_url.rstrip('/')}/knowledge_graph/episode/create"
        data = json.dumps(req).encode("utf-8")
        r = urllib.request.Request(
            url,
            data=data,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(r, timeout=30) as resp:
                resp_json = json.loads(resp.read().decode("utf-8"))
            ok = resp.status == 200 and resp_json.get("success") is True
            task = resp_json.get("task_id") if ok else None
            if ok:
                self.results["sent"].append({
                    "name": name,
                    "uuid": episode_uuid,
                    "task": task,
                    "source_description": source_description,
                })
                print(f"  [OK] {name} -> uuid={episode_uuid[:8]}... task={task}")
                return {"status": "sent", "uuid": episode_uuid, "task_id": task}
            else:
                err = str(resp_json)[:200]
                self.results["failed"].append({"name": name, "uuid": episode_uuid, "error": err})
                print(f"  [FAIL] {name}: {err}")
                return {"status": "failed", "uuid": episode_uuid, "error": err}
        except urllib.error.HTTPError as e:
            err = f"HTTP {e.code}: {e.read().decode('utf-8')[:200]}"
            self.results["failed"].append({"name": name, "uuid": episode_uuid, "error": err})
            print(f"  [FAIL] {name}: {err}")
            return {"status": "failed", "uuid": episode_uuid, "error": err}
        except Exception as e:
            err = str(e)
            self.results["failed"].append({"name": name, "uuid": episode_uuid, "error": err})
            print(f"  [FAIL] {name}: {err}")
            return {"status": "failed", "uuid": episode_uuid, "error": err}

    def report(self, manifest_path=None):
        """Print summary + write manifest."""
        print()
        print(f"=== ingest summary ({self.label}) ===")
        for k, v in self.results.items():
            print(f"  {k}:      {len(v)}")
        if not manifest_path:
            manifest_path = f"/root/.zaocoworking/ingest-{self.label}-{self.epoch}.json"
        os.makedirs(os.path.dirname(manifest_path), exist_ok=True)
        with open(manifest_path, "w") as f:
            json.dump({
                "ts": self.now,
                "label": self.label,
                "sanitize_mode": self.sanitize,
                "summary": {k: len(v) for k, v in self.results.items()},
                "details": self.results,
            }, f, indent=2)
        print(f"  manifest: {manifest_path}")


if __name__ == "__main__":
    # Quick connectivity test (no actual POST)
    p = IngestPipeline(label="connectivity-test", dry_run=True)
    p.ingest(
        name="test:1",
        body="This is a clean episode with no secrets.",
        source_description="test",
    )
    p.ingest(
        name="test:2",
        body="This has a synthetic key-shaped string sk-ant-FAKE000FAKE000FAKE000FAKE000FAKE",
        source_description="test",
    )
    p.ingest(
        name="test:3-pii",
        body="Contact info leak: call (555) 123-4567 or SSN 123-45-6789.",
        source_description="test",
    )
    p.report(manifest_path="/tmp/test-manifest.json")
