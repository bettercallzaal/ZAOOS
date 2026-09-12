#!/usr/bin/env python3
"""git-pii-scan.py - block a commit that stages someone else's personal data.

`.claude/rules/pii-hygiene.md` was written 2026-05-23 and specifies the regexes,
the allowlists, and the pre-flight checks. Its own line 153 says a pre-commit hook
automating them "is a worthwhile follow-up". It was never built, so for fifteen
months the rule has been a manual checklist - which is exactly the shape of rule
that gets economised away on a busy day.

WHAT THE MEASUREMENT CHANGED. Before writing this, the rule's seven patterns were
run against the last 40 commits on main. Results decided the design:

  email       2 hits, BOTH allowlisted (zoe-zao@agentmail.to, zoe@thezao.com)
  us_phone    2 hits, BOTH false positives - a UUID and a Kickstarter URL
  cc          1 hit,  false positive - the same UUID
  intl_phone  0
  street      0
  birthdate   0
  tg_handle   86 hits across 14 of 40 commits

So `@\\w+` for Telegram handles is DROPPED, deliberately, and this is the most
important design decision here. It fires on every @mention in a task table, every
npm scope, every code decorator. The rule's allowlist names six bot handles while
the repo legitimately mentions teammates constantly, so no allowlist fixes it.
A check that fires on 35% of commits gets bypassed within a week, and then the
email check dies with it (.claude/rules/noisy-signal-guard.md). Better to block
the six patterns that can be precise than to lose all seven to alert fatigue.

Handle PII is still covered by the rule for humans to apply; it is simply not
mechanised, and saying so is more honest than pretending otherwise.

Phone and card patterns keep the rule's regex but skip UUID-shaped and URL-bearing
lines, because that is what every observed false positive was.

Exits NON-ZERO on a hit. A security scan fails closed (silent-failure-guard rule 5).
"""
from __future__ import annotations

import re
import subprocess
import sys

# From pii-hygiene.md's "Email allowlist" section. These are already public.
EMAIL_ALLOW = {
    "zaal@thezao.com",
    "zaalp99@gmail.com",
    "zaal@bettercallzaal.com",
    "zoe-zao@agentmail.to",
    "hello@thezao.com",
    "support@thezao.com",
}
# From pii-hygiene.md's "Venue address allowlist" section (added 2026-09-06).
# A commercial venue's OWN PUBLISHED address is not third-party personal data.
# The street_address pattern cannot tell a gallery from a home, so it fired on
# venues whose addresses came off their own public event listings and blocked a
# research doc for protecting nobody.
#
# EXACT MATCH ONLY, and deliberately so. This does not loosen the pattern, does
# not exempt a street, and does not exempt a number range. Every entry is a
# business or public venue, published by the venue or its event, recorded as
# where an event happened. A private residence is never eligible, and a venue
# address used to place an INDIVIDUAL still gets redacted - the allowlist covers
# the address, not the use.
VENUE_ADDR_ALLOW = {
    "300 broome st",   # Heft Gallery, NYC
    "91 allen st",     # Cycol Gallery, NYC
    "141 e houston st",  # Solana / Skyline Tower, NYC
    "247 w 30th st",   # American Whiskey, NYC
    "48 e 23rd st",    # SPIN New York Flatiron
}

# Public role-addresses on ZAO-controlled domains, per the same section.
ROLE_PREFIXES = ("contact@", "team@", "info@", "hello@", "support@", "press@", "zoe@")
ZAO_DOMAINS = ("thezao.com", "bettercallzaal.com", "zabalgamez.com", "zaofestivals.com")

# Lines that produced every observed false positive. A UUID is not a phone number.
UUID_RE = re.compile(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}", re.I)
URL_RE = re.compile(r"https?://|www\.")
# Long hex tokens - a transaction hash, an address, a token id - contain runs of
# ten consecutive decimal digits by pure chance, and such a run satisfies the
# NANP phone pattern. Real case, 2026-08-17: the on-chain evidence for the
# fractal weekly record was blocked because an Optimism tx hash ended in a
# ten-digit decimal run. The (?<![\d]) lookbehind does not help, because those
# digits are preceded by a hex LETTER rather than a digit. Same false-positive
# class the header already records for a UUID, so it joins the same guard.
# (The offending hash is not reproduced here - a literal digit run in this file
# would trip the scanner it belongs to. It is pinned in the tests, assembled at
# runtime, alongside the pre-existing fixtures that do the same.)
HEX_RE = re.compile(r"0x[0-9a-fA-F]{16,}|\b[0-9a-fA-F]{32,}\b")

PATTERNS: dict[str, tuple[str, bool]] = {
    # name: (regex, skip_on_uuid_or_url)
    "email": (r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", False),
    # NANP: neither the area code nor the exchange code may begin with 0 or 1.
    # The old pattern allowed any digits, so a bare 10-digit run matched - and
    # bare 10-digit runs in this repo are overwhelmingly Unix timestamps. It
    # blocked doc 2288 on the filenames loops-report.sh.bak-1786325436 and
    # -1786325477, and the header above already records that BOTH historical
    # us_phone hits were false positives too. Requiring [2-9] on both codes
    # costs no real coverage: a number those digits would reject is not a
    # dialable US number. The (?<!\d) also stops a match STARTING mid-run: a
    # 13-digit millisecond timestamp like draft-1786759226095 contains a
    # perfectly valid-looking 10-digit tail, which the NANP fix alone allowed.
    "us_phone": (r"(?<![\d])\+?1?[\s.-]?\(?[2-9]\d{2}\)?[\s.-]?[2-9]\d{2}[\s.-]?\d{4}\b", True),
    # The rule's own regex was r"\+\d{1,3}\s*\d{6,}", which requires the digits
    # to run together and therefore MISSES a normally-formatted number like
    # "+44 208 8901282". Widened to allow internal spaces, dots and hyphens.
    "intl_phone": (r"\+\d{1,3}[\s.\-]?(?:\d[\s.\-]?){6,}", True),
    "street_address": (r"\d{1,5}\s+\w+\s+(?:St|Ave|Blvd|Rd|Dr|Ln|Way|Pl|Ct|Pkwy)\b", False),
    "birthdate": (r"\b(?:0?[1-9]|1[012])[-/](?:0?[1-9]|[12]\d|3[01])[-/](?:19|20)\d{2}\b", True),
    "card_number": (r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b", True),
}


def venue_addr_allowed(addr: str) -> bool:
    """True only for an exact match against VENUE_ADDR_ALLOW.

    Normalises whitespace and case so "300  Broome  St" and "300 Broome St" are
    the same entry. Does nothing else - no prefix matching, no street-level
    wildcards. If it is not on the list character for character, it is blocked.
    """
    return " ".join(addr.split()).lower() in VENUE_ADDR_ALLOW


def email_allowed(addr: str) -> bool:
    a = addr.lower()
    if a in EMAIL_ALLOW:
        return True
    return a.startswith(ROLE_PREFIXES) and a.endswith(ZAO_DOMAINS)


def _added_against(base: str | None) -> list[tuple[str, str]]:
    """[(file, added_line)] from the staged diff against `base` (HEAD if None)."""
    cmd = ["git", "diff", "--cached", "--unified=0", "--no-color"]
    if base:
        cmd.append(base)
    out = subprocess.run(cmd, capture_output=True, text=True, check=False)
    rows: list[tuple[str, str]] = []
    current = "?"
    for line in out.stdout.splitlines():
        if line.startswith("+++ b/"):
            current = line[6:]
        elif line.startswith("+") and not line.startswith("+++"):
            rows.append((current, line[1:]))
    return rows


def _merging() -> bool:
    return subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "MERGE_HEAD"],
        capture_output=True, text=True, check=False,
    ).returncode == 0


def staged_added_lines() -> list[tuple[str, str]]:
    """[(file, added_line)] from the staged diff. Added lines only - context lines
    are already committed, and re-flagging them would make every commit near an
    old address impossible.

    ON A MERGE COMMIT, "added" against HEAD is not the same as "authored here".
    The index holds everything BOTH parents brought, so every line the other side
    committed reads as new. Measured 2026-09-12 merging main into a 44-commit-stale
    branch: this refused the commit over an address-shaped string that had been on
    main since 2026-09-08, which nobody in the merge wrote. That is the same
    principle the paragraph above already states, applied one level out - the line
    is already committed, just on the other parent.

    So mid-merge a line counts only if it is absent from BOTH parents: intersect
    the two diffs. A line the other side brought is present in MERGE_HEAD and
    never enters the second set; a line typed DURING the resolution is in neither
    parent, enters both, and is still caught. That second case is the one this
    must not lose, because it is a real address arriving through a merge.

    FAILS CLOSED. If the MERGE_HEAD diff cannot be taken, the rows are left
    unfiltered - which is exactly today's behaviour, so a broken read can only
    over-report, never under-report, on a security gate.
    """
    rows = _added_against(None)
    if not rows or not _merging():
        return rows
    theirs = _added_against("MERGE_HEAD")
    if not theirs:
        # Either the other parent genuinely added nothing, or the diff failed.
        # Both are indistinguishable here, so do not filter. Over-reporting on a
        # PII gate is recoverable; under-reporting is not.
        return rows
    theirs_set = set(theirs)
    return [r for r in rows if r in theirs_set]


def scan(rows: list[tuple[str, str]]) -> list[tuple[str, str, str, str]]:
    """-> [(kind, file, match, line)]"""
    found: list[tuple[str, str, str, str]] = []
    for path, line in rows:
        skip_numeric = bool(
            UUID_RE.search(line) or URL_RE.search(line) or HEX_RE.search(line)
        )
        for kind, (pat, guarded) in PATTERNS.items():
            if guarded and skip_numeric:
                continue
            for m in re.findall(pat, line):
                text = m if isinstance(m, str) else m[0]
                if kind == "email" and email_allowed(text):
                    continue
                if kind == "street_address" and venue_addr_allowed(text):
                    continue
                found.append((kind, path, text, line.strip()[:100]))
    return found


def main() -> int:
    rows = staged_added_lines()
    if not rows:
        return 0
    found = scan(rows)
    if not found:
        return 0

    print("COMMIT BLOCKED - personal data in the staged diff\n", file=sys.stderr)
    for kind, path, match, line in found:
        print(f"  {kind:15} {path}", file=sys.stderr)
        print(f"  {'':15} matched: {match}", file=sys.stderr)
        print(f"  {'':15} line:    {line}", file=sys.stderr)
        print(file=sys.stderr)
    print(
        "Third-party personal data must not be committed. Redact it, or add the\n"
        "address to BOTH the allowlist section in .claude/rules/pii-hygiene.md AND\n"
        "the matching set in this script (EMAIL_ALLOW / VENUE_ADDR_ALLOW) - the\n"
        "markdown is documentation, the sets are what this scanner reads. A venue\n"
        "address is eligible only if it is a published commercial venue; a home\n"
        "ZAO address. Raw query output belongs in ~/.zao/private/, never the repo.\n\n"
        "If this is a false positive, that is a bug in the scanner worth fixing -\n"
        "say so rather than bypassing, because a check people route around protects\n"
        "nobody.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
