"""Tests for check-doc-currency.py.

The false-POSITIVE tests matter most. This repo already produced one check that
fired 35 times on a healthy codebase and taught everyone to ignore it
(.claude/rules/noisy-signal-guard.md). A doc-currency check that flags every PR
would be the second, and it would be worse, because it touches every commit.

Runnable without pytest: `python3 scripts/__tests__/test_check_doc_currency.py`.
This repo's runner is vitest, and a test that cannot run in CI is
indistinguishable from one that passes.
"""
import importlib.util
import subprocess
import sys
import tempfile
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "check-doc-currency.py"
_spec = importlib.util.spec_from_file_location("cdc", SCRIPT)
cdc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cdc)

PATH_RE = cdc.PATH_RE


def paths_in(text):
    return [m.group(1) for m in PATH_RE.finditer(text)]


# --- what the regex must catch ------------------------------------------------

def test_catches_a_plain_source_path():
    assert "bot/src/zoe/scheduler.ts" in paths_in("see bot/src/zoe/scheduler.ts for the tick")


def test_catches_a_backticked_path():
    assert "src/lib/spaces/roomsDb.ts" in paths_in("the type lives in `src/lib/spaces/roomsDb.ts`")


def test_catches_a_path_with_a_line_reference():
    assert "bot/src/zoe/recall.ts" in paths_in("recall.ts:100 - see bot/src/zoe/recall.ts:100")


def test_catches_scripts_and_packages():
    got = paths_in("scripts/verify.py and packages/heart-fleet/src/lease.ts")
    assert "scripts/verify.py" in got
    assert "packages/heart-fleet/src/lease.ts" in got


def test_catches_a_nextjs_dynamic_route():
    assert "src/app/spaces/[id]/page.tsx" in paths_in("see src/app/spaces/[id]/page.tsx")


# --- what it must NOT catch (these decide whether the check is usable) --------

def test_ignores_prose_with_a_slash():
    assert paths_in("use this and/or that, per the docs") == []


def test_ignores_a_bare_filename_with_no_directory():
    assert paths_in("open scheduler.ts and read it") == []


def test_ignores_an_external_github_path():
    assert paths_in("see github.com/builderz-labs/mission-control for the pattern") == []


def test_ignores_a_url_path():
    assert paths_in("https://zabalgamez.com/finals/live/index.html") == []


def test_ignores_a_directory_without_a_file():
    assert paths_in("everything under bot/src/zoe/ is the agent") == []


def test_ignores_an_unknown_top_level_dir():
    assert paths_in("vendor/thirdparty/thing.ts is not ours") == []


# --- index behaviour ----------------------------------------------------------

def _repo(tmp, docs):
    root = Path(tmp)
    (root / "research" / "x").mkdir(parents=True)
    for name, body in docs.items():
        d = root / "research" / "x" / name
        d.mkdir(parents=True, exist_ok=True)
        (d / "README.md").write_text(body, encoding="utf-8")
    return root


def test_index_maps_path_to_the_doc_that_cites_it():
    with tempfile.TemporaryDirectory() as tmp:
        root = _repo(tmp, {"a": "the tick is in bot/src/zoe/scheduler.ts"})
        idx = cdc.index_docs(root)
        assert len(idx["bot/src/zoe/scheduler.ts"]) == 1


def test_index_skips_superseded_docs():
    with tempfile.TemporaryDirectory() as tmp:
        root = _repo(tmp, {"a": "---\nstatus: superseded\n---\nsee bot/src/zoe/scheduler.ts"})
        assert cdc.index_docs(root).get("bot/src/zoe/scheduler.ts") is None, \
            "a superseded doc is a record of a moment and cannot rot"


def test_index_skips_point_in_time_records():
    with tempfile.TemporaryDirectory() as tmp:
        root = _repo(tmp, {"a": "---\ntype: point-in-time\n---\nsee scripts/verify.py"})
        assert cdc.index_docs(root).get("scripts/verify.py") is None


def test_index_survives_an_unreadable_doc():
    with tempfile.TemporaryDirectory() as tmp:
        root = _repo(tmp, {"a": "see scripts/verify.py"})
        (root / "research" / "x" / "b").mkdir()
        (root / "research" / "x" / "b" / "README.md").write_bytes(b"\xff\xfe bad bytes")
        assert len(cdc.index_docs(root)["scripts/verify.py"]) == 1


# --- CLI ----------------------------------------------------------------------

def _run(args):
    return subprocess.run(
        [sys.executable, str(SCRIPT), *args],
        capture_output=True, text=True,
        cwd=str(SCRIPT.resolve().parents[2]),
    )


def test_cli_is_silent_when_nothing_is_cited():
    r = _run(["--files", "bot/src/zoe/a-file-no-doc-mentions-xyz.ts"])
    assert r.returncode == 0
    assert r.stdout.strip() == "", "silence is the common case and must stay silent"


def test_cli_never_blocks_even_when_it_fires():
    r = _run(["--files", "bot/src/zoe/scheduler.ts"])
    assert r.returncode == 0, "this is advisory - it reports, it never blocks a commit"


def test_cli_ignores_readme_changes():
    r = _run(["--files", "research/agents/1081-zoe-assistant-buildout-roadmap/README.md"])
    assert r.stdout.strip() == "", "editing a doc does not make a doc stale"


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
