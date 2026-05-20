#!/usr/bin/env python3
"""
Ingest every research/<...>/README.md from ZAOOS into the ZABAL bonfire.

768 READMEs across topic folders (agents, business, community, music,
infrastructure, etc) + numbered hub docs at the research/ root. Each
becomes one episode with frontmatter metadata + README excerpt.

Big test for the IngestPipeline + secret_scan filter - real institutional
content over years, some old docs might have leaked creds. Scanner blocks
HIGH severity by default; sanitize mode redacts-and-sends.

Run:
    set -a; . /root/cowork-zaodevz/agent/.env; set +a
    cd /root/cowork-zaodevz-checkout  # or wherever ZAOOS clone lives
    python3 scripts/bonfire-ingest/ingest_research_library.py [--sanitize] [--dry-run] [--limit N]

If ZAOOS isn't cloned on the VPS yet:
    git clone https://github.com/bettercallzaal/ZAOOS.git /root/zaoos-checkout
    cd /root/zaoos-checkout
    git checkout main
"""

import argparse
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from bonfire_client import IngestPipeline


BODY_CAP = 4000  # chars per episode

# Pull the frontmatter (YAML between --- ... ---) into a dict-ish summary
FM_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)


def parse_frontmatter(text):
    m = FM_RE.match(text)
    if not m:
        return {}, text
    fm_raw = m.group(1)
    body = text[m.end():]
    fm = {}
    for line in fm_raw.split("\n"):
        if ":" not in line:
            continue
        k, _, v = line.partition(":")
        fm[k.strip()] = v.strip().strip("\"'")
    return fm, body


def parse_doc_number_from_path(path):
    """research/agents/665-bonfires-deep-dive/README.md -> ('agents', '665', 'bonfires-deep-dive')"""
    parts = path.split(os.sep)
    if len(parts) < 3:
        return None
    # Look for the NNN-slug pattern in any segment
    for seg in parts[1:]:
        m = re.match(r"^(\d{3})-(.+)$", seg)
        if m:
            # category = first non-prefix segment
            topic = "general"
            for p in parts:
                if p in ("research", seg, "README.md"):
                    continue
                if re.match(r"^\d{3}-", p):
                    continue
                topic = p
                break
            return (topic, m.group(1), m.group(2))
    return None


def build_episode(path, content, fm, doc_id, slug, topic):
    """Build a natural-language episode body from a research doc."""
    title = fm.get("title") or fm.get("name") or slug.replace("-", " ").title()
    doc_type = fm.get("type", "research")
    status = fm.get("status", "unknown")
    last_validated = fm.get("last-validated") or fm.get("last_validated") or "unknown"
    tier = fm.get("tier", "")

    header = (
        f"ZAO research doc #{doc_id} in the '{topic}' topic: {title}. "
        f"Type: {doc_type}. Status: {status}. Last validated: {last_validated}."
        f"{' Tier: ' + tier + '.' if tier else ''} "
        f"Lives at research/{topic}/{doc_id}-{slug}/README.md in the bettercallzaal/ZAOOS repo. "
    )

    # Take the first chunk of the body content (after frontmatter)
    body_excerpt = content.strip()[:BODY_CAP]
    suffix = ""
    if len(content.strip()) > BODY_CAP:
        suffix = f" ...[truncated, full doc {len(content)} chars]"

    return header + "Doc content excerpt: " + body_excerpt + suffix


def walk_research(root):
    """Yield (path, frontmatter, body, topic, doc_id, slug) for each README.md."""
    for dirpath, dirs, files in os.walk(root):
        # Skip hidden dirs (.git etc) + _archive + _graph + _handoffs
        dirs[:] = [d for d in dirs if not d.startswith(".") and not d.startswith("_")]
        for fn in files:
            if fn != "README.md":
                continue
            path = os.path.join(dirpath, fn)
            rel = os.path.relpath(path, start=os.path.dirname(root))
            try:
                content = open(path, "r", encoding="utf-8", errors="replace").read()
            except Exception as e:
                print(f"  [SKIP] {rel}: {e}")
                continue

            fm, body = parse_frontmatter(content)
            doc_info = parse_doc_number_from_path(rel)
            if doc_info:
                topic, doc_id, slug = doc_info
            else:
                # Top-level README.md or topic-folder README.md (no number)
                topic_match = re.match(r"research/([^/]+)/README\.md", rel)
                if topic_match:
                    topic = topic_match.group(1)
                    doc_id = "topic"
                    slug = topic + "-index"
                elif rel == "research/README.md":
                    topic = "root"
                    doc_id = "topic"
                    slug = "library-index"
                else:
                    # Skip unrecognized files
                    continue
            yield (rel, fm, content, topic, doc_id, slug)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sanitize", action="store_true", help="redact HIGH-severity hits and post; default = block")
    ap.add_argument("--dry-run", action="store_true", help="don't actually POST")
    ap.add_argument("--limit", type=int, default=0, help="ingest only first N (0 = all)")
    ap.add_argument("--research-root", default=None, help="path to research/ dir (default: cwd/research)")
    args = ap.parse_args()

    root = args.research_root or os.path.join(os.getcwd(), "research")
    if not os.path.isdir(root):
        print(f"research/ not found at {root}. Pass --research-root or cd into a ZAOOS checkout.")
        sys.exit(2)

    print(f"=== ingesting research/ from {root} ===")
    print(f"sanitize: {args.sanitize}, dry-run: {args.dry_run}, limit: {args.limit or 'no limit'}")
    print()

    p = IngestPipeline(label="research-library", sanitize=args.sanitize, dry_run=args.dry_run)

    count = 0
    skipped = 0
    for rel, fm, content, topic, doc_id, slug in walk_research(root):
        count += 1
        if args.limit and count > args.limit:
            count -= 1
            break
        body = build_episode(rel, content, fm, doc_id, slug, topic)
        print(f"[{count:3d}] {rel}")
        result = p.ingest(
            name=f"research:{topic}:{doc_id}:{slug}",
            body=body,
            source_description=f"zaoos-research:{rel}",
        )
        # Gentle pacing to be nice to the API
        time.sleep(0.2)

    p.report()
    print(f"\nprocessed: {count}")


if __name__ == "__main__":
    main()
