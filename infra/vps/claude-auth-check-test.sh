#!/usr/bin/env bash
# Tests for claude-auth-check.sh, the single owner of fleet-claude-auth.state.
#
#   infra/vps/claude-auth-check-test.sh                 # tests the script beside it
#   infra/vps/claude-auth-check-test.sh --against FILE  # red control: tests FILE
#
# Every case runs in a throwaway HOME with a fake `claude`, `curl` and
# `timeout` on PATH. Nothing reaches Telegram and no real state file is read.
# Red controls, each a different artifact from the one under test:
#   - the verbatim VPS copy (git show 98c0b52fc:infra/vps/claude-auth-check.sh).
#     It hardcodes PATH, so its fake `claude` is never found and every probe is
#     transient; it fails, but mostly for that reason.
#   - write_state reduced to a plain `> "$STATE"`: fails the read-only and
#     foreign-write cases, which is the ownership property itself.
#   - the cap pattern without weekly/hit-your-limit: fails the weekly-limit case.
set -uo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
SUT="$HERE/claude-auth-check.sh"
if [ "${1:-}" = "--against" ]; then SUT=$(cd "$(dirname "$2")" && pwd)/$(basename "$2"); fi

pass=0; fail=0
ok(){ pass=$((pass + 1)); echo "  ok   $1"; }
no(){ fail=$((fail + 1)); echo "  FAIL $1"; }

setup(){
  T=$(mktemp -d)
  mkdir -p "$T/bin" "$T/.config"
  printf 'ZOE_BOT_TOKEN=test-not-a-token\nZAAL_TELEGRAM_ID=1\n' > "$T/env"
  cat > "$T/bin/claude" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "${FAKE_OUT:-OK}"
exit "${FAKE_RC:-0}"
EOF
  cat > "$T/bin/curl" <<'EOF'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$HOME/alerts.log"
EOF
  cat > "$T/bin/timeout" <<'EOF'
#!/usr/bin/env bash
shift; exec "$@"
EOF
  chmod +x "$T/bin/"*
}

probe(){ # probe <rc> <output>
  HOME="$T" FAKE_RC="$1" FAKE_OUT="$2" \
    CLAUDE_AUTH_CHECK_PATH="$T/bin:/usr/bin:/bin" \
    FLEET_CLAUDE_AUTH_ENV="$T/env" \
    bash "$SUT" >/dev/null 2>&1
}
state(){ cat "$T/.config/fleet-claude-auth.state" 2>/dev/null; }
alerts(){ grep -c . "$T/alerts.log" 2>/dev/null || echo 0; }

echo "claude-auth-check tests against: $SUT"

setup
probe 1 "You've hit your weekly limit · resets Sep 17, 10am (UTC)"
[ "$(state)" = cap ] && ok "weekly limit is cap, not down" || no "weekly limit is cap, not down (got '$(state)')"
[ "$(alerts)" = 1 ] && grep -q "CAP" "$T/alerts.log" && ok "cap says FYI once" || no "cap says FYI once"
rm -rf "$T"

setup
probe 0 "OK"
[ "$(state)" = ok ] && ok "a clean probe writes ok" || no "a clean probe writes ok (got '$(state)')"
[ -f "$T/.config/fleet-claude-auth.state" ] && [ ! -w "$T/.config/fleet-claude-auth.state" ] && ok "state file is read-only to every writer" || no "state file is read-only to every writer"
( echo down > "$T/.config/fleet-claude-auth.state" ) 2>/dev/null
[ "$(state)" = ok ] && ok "a foreign write fails rather than wins" || no "a foreign write fails rather than wins (got '$(state)')"
probe 1 "Please run /login - 401 unauthorized"
[ "$(state)" = down ] && ok "the owner still replaces its own read-only file" || no "the owner still replaces its own read-only file (got '$(state)')"
grep -q "AUTH is down" "$T/alerts.log" && ok "auth down alerts" || no "auth down alerts"
ls "$T/.config" | grep -q 'fleet-claude-auth.state\.' && no "no temp files left behind" || ok "no temp files left behind"
rm -rf "$T"

setup
echo down > "$T/.config/fleet-claude-auth.state"
probe 1 "Please run /login - 401 unauthorized"
# Documents the hazard a second writer creates: prev=down suppresses the alert.
[ "$(alerts)" = 0 ] && ok "a pre-existing down suppresses the auth alert (why one writer matters)" || no "a pre-existing down suppresses the auth alert"
rm -rf "$T"

echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
