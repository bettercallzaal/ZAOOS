#!/usr/bin/env python3
"""
PII scanner for bonfire ingestion pipelines. Sibling to secret_scan.py.

secret_scan.py catches API keys / tokens / PEM blocks (credential theft).
pii_scan.py catches third-party PERSONAL data (reputational / relational
leakage): phone numbers, emails, street addresses, SSNs, credit cards,
personal Telegram handles. Implements `.claude/rules/pii-hygiene.md` Rule 3
(the banned-PII patterns) plus its email + Telegram-handle allowlists.

Public entrypoints (mirror secret_scan.py so the pipeline can call both):
  scan_text(s)      -> list of {pattern, severity, excerpt, line_no}
  sanitize_text(s)  -> (cleaned_text, hits)   # redacts to <redacted-*>
  preflight(text, label='ingest') -> {ok, hits, summary, label}
    ok=True iff no HIGH-severity hits.

Severity policy (deliberately asymmetric — the graph LEGITIMATELY holds
people, so over-blocking would kill the bulk research-library ingest):

  HIGH  (BLOCK)  structured PII that should ~never appear in an episode:
                 formatted phone, SSN, Luhn-valid credit card, labeled DOB.
  MED   (LOG)    email / personal Telegram handle / street address —
                 flagged for review, posted unless --sanitize redacts them.
  (allowlisted emails + bot/handle allowlist are skipped entirely.)

KNOWN LIMITATION — read before trusting this as "PII-safe":
  Regex catches STRUCTURED PII only. It does NOT catch a person's NAME
  ("Gustavo de Lima Cavalcanti") or a free-text sensitive disclosure
  ("diagnosed with Hyper-IgE Syndrome") — those are just words. The
  highest-leakage cases in the ZAO Bonfire (real names + health/biographical
  context, per pii-hygiene.md "Bonfire / knowledge-graph specifics") need
  the human approval step the bot already runs ("Approve all?") or an LLM
  classifier. This scanner is the structured-PII floor, not the ceiling.
  See research/agents/798-bonfire-graph-quality-audit/.
"""

import re

# ---------------------------------------------------------------------------
# Allowlists (verbatim from .claude/rules/pii-hygiene.md). These may appear
# in committed artifacts AND in graph episodes without redaction.
# ---------------------------------------------------------------------------
EMAIL_ALLOWLIST = {
    "zaal@thezao.com",
    "zaalp99@gmail.com",
    "zaal@bettercallzaal.com",
    "zoe-zao@agentmail.to",
    "hello@thezao.com",
    "support@thezao.com",
}

# Public role-email local-parts for ZAO/BCZ entities (contact@<brand>.com etc).
ROLE_EMAIL_LOCALPARTS = {"contact", "team", "hello", "support", "info", "admin"}

# Public ZAO bot identities — handles that are NOT personal PII.
TELEGRAM_HANDLE_ALLOWLIST = {
    "@zaoclaw_bot",
    "@zoe_hermes_bot",
    "@zaodevz_bot",
    "@zabal_bonfire",
    "@zabal_bonfire_bot",
    "@zaostockteambot",
    "@zaocoworkingbot",
}

EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
# @handle: 5-32 word chars, the Telegram shape. Bot handles (suffix `bot`)
# are excluded as non-personal in _classify_handle.
HANDLE_RE = re.compile(r"(?<![A-Za-z0-9._%+-])@([A-Za-z][A-Za-z0-9_]{4,31})\b")

# Structured-PII patterns. (name, severity, compiled).
PATTERNS = [
    # ===== HIGH — block =====
    # US phone REQUIRING separators/parens/+1 so a bare 10-digit epoch
    # (1749081600) or numeric id does NOT false-positive.
    ("us_phone_formatted", "HIGH", re.compile(
        r"(?:\+?1[\s.-])?\(\d{3}\)[\s.-]?\d{3}[\s.-]?\d{4}\b"
        r"|(?:\+?1[\s.-])?\d{3}[\s.-]\d{3}[\s.-]\d{4}\b"
    )),
    ("us_ssn", "HIGH", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
    # DOB only when context-labeled — bare MM/DD/YYYY is too noisy (event
    # dates) to block on.
    ("dob_labeled", "HIGH", re.compile(
        r"(?i)(?:dob|d\.o\.b\.|date of birth|born(?: on)?)\D{0,12}"
        r"(?:0?[1-9]|1[012])[-/](?:0?[1-9]|[12]\d|3[01])[-/](?:19|20)\d{2}\b"
    )),

    # ===== MED — log + post (sanitize redacts) =====
    ("street_address", "MED", re.compile(
        r"\b\d{1,5}\s+(?:[A-Z][a-z]+\.?\s+){1,3}"
        r"(?:St|Street|Ave|Avenue|Blvd|Rd|Road|Dr|Drive|Ln|Lane|Way|Pl|Place|Ct|Court|Pkwy|Parkway)\b"
    )),
    ("intl_phone", "MED", re.compile(r"\+\d{1,3}\s*\d{2,4}\s*\d{6,}")),
]

# Credit-card candidate (validated by Luhn -> HIGH, else dropped).
CC_CANDIDATE_RE = re.compile(r"\b(?:\d[ -]?){13,16}\b")


def _luhn_ok(number: str) -> bool:
    digits = [int(c) for c in number if c.isdigit()]
    if not 13 <= len(digits) <= 19:
        return False
    checksum = 0
    parity = len(digits) % 2
    for i, d in enumerate(digits):
        if i % 2 == parity:
            d *= 2
            if d > 9:
                d -= 9
        checksum += d
    return checksum % 10 == 0


def _redact(ex: str) -> str:
    return ex[:3] + "..." + ex[-2:] if len(ex) > 8 else "..."


def _email_allowed(email: str) -> bool:
    e = email.lower()
    if e in EMAIL_ALLOWLIST:
        return True
    local = e.split("@", 1)[0]
    return local in ROLE_EMAIL_LOCALPARTS


def _handle_allowed(handle: str) -> bool:
    h = handle.lower()
    if h in TELEGRAM_HANDLE_ALLOWLIST:
        return True
    # Any *_bot handle is a bot identity, not personal PII.
    return h.endswith("bot")


def scan_text(text):
    """Return list of {pattern, severity, excerpt, line_no}."""
    hits = []

    def _add(name, sev, m):
        ex = m.group(0)
        hits.append({
            "pattern": name,
            "severity": sev,
            "excerpt": _redact(ex),
            "line_no": text[:m.start()].count("\n") + 1,
        })

    for name, sev, pat in PATTERNS:
        for m in pat.finditer(text):
            _add(name, sev, m)

    for m in EMAIL_RE.finditer(text):
        if not _email_allowed(m.group(0)):
            _add("email_personal", "MED", m)

    for m in HANDLE_RE.finditer(text):
        if not _handle_allowed("@" + m.group(1)):
            _add("telegram_handle_personal", "MED", m)

    for m in CC_CANDIDATE_RE.finditer(text):
        if _luhn_ok(m.group(0)):
            _add("credit_card_luhn", "HIGH", m)

    return hits


def sanitize_text(text):
    """Return (cleaned_text, hits). Replaces matches with <redacted-*>."""
    hits = []
    cleaned = text

    def _sub_factory(name, sev, placeholder):
        def _sub(m):
            hits.append({"pattern": name, "severity": sev, "excerpt": _redact(m.group(0))})
            return placeholder
        return _sub

    # Structured patterns first.
    placeholders = {
        "us_phone_formatted": "<redacted-phone>",
        "intl_phone": "<redacted-phone>",
        "us_ssn": "<redacted-ssn>",
        "dob_labeled": "<redacted-dob>",
        "street_address": "<redacted-address>",
    }
    for name, sev, pat in PATTERNS:
        cleaned = pat.sub(_sub_factory(name, sev, placeholders.get(name, "<redacted-pii>")), cleaned)

    # Luhn-valid cards.
    def _cc_sub(m):
        if _luhn_ok(m.group(0)):
            hits.append({"pattern": "credit_card_luhn", "severity": "HIGH", "excerpt": _redact(m.group(0))})
            return "<redacted-cc>"
        return m.group(0)
    cleaned = CC_CANDIDATE_RE.sub(_cc_sub, cleaned)

    # Emails / handles, allowlist-aware.
    def _email_sub(m):
        if _email_allowed(m.group(0)):
            return m.group(0)
        hits.append({"pattern": "email_personal", "severity": "MED", "excerpt": _redact(m.group(0))})
        return "<redacted-email>"
    cleaned = EMAIL_RE.sub(_email_sub, cleaned)

    def _handle_sub(m):
        if _handle_allowed("@" + m.group(1)):
            return m.group(0)
        hits.append({"pattern": "telegram_handle_personal", "severity": "MED", "excerpt": _redact(m.group(0))})
        return "@<redacted-handle>"
    cleaned = HANDLE_RE.sub(_handle_sub, cleaned)

    return cleaned, hits


def preflight(text, label="ingest"):
    """{ok, hits, summary:{HIGH,MED,LOW}, label}. ok=True iff no HIGH hits."""
    hits = scan_text(text)
    by_sev = {"HIGH": 0, "MED": 0, "LOW": 0}
    for h in hits:
        by_sev[h["severity"]] = by_sev.get(h["severity"], 0) + 1
    return {"ok": by_sev.get("HIGH", 0) == 0, "label": label, "hits": hits, "summary": by_sev}


if __name__ == "__main__":
    import json
    import sys

    # SYNTHETIC fixtures only. The phone/SSN/CC values below are invalid /
    # reserved shapes chosen to match regexes — never paste real PII here.
    fixture = """
    Allowlisted, must NOT flag: zaal@thezao.com, contact@somebrand.com
    Public bot handle, must NOT flag: @zabal_bonfire_bot @zaodevz_bot
    Bare epoch must NOT flag as phone: 1749081600
    ISO event date must NOT flag as DOB: 2026-04-29

    --- SHOULD flag MED ---
    Personal email: someone@randommail.io
    Personal handle: @GCvlcnti
    Street: 1234 Example Avenue

    --- SHOULD flag HIGH (block) ---
    Phone: (555) 123-4567
    SSN: 123-45-6789
    Labeled DOB: born on 04/12/1990
    Card (Luhn-valid test number): 4242 4242 4242 4242
    """
    result = preflight(fixture, label="self-test")
    print(json.dumps(result, indent=2))
    # Expect: HIGH >= 3 (phone, ssn, dob, cc), MED >= 3 (email, handle, address).
    ok = result["summary"]["HIGH"] >= 4 and result["summary"]["MED"] >= 3
    print(f"\nself-test {'PASS' if ok else 'FAIL'}: {result['summary']}")
    sys.exit(0 if ok else 1)
