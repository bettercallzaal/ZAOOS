#!/usr/bin/env python3
"""Generate ingest-ready Bonfire .md files for the ZAO research library.

Reads research/<folder>/<num>-<slug>/README.md across the repo and emits
five thematic ingest files at content/bonfire-ingest/research-index-*.md.
Each file holds one fact per research doc with a one-line summary pulled
from the doc's first H1 or first non-empty narrative line.
"""
from __future__ import annotations
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "research"
OUT = REPO / "content" / "bonfire-ingest"

GROUPS: dict[str, list[str]] = {
    "agents": ["agents"],
    "dev-workflows": ["dev-workflows"],
    "music-farcaster": ["music", "farcaster"],
    "infra-business-events": ["infrastructure", "business", "events"],
    "governance-community-identity": [
        "governance",
        "community",
        "identity",
        "cross-platform",
        "security",
        "wavewarz",
        "inspiration",
    ],
}


def first_h1_or_summary(readme: Path) -> str:
    """Pull a one-line summary from the README — first H1, then first prose line."""
    try:
        text = readme.read_text(errors="replace")
    except Exception:
        return ""
    lines = text.splitlines()
    # try H1
    for line in lines:
        if line.startswith("# "):
            return line[2:].strip()
    # try first quote line ("> ...")
    for line in lines:
        if line.startswith("> "):
            return line[2:].strip().strip("*_")
    # try first prose line that isn't frontmatter or table
    in_frontmatter = False
    for line in lines:
        s = line.strip()
        if not s:
            continue
        if s == "---":
            in_frontmatter = not in_frontmatter
            continue
        if in_frontmatter:
            continue
        if s.startswith(("|", "##", "```", "- ")):
            continue
        return s[:200]
    return ""


def slug_from_path(p: Path) -> tuple[str, str]:
    """Extract numeric ID + slug from research/<topic>/<num>-<slug>/."""
    name = p.name
    m = re.match(r"(\d+)-(.+)", name)
    if m:
        return m.group(1), m.group(2)
    return name, name


def find_top_level_legacy_docs() -> list[Path]:
    """Find legacy top-level research/<num>-<slug>/README.md (pre-folder era)."""
    docs = []
    for d in SRC.iterdir():
        if not d.is_dir():
            continue
        if d.name.startswith("_") or d.name == "newfiles":
            continue
        # skip topic folders
        if d.name in {
            "agents",
            "music",
            "dev-workflows",
            "infrastructure",
            "governance",
            "community",
            "cross-platform",
            "farcaster",
            "identity",
            "business",
            "events",
            "wavewarz",
            "security",
            "inspiration",
        }:
            continue
        if re.match(r"\d+-", d.name):
            readme = d / "README.md"
            if readme.exists():
                docs.append(d)
    return docs


def render_fact(idx: int, topic: str, doc_dir: Path) -> str:
    num, slug = slug_from_path(doc_dir)
    readme = doc_dir / "README.md"
    title = first_h1_or_summary(readme) or slug.replace("-", " ").title()
    title_clean = title.lstrip("#").strip()
    title_clean = re.sub(r"^\d+\s*[-—]\s*", "", title_clean)
    short = title_clean[:160]
    return (
        f"### FACT {idx}\n"
        f"Subject: Research Doc {num}: {short}\n"
        f"Type: ResearchDoc\n"
        f"Topic: {topic}\n"
        f"Doc number: {num}\n"
        f"Description: {short}\n"
        f"Source: internal://research/{topic}/{doc_dir.name}/\n"
        f"Confidence: 1.0\n"
    )


def render_file(group_name: str, topics: list[str]) -> str:
    out: list[str] = []
    out.append(
        f"INGEST BATCH: ZAO Research Library Index — "
        f"{group_name.replace('-', ' / ')} ({len(topics)} topic folder{'s' if len(topics) > 1 else ''})."
    )
    out.append("")
    out.append(
        "Build a manifest of ResearchDoc nodes, preview the first 3, then ask me to approve. "
        "Each ResearchDoc has Topic + Doc number + Description as attributes. "
        "Topics, platforms, tools, and dates must be attributes only, NEVER standalone Entity nodes per scope_constraint trait. "
        "If existing ResearchDoc nodes match by Doc number, MERGE; do not create parallel nodes."
    )
    out.append("")

    idx = 1
    total_docs = 0
    for topic in topics:
        topic_dir = SRC / topic
        if not topic_dir.exists():
            continue
        docs = sorted(
            [d for d in topic_dir.iterdir() if d.is_dir() and re.match(r"\d+-", d.name)],
            key=lambda p: int(re.match(r"(\d+)-", p.name).group(1)),
        )
        if not docs:
            continue
        out.append(f"## SECTION — {topic} ({len(docs)} docs)")
        out.append("")
        for d in docs:
            out.append(render_fact(idx, topic, d))
            out.append("")
            idx += 1
        total_docs += len(docs)

    # legacy top-level docs go into the "governance-community-identity" file as misc
    if group_name == "governance-community-identity":
        legacy = find_top_level_legacy_docs()
        if legacy:
            out.append(f"## SECTION — legacy top-level docs ({len(legacy)} docs)")
            out.append("")
            for d in sorted(legacy, key=lambda p: int(re.match(r"(\d+)-", p.name).group(1))):
                num, slug = slug_from_path(d)
                title = first_h1_or_summary(d / "README.md") or slug.replace(
                    "-", " "
                ).title()
                title_clean = re.sub(r"^\d+\s*[-—]\s*", "", title.lstrip("#").strip())[
                    :160
                ]
                out.append(f"### FACT {idx}")
                out.append(f"Subject: Research Doc {num}: {title_clean}")
                out.append(f"Type: ResearchDoc")
                out.append(f"Topic: misc")
                out.append(f"Doc number: {num}")
                out.append(f"Description: {title_clean}")
                out.append(f"Source: internal://research/{d.name}/")
                out.append(f"Confidence: 1.0")
                out.append("")
                idx += 1
            total_docs += len(legacy)

    out.append("## EDGES TO ASSERT")
    out.append("- Zaal Panthaki -[authored]-> [each ResearchDoc above]")
    out.append("- The ZAO -[has_research_doc]-> [each ResearchDoc]")
    out.append(
        "- ResearchDoc -[has_topic]-> Topic (as attribute, do NOT create Topic Entity nodes)"
    )
    out.append("")
    out.append("---")
    out.append(
        f'Build the manifest, preview the first 3 nodes, then ask me "approve all?". '
        f"Total {total_docs} ResearchDoc nodes in this batch. "
        f"Do not commit until I say yes. If a Doc number already exists in graph, MERGE; "
        f"do not create duplicate."
    )
    return "\n".join(out)


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    summary = []
    for group, topics in GROUPS.items():
        text = render_file(group, topics)
        path = OUT / f"research-index-{group}.md"
        path.write_text(text)
        # count facts
        count = text.count("\n### FACT ")
        summary.append((group, count, path))
        print(f"wrote {path.relative_to(REPO)} ({count} facts)")
    print("\n--- summary ---")
    total = sum(c for _, c, _ in summary)
    print(f"total ResearchDoc facts across 5 files: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
