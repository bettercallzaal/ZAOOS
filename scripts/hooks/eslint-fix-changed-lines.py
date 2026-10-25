#!/usr/bin/env python3
"""eslint-fix-changed-lines - the PostToolUse auto-format hook, scoped to the lines
this edit changed.

WHY (2026-10-23, the seat). The hook ran `npx eslint --fix <file>` after every Edit
or Write of a src/**/*.ts(x) file, so a one-line Edit to an old file reflowed the
whole file: a diff full of lines nobody meant to touch, and a review that cannot
see the real change. ESLint has no "fix only these lines" option, so this asks it
for the fixed text without writing (--fix-dry-run --format json), and keeps only
the fixes that fall wholly inside the lines git says changed. Every other line is
left byte-identical.

WHAT COUNTS AS CHANGED: the new-side lines of `git diff -U0 HEAD -- <file>`. A file
git does not track yet is all new, so the whole of it may be fixed.

NEVER BLOCKS, NEVER FAILS LOUDLY: it is a formatter. Any error (no eslint, no git,
unparseable output) leaves the file exactly as it was, and the hook exits 0.

Input: the hook's stdin JSON (tool_input.file_path), else $TOOL_ARG_FILE_PATH.
Tested by scripts/__tests__/eslint-fix-changed-lines.test.ts.
"""
import difflib
import json
import os
import re
import subprocess
import sys

HUNK = re.compile(r"^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@", re.M)


def file_path():
    try:
        data = json.loads(sys.stdin.read() or "{}")
        p = (data.get("tool_input") or {}).get("file_path")
        if p:
            return p
    except Exception:  # noqa: BLE001 - fall back to the env var below
        pass
    return os.environ.get("TOOL_ARG_FILE_PATH", "")


def changed_lines(path, root):
    """The set of 1-based line numbers this file changed against HEAD, or None for
    'the whole file is new' (untracked)."""
    rel = os.path.relpath(path, root)
    tracked = subprocess.run(["git", "-C", root, "ls-files", "--error-unmatch", "--", rel],
                             capture_output=True, text=True)
    if tracked.returncode != 0:
        return None
    d = subprocess.run(["git", "-C", root, "diff", "-U0", "HEAD", "--", rel],
                       capture_output=True, text=True, check=True).stdout
    lines = set()
    for m in HUNK.finditer(d):
        start, count = int(m.group(1)), int(m.group(2) or "1")
        lines.update(range(start, start + count))
    return lines


def fixed_text(path, root):
    r = subprocess.run(["npx", "--no-install", "eslint", "--fix-dry-run", "--format", "json", path],
                       capture_output=True, text=True, cwd=root, timeout=120)
    results = json.loads(r.stdout or "[]")
    return results[0].get("output") if results else None


def keep_fixes_inside(original, fixed, changed):
    """`original` with only those fixes applied whose original-line span lies wholly
    inside `changed` (1-based). A fix that touches any unchanged line is dropped."""
    a, b = original.splitlines(keepends=True), fixed.splitlines(keepends=True)
    out = []
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(a=a, b=b, autojunk=False).get_opcodes():
        if tag == "equal":
            out.extend(a[i1:i2])
            continue
        if tag == "replace" and i2 - i1 == j2 - j1:
            # Same number of lines on both sides: a line-for-line fix (a semicolon,
            # quotes, spacing). Decide each line on its own, so one fixed line in a
            # long run of fixes is kept and its unchanged neighbours are not.
            for k in range(i2 - i1):
                out.append(b[j1 + k] if (i1 + k + 1) in changed else a[i1 + k])
            continue
        span = range(i1 + 1, i2 + 1) if i2 > i1 else range(i1, i1 + 1)
        if span and all(n in changed for n in span):
            out.extend(b[j1:j2])
        else:
            out.extend(a[i1:i2])
    return "".join(out)


def main():
    path = file_path()
    if not path or not re.search(r"\.tsx?$", path) or not os.path.isfile(path):
        return 0
    root = os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()
    try:
        changed = changed_lines(os.path.abspath(path), root)
        fixed = fixed_text(path, root)
        if fixed is None:
            return 0  # eslint had nothing to fix
        original = open(path, encoding="utf-8").read()
        result = fixed if changed is None else keep_fixes_inside(original, fixed, changed)
        if result != original:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(result)
    except Exception:  # noqa: BLE001 - a formatter never blocks an edit
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
