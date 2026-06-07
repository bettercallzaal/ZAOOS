#!/usr/bin/env python3
"""
Ingest the ZABAL Brand Kit (bettercallzaal.com/brands.json) into the
ZABAL bonfire as one episode per brand.

Re-implemented on top of bonfire_client.IngestPipeline so the secret
scanner runs on every episode before POST. Original /tmp/ingest-brand-kit.sh
was a one-shot; this is the durable version that lives in the repo.

Run:
    set -a; . /root/cowork-zaodevz/agent/.env; set +a
    python3 scripts/bonfire-ingest/ingest_brand_kit.py
"""

import json
import os
import sys
import urllib.request

# Make sibling imports work regardless of cwd
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from bonfire_client import IngestPipeline


BRAND_KIT_URL = "https://bettercallzaal.com/brands.json"


def fetch_brand_kit():
    req = urllib.request.Request(BRAND_KIT_URL, headers={"User-Agent": "Mozilla/5.0 (compatible; ZAOcoworkingBot/0.3.1)"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read().decode("utf-8"))


def build_episode(brand, categories):
    name = brand["name"]
    cat = categories.get(brand.get("category"), brand.get("category", "uncategorized"))
    parts = [
        f"{name} is a {brand.get('tag', '').lower()} in the ZABAL brand ecosystem, category: {cat}, status: {brand.get('status', '')}.",
        brand.get("blurb", ""),
    ]
    if brand.get("founded"):
        parts.append(f"Founded: {brand['founded']}.")
    if brand.get("audience"):
        parts.append(f"Audience: {brand['audience']}.")
    if brand.get("monetization"):
        parts.append(f"Monetization: {brand['monetization']}.")

    links = brand.get("links", [])
    if links:
        link_str = ", ".join(f"{l['label']} ({l['url']})" for l in links)
        parts.append(f"Public links: {link_str}.")

    plug = brand.get("plugIn", {})
    if plug:
        plug_parts = []
        for role in ("sponsor", "collab", "customer", "contributor"):
            r = plug.get(role)
            if isinstance(r, dict) and r.get("label"):
                plug_parts.append(f"{role}: {r['label']}")
        if plug.get("contact"):
            plug_parts.append(f"contact {plug['contact']}")
        if plug_parts:
            parts.append("How to plug in: " + "; ".join(plug_parts) + ".")

    parts.append("This brand is part of Zaal Panthaki's BCZ Strategies LLC umbrella under the ZABAL impact network.")
    return " ".join(parts)


def main():
    print(f"=== fetching brand kit from {BRAND_KIT_URL} ===")
    d = fetch_brand_kit()
    brands = d["brands"]
    cats = {c["id"]: c["label"] for c in d.get("categories", [])}
    print(f"  {len(brands)} brands, version {d.get('version')}")
    print()

    p = IngestPipeline(label="brand-kit", sanitize=False, dry_run=False)
    for brand in brands:
        body = build_episode(brand, cats)
        p.ingest(
            name=f"brand:{brand['id']}",
            body=body,
            source_description=f"bcz-brand-kit:{brand['id']}",
            provenance="canonical",  # official BCZ brand kit
        )
    p.report()


if __name__ == "__main__":
    main()
