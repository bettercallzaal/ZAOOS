#!/usr/bin/env python3
"""zoe-memory-git - version every ZOE memory write with commit-per-edit.

The #1 gap the ZOE-vs-toolkits audit found (doc 2235): ZOE's memory lives as plain
files at ~/.zao/zoe/*.md (persona, human, HANDOFF, ...) with NO version history - you
can't see what changed, when, or why, and you can't roll back. Letta/MemGPT
(letta-ai/letta, Apache-2.0) versions its memory blocks; this brings the same guarantee
to ZOE using git as the backend. It rhymes with tonight's receipts/trust theme: receipts
are an audit trail for ACTIONS; this is an audit trail for BELIEFS (memory).

Check-alternatives (feedback_check_alternatives_oss_first): git IS the versioning
backend - a native platform feature, no new dependency (code-restraint rung 4). We do
not build a versioning system; we wrap memory writes in git commits.

This is a STANDALONE helper. It does NOT touch the running bot - wiring ZOE's memory.ts
to call `write()` is a separate, gated step. Nothing here deletes recursively (rollback
uses `git checkout`, init uses `git init` - no rm, per no-rm-rf.md).

  zoe-memory-git.py write <file> <reason> [--author WHO] [--stdin | --content TEXT]
  zoe-memory-git.py history <file>          # what changed, when, why (commit log)
  zoe-memory-git.py why <file>              # just the reasons, newest first
  zoe-memory-git.py diff <file> [--ref REF] # diff of a change (default: last)
  zoe-memory-git.py rollback <file> <ref> [--author WHO]  # restore a prior version
  zoe-memory-git.py --selftest
Env: ZOE_MEMORY_DIR (default ~/.zao/zoe)
"""
from __future__ import annotations
import argparse, os, subprocess, sys


def mem_dir() -> str:
    return os.environ.get("ZOE_MEMORY_DIR") or os.path.join(
        os.path.expanduser("~"), ".zao", "zoe")


def _git(dir_: str, *args: str, check: bool = True) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", dir_, *args],
                          capture_output=True, text=True, check=check)


def ensure_repo(dir_: str) -> None:
    """git init the memory dir on first use (idempotent). Never touches file contents."""
    os.makedirs(dir_, exist_ok=True)
    if not os.path.isdir(os.path.join(dir_, ".git")):
        _git(dir_, "init", "-q")
        # local identity so commits work even if the box has no global git config
        _git(dir_, "config", "user.email", "zoe@thezao.com", check=False)
        _git(dir_, "config", "user.name", "ZOE memory", check=False)


def write(file: str, content: str, reason: str, author: str = "zoe") -> str:
    """Write a memory file and commit it with (reason, author). Returns the commit sha
    (or '' if nothing changed - an idempotent no-op write does not create an empty commit)."""
    d = mem_dir()
    ensure_repo(d)
    path = os.path.join(d, file)
    os.makedirs(os.path.dirname(path) or d, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)
    _git(d, "add", file)
    # nothing staged (content identical) -> no commit, honest no-op
    if _git(d, "diff", "--cached", "--quiet", "--", file, check=False).returncode == 0:
        return ""
    msg = f"memory: {file} - {reason}\n\nAuthor: {author}"
    _git(d, "commit", "-q", "-m", msg, "--author", f"{author} <{author}@thezao.com>")
    return _git(d, "rev-parse", "--short", "HEAD").stdout.strip()


def history(file: str) -> list[dict]:
    """Return [{sha, date, reason}] newest-first for a memory file."""
    d = mem_dir()
    if not os.path.isdir(os.path.join(d, ".git")):
        return []
    out = _git(d, "log", "--format=%h\x1f%ad\x1f%s", "--date=short", "--", file, check=False).stdout
    rows = []
    for line in out.splitlines():
        if "\x1f" in line:
            sha, date, subject = line.split("\x1f", 2)
            reason = subject.split(" - ", 1)[1] if " - " in subject else subject
            rows.append({"sha": sha, "date": date, "reason": reason})
    return rows


def why(file: str) -> list[str]:
    """The why-changed traversal: just the reasons, newest first."""
    return [r["reason"] for r in history(file)]


def diff(file: str, ref: str | None = None) -> str:
    d = mem_dir()
    if not os.path.isdir(os.path.join(d, ".git")):
        return ""
    target = ref or "HEAD"
    return _git(d, "show", f"{target}", "--", file, check=False).stdout


def rollback(file: str, ref: str, author: str = "zoe") -> str:
    """Restore a memory file to a prior commit's version, recorded as a NEW commit
    (never rewrites history). Returns the new commit sha."""
    d = mem_dir()
    ensure_repo(d)
    _git(d, "checkout", ref, "--", file)   # restore the file content from `ref`
    _git(d, "add", file)
    if _git(d, "diff", "--cached", "--quiet", "--", file, check=False).returncode == 0:
        return ""  # already at that version, no-op
    msg = f"memory: {file} - rollback to {ref}\n\nAuthor: {author}"
    _git(d, "commit", "-q", "-m", msg, "--author", f"{author} <{author}@thezao.com>")
    return _git(d, "rev-parse", "--short", "HEAD").stdout.strip()


def _selftest() -> int:
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        os.environ["ZOE_MEMORY_DIR"] = td
        c1 = write("human.md", "Zaal builds ZAO.", "initial seed", author="zoe")
        c2 = write("human.md", "Zaal builds ZAO. Loves Farcaster.", "learned FC preference", author="loop")
        assert c1 and c2 and c1 != c2, f"two distinct commits expected: {c1},{c2}"
        # idempotent write = no empty commit
        assert write("human.md", "Zaal builds ZAO. Loves Farcaster.", "no change", author="zoe") == "", "identical write must be a no-op"
        h = history("human.md")
        assert len(h) == 2, f"expected 2 commits, got {len(h)}: {h}"
        assert h[0]["reason"] == "learned FC preference" and h[1]["reason"] == "initial seed", h
        assert why("human.md") == ["learned FC preference", "initial seed"], why("human.md")
        # diff of the latest change mentions the added line
        assert "Loves Farcaster" in diff("human.md"), "latest diff should show the added text"
        # rollback to the first commit -> content reverts, a NEW commit is added (history preserved)
        rb = rollback("human.md", c1, author="zaal")
        assert rb, "rollback should create a commit"
        assert open(os.path.join(td, "human.md")).read() == "Zaal builds ZAO.", "content reverted to v1"
        assert len(history("human.md")) == 3, "rollback adds a 3rd commit, never rewrites"
        assert why("human.md")[0].startswith("rollback"), "newest reason is the rollback"
        # a second memory file is independent
        write("persona.md", "ZOE is Zaal's operator.", "seed persona", author="zoe")
        assert len(history("persona.md")) == 1 and len(history("human.md")) == 3, "files version independently"
    print("selftest OK")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="zoe-memory-git - commit-per-edit memory versioning")
    sub = ap.add_subparsers(dest="cmd")
    pw = sub.add_parser("write"); pw.add_argument("file"); pw.add_argument("reason")
    pw.add_argument("--author", default="zoe"); pw.add_argument("--content", default=None)
    pw.add_argument("--stdin", action="store_true")
    ph = sub.add_parser("history"); ph.add_argument("file")
    py = sub.add_parser("why"); py.add_argument("file")
    pd = sub.add_parser("diff"); pd.add_argument("file"); pd.add_argument("--ref", default=None)
    prb = sub.add_parser("rollback"); prb.add_argument("file"); prb.add_argument("ref"); prb.add_argument("--author", default="zoe")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args(argv)
    if a.selftest:
        return _selftest()
    if a.cmd == "write":
        content = sys.stdin.read() if a.stdin else (a.content if a.content is not None else "")
        sha = write(a.file, content, a.reason, a.author)
        print(sha or "(no change)"); return 0
    if a.cmd == "history":
        for r in history(a.file):
            print(f"{r['sha']}  {r['date']}  {r['reason']}")
        return 0
    if a.cmd == "why":
        for w in why(a.file):
            print(f"- {w}")
        return 0
    if a.cmd == "diff":
        print(diff(a.file, a.ref)); return 0
    if a.cmd == "rollback":
        sha = rollback(a.file, a.ref, a.author)
        print(sha or "(already at that version)"); return 0
    ap.print_help(); return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
