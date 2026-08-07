#!/usr/bin/env python3
"""clip-anchor - turn a verbatim transcript quote into a real [start,end] time span.

The hallucination-proof clip trick from clawdbotatg/clawd-clipper (MIT, Austin
Griffith - src/anchor.ts), adopted per doc 2237: a selection model returns VERBATIM
QUOTES, never timestamps; this locates the quote in a word-timed transcript and
recovers the real span. A quote that cannot be found returns None and the caller
DROPS the clip rather than guessing - fabrication is impossible by construction
(anti-fabrication.md as a media primitive).

Input transcript format (a /meeting-style word-timed JSON):
  {"words": [{"word": "Hello", "start": 0.0, "end": 0.4}, ...]}
(also accepts whisper-style {"segments": [{"words": [...]}]} - flattened.)

Matching, mirroring clawd anchor.ts:
- normalize: lowercase, strip punctuation, and fold contractions ("It's" -> "its",
  NOT "it s") - clawd's hard-won fix (anchor.ts:13-15): without it any quote with a
  contraction silently failed to anchor and good clips were dropped.
- exact token-run match first; then a fuzzy window match (>= 70% token overlap,
  same length window) for STT drift ("gonna" vs "going to").
- multi-part STT words ("GPT-4o" -> "gpt","4o") are split into per-part tokens that
  share the source word's timing.

  clip-anchor.py anchor <transcript.json> "<verbatim quote>" [--fuzzy 0.7]
  clip-anchor.py --selftest
"""
from __future__ import annotations
import argparse, json, re, sys

# "it's" -> "its" (fold the apostrophe, do NOT split) - clawd anchor.ts:13-15
_APOS = re.compile(r"[’']")
_NONWORD = re.compile(r"[^a-z0-9]+")


def norm(s: str) -> list[str]:
    """Normalize text to comparable tokens. Contractions fold; other punctuation splits."""
    s = _APOS.sub("", s.lower())          # it's -> its (never "it s")
    parts = _NONWORD.split(s)              # GPT-4o -> gpt, 4o
    return [p for p in parts if p]


def flatten_words(doc: dict) -> list[dict]:
    """Accept {words:[...]} or whisper-style {segments:[{words:[...]}]}."""
    if isinstance(doc.get("words"), list):
        return doc["words"]
    out = []
    for seg in doc.get("segments") or []:
        out.extend(seg.get("words") or [])
    return out


def tokens(words: list[dict]) -> list[dict]:
    """Per-token stream; a multi-part STT word yields several tokens sharing its timing."""
    toks = []
    for w in words:
        for part in norm(str(w.get("word", ""))):
            toks.append({"t": part, "start": float(w["start"]), "end": float(w["end"])})
    return toks


def anchor(doc: dict, quote: str, fuzzy: float = 0.7) -> dict | None:
    """Locate `quote` in the word-timed transcript. Returns {start, end, match, score}
    or None if it cannot be anchored - the caller must DROP the clip, never guess."""
    q = norm(quote)
    toks = tokens(flatten_words(doc))
    n, m = len(toks), len(q)
    if m == 0 or n < m:
        return None
    # 1. exact token-run match
    stream = [t["t"] for t in toks]
    for i in range(n - m + 1):
        if stream[i:i + m] == q:
            return {"start": toks[i]["start"], "end": toks[i + m - 1]["end"],
                    "match": "exact", "score": 1.0}
    # 2. fuzzy window match: same-length window, order-insensitive token overlap >= fuzzy
    qset = {}
    for t in q:
        qset[t] = qset.get(t, 0) + 1
    best_i, best_score = -1, 0.0
    for i in range(n - m + 1):
        window = stream[i:i + m]
        remaining = dict(qset)
        hits = 0
        for t in window:
            if remaining.get(t, 0) > 0:
                remaining[t] -= 1
                hits += 1
        score = hits / m
        if score > best_score:
            best_i, best_score = i, score
    if best_score >= fuzzy:
        return {"start": toks[best_i]["start"], "end": toks[best_i + m - 1]["end"],
                "match": "fuzzy", "score": round(best_score, 3)}
    return None  # unanchorable -> the clip is dropped, never guessed


def _selftest() -> int:
    doc = {"words": [
        {"word": "Hello", "start": 0.0, "end": 0.4},
        {"word": "everyone,", "start": 0.4, "end": 0.9},
        {"word": "it's", "start": 0.9, "end": 1.1},
        {"word": "the", "start": 1.1, "end": 1.2},
        {"word": "ZAO", "start": 1.2, "end": 1.6},
        {"word": "morning", "start": 1.6, "end": 2.0},
        {"word": "call", "start": 2.0, "end": 2.3},
        {"word": "about", "start": 2.3, "end": 2.5},
        {"word": "GPT-4o", "start": 2.5, "end": 3.0},
        {"word": "agents", "start": 3.0, "end": 3.5},
    ]}
    # 1. exact match anchors with real timestamps
    r = anchor(doc, "the ZAO morning call")
    assert r and r["match"] == "exact" and r["start"] == 1.1 and r["end"] == 2.3, r
    # 2. contraction quote anchors (It's -> its folds, never "it s") - clawd anchor.ts:13-15
    r2 = anchor(doc, "It's the ZAO morning")
    assert r2 and r2["match"] == "exact" and r2["start"] == 0.9 and r2["end"] == 2.0, r2
    # 3. multi-part STT word: quote crossing "GPT-4o" anchors (gpt+4o share timing)
    r3 = anchor(doc, "about GPT 4o agents")
    assert r3 and r3["start"] == 2.3 and r3["end"] == 3.5, r3
    # 4. fuzzy match: one wrong word in a 5-token quote (4/5 = 0.8 >= 0.7)
    r4 = anchor(doc, "the ZAO evening call about")
    assert r4 and r4["match"] == "fuzzy" and r4["score"] >= 0.7 and r4["start"] == 1.1, r4
    # 5. absent quote -> None (DROP, never guess)
    assert anchor(doc, "completely unrelated sentence here") is None, "absent quote must return None"
    # 6. below-threshold fuzz -> None (2/5 = 0.4 overlap < 0.7 -> DROP)
    assert anchor(doc, "the cat evening walk about") is None, "0.4-overlap quote must not anchor"
    # 7. whisper-style segments input also works
    seg_doc = {"segments": [{"words": doc["words"][:5]}, {"words": doc["words"][5:]}]}
    r7 = anchor(seg_doc, "the ZAO morning call")
    assert r7 and r7["start"] == 1.1 and r7["end"] == 2.3, r7
    # 8. empty/short transcript -> None, never a crash
    assert anchor({"words": []}, "anything") is None
    print("selftest OK")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="clip-anchor - verbatim quote -> real [start,end] span")
    sub = ap.add_subparsers(dest="cmd")
    pa = sub.add_parser("anchor")
    pa.add_argument("transcript"); pa.add_argument("quote")
    pa.add_argument("--fuzzy", type=float, default=0.7)
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args(argv)
    if a.selftest:
        return _selftest()
    if a.cmd == "anchor":
        with open(a.transcript, encoding="utf-8") as fh:
            doc = json.load(fh)
        r = anchor(doc, a.quote, a.fuzzy)
        if r is None:
            print(json.dumps({"anchored": False, "action": "DROP the clip - never guess"}))
            return 1
        print(json.dumps({"anchored": True, **r}))
        return 0
    ap.print_help(); return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
