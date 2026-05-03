#!/usr/bin/env python3
"""Mine ChatGPT export → Bonfire ingest .md files.

Reads /tmp/chatgpt-export/conversations-*.json (the 631 conversations from
Zaal's 2023-07-18 → 2026-04-29 history) and produces thematic ingest files
at content/bonfire-ingest/chatgpt-archive-*.md.

Per conversation: title + date + bucket + prompt snippet + conclusion snippet
+ chatgpt:// source URL. Topic + bucket are attributes (per scope_constraint
trait), not standalone Entity nodes.
"""
from __future__ import annotations
import json
import glob
import re
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
EXPORT_DIR = Path("/tmp/chatgpt-export")
OUT_DIR = REPO / "content" / "bonfire-ingest"

ZAO_KEYWORDS = [
    "zao",
    "zabal",
    "zaostock",
    "fishbowlz",
    "bcz",
    "fractals",
    "chella",
    "palooza",
    "wavewarz",
    "coc concertz",
    "coc concert",
    "cipher",
    "empire builder",
    "thezao",
    "bettercallzaal",
]
PEOPLE_KEYWORDS = [
    "cassie",
    "steve peer",
    "tyler",
    "hannah",
    "roddy",
    "joshua",
    "mat tambussi",
    "matteo",
    "kenny",
    "daya",
    "sven",
    "yerbearserker",
    "diviflyy",
    "attabotty",
    "ohnahji",
    "ezincrypto",
    "jadyn",
    "darius",
    "deepa",
]
DECISION_PATTERNS = [
    r"\bvs\b",
    r"should i",
    r"how should",
    r"which is better",
    r"pros and cons",
    r"tradeoff",
    r"\bdecide\b",
]
WRITING_PATTERNS = [
    "pitch",
    "sponsor",
    "partnership",
    "newsletter",
    "article",
    "cast",
    "thread",
    "draft",
    "blog post",
    "essay",
]
THROW_PATTERNS = [
    "meme",
    "translate",
    "translation",
    "pinyin",
    "syntax error",
    "typeerror",
    "fix this code",
    "fix the error",
    "image generation",
    "generate image",
    "create image",
    "photo of",
    "picture of",
    "recipe",
    "workout",
    "birthday gift",
]


def first_user_msg(c: dict) -> str:
    mapping = c.get("mapping", {})
    user_msgs = []
    for _mid, node in mapping.items():
        msg = node.get("message")
        if not msg:
            continue
        if msg.get("author", {}).get("role") == "user":
            parts = msg.get("content", {}).get("parts", [])
            text = " ".join(str(p) for p in parts if isinstance(p, str))
            ct = msg.get("create_time")
            if text and ct:
                user_msgs.append((ct, text))
    if not user_msgs:
        return ""
    user_msgs.sort()
    return user_msgs[0][1]


def last_assistant_msg(c: dict) -> str:
    mapping = c.get("mapping", {})
    asst_msgs = []
    for _mid, node in mapping.items():
        msg = node.get("message")
        if not msg:
            continue
        if msg.get("author", {}).get("role") == "assistant":
            parts = msg.get("content", {}).get("parts", [])
            text = " ".join(str(p) for p in parts if isinstance(p, str))
            ct = msg.get("create_time")
            if text and ct:
                asst_msgs.append((ct, text))
    if not asst_msgs:
        return ""
    asst_msgs.sort()
    return asst_msgs[-1][1]


def classify(title: str, first_msg: str) -> str:
    t = (title or "").lower()
    m = (first_msg or "")[:600].lower()
    blob = t + " " + m
    for kw in ZAO_KEYWORDS:
        if kw in blob:
            return "KEEP_ZAO"
    for kw in PEOPLE_KEYWORDS:
        if kw in blob:
            return "KEEP_PERSON"
    for p in THROW_PATTERNS:
        if p in blob:
            return "THROW_NOISE"
    for p in DECISION_PATTERNS:
        if re.search(p, blob):
            return "KEEP_DECISION"
    for p in WRITING_PATTERNS:
        if p in blob:
            return "KEEP_WRITING"
    return "MAYBE"


def truncate(s: str, n: int) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) <= n:
        return s
    return s[: n - 3] + "..."


def render_fact(idx: int, conv: dict, bucket: str) -> str:
    title = (conv.get("title") or "(untitled)").strip()
    create = conv.get("create_time") or 0
    date = (
        datetime.fromtimestamp(create).date().isoformat() if create else "unknown"
    )
    msg_count = len(conv.get("mapping", {}))
    cid = conv.get("id") or conv.get("conversation_id") or ""
    prompt = truncate(first_user_msg(conv), 280)
    conclusion = truncate(last_assistant_msg(conv), 280)
    src = f"https://chatgpt.com/c/{cid}" if cid else "internal://chatgpt-export"
    safe_title = title.replace('"', "'").replace("\n", " ")
    out = []
    out.append(f"### FACT {idx}")
    out.append(f"Subject: {safe_title}")
    out.append("Type: Conversation")
    out.append(f"Date: {date}")
    out.append(f"Bucket: {bucket}")
    out.append(f"Message count: {msg_count}")
    out.append(f'Prompt (verbatim, opening): "{prompt}"')
    out.append(f'Conclusion (verbatim, closing): "{conclusion}"')
    out.append(f"Source: {src}")
    out.append("Confidence: 1.0")
    out.append("")
    return "\n".join(out)


def render_file(name: str, items: list[tuple[int, dict, str]], description: str) -> str:
    out: list[str] = []
    out.append(f"INGEST BATCH: ChatGPT Archive — {name} ({len(items)} conversations).")
    out.append("")
    out.append(description)
    out.append("")
    out.append(
        "Build a manifest of Conversation nodes, preview the first 3, then ask me to approve. "
        "Bucket and Topic are attributes on each Conversation node (per scope_constraint trait). "
        "Do NOT create standalone Entity nodes for buckets, topics, dates, or message counts. "
        "If existing Conversation nodes match by Subject + Date, MERGE; do not create parallel nodes."
    )
    out.append("")
    for n, (idx, conv, bucket) in enumerate(items, 1):
        out.append(render_fact(n, conv, bucket))
    out.append("## EDGES TO ASSERT")
    out.append("- Zaal Panthaki -[discussed_in]-> [each Conversation above]")
    out.append(
        "- Conversation -[has_bucket]-> bucket (as attribute, NOT as Entity node)"
    )
    out.append("")
    out.append("---")
    out.append(
        f'Build the manifest, preview the first 3 nodes inline, then ask me "approve all?". '
        f"Total {len(items)} Conversation nodes in this batch. "
        f"Do not commit until I say yes. Conversations with Subject + Date match should MERGE."
    )
    return "\n".join(out)


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    all_convs: list[dict] = []
    for f in sorted(glob.glob(str(EXPORT_DIR / "conversations-*.json"))):
        with open(f) as fp:
            data = json.load(fp)
        all_convs.extend(data)
    print(f"loaded {len(all_convs)} conversations")

    # classify
    classified: list[tuple[int, dict, str]] = []
    counts: dict[str, int] = {}
    for i, c in enumerate(all_convs):
        title = c.get("title") or ""
        prompt = first_user_msg(c)
        bucket = classify(title, prompt)
        # also bump MAYBE to KEEP if msg_count >= 20 (substantive long thread)
        if bucket == "MAYBE" and len(c.get("mapping", {})) >= 20:
            bucket = "KEEP_LONG_THREAD"
        classified.append((i, c, bucket))
        counts[bucket] = counts.get(bucket, 0) + 1

    print("\nbucket counts:")
    for k in sorted(counts.keys()):
        print(f"  {k}: {counts[k]}")

    # split into output files
    # bucket → file name
    keepers = [
        x for x in classified if x[2].startswith("KEEP")
    ]
    print(f"\ntotal keepers: {len(keepers)}")

    # split KEEP_ZAO temporally (largest bucket)
    zao = [x for x in keepers if x[2] == "KEEP_ZAO"]
    zao.sort(key=lambda x: x[1].get("create_time") or 0)
    others = [x for x in keepers if x[2] != "KEEP_ZAO"]

    def by_year_range(items, year_start, year_end):
        out = []
        for x in items:
            ct = x[1].get("create_time") or 0
            if ct == 0:
                continue
            year = datetime.fromtimestamp(ct).year
            if year_start <= year <= year_end:
                out.append(x)
        return out

    splits = [
        (
            "chatgpt-archive-zao-2023-2024",
            by_year_range(zao, 2023, 2024),
            "ChatGPT conversations explicitly about The ZAO ecosystem (ZAO, ZABAL, ZAOstock, FISHBOWLZ, BCZ, Fractals, COC Concertz, ZAO Music, WaveWarZ, etc.) from 2023-07-18 through 2024-12-31.",
        ),
        (
            "chatgpt-archive-zao-2025",
            by_year_range(zao, 2025, 2025),
            "ChatGPT conversations explicitly about The ZAO ecosystem from 2025-01-01 through 2025-12-31.",
        ),
        (
            "chatgpt-archive-zao-2026",
            by_year_range(zao, 2026, 2026),
            "ChatGPT conversations explicitly about The ZAO ecosystem from 2026-01-01 through 2026-04-29.",
        ),
        (
            "chatgpt-archive-non-zao-keepers",
            others,
            "ChatGPT conversations not explicitly ZAO-tagged but flagged as keepers: long threads (20+ messages), strategic decisions, writing artifacts, person mentions.",
        ),
    ]

    summary = []
    for name, items, desc in splits:
        if not items:
            continue
        text = render_file(name, items, desc)
        path = OUT_DIR / f"{name}.md"
        path.write_text(text)
        summary.append((name, len(items), path))
        print(f"wrote {path.relative_to(REPO)} ({len(items)} convs)")

    print("\n--- summary ---")
    total = sum(c for _, c, _ in summary)
    print(f"total Conversation facts across {len(summary)} files: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
