#!/usr/bin/env python3
"""zoe-drift - fail when a rule/doc references a repo path that doesn't exist.

The automated enforcement teeth for .claude/rules/confirm-before-claiming-absence.md
("never assert X from a partial read; a confident wrong self-image causes confident
wrong edits") and anti-fabrication.md rule 5 (measure, don't guess). ZAO had the
principle as prose a human must remember; this makes it an exit code.

Adapted from clawdbotatg/claude-p-agent's `tools/self drift` (tools/self:103-167, MIT,
Austin Griffith) - which walks its core docs and FAILs when a backtick-path is missing
on disk. Same idea, pointed at ZAO's rule files: every `backtick-wrapped/repo/path` in
.claude/rules/*.md + CLAUDE.md + AGENTS.md must exist, or the docs lie about the code.

Scans, by default: .claude/rules/*.md, CLAUDE.md, AGENTS.md. A path is a FAIL only if
it clearly names an in-repo file/dir and is absent. HIGH PRECISION on purpose - a false
FAIL that cries wolf is worse than a miss (anti-fabrication.md rule 4: grade to the
lowest severity the evidence supports). So the ONLY two things flagged are:

  1. A slashed path whose FIRST SEGMENT is a real repo top-level entry (src/, bot/,
     scripts/, .claude/, research/, packages/, ...) but whose full path is missing.
     This is genuine drift: "the dir exists, this file under it doesn't." It ignores
     git refs (origin/main), npm imports (next/dynamic), and system paths, because
     their first segment is not a repo entry.
  2. A bare `sibling.md` cross-reference that resolves neither next to the doc nor in
     .claude/rules/. (The common "Siblings: agent-loops.md" idiom - a real, checkable
     doc-to-doc link.)

Everything else - bare code-module names (`recall.ts`), gitignored build tools
(node_modules), operator scripts outside the repo (`zoe-autodeploy.sh`), globs, URLs,
placeholders, function-call idioms - is too ambiguous to assert, so it is SKIPPED.

  zoe-drift.py                 # scan defaults, exit 1 on any missing path
  zoe-drift.py --root DIR      # repo root (default: cwd)
  zoe-drift.py --scan a.md b/  # scan explicit files/dirs instead of defaults
  zoe-drift.py --json          # machine-readable report
  zoe-drift.py --selftest
"""
from __future__ import annotations
import argparse, json, os, re, sys

# a backtick span that looks like a repo path: contains a "/" or a known code extension,
# no spaces, reasonable length. Captures the inside of a single-backtick span.
BACKTICK = re.compile(r"`([^`\n]{2,200})`")
CODE_EXT = (".ts", ".tsx", ".js", ".jsx", ".py", ".json", ".md", ".sh", ".sql",
            ".yaml", ".yml", ".toml", ".css", ".html", ".env")
DEFAULT_SCAN = [".claude/rules", "CLAUDE.md", "AGENTS.md"]


def _clean(s: str) -> str:
    s = s.strip().rstrip("/")
    if s.startswith("./"):
        s = s[2:]
    return s


def _obviously_not_a_path(s: str) -> bool:
    if not s or " " in s or "\t" in s:
        return True
    if s.startswith(("http://", "https://", "@", "#", "$", "-", "~", "/")):
        return True
    if "://" in s or "node_modules" in s:
        return True  # URLs, gitignored build tools
    if any(c in s for c in "*?{}[]<>|=") or "..." in s:
        return True  # globs, ranges, placeholders, shell
    if "(" in s or s.endswith((")", ":")):
        return True  # function-call idioms: getSession(), list_tables:
    if "your" in s.lower() or "example" in s.lower():
        return True  # placeholder idioms
    segs = {seg.lower() for seg in s.split("/")}
    if segs & {"foo", "bar", "baz", "qux", "xyz"}:
        return True  # universal placeholder path segments (illustrative, not real)
    return False


def repo_top_entries(root: str) -> set[str]:
    """The real top-level dirs/files in the repo - the whitelist a slashed path's
    first segment must match to count as a checkable in-repo claim."""
    try:
        return {e for e in os.listdir(root) if not e.startswith(".git")}
    except OSError:
        return set()


def missing(cand: str, doc_dir: str, root: str, top: set[str],
            md_basenames: set[str] | None = None) -> bool:
    """True iff `cand` is a checkable in-repo path claim that does NOT resolve."""
    cand = _clean(cand)
    if _obviously_not_a_path(cand):
        return False
    if "/" in cand:
        first = cand.split("/", 1)[0]
        if first not in top:
            return False  # not rooted in the repo (git ref, npm import, system path)
        return not os.path.exists(os.path.join(root, cand))
    # bare name (no slash): only .md sibling cross-refs are checkable
    if cand.endswith(".md"):
        if os.path.exists(os.path.join(doc_dir, cand)):
            return False  # sibling of the doc
        if os.path.exists(os.path.join(root, ".claude", "rules", cand)):
            return False  # a rule file
        if os.path.exists(os.path.join(root, cand)):
            return False  # repo-root doc
        # a bare .md whose basename exists ANYWHERE in the repo is a convention
        # reference (e.g. "renamed to PERSONA.md", which lives at agents/*/PERSONA.md),
        # not a broken path. Only a basename that exists NOWHERE is a real lie.
        if md_basenames is not None and cand in md_basenames:
            return False
        return True       # a .md cross-ref that resolves nowhere = a real lie
    return False          # bare non-.md (module name, script name) = too ambiguous


def md_basename_index(root: str) -> set[str]:
    """Every .md basename present anywhere in the repo (minus node_modules/.git) -
    so a bare `PERSONA.md` convention-reference that lives at agents/*/PERSONA.md
    isn't flagged as a broken path."""
    out = set()
    for dp, dn, fns in os.walk(root):
        dn[:] = [d for d in dn if d not in ("node_modules", ".git")]
        for fn in fns:
            if fn.endswith(".md"):
                out.add(fn)
    return out


def doc_files(root: str, scan: list[str]) -> list[str]:
    out = []
    for entry in scan:
        p = os.path.join(root, entry)
        if os.path.isfile(p):
            out.append(p)
        elif os.path.isdir(p):
            for dp, _dn, fns in os.walk(p):
                for fn in fns:
                    if fn.endswith(".md"):
                        out.append(os.path.join(dp, fn))
    return sorted(set(out))


def scan_doc(path: str, root: str, top: set[str], md_basenames: set[str]) -> list[tuple[int, str]]:
    """Return [(lineno, missing_path)] for every backtick repo-path missing on disk."""
    misses = []
    doc_dir = os.path.dirname(path)
    with open(path, encoding="utf-8") as fh:
        for i, line in enumerate(fh, 1):
            for m in BACKTICK.finditer(line):
                cand = _clean(m.group(1))
                if missing(cand, doc_dir, root, top, md_basenames):
                    misses.append((i, cand))
    return misses


def run(root: str, scan: list[str]) -> dict:
    report = {"root": root, "docs_scanned": 0, "fails": []}
    top = repo_top_entries(root)
    md_basenames = md_basename_index(root)
    for doc in doc_files(root, scan):
        report["docs_scanned"] += 1
        rel = os.path.relpath(doc, root)
        for lineno, miss in scan_doc(doc, root, top, md_basenames):
            report["fails"].append({"doc": rel, "line": lineno, "missing": miss})
    return report


def _selftest() -> int:
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        os.makedirs(os.path.join(td, ".claude", "rules"))
        os.makedirs(os.path.join(td, "scripts", "agents"))
        # a real file the doc can reference truthfully
        open(os.path.join(td, "scripts", "agents", "present.py"), "w").close()
        # a real sibling rule the doc can cross-ref truthfully
        open(os.path.join(td, ".claude", "rules", "sibling.md"), "w").close()
        # a convention file that lives DEEP under a path, referenced bare elsewhere
        os.makedirs(os.path.join(td, "agents", "ceo"))
        open(os.path.join(td, "agents", "ceo", "PERSONA.md"), "w").close()
        rule = os.path.join(td, ".claude", "rules", "x.md")
        with open(rule, "w") as fh:
            fh.write(
                "See `scripts/agents/present.py` - exists, must PASS.\n"      # 1 present slashed -> ok
                "Broken ref to `scripts/agents/GONE.py` - must FAIL.\n"        # 2 missing, first seg 'scripts' real -> FAIL
                "Sibling `sibling.md` resolves in rules - must PASS.\n"        # 3 bare .md sibling -> ok
                "Dangling `no-such-rule.md` cross-ref - must FAIL.\n"          # 4 bare .md nowhere -> FAIL
                "Convention ref `PERSONA.md` exists at agents/ceo - must PASS.\n"  # 5 bare .md, basename exists deep -> skip
                "Skip git ref `origin/main` (first seg not a repo entry).\n"  # 6 origin not entry -> skip
                "Skip npm import `next/dynamic` entirely.\n"                  # 7 next not entry -> skip
                "Skip gitignored `bot/node_modules/.bin/esbuild`.\n"          # 8 node_modules -> skip
                "Skip bare module `recall.ts` (no slash, not .md).\n"         # 9 bare non-md -> skip
                "Skip the URL `https://useicm.com/api` entirely.\n"           # 10 url -> skip
                "Skip a glob `research/*/README.md` entirely.\n"              # 11 glob -> skip
                "Skip a function `getSession()` idiom.\n"                     # 12 call -> skip
                "Skip placeholder `adapters/yours.py`.\n"                     # 13 'your' -> skip
            )
        rep = run(td, DEFAULT_SCAN)
        fails = rep["fails"]
        miss_set = {(f["line"], f["missing"]) for f in fails}
        assert miss_set == {(2, "scripts/agents/GONE.py"), (4, "no-such-rule.md")}, \
            f"expected exactly the 2 real lies (PERSONA.md must be skipped), got {sorted(miss_set)}"
        # a clean doc (only resolvable refs) -> zero fails
        with open(rule, "w") as fh:
            fh.write("Only `scripts/agents/present.py` and `sibling.md` here.\n")
        assert run(td, DEFAULT_SCAN)["fails"] == [], "clean doc must pass"
    print("selftest OK")
    return 0


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description="zoe-drift - fail when a doc references a missing repo path")
    ap.add_argument("--root", default=os.getcwd())
    ap.add_argument("--scan", nargs="*", default=None, help="files/dirs to scan (default: .claude/rules, CLAUDE.md, AGENTS.md)")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args(argv)
    if a.selftest:
        return _selftest()
    root = os.path.abspath(a.root)
    rep = run(root, a.scan or DEFAULT_SCAN)
    if a.json:
        print(json.dumps(rep, indent=2))
    else:
        for f in rep["fails"]:
            print(f"drift: FAIL - {f['doc']}:{f['line']} references missing `{f['missing']}`", file=sys.stderr)
        if rep["fails"]:
            print(f"drift: {len(rep['fails'])} doc lie(s) across {rep['docs_scanned']} docs - fix the doc or the code", file=sys.stderr)
        else:
            print(f"drift: clean - {rep['docs_scanned']} docs scanned, all referenced paths exist")
    return 1 if rep["fails"] else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
