#!/usr/bin/env python3
"""zao-vault-linkrot - find dead paths and dead doc numbers in the vault.

Scans zao-vault/handoffs and /notes (the files lanes actually boot from) and
reports references that no longer resolve, so a lane never boots on a path
that vanished.

WHY THIS IS GIT-TRACKED: the shepherd loop depends on it, and
`.claude/rules/vanishing-dependencies.md` is explicit - if something depends on
a file, git must hold it. Four load-bearing scripts died untracked in one day.

Residual known-benign hits (3 as of 2026-08-19): two vault lines wrap a real
filename across more than the two lines joined below, and one is the prose
"~25-record batches". Left rather than special-cased - a rule that contorts to
reach zero stops meaning anything.

Run: python3 scripts/agents/zao-vault-linkrot.py
"""
import os, re, glob, subprocess

HOME = os.path.expanduser("~")
VAULT = os.path.join(HOME, "zao-vault")
REPO = "/Users/zaalpanthaki/Documents/ZAO OS V1"

# scan handoffs + notes (the files lanes actually boot from)
targets = []
for sub in ("handoffs", "notes"):
    targets += glob.glob(os.path.join(VAULT, sub, "**", "*.md"), recursive=True)
# INSTRUMENT FIX 3a: archive/ holds superseded briefs. A path that has since
# gone is EXPECTED there, so scanning archives makes the check fire on the
# normal case - the definition of a broken instrument.
targets = [t for t in targets if "/archive/" not in t]

path_re = re.compile(r"(~[\w./\-]+|/Users/zaalpanthaki/[\w./\- ]+?)(?=[\s,;)`\"']|$)")
doc_re = re.compile(r"\bdoc(?:ument)?\s*#?(\d{3,4})\b", re.I)

bad_paths = {}
bad_docs = {}

# build the set of real doc numbers once
# INSTRUMENT FIX 2: read ORIGIN/MAIN, not the working tree. This session's
# checkout sits on a feature branch several merges behind main, so the first
# run reported docs 2321/2322/2323 as nonexistent when all three are on main.
# A scanner pointed at a stale tree invents rot (state-claims: name the source).
real_docs = set()
try:
    out = subprocess.run(
        ["git", "-C", REPO, "ls-tree", "-r", "--name-only", "origin/main"],
        capture_output=True, text=True, timeout=60).stdout
    for m in re.finditer(r"research/[a-z-]+/(\d{3,4})-", out):
        real_docs.add(m.group(1).lstrip("0") or "0")
except Exception:
    pass
if not real_docs:  # fail loud rather than pass everything
    print("WARNING: could not read origin/main - doc check SKIPPED, not passed")

for f in targets:
    try:
        s = open(f, errors="replace").read()
    except Exception:
        continue
    rel = os.path.relpath(f, VAULT)
    for m in path_re.finditer(s):
        p = m.group(1).rstrip(".,:;)")
        if len(p) < 8:
            continue
        # skip obvious prose/globs
        if any(c in p for c in "*<>") or p.endswith("/"):
            continue
        full = os.path.expanduser(p)
        if os.path.exists(full):
            continue
        # INSTRUMENT FIX 2026-08-19: real paths contain spaces ("ZAO OS V1",
        # "ZAO-STOCK Standup - ....mp4"), and a whitespace-terminated regex
        # truncates them, so the first run reported ~/Documents/ZAO and
        # ~/Desktop/ZAO-STOCK as broken when both resolve once the rest of the
        # name is included. Before calling a path dead, check whether the line
        # continues it into something that exists (noisy-signal-guard: fix the
        # instrument before acting on its output).
        line = s_lines[s.count("\n", 0, m.start())] if False else None
        # INSTRUMENT FIX 3c: two more sources of fake rot.
        # (i) URLs - "farcaster.xyz/~/spaces/..." and wix "...~mv2.jpg" are not
        #     filesystem paths at all; a preceding domain or non-space char means
        #     this is a URL fragment.
        # (ii) LINE WRAP - vault prose wraps at ~78 cols, so a real path can
        #      continue on the NEXT line ("~/Desktop/ZAO-STOCK Standup - \n2026...").
        #      Checking only the current line calls a live file dead.
        before = s[max(0, m.start() - 2):m.start()]
        if before and not before[-1].isspace() and before[-1] not in "(`\"'":
            continue
        tail = " ".join(s[m.start():m.start() + 300].split("\n")[:2])
        # INSTRUMENT FIX 3b: a path annotated (VPS)/(Pi)/(remote) is correct and
        # simply not on this machine. Without this the annotation could never
        # clear the flag, and a check that cannot reach zero is one nobody reads.
        if re.match(r"[^\n]{0,40}?\((VPS|Pi|remote)\)", tail, re.I):
            continue
        alive = False
        for cut in range(len(tail), len(p), -1):
            cand = os.path.expanduser(tail[:cut].rstrip(".,:;)`\"'"))
            if os.path.exists(cand):
                alive = True
                break
        if not alive:
            bad_paths.setdefault(rel, set()).add(p)
    for m in doc_re.finditer(s):
        n = m.group(1).lstrip("0") or "0"
        if n not in real_docs:
            bad_docs.setdefault(rel, set()).add(m.group(1))

print(f"scanned {len(targets)} vault files; {len(real_docs)} real research docs\n")
print("=== PATHS THAT DO NOT RESOLVE ===")
for rel in sorted(bad_paths):
    for p in sorted(bad_paths[rel]):
        print(f"  {rel}: {p}")
print("\n=== DOC NUMBERS WITH NO MATCHING FOLDER ===")
for rel in sorted(bad_docs):
    print(f"  {rel}: {', '.join(sorted(bad_docs[rel]))}")
