"""Tests for git-pii-scan.py.

Two things must both be true, and either alone is worthless:

  1. It CATCHES real third-party PII. A scan that never fires protects nobody.
  2. It does NOT fire on ordinary repo content. Measured at zero across the last
     40 commits on main; these tests pin the specific shapes that produced every
     observed false positive, so a future regex tweak cannot quietly reintroduce
     them.

Runnable without pytest: `python3 scripts/__tests__/test_git_pii_scan.py`.
This repo runs vitest, and a test that cannot run in CI is indistinguishable
from one that passes.
"""
import importlib.util
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "git-pii-scan.py"
_spec = importlib.util.spec_from_file_location("pii", SCRIPT)
pii = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pii)


def hits(line, path="notes.md"):
    return pii.scan([(path, line)])


def kinds(line):
    return {k for k, _, _, _ in hits(line)}


# --- MUST CATCH: real third-party PII ---------------------------------------

def test_catches_a_third_party_email():
    assert "email" in kinds("reach her at jane.doe@somecompany.co.uk about the deck")


def test_catches_a_us_phone():
    assert "us_phone" in kinds("call the venue on 207-555-0142 to confirm")


def test_catches_a_phone_with_parens():
    assert "us_phone" in kinds("her cell is (207) 555-0142")


def test_catches_an_international_phone():
    assert "intl_phone" in kinds("WZO office is +44 208 8901282")


def test_catches_a_street_address():
    assert "street_address" in kinds("the parklet is at 12 Franklin St, Ellsworth")


def test_catches_a_birthdate():
    assert "birthdate" in kinds("DOB 04/17/1988 on the waiver form")


def test_catches_a_card_number():
    assert "card_number" in kinds("card 4111 1111 1111 1111 on file")


def test_reports_the_file_it_found_it_in():
    h = hits("mail bob@example.org", path="research/x/README.md")
    assert h and h[0][1] == "research/x/README.md"


# --- MUST NOT FIRE: every observed false positive ----------------------------

def test_allowlisted_zao_addresses_pass():
    for addr in ["zaal@thezao.com", "zaalp99@gmail.com", "zoe-zao@agentmail.to",
                 "hello@thezao.com", "support@thezao.com"]:
        assert not kinds(f"contact {addr} for access"), addr


def test_zao_role_addresses_pass():
    assert not kinds("email info@thezao.com or team@zabalgamez.com")


def test_a_uuid_is_not_a_phone_number():
    # This exact shape produced two false positives in the measured history.
    assert not kinds("const ZOE = '00000000-0000-4000-8000-00000000a0e0'")


def test_a_uuid_is_not_a_card_number():
    assert not kinds("id: 550e8400-e29b-41d4-a716-446655440000")


def test_digits_inside_a_url_are_ignored():
    # The Kickstarter help URL that tripped the phone pattern in real history.
    assert not kinds("see https://help.kickstarter.com/hc/en-us/articles/15005028514")


def test_ordinary_prose_is_silent():
    assert not kinds("The ZAO ran 32 sessions in June 2026 with 31 presenters.")


def test_at_mentions_do_not_fire():
    # The dropped tg_handle pattern fired 86 times across 14 of 40 commits.
    # Everything here must stay silent or the scanner is unusable.
    assert not kinds("| Ship the retro | @Zaal | PR | 2026-08-15 |")
    assert not kinds("installed @openai/codex and @100mslive/react-sdk")
    assert not kinds("thanks @ghostmintops and @branth for shipping")


def test_a_version_number_is_not_a_phone():
    assert not kinds("bumped to 1.144.6 and 0.144.6")


def test_semver_and_ports_are_silent():
    assert not kinds("listening on 127.0.0.1:7777 and 100.72.152.63")


# --- diff parsing ------------------------------------------------------------

def test_only_added_lines_are_scanned():
    """Context lines are already committed. Re-flagging them would make any commit
    near an old address impossible."""
    diff = "+++ b/a.md\n-old jane@x.com\n bob@y.com context\n+new text\n"
    rows = []
    cur = "?"
    for line in diff.splitlines():
        if line.startswith("+++ b/"):
            cur = line[6:]
        elif line.startswith("+") and not line.startswith("+++"):
            rows.append((cur, line[1:]))
    assert pii.scan(rows) == []


def test_cli_exits_zero_with_nothing_staged():
    r = subprocess.run([sys.executable, str(SCRIPT)], capture_output=True, text=True,
                       cwd=str(SCRIPT.resolve().parents[1]))
    assert r.returncode == 0


def _main() -> int:
    tests = [(n, f) for n, f in sorted(globals().items())
             if n.startswith("test_") and callable(f)]
    failed = []
    for name, fn in tests:
        try:
            fn()
        except AssertionError as exc:
            failed.append((name, str(exc) or "assertion failed"))
        except Exception as exc:  # noqa: BLE001
            failed.append((name, f"{type(exc).__name__}: {exc}"))
    for name, why in failed:
        print(f"FAIL {name}: {why}")
    print(f"{len(tests) - len(failed)}/{len(tests)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(_main())
