#!/usr/bin/env python3
"""check-doc-currency.py - flag research docs that make claims about files you changed.

WHY. On 2026-08-09 the same failure landed four times in one day: a document
that was confidently, specifically wrong because the thing it described had
moved underneath it.

  doc 2178          said the VPS runs 9 tmux loops. It runs 3.
  doc 743           lists two partners retired on 2026-07-31 as current.
  finals.html       described two Finals formats, neither of which was running.
  mission-control.ts was marked complete in its own doc and never wired in.

We have 24 rules in .claude/rules/. Every one is about not ASSERTING falsely -
anti-fabrication, state-claims, confirm-before-claiming-absence. NONE is about a
document quietly BECOMING false while nobody touches it. `agent-loops.md` rule 3
already says "read live code first, docs are aspirational", and we still built on
doc 2178's stale fleet table that morning. Discipline was tried; it does not hold.

WHAT THIS DOES, AND WHAT IT DELIBERATELY DOES NOT.

It does NOT ask you to update docs. It does not score staleness, guess intent, or
require a DESIGN.md per component - this repo already has 2,000+ research docs and
fragmenting further is the opposite of the fix.

It answers exactly one question: *of the docs that name a specific file by path,
which ones named a file this change touches?* Those docs made a checkable claim
about code that just moved. Everything else is left alone.

That narrowness is the whole design. A check that fires on every PR is one people
route around (.claude/rules/noisy-signal-guard.md), and this repo has already
produced one of those this week.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

# A path-shaped token inside a doc: at least one slash, a real source extension.
# Anchored on the repo's actual top-level source dirs so prose like "and/or" or a
# URL path never reads as a file reference.
PATH_RE = re.compile(
    r"\b((?:src|bot/src|scripts|packages|app|api|components|lib)/"
    r"[A-Za-z0-9_./\-\[\]]+\.(?:ts|tsx|js|jsx|mjs|py|sh|sql|json|ps1))\b"
)

# Docs that are explicitly historical do not rot - they are records of a moment.
ARCHIVAL_MARKERS = ("status: superseded", "type: incident-postmortem", "point-in-time")


def repo_root(start: Path) -> Path:
    out = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        cwd=start, capture_output=True, text=True, check=False,
    )
    return Path(out.stdout.strip()) if out.returncode == 0 else start


def changed_files(root: Path, base: str) -> list[str]:
    """Files changed against base. Never a pipeline - we need git's own status."""
    out = subprocess.run(
        ["git", "diff", "--name-only", f"{base}...HEAD"],
        cwd=root, capture_output=True, text=True, check=False,
    )
    if out.returncode != 0:
        out = subprocess.run(
            ["git", "diff", "--name-only", "--cached"],
            cwd=root, capture_output=True, text=True, check=False,
        )
    return [ln.strip() for ln in out.stdout.splitlines() if ln.strip()]


def index_docs(root: Path) -> dict[str, set[Path]]:
    """path -> {docs that name it}. Built fresh; never cached, so it cannot go stale."""
    index: dict[str, set[Path]] = defaultdict(set)
    for doc in (root / "research").rglob("README.md"):
        try:
            text = doc.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        head = text[:600].lower()
        if any(m in head for m in ARCHIVAL_MARKERS):
            continue
        for m in PATH_RE.finditer(text):
            index[m.group(1)].add(doc)
    return index


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="origin/main")
    ap.add_argument("--files", nargs="*", help="explicit file list instead of a git diff")
    ap.add_argument("--stats", action="store_true", help="report the index only")
    args = ap.parse_args()

    root = repo_root(Path.cwd())
    index = index_docs(root)

    if args.stats:
        docs = {d for s in index.values() for d in s}
        print(f"paths cited: {len(index)}")
        print(f"docs citing at least one path: {len(docs)}")
        return 0

    files = args.files if args.files else changed_files(root, args.base)
    # A doc changing does not make a doc stale.
    files = [f for f in files if not f.endswith("README.md")]
    if not files:
        return 0

    hits: dict[Path, list[str]] = defaultdict(list)
    for f in files:
        for doc in index.get(f, ()):
            hits[doc].append(f)

    if not hits:
        return 0

    print("Docs that make claims about files this change touches:\n")
    for doc, paths in sorted(hits.items()):
        rel = doc.relative_to(root)
        print(f"  {rel}")
        for p in sorted(set(paths)):
            print(f"      cites {p}")
    print(
        "\nEach of these named a file you just changed. Confirm the claim still holds,"
        "\nor update the doc in this PR."
        "\n\nNot every hit needs an edit - a doc can cite a file for context without"
        "\nmaking a claim about it. This is a prompt to look, not an accusation."
        "\n\nWhy: on 2026-08-09 four documents were confidently wrong because the code"
        "\nmoved and nothing made anyone re-read them (.claude/rules/state-claims.md)."
    )
    return 0  # advisory: this reports, it never blocks


if __name__ == "__main__":
    sys.exit(main())
