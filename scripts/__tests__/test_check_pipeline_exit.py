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


# --- 2026-08-21: two false positives caught in live use -----------------------
# Both blocked a CORRECT command. The second one blocked the very pattern the
# tool's own ADVICE text recommends, which is the strongest possible signal that
# the check was wrong rather than the author.

def test_ignores_same_line_command_when_previous_line_piped():
    """`cmd > file; rc=$?` reads ITS OWN command's status.

    The lookback to the previous line is only valid when the $?-reading line has
    no command of its own. Here it does, so a pipe on the line above is
    irrelevant - and flagging it blocks correct code.
    """
    cmd = 'n=$(echo "$t" | cut -d" " -f1)\nout=$(eval "$n" 2>&1); rc=$?'
    assert not cpe.check(cmd), "the $? belongs to the same-line command, not the line above"


def test_ignores_the_advice_the_tool_itself_gives():
    """ADVICE says: 'Do not pipe when you need the status. Redirect to a file,
    check the status, then read the file: cmd > /tmp/out; rc=$?'

    That exact shape must never be flagged, or the tool contradicts itself."""
    cmd = 'f=$(sed "s/x/y/" /tmp/a | grep -oE "[0-9]+")\n~/bin/thing > /tmp/b 2>&1; rc=$?'
    assert not cpe.check(cmd), "the tool must not block its own recommended fix"


def test_still_catches_same_line_pipe_before_status_read():
    """The genuine bug on one line must still fire - a piped command followed by
    `; echo $?` on the SAME line is the original lane-send incident."""
    cmd = 'lane-send cowork probe 2>&1 | sed "s/^/  /"; echo "exit=$?"'
    assert cpe.check(cmd), "same-line pipe before the status read is the real bug"


# Built rather than written literally so this file can be generated by a script
# without the generator's own text tripping the very check it tests.
Q = "$" + "?"


def test_ignores_a_status_read_inside_a_heredoc_body():
    """A heredoc payload is data, not shell.

    This blocked a real python patch script on 2026-08-21 whose COMMENTS
    mentioned a status read on one line and a pipe character on another. Nothing
    in the body is ever executed as shell, so nothing in it can have this bug.
    """
    cmd = (
        "cat > /tmp/x.py <<'PY'\n"
        "# reads QQ after a pipe, in prose: cmd | head\n"
        "print('QQ')\n"
        "PY\n"
        "echo done"
    ).replace("QQ", Q)
    assert not cpe.check(cmd), "heredoc bodies are payload and must not be scanned"


def test_still_catches_the_bug_after_a_heredoc_closes():
    """Skipping the body must not skip the rest of the command."""
    cmd = (
        "cat > /tmp/x.txt <<'EOF'\n"
        "just some text\n"
        "EOF\n"
        'grep foo /tmp/x.txt | head -1\n'
        'echo "exit=QQ"'
    ).replace("QQ", Q)
    assert cpe.check(cmd), "the real bug after a heredoc must still fire"
