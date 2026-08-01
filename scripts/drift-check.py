#!/usr/bin/env python3
"""drift-check - catch a fact that contradicts itself across the ZAO knowledge sources.

The failure this exists for (doc 2163, r/ClaudeAI thread): a rule/fact lives in
CLAUDE.md AND a rule file AND an ICM box - one copy drifts, nothing errors, and
you find out late from the wrong symptom. Real case: CLAUDE.md said `magnetiq.io`
while the verified URL is `magnetiq.xyz`.

This scans the always-resident + canonical sources and flags:
  1. BRAND-DOMAIN DRIFT - a brand name appearing with two different domains
     (e.g. magnetiq.io vs magnetiq.xyz), auto-detected, no canonical needed.
  2. CANONICAL CONTRADICTIONS - a source stating a value that disagrees with the
     small CANONICAL registry below (high-stakes facts: verified URLs, key dates).

No dependencies. Exit 0 = clean, 1 = drift found (so it gates a commit / CI).
Usage: python3 scripts/drift-check.py [--memory <dir>]  (--memory adds an off-repo
memory dir to the scan; repo sources are always scanned).
"""
import os, re, sys, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --- what to scan (the always-resident + canonical knowledge) ---
def sources(extra_dirs):
    paths = []
    for p in ["CLAUDE.md", "AGENTS.md"]:
        fp = os.path.join(ROOT, p)
        if os.path.exists(fp):
            paths.append(fp)
    # The GLOBAL user CLAUDE.md is always-resident too - and is where the magnetiq
    # drift actually lived (a repo-only scan misses it). Include it if present.
    for gp in ["~/.claude/CLAUDE.md"]:
        fp = os.path.expanduser(gp)
        if os.path.exists(fp):
            paths.append(fp)
    paths += glob.glob(os.path.join(ROOT, ".claude", "rules", "*.md"))
    paths += glob.glob(os.path.join(ROOT, "research", "identity", "icm-boxes", "**", "*.llm.txt"), recursive=True)
    for d in extra_dirs:
        paths += glob.glob(os.path.join(os.path.expanduser(d), "*.md"))
    # Only AUTHORITATIVE sources are checked. Drafts are pre-publication proposals
    # (and often meta-docs ABOUT a correction), not canon - exclude them.
    paths = [p for p in paths if f"{os.sep}drafts{os.sep}" not in p]
    return sorted(set(paths))

def rel(fp):
    home = os.path.expanduser("~")
    if fp.startswith(os.path.join(home, ".claude")):
        return "~" + fp[len(home):]  # e.g. ~/.claude/CLAUDE.md
    try:
        return os.path.relpath(fp, ROOT)
    except ValueError:
        return fp

# --- 1. brand-domain drift (canonical-free) ---
# ZAO-owned / ZAO-relevant brand names whose domain should be consistent.
BRANDS = [
    "wavewarz", "thezao", "zabalgamez", "zabalgames", "sparkz",
    "poidh", "zaostock", "bettercallzaal", "useicm", "restream",
]
# Known-legit multi-domain brands (own more than one on purpose - NOT drift).
# Each set lists the domains that are all correct for that brand.
LEGIT_MULTI = {
    "thezao": {"thezao.com", "thezao.xyz"},      # both owned; .xyz primary
    "wavewarz": {"wavewarz.com", "wavewarz.info"},  # .com site, .info API
}

# brand -> set of TLDs seen -> file map
DOMAIN_RE = re.compile(r"\b(" + "|".join(BRANDS) + r")\.([a-z]{2,6})\b", re.I)

def brand_domain_drift(texts):
    """WARN-level: a brand with >1 domain, minus known-legit multi-domain pairs."""
    seen = {}  # brand -> {domain: set(files)}
    for fp, text in texts.items():
        for m in DOMAIN_RE.finditer(text):
            brand = m.group(1).lower()
            domain = f"{brand}.{m.group(2).lower()}"
            seen.setdefault(brand, {}).setdefault(domain, set()).add(rel(fp))
    findings = []
    for brand, domains in seen.items():
        domset = set(domains)
        if brand in LEGIT_MULTI and domset <= LEGIT_MULTI[brand]:
            continue  # all domains are known-legit for this brand
        if len(domains) > 1:
            findings.append((brand, domains))
    return findings

# --- 2. canonical contradictions ---
# High-stakes facts with a KNOWN-good value. A source using a different value for
# the same entity is drift. Keep this list SHORT and verified.
CANONICAL = {
    # entity            : (correct_value, wrong_values_to_flag)
    "magnetiq domain":    ("magnetiq.xyz", ["magnetiq.io"]),
    "zaostock date":      ("October 3, 2026", ["October 4, 2026", "Oct 4 2026", "Sept"]),
}

# A wrong value is OK if it appears in an explicit-negation context - a source
# warning "NOT magnetiq.io" or "magnetiq.io is a different company" is correcting
# the drift, not committing it. Check both BEFORE and AFTER the match.
NEG_BEFORE = re.compile(r"(not|never|wrong|n[o']t|!=|≠|instead of)\W*$", re.I)
NEG_AFTER = re.compile(r"^\W*(is\s+)?(a\s+)?(different company|different|wrong|not\b|-\s*a different)", re.I)

def _negated(text, start, end):
    """True if the value at [start:end] sits in an explicit-negation context."""
    pre = text[max(0, start - 40):start]
    post = text[end:end + 40]
    return bool(NEG_BEFORE.search(pre) or NEG_AFTER.search(post))

def canonical_drift(texts):
    findings = []
    for entity, (correct, wrongs) in CANONICAL.items():
        for fp, text in texts.items():
            for w in wrongs:
                for m in re.finditer(re.escape(w), text, re.I):
                    if _negated(text, m.start(), m.end()):
                        continue  # "NOT magnetiq.io" / "magnetiq.io is a different company" is fine
                    findings.append((entity, correct, w, rel(fp)))
                    break  # one hit per (entity, wrong, file) is enough
    return findings

def main():
    extra = []
    args = sys.argv[1:]
    if "--memory" in args:
        i = args.index("--memory")
        if i + 1 < len(args):
            extra.append(args[i + 1])
    files = sources(extra)
    texts = {}
    for fp in files:
        try:
            with open(fp, encoding="utf-8") as f:
                texts[fp] = f.read()
        except OSError:
            continue

    print(f"drift-check: scanned {len(texts)} source file(s)\n")

    # WARN-level: multi-domain brands (may be legit; surfaced for a human look).
    bd = brand_domain_drift(texts)
    if bd:
        print("WARN - brand appears with >1 domain (review; add to LEGIT_MULTI if intended):")
        for brand, domains in bd:
            print(f"  ~ {brand}:")
            for dom, fs in sorted(domains.items()):
                print(f"      {dom}  <- {', '.join(sorted(fs))}")
        print()

    # FAIL-level: a source contradicts a verified canonical value.
    cd = canonical_drift(texts)
    if cd:
        print("FAIL - canonical contradiction (source disagrees with the verified value):")
        for entity, correct, wrong, fp in cd:
            print(f"  ! {entity}: found '{wrong}' in {fp} (correct: '{correct}')")
        print("\nDRIFT FOUND. Fix the disagreeing source (change the canon/box first, then downstream).")
        return 1

    print("clean - no canonical contradictions." + (" (see WARNs above)" if bd else ""))
    return 0

if __name__ == "__main__":
    sys.exit(main())
