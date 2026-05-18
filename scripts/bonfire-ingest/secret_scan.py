#!/usr/bin/env python3
"""
Sensitive-info scanner for bonfire ingestion pipelines.

v2 (2026-05-18): added template-placeholder detection. The retro README
audit found 8 hits, ALL false positives (your_key_here, xxxx, password)
in .env.example setup sections. v2 distinguishes between:
  - template_placeholder: env-style assignment with obvious dummy value (LOW)
  - real_secret_assign:   env-style assignment with high-entropy value (HIGH)

Public entrypoints:
  scan_text(s)      -> list of (pattern_name, severity, redacted_excerpt)
  sanitize_text(s)  -> (cleaned_text, hits)
  preflight(text, label='ingest') -> dict {ok, hits, summary}
    ok=True if no HIGH severity hits, False otherwise

Conservative bias: false positives preferred over false negatives for
HIGH severity. Template-detection is opt-in - if you want strict mode,
pass strict=True.
"""

import re

# Obvious placeholder values - if an env-style assignment's value matches
# any of these, downgrade to LOW (template_placeholder).
TEMPLATE_VALUE_PATTERN = re.compile(
    r"^[\"' ]?("
    r"x{3,}"
    r"|X{3,}"
    r"|\d+x+"
    r"|your[_-]?(key|token|api|secret|password|url|id|address)([_-]?here)?"
    r"|<[^>]+>"
    r"|\[[^\]]+\]"
    r"|paste[_-].*"
    r"|REDACTED.*"
    r"|REPLACE[_-]?ME"
    r"|changeme"
    r"|example[_-].*"
    r"|sample[_-].*"
    r"|fake[_-].*"
    r"|dummy[_-].*"
    r"|insert[_-].*"
    r"|TODO.*"
    r"|FIXME.*"
    r"|password"
    r"|secret"
    r"|token"
    r"|<your.*>"
    r"|0000+"
    r"|1111+"
    r"|abcdef+"
    r"|test[_-].*"
    r"|demo[_-].*"
    r")",
    re.IGNORECASE
)

ENV_ASSIGN_RE = re.compile(
    r"(?im)^\s*(?P<key>(?:[A-Z][A-Z0-9_]+_)?(?:KEY|TOKEN|SECRET|PASSWORD|API|PRIVKEY|PRIVATE_KEY|PWD|ID|URL))\s*=\s*(?P<val>[\"']?[^\s\"'#]+[\"']?)"
)

PATTERNS = [
    # ===== Hard credentials (HIGH) =====
    ("anthropic_api_key", "HIGH", re.compile(r"sk-ant-[A-Za-z0-9_-]{20,}")),
    ("openai_api_key_real", "HIGH", re.compile(r"sk-(?:proj-|cp-)?[A-Za-z0-9_-]{30,}")),
    ("github_pat_classic", "HIGH", re.compile(r"ghp_[A-Za-z0-9]{36}")),
    ("github_pat_fine", "HIGH", re.compile(r"github_pat_[A-Za-z0-9_]{60,}")),
    ("github_app_token", "HIGH", re.compile(r"ghs_[A-Za-z0-9]{36}")),
    ("github_oauth_token", "HIGH", re.compile(r"gho_[A-Za-z0-9]{36}")),
    ("aws_access_key", "HIGH", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("aws_secret_key", "HIGH", re.compile(r"(?i)aws.{0,20}(?:secret|sk).{0,20}[\"' :=]+[A-Za-z0-9/+=]{40}")),
    ("gcp_service_account", "HIGH", re.compile(r"\"type\"\s*:\s*\"service_account\"")),
    ("private_key_pem", "HIGH", re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED |PGP )?PRIVATE KEY-----")),
    ("eth_privkey_hex", "HIGH", re.compile(r"\b0x[0-9a-fA-F]{64}\b")),
    ("hex64_bare", "HIGH", re.compile(r"(?<![0-9a-fA-F])[0-9a-fA-F]{64}(?![0-9a-fA-F])")),
    ("telegram_bot_token", "HIGH", re.compile(r"\b\d{9,12}:[A-Za-z0-9_-]{30,}\b")),
    ("discord_bot_token", "HIGH", re.compile(r"\b[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}\b")),
    ("slack_token", "HIGH", re.compile(r"xox[bpaors]-[A-Za-z0-9-]{10,}")),
    ("postgres_url_with_creds", "HIGH", re.compile(r"postgres(?:ql)?://[^\s:]+:[^\s@]+@[^\s]+")),
    ("mongo_url_with_creds", "HIGH", re.compile(r"mongodb(?:\+srv)?://[^\s:]+:[^\s@]+@[^\s]+")),
    ("redis_url_with_creds", "HIGH", re.compile(r"redis(?:s)?://[^\s:]+:[^\s@]+@[^\s]+")),
    ("authorization_bearer", "HIGH", re.compile(r"(?i)authorization\s*[:=]\s*[\"']?bearer\s+[A-Za-z0-9._~+/=-]{20,}")),
    ("mnemonic_labeled", "HIGH", re.compile(
        r"(?i)(?:mnemonic|seed.{0,5}phrase|recovery.{0,5}phrase|seed.{0,5}words)\s*[:=]?\s*[\"']?(?:\b[a-z]+\b[ \t]+){11,23}\b[a-z]+\b"
    )),

    # ===== Infrastructure (MED - flag but allow) =====
    ("vps_ip_iman", "MED", re.compile(r"\b187\.77\.3\.104\b")),
    ("hostinger_ip", "MED", re.compile(r"\b31\.97\.148\.88\b")),
    ("private_rfc1918", "MED", re.compile(r"\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b")),
    ("supabase_url_in_text", "MED", re.compile(r"https://[a-z0-9]{20}\.supabase\.co")),

    # ===== Personal info (LOW - flag for review) =====
    ("personal_email", "LOW", re.compile(r"\b[A-Za-z0-9._%+-]+@(?:gmail|outlook|hotmail|yahoo|icloud|protonmail|me)\.com\b")),
]


def _classify_env_assign(line, key, val):
    """Return ('template_placeholder', 'LOW') or ('real_secret_assign', 'HIGH')."""
    stripped = val.strip("\"' ")
    # Match against template patterns
    if TEMPLATE_VALUE_PATTERN.match(stripped):
        return ("template_placeholder", "LOW")
    # Very short values are placeholders
    if len(stripped) < 8:
        return ("template_placeholder", "LOW")
    # Empty or just punctuation
    if not re.search(r"[A-Za-z0-9]", stripped):
        return ("template_placeholder", "LOW")
    # Otherwise high-entropy + suspicious
    return ("real_secret_assign", "HIGH")


def scan_text(text):
    """Return list of dicts: {pattern, severity, excerpt, line_no}."""
    hits = []

    # First pass: env-style assignments with template detection
    for m in ENV_ASSIGN_RE.finditer(text):
        key = m.group("key")
        val = m.group("val")
        pname, sev = _classify_env_assign(m.group(0), key, val)
        ex = m.group(0)
        redacted = ex if len(ex) <= 30 else (ex[:15] + "..." + ex[-8:])
        line_no = text[:m.start()].count("\n") + 1
        hits.append({"pattern": pname, "severity": sev, "excerpt": redacted, "line_no": line_no})

    # Second pass: hard pattern matches
    for name, sev, pat in PATTERNS:
        for m in pat.finditer(text):
            ex = m.group(0)
            redacted = ex[:4] + "..." + ex[-4:] if len(ex) > 12 else "..."
            line_no = text[:m.start()].count("\n") + 1
            hits.append({"pattern": name, "severity": sev, "excerpt": redacted, "line_no": line_no})

    return hits


def sanitize_text(text):
    """Return (sanitized_text, hits). Replaces matches with [REDACTED:name]."""
    hits = []
    cleaned = text

    def _env_sub(m):
        pname, sev = _classify_env_assign(m.group(0), m.group("key"), m.group("val"))
        if sev == "HIGH":
            ex = m.group(0)
            redacted = ex[:15] + "..." + ex[-8:] if len(ex) > 30 else "..."
            hits.append({"pattern": pname, "severity": sev, "excerpt": redacted})
            return f"{m.group('key')}=[REDACTED:{pname}]"
        return m.group(0)  # leave template lines unchanged

    cleaned = ENV_ASSIGN_RE.sub(_env_sub, cleaned)

    for name, sev, pat in PATTERNS:
        def _sub(m, _name=name, _sev=sev):
            ex = m.group(0)
            redacted = ex[:4] + "..." + ex[-4:] if len(ex) > 12 else "..."
            hits.append({"pattern": _name, "severity": _sev, "excerpt": redacted})
            return f"[REDACTED:{_name}]"
        cleaned = pat.sub(_sub, cleaned)
    return cleaned, hits


def preflight(text, label="ingest"):
    """
    Returns: {ok, hits, summary: {high, med, low}, label}
    ok=True iff NO high-severity hits remain (med/low are reported, not blocked).
    Caller decides whether to sanitize, block, or pass through.
    """
    hits = scan_text(text)
    by_sev = {"HIGH": 0, "MED": 0, "LOW": 0}
    for h in hits:
        by_sev[h["severity"]] = by_sev.get(h["severity"], 0) + 1
    return {
        "ok": by_sev.get("HIGH", 0) == 0,
        "label": label,
        "hits": hits,
        "summary": by_sev,
    }


if __name__ == "__main__":
    import json, sys

    # Self-test fixtures.
    #
    # CRITICAL: every value below is SYNTHETIC - characters chosen to match
    # the regex patterns but with no real-world validity. NEVER paste a real
    # secret here even temporarily. We learned this 2026-05-18: a real
    # Telegram bot token in a prior fixture triggered GitHub Secret Scanning
    # the moment the PR was pushed + forced a rotation.
    #
    # IPs use TEST-NET-1/2/3 (RFC 5737) which are reserved for docs.
    # Hex strings use all-zero or repeated patterns.
    # Token-shaped strings use FAKE_DO_NOT_USE markers in the value.
    test = """
    Synthetic Anthropic shape: sk-ant-FAKE0000FAKE0000FAKE0000FAKE0000
    Synthetic GitHub PAT shape: ghp_FAKE000000000000000000000000000000FAKE
    TEST-NET-2 example IP 198.51.100.1 (reserved, never routable)
    Personal-domain pattern: someone@example.com
    Public email zaal@thezao.com (intentional)
    Synthetic hex64: abcdef0000000000000000000000000000000000000000000000000000abcdef
    -----BEGIN PRIVATE KEY-----
    Synthetic bot token: 0000000000:FAKE_DO_NOT_USE_PLACEHOLDER_VALUE_XXXXXXXXXX
    POSTGRES_URL=postgresql://admin:FakePasswordPlaceholder@example.com:5432/mydb

    --- Template lines that should NOT trigger HIGH ---
    OPENAI_API_KEY=your_key_here
    DISCORD_TOKEN=xxxx
    HMS_ROOM_ID=
    POSTGRES_PASSWORD="password"
    ALCHEMY_API_KEY=YOUR_API_KEY_HERE
    JWT_SECRET=changeme

    --- These SHOULD trigger HIGH (synthetic but high-entropy-shaped) ---
    OPENAI_API_KEY=sk-proj-FakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFakeFake
    JWT_SECRET=FakeFakeFakeFakeFakeFakeFakeFake12345678
    """
    result = preflight(test, label="self-test")
    print(json.dumps(result, indent=2))
    sys.exit(0 if result["ok"] else 1)
