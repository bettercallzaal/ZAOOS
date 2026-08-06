# cheap-loop-capguard - daily spend circuit breaker for the cheap-loop fleet

The cheap-loop fleet already had two of the three pieces of a cost circuit
breaker and was missing the third:

1. `cheap-loop.sh` HALTS when `~/.zao/cheap-loop.pause` exists (line ~23). [existed]
2. Every OpenRouter pass LOGS its cost to `~/.zao/cost-of-pass.jsonl`. [existed]
3. Something that SUMS today's spend and TRIPS the pause when over a cap. [this script]

Without piece 3, the pause file was only ever written by hand - so a runaway
loop could spend all day unchecked. This script closes that gap.

## What it does

Run on a cron. Each run it sums today's spend (UTC day, matching the cost-ledger
convention) from `cost-of-pass.jsonl`, then:

- **Global cap** - if total across all loops today `> CHEAP_LOOP_GLOBAL_USD_CAP`
  (default `$5.00`), it writes `~/.zao/cheap-loop.pause`. `cheap-loop.sh` already
  honors this file, so the global cap works with **zero loop-script edits**.
- **Per-loop cap** - for each loop whose spend today `> CHEAP_LOOP_PER_LOOP_USD_CAP`
  (default `$1.00`), it writes `~/.zao/cheap-loop-<slug>.pause`. This needs the
  one-line patch below so `cheap-loop.sh` checks the per-loop file.

**Daily reset is automatic.** A pause file this script wrote carries a marker
line; once the relevant spend is back under cap (i.e. the next UTC day, when the
sum resets to 0) the script removes only its own pause files. A pause file YOU
created by hand (no marker) is never auto-removed - a manual pause is respected.

**Fail-safe.** If the cost log is missing or unreadable it does nothing (never
crashes a loop, never writes a spurious pause). It always exits 0 - a guard must
not break its own cron.

## Verify before deploy

```bash
python3 scripts/fleet/cheap-loop-capguard.py --selftest   # assertions, no writes
python3 scripts/fleet/cheap-loop-capguard.py --dry-run     # print actions vs the real log, no writes
```

## Deploy (Zaal-gated - operator surface)

```bash
# 1. Put the guard in ~/bin on the VPS
scp scripts/fleet/cheap-loop-capguard.py vps:~/bin/cheap-loop-capguard.py
ssh vps 'chmod +x ~/bin/cheap-loop-capguard.py'

# 2. Cron it every 15 min (tune the caps to taste)
ssh vps 'crontab -l 2>/dev/null | grep -q cheap-loop-capguard || (crontab -l 2>/dev/null; echo "*/15 * * * * CHEAP_LOOP_GLOBAL_USD_CAP=5.00 CHEAP_LOOP_PER_LOOP_USD_CAP=1.00 ~/bin/cheap-loop-capguard.py >> ~/.zao/capguard.log 2>&1") | crontab -'
```

The **global cap is live immediately** after step 2. For **per-loop** halting,
add this one line to `~/bin/cheap-loop.sh` right after the existing global pause
check (the `~/.zao/cheap-loop.pause` line):

```bash
[ -f "$HOME/.zao/cheap-loop-$SLUG.pause" ] && { echo "[cheap-loop] $SLUG paused: per-loop daily cap hit. exiting."; exit 0; }
```

(`$SLUG` is already set above that point in the script.)

## Manual controls

- Pause everything by hand: `touch ~/.zao/cheap-loop.pause` (the guard will not
  auto-clear a file you made - no marker).
- Resume: `rm ~/.zao/cheap-loop.pause` (and any `~/.zao/cheap-loop-*.pause`).
- Watch it: `tail -f ~/.zao/capguard.log`.

## Source

Closes the "hard per-loop daily halt-cap" gap noted in the ZAO OS Operating
Manual (doc 2210, section 5). Reuses the existing pause + cost-log mechanism in
`cheap-loop.sh` rather than adding a parallel system. Sibling to the ZOE bot's
own `cost-governance.ts` hard-stop (that guards ZOE's Claude calls; this guards
the ~21 shell loops).
