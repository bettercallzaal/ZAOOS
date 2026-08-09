"""Tests for check-pipeline-exit.py.

The false-POSITIVE tests matter more than the true-positive ones. This check can
block a command, so a rule that fires on ordinary `| head` usage would be worse
than no check at all - it would train everyone to work around it
(.claude/rules/noisy-signal-guard.md).
"""
import importlib.util
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "check-pipeline-exit.py"

_spec = importlib.util.spec_from_file_location("cpe", SCRIPT)
cpe = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cpe)


# --- the three real incidents from 2026-08-09 -------------------------------

def test_catches_the_lane_send_incident():
    cmd = """~/bin/lane-send cowork "probe" 2>&1 | sed 's/^/  /'; echo "  exit=$?" """
    assert cpe.check(cmd), "must catch the sed-swallows-status shape"


def test_catches_the_secret_scan_incident():
    cmd = (
        "git diff --cached | grep -inE 'sk-ant-|ghp_' | head -5\n"
        'echo "  scan exit=$? (1 = no matches, good)"'
    )
    assert cpe.check(cmd), "must catch status-read on the line after a pipeline"


def test_catches_the_desktop_ssh_incident():
    cmd = 'ssh ansuz "echo hi" 2>&1 | tail -1\nif [ $? -ne 0 ]; then echo down; fi'
    assert cpe.check(cmd), "must catch a piped ssh reported as reachable"


# --- must NOT fire on ordinary usage ----------------------------------------

def test_ignores_a_plain_pipeline_with_no_status_read():
    assert not cpe.check("cat file | grep foo | head -20")


def test_ignores_status_read_with_no_pipeline():
    assert not cpe.check('mycommand --flag\necho "exit=$?"')


def test_ignores_pipefail():
    cmd = 'set -o pipefail\ncurl -s url | tee /tmp/x\necho "exit=$?"'
    assert not cpe.check(cmd)


def test_ignores_explicit_pipestatus():
    cmd = 'cmd | head -5\nrc=${PIPESTATUS[0]}\necho "$rc"'
    assert not cpe.check(cmd)


def test_ignores_logical_or_which_is_not_a_pipe():
    assert not cpe.check('cmd_a || cmd_b\necho "exit=$?"')


def test_ignores_a_pipe_char_inside_quotes():
    cmd = """grep -E 'foo|bar' file\necho "exit=$?" """
    assert not cpe.check(cmd), "a | inside a quoted regex is not a pipeline"


def test_ignores_status_read_after_an_unpiped_command_further_down():
    cmd = 'a | b\n\nsome_other_command\necho "exit=$?"'
    assert not cpe.check(cmd), "the nearest preceding command is unpiped, so $? is its own"


# --- CLI contract ------------------------------------------------------------

def _run(args, stdin=""):
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        input=stdin, capture_output=True, text=True,
    )


def test_cli_exits_2_and_explains_on_a_hit():
    r = _run(["--command", 'cmd | head\necho "$?"'])
    assert r.returncode == 2
    assert "PIPESTATUS" in r.stderr and "pipefail" in r.stderr


def test_cli_exits_0_on_clean_input():
    assert _run(["--command", "echo hello"]).returncode == 0


def test_hook_mode_reads_claude_code_payload():
    payload = '{"tool_input": {"command": "cmd | tail\\necho $?"}}'
    assert _run(["--hook"], stdin=payload).returncode == 2


def test_hook_mode_never_blocks_on_unparseable_input():
    assert _run(["--hook"], stdin="not json").returncode == 0, "a broken hook must not block work"


def test_hook_mode_allows_empty_command():
    assert _run(["--hook"], stdin='{"tool_input": {}}').returncode == 0


# --- runnable without pytest --------------------------------------------------
# This repo's test runner is vitest, so a pytest-only file would never execute in
# CI - and a test that does not run is indistinguishable from one that passes.

def _main() -> int:
    tests = [(n, f) for n, f in sorted(globals().items())
             if n.startswith("test_") and callable(f)]
    failed = []
    for name, fn in tests:
        try:
            fn()
        except AssertionError as exc:
            failed.append((name, str(exc) or "assertion failed"))
        except Exception as exc:  # noqa: BLE001 - report, do not mask
            failed.append((name, f"{type(exc).__name__}: {exc}"))
    for name, why in failed:
        print(f"FAIL {name}: {why}")
    print(f"{len(tests) - len(failed)}/{len(tests)} passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(_main())
