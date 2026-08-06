#!/usr/bin/env bash
# zao-bench - benchmark ZOE's model tiers: cost, latency, and EMPIRICAL cache-hit.
#
# The trick: run each prompt TWICE. A working prompt-cache shows up as
# `cache_read_input_tokens` (claude CLI) / `prompt_cache_hit_tokens` (deepseek)
# on run 2 - so we PROVE caching instead of assuming it. Also checks that ZOE's
# shipped features (trace, cost-ledger, cross-family, nudge-ladder) are wired.
#
# Runs on the VPS (where the claude CLI + OpenRouter key live). Writes a dated
# markdown report to ~/.zao/bench/ and prints its path. Read-only + cheap
# (a few tiny model calls); no prod writes, no deploys.
#
# Usage:  ssh vps 'bash <this>'                 # default prompt suite
#         ssh vps 'bash <this> "your prompt"'   # custom prompt
set -uo pipefail

BENCH_DIR="${HOME}/.zao/bench"; mkdir -p "$BENCH_DIR"
DATE="$(date +%Y%m%d-%H%M%S)"
OUT="$BENCH_DIR/bench-${DATE}.md"
PROMPT="${1:-In one sentence, why does prompt caching lower cost for repeated context?}"
CLAUDE="${HERMES_CLAUDE_BIN:-claude}"
ENV_FILE="${HOME}/zao-bot-live/bot/.env"
set -a; . "$ENV_FILE" 2>/dev/null || true; set +a
OR_MODEL="${OPENROUTER_MODEL:-deepseek/deepseek-chat}"

# --- claude tier: one run -> "in|cache_read|out|cost|ms" ---
claude_run() {
  "$CLAUDE" -p "$PROMPT" --model "$1" --output-format json 2>/dev/null | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin); u=d.get('usage',{})
  print(f\"{u.get('input_tokens',0)}|{u.get('cache_read_input_tokens',0)}|{u.get('output_tokens',0)}|{d.get('total_cost_usd',0)}|{d.get('duration_ms',0)}\")
except Exception as e:
  print(f'ERR|{e}|0|0|0')
"
}

# --- deepseek via OpenRouter: one run -> "in|cache_hit|out|cost|ms" ---
openrouter_run() {
  local start end body
  start=$(python3 -c 'import time;print(int(time.time()*1000))')
  body=$(curl -s -m 60 https://openrouter.ai/api/v1/chat/completions \
    -H "Authorization: Bearer ${OPENROUTER_API_KEY:-}" -H "Content-Type: application/json" \
    -d "{\"model\":\"$OR_MODEL\",\"messages\":[{\"role\":\"user\",\"content\":\"$PROMPT\"}],\"max_tokens\":80}" 2>/dev/null)
  end=$(python3 -c 'import time;print(int(time.time()*1000))')
  echo "$body" | python3 -c "
import sys,json
try:
  d=json.load(sys.stdin); u=d.get('usage',{})
  ch=u.get('prompt_cache_hit_tokens', u.get('cached_tokens',0))
  print(f\"{u.get('prompt_tokens',0)}|{ch}|{u.get('completion_tokens',0)}|0|$((end-start))\")
except Exception as e:
  print(f'ERR|{str(e)[:30]}|0|0|0')
"
}

row() { # name run1 run2  -> a markdown table row with a cache verdict
  IFS='|' read -r i1 c1 o1 cost1 ms1 <<< "$2"
  IFS='|' read -r i2 c2 o2 cost2 ms2 <<< "$3"
  local verdict="no"
  [ "${c2:-0}" -gt 0 ] 2>/dev/null && verdict="YES (${c2} cached)"
  printf "| %s | %s / %s | %s / %s | %s / %s | %s / %s | %s |\n" \
    "$1" "$i1" "$i2" "$o1" "$o2" "$cost1" "$cost2" "$ms1" "$ms2" "$verdict"
}

{
  echo "# ZAO bench - ${DATE}"
  echo ""
  echo "Prompt: \`${PROMPT}\`  (each tier run twice; cache = run-2 cached-input tokens)"
  echo ""
  echo "## Model tiers - cost / latency / cache (run1 / run2)"
  echo ""
  echo "| tier | in-tok | out-tok | cost usd | latency ms | cache hit (run2) |"
  echo "|------|--------|---------|----------|------------|------------------|"
  echo "  ...measuring claude haiku..." >&2
  row "claude/haiku"  "$(claude_run haiku)"  "$(claude_run haiku)"
  echo "  ...measuring claude sonnet..." >&2
  row "claude/sonnet" "$(claude_run sonnet)" "$(claude_run sonnet)"
  echo "  ...measuring deepseek (openrouter)..." >&2
  row "openrouter/${OR_MODEL##*/}" "$(openrouter_run)" "$(openrouter_run)"
  echo ""
  echo "## ZOE feature wiring (deployed live?)"
  L="${HOME}/zao-bot-live/bot/src/zoe"
  echo "- cross-family critic (runCritiqueModel): $([ -f "$L/critics/types.ts" ] && grep -q runCritiqueModel "$L/critics/types.ts" && echo WIRED || echo missing)"
  echo "- step tracing (trace.ts + traces written): $([ -f "$L/trace.ts" ] && echo "present, $(ls ${HOME}/.zao/zoe/traces/ 2>/dev/null | wc -l | tr -d ' ') trace file(s)" || echo missing)"
  echo "- verify-replan (bare flag gone): $([ "$(grep -cE '^\s*bare: true,' "$L/work-loop.ts" 2>/dev/null)" = "0" ] && echo OK || echo 'bare flag present')"
  echo "- nudge-ladder: $([ -f "$L/nudge-ladder.ts" ] && echo "wired (ZOE_NUDGE_LADDER=$(grep -oE 'ZOE_NUDGE_LADDER=[01]' "$ENV_FILE" 2>/dev/null | cut -d= -f2))" || echo 'not deployed yet')"
  echo "- cost-ledger: $([ -f "$L/cost-ledger.ts" ] && echo present || echo missing)"
  echo ""
  echo "## Read"
  echo "- **cache hit YES on run2** = the tier is caching repeated context (the auto-caching claim, proven)."
  echo "- Compare cost/latency across tiers to confirm the routing choices (cheap tier for grunt)."
  echo "- Any feature 'missing' = not deployed; check the autodeploy."
} > "$OUT" 2>>"$OUT"

echo "bench report: $OUT"
cat "$OUT"
