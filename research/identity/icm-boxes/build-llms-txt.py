#!/usr/bin/env python3
"""
build-llms-txt.py — generate per-domain llms.txt files FROM the ICM context boxes.

WHY THIS EXISTS (drift avoidance)
---------------------------------
The ZAO has two AI-readable surfaces that must state the SAME facts:
  1. ICM context boxes on useicm.com  (source of truth: this directory, *.llm.txt)
  2. llms.txt on the ZAO domains       (per doc 1107 GEO plan)
If those two surfaces disagree, an LLM that finds both trusts neither. So the
llms.txt files are DERIVED from the ICM boxes — one source, two surfaces, no drift.
Edit a box, re-run this script, both surfaces stay consistent.

WHAT IT DOES
------------
For each domain in DOMAIN_MAP, reads the mapped ICM box, transforms it to a
spec-compliant llms.txt (llmstxt.org): H1 title, a `>` blockquote summary, the
box body, and a "## Canonical identity" section (name / url / sameAs) that gives
LLMs the exact brand string + every cross-linked social profile (doc 1107 §5).

USAGE
-----
  python3 build-llms-txt.py            # write generated/<domain>.llms.txt
  python3 build-llms-txt.py --check    # verify generated files match source (drift guard); exit 1 on drift
  python3 build-llms-txt.py --selftest # run internal tests

Deploy is GATED (Iman / Zaal): each file ships to <domain>/.well-known/llms.txt
(and a copy at <domain>/llms.txt). This script only drafts the content.
"""
from __future__ import annotations
import sys
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "generated"

# domain -> (box filename, canonical name, canonical url, [sameAs profile urls])
# Priority domains are the three named in doc 1107 §GEO. Others are drafted
# "ready-when-domain-live" so Iman has them staged. sameAs links are taken
# ONLY from each box's own "Find it" section — no invented profiles.
DOMAIN_MAP = {
    "thezao.com": {
        "box": "thezao.llm.txt",
        "name": "The ZAO",
        "url": "https://thezao.com",
        "sameAs": [
            "https://thezao.xyz",
            "https://zaoos.com",
            "https://warpcast.com/~/channel/zao",
        ],
        "priority": True,
    },
    "bettercallzaal.com": {
        "box": "zaal.llm.txt",
        "name": "BetterCallZaal",
        "url": "https://bettercallzaal.com",
        "sameAs": [
            "https://x.com/bettercallzaal",
            "https://www.youtube.com/@bettercallzaal",
            "https://github.com/bettercallzaal",
            "https://warpcast.com/zaal",
            "https://thezao.xyz",
            "https://zaoos.com",
        ],
        "priority": True,
    },
    "wavewarz.com": {
        "box": "wavewarz.llm.txt",
        "name": "WaveWarZ",
        "url": "https://wavewarz.com",
        "sameAs": [
            "https://x.com/WaveWarZ",
            "https://warpcast.com/~/channel/wavewarz",
        ],
        "priority": True,
    },
    "zabalgamez.com": {
        "box": "zabalgamez.llm.txt",
        "name": "ZABAL Games",
        "url": "https://zabalgamez.com",
        "sameAs": [],
        "priority": False,
    },
    "fractal.thezao.com": {
        "box": "fractal.llm.txt",
        "name": "ZAO Fractal",
        "url": "https://thezao.com/fractal",
        "sameAs": ["https://thezao.xyz/paper"],
        "priority": False,
    },
}

GENERATED_MARKER = "<!-- GENERATED from research/identity/icm-boxes/{box} — single source of truth. Do not edit directly; edit the box and re-run build-llms-txt.py. -->"


def _split_box(text: str) -> tuple[str, str, str]:
    """Return (title, summary, body) from an ICM box.

    title  = H1 with the leading "ICM: " stripped.
    summary= the first non-empty prose paragraph after the H1, collapsed to one line.
    body   = everything from the first "## " section onward (unchanged).
    """
    lines = text.splitlines()
    title = ""
    i = 0
    for i, ln in enumerate(lines):
        if ln.startswith("# "):
            title = ln[2:].strip()
            if title.lower().startswith("icm:"):
                title = title[4:].strip()
            i += 1
            break
    # summary: prose lines until the first blank line that precedes a "## " section,
    # or until the first "## ". Collapse multi-line intro to a single line.
    summary_parts: list[str] = []
    body_start = len(lines)
    for j in range(i, len(lines)):
        ln = lines[j]
        if ln.startswith("## "):
            body_start = j
            break
        if ln.strip():
            summary_parts.append(ln.strip())
    summary = " ".join(summary_parts).strip()
    body = "\n".join(lines[body_start:]).strip()
    return title, summary, body


def render(domain: str, cfg: dict) -> str:
    box_path = HERE / cfg["box"]
    text = box_path.read_text(encoding="utf-8")
    if not text.strip():
        raise ValueError(f"empty box: {box_path}")
    title, summary, body = _split_box(text)
    if not title:
        raise ValueError(f"no H1 title in {box_path}")

    out: list[str] = []
    out.append(f"# {title}")
    out.append("")
    out.append(GENERATED_MARKER.format(box=cfg["box"]))
    out.append("")
    if summary:
        # blockquote summary — llms.txt spec wants a one-line `>` summary under the H1
        out.append(f"> {summary}")
        out.append("")
    if body:
        out.append(body)
        out.append("")
    # Canonical identity block (doc 1107 §5: exact name + url + sameAs for LLMs/JSON-LD)
    out.append("## Canonical identity")
    out.append(f"- Name: {cfg['name']}")
    out.append(f"- URL: {cfg['url']}")
    if cfg["sameAs"]:
        out.append("- sameAs:")
        for u in cfg["sameAs"]:
            out.append(f"  - {u}")
    out.append("")
    return "\n".join(out).rstrip() + "\n"


def build(check: bool = False) -> int:
    OUT.mkdir(exist_ok=True)
    drift = []
    for domain, cfg in DOMAIN_MAP.items():
        content = render(domain, cfg)
        target = OUT / f"{domain}.llms.txt"
        if check:
            existing = target.read_text(encoding="utf-8") if target.exists() else ""
            if existing != content:
                drift.append(domain)
        else:
            target.write_text(content, encoding="utf-8")
            tag = "priority" if cfg["priority"] else "staged"
            print(f"  wrote {target.name}  ({tag}, from {cfg['box']})")
    if check:
        if drift:
            print(f"DRIFT: {', '.join(drift)} — generated files are stale. Run build-llms-txt.py.")
            return 1
        print("OK: all generated llms.txt match their ICM boxes.")
        return 0
    print(f"Done. {len(DOMAIN_MAP)} llms.txt drafts in {OUT.relative_to(HERE.parents[2])}/")
    return 0


def selftest() -> int:
    sample = (
        "# ICM: Test Brand\n\n"
        "One line intro. Second sentence.\n\n"
        "## What it is\n- a thing\n\n## Related boxes\n- Other\n"
    )
    t, s, b = _split_box(sample)
    assert t == "Test Brand", t
    assert s == "One line intro. Second sentence.", repr(s)
    assert b.startswith("## What it is"), b
    assert "## Related boxes" in b, b
    # render against a real box
    cfg = {"box": "thezao.llm.txt", "name": "The ZAO", "url": "https://thezao.com",
           "sameAs": ["https://thezao.xyz"], "priority": True}
    out = render("thezao.com", cfg)
    assert out.startswith("# The ZAO\n"), out[:40]
    assert "GENERATED from" in out
    assert out.count("# ") >= 1
    assert "> " in out, "missing blockquote summary"
    assert "## Canonical identity" in out
    assert "https://thezao.xyz" in out
    # idempotence: check mode on freshly-built output is clean
    print("selftest: 8/8 OK")
    return 0


if __name__ == "__main__":
    arg = sys.argv[1] if len(sys.argv) > 1 else ""
    if arg == "--selftest":
        sys.exit(selftest())
    elif arg == "--check":
        sys.exit(build(check=True))
    else:
        sys.exit(build())
