#!/usr/bin/env python3
"""Generate ingest-ready Bonfire .md files from BCZ YapZ transcripts.

Reads content/transcripts/bcz-yapz/*.md, extracts YAML frontmatter + 7
representative timestamped quotes per episode, writes one ingest-ready
markdown file per episode to content/yapz-bonfire-ingest/.

Each output file is self-contained and starts with an explicit INGEST BATCH
trigger so the bot's extraction_discipline trait fires. Quotes preserve
verbatim text and carry youtube.com/watch?v=ID&t=SEC deeplinks.
"""
from __future__ import annotations
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SRC_DIR = REPO / "content" / "transcripts" / "bcz-yapz"
OUT_DIR = REPO / "content" / "yapz-bonfire-ingest"

TIMESTAMP_RE = re.compile(r"\[(\d{2}):(\d{2}):(\d{2})\]")


def parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---\n"):
        return {}, text
    end = text.index("\n---\n", 4)
    raw = text[4:end]
    body = text[end + 5 :]
    fm: dict = {}
    key = None
    for line in raw.splitlines():
        m = re.match(r"^([a-zA-Z_]+):\s*(.*)$", line)
        if m and not line.startswith(" "):
            key = m.group(1)
            val = m.group(2).strip()
            if val:
                fm[key] = val.strip("'\"")
            else:
                fm[key] = ""
    return fm, body


def to_seconds(h: int, m: int, s: int) -> int:
    return h * 3600 + m * 60 + s


def extract_segments(transcript_body: str) -> list[dict]:
    """Split transcript at timestamp markers; emit (sec_offset, text) pairs."""
    after_header = transcript_body.split("## Transcript", 1)
    body = after_header[1] if len(after_header) > 1 else transcript_body
    matches = list(TIMESTAMP_RE.finditer(body))
    segments: list[dict] = []
    for i, mt in enumerate(matches):
        h, m, s = (int(g) for g in mt.groups())
        sec = to_seconds(h, m, s)
        start = mt.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        text = body[start:end]
        text = re.sub(r"\s+", " ", text).strip()
        if text:
            segments.append({"sec": sec, "text": text})
    return segments


def pick_highlights(segments: list[dict], count: int = 7) -> list[dict]:
    """Pick segments evenly distributed across the episode, biasing for length."""
    if len(segments) <= count:
        return segments
    fractions = [0.04, 0.18, 0.32, 0.46, 0.6, 0.74, 0.88]
    picks: list[dict] = []
    used: set[int] = set()
    for f in fractions[:count]:
        target = int(len(segments) * f)
        # search a window for the longest segment near target
        window_start = max(0, target - 3)
        window_end = min(len(segments), target + 4)
        candidates = [
            (i, len(segments[i]["text"]))
            for i in range(window_start, window_end)
            if i not in used
        ]
        if not candidates:
            continue
        best = max(candidates, key=lambda x: x[1])
        used.add(best[0])
        picks.append(segments[best[0]])
    picks.sort(key=lambda x: x["sec"])
    return picks


def fmt_timestamp(sec: int) -> str:
    h = sec // 3600
    m = (sec % 3600) // 60
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def slug_to_episode_num(slug: str, fm_episode: str) -> str:
    if fm_episode:
        return fm_episode
    # heuristic — use date
    date_m = re.match(r"(\d{4}-\d{2}-\d{2})", slug)
    return date_m.group(1) if date_m else slug


def render_ingest_md(slug: str, fm: dict, picks: list[dict]) -> str:
    title = fm.get("title", slug)
    guest = fm.get("guest", "Guest")
    guest_org = fm.get("guest_org", "")
    date = fm.get("date", "")[:10] if fm.get("date") else ""
    youtube_url = fm.get("youtube_url", "").strip("'\"")
    video_id = fm.get("youtube_video_id", "")
    episode_num = fm.get("episode") or slug_to_episode_num(slug, "")

    org_line = f" from {guest_org}" if guest_org else ""

    out = []
    out.append(
        "INGEST BATCH: BCZ YapZ Episode "
        + str(episode_num)
        + " — "
        + guest
        + org_line
        + (f" ({date})" if date else "")
        + "."
    )
    out.append("")
    out.append(
        "Build a manifest of nodes and edges, preview the first 3 nodes, then ask me to approve. "
        "Verbatim quote text must be preserved exactly. Topics, platforms, chains, and tools must be "
        "stored as attributes on the Episode node, NEVER as standalone Entity nodes per scope_constraint trait."
    )
    out.append("")

    # Episode node
    out.append("## EPISODE NODE")
    out.append(f"Subject: {title}")
    out.append("Type: PodcastEpisode")
    if date:
        out.append(f"Date: {date}")
    out.append("Show: BCZ YapZ")
    if episode_num:
        out.append(f"Episode number: {episode_num}")
    out.append("Format: video-podcast")
    if youtube_url:
        out.append(f"YouTube URL: {youtube_url}")
    if video_id:
        out.append(f"YouTube video ID: {video_id}")
    if guest:
        desc = f"Zaal interviews {guest}"
        if guest_org:
            desc += f" from {guest_org}"
        desc += "."
        out.append(f"Description: {desc}")
    out.append(f"Source: {youtube_url or 'https://youtube.com/@bettercallzaal'}")
    out.append("Confidence: 1.0")
    out.append("")

    # Person node — guest
    out.append("## PERSON NODE — Guest")
    out.append(f"Subject: {guest}")
    out.append("Type: Person")
    if guest_org:
        out.append(f"Role: Founder/team at {guest_org}")
    out.append(f"Source: {youtube_url}")
    out.append("Confidence: 1.0")
    out.append("")

    # Org node — guest org
    if guest_org:
        out.append("## ORG NODE — Guest's organization")
        out.append(f"Subject: {guest_org}")
        out.append("Type: Org")
        out.append(f"Source: {youtube_url}")
        out.append("Confidence: 0.9")
        out.append("")

    # Quotes
    for i, p in enumerate(picks, 1):
        ts = fmt_timestamp(p["sec"])
        deep = (
            f"https://youtu.be/{video_id}?t={p['sec']}"
            if video_id
            else (youtube_url + f"?t={p['sec']}" if youtube_url else "")
        )
        out.append(f"## QUOTE NODE {i}")
        out.append("Type: Quote")
        out.append("Speaker: (mark Zaal or guest based on context)")
        text = p["text"].strip()
        if len(text) > 600:
            text = text[:597] + "..."
        out.append(f'Text (verbatim): "{text}"')
        out.append(f"Timestamp: {ts}")
        if deep:
            out.append(f"YouTube deeplink: {deep}")
        out.append("Confidence: 1.0")
        out.append("")

    # Edges
    out.append("## EDGES TO ASSERT")
    out.append(f"- Zaal Panthaki -[hosted]-> {title}")
    out.append(f"- {guest} -[appeared_on]-> {title}")
    if guest_org:
        out.append(f"- {guest} -[part_of]-> {guest_org}")
    out.append(f"- {title} -[contains_quote]-> Quote 1 through Quote {len(picks)}")
    out.append("")

    # Closing instruction
    out.append("---")
    out.append(
        "Build the manifest, preview the first 3 nodes inline, then ask me \"approve all?\". "
        "Do not commit until I say yes. If existing Episode/Person/Org nodes match by name, MERGE; "
        "do not create parallel nodes. Topics in the description are attributes, not entities."
    )
    return "\n".join(out)


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    transcripts = sorted(SRC_DIR.glob("*.md"))
    if not transcripts:
        print(f"no transcripts found in {SRC_DIR}")
        return 1
    written = 0
    for src in transcripts:
        text = src.read_text()
        fm, body = parse_frontmatter(text)
        segs = extract_segments(body)
        if not segs:
            print(f"warn: no timestamps in {src.name}")
            continue
        picks = pick_highlights(segs, count=7)
        out_text = render_ingest_md(src.stem, fm, picks)
        out_path = OUT_DIR / f"{src.stem}.md"
        out_path.write_text(out_text)
        written += 1
        print(f"wrote {out_path.relative_to(REPO)} ({len(picks)} quotes)")
    print(f"\ndone. {written} ingest files written to {OUT_DIR.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
