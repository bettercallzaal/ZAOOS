# ZOE on the Pi - RUNBOOK

For `ansuz` (Raspberry Pi 4, Tailscale `100.117.191.11`, user `zaal`). Written
2026-08-27 by the ZOE-TO-PI lane. Companion: `requirements.md` (what and why),
`zoe.service` (the unit), `install.sh` (the installer). Nothing in this file has
been run yet as of 2026-08-27 - step 3 of the handoff runs "tomorrow, on Zaal's tap".

Glue-first: systemd user unit + journald, the same shape as the VPS
(`bot/systemd/zoe-bot.service`), not pm2 and not a tmux loop. Where the Pi's
existing ZOL pattern (`start-fleet.sh`, tmux + 15-min cron heal) fits and where it
does not is in section 9.

## Status 2026-08-27 22:3x EDT - exercised end to end, then HELD at the 409 gate

Everything below was run for real tonight on the Pi (log: `~/.zao/zoe-install-2026-08-27.log`
on the Pi): secrets assembled by pipe (names only ever shown), `getMe` returned
`username=zaoclaw_bot`, clone + `npm ci` (300 packages, 36 s) + esbuild boot-verify
passed, unit installed, linger enabled, unit started. ZOE booted on the Pi and
logged `polling as @zaoclaw_bot` at 22:27:57 EDT.

**Fourteen seconds later it got the 409.** The brief's premise "VPS down since
2026-08-23, no second consumer" was WRONG: the VPS at `31.97.148.88` (`ssh vps`) is
UP (119 days uptime), `zoe-bot.service` is `enabled` + `active` there, and it was
polling. `187.77.3.104` - the address other lanes had been probing - times out.
Both bots crashed once on the 409 (both restart themselves), the Pi unit was
stopped + disabled at 22:28:32 EDT, and the VPS bot has been polling alone again
since 02:28:11 UTC on commit `54a78ade`. Total fight: about 35 seconds.

So ZOE is live on the VPS, not the Pi. The Pi is a warm standby: installed,
verified, disabled. **Cutover is one Zaal tap** (section 3's VPS one-liner, then
`ssh zaal@ansuz 'systemctl --user enable --now zoe'`). Whether to cut over at all
is now a real question, because the VPS is not actually down.

## 0. Order of operations (read once)

1. Zaal writes the secrets file on the Pi (section 2). Only Zaal. Never in chat,
   a repo, or a relay.
2. Zaal confirms the VPS ZOE cannot poll (section 3). This is the 409 gate.
3. Run the installer (section 4). It clones, installs, verifies, installs the unit.
4. Enable linger once (section 5).
5. Start (section 4, `--start`). Watch the journal for `polling as @zaoclaw_bot`.
6. DM the bot. If it answers, ZOE is on the Pi.

## 1. Where things live on the Pi

| What | Path |
|---|---|
| Code (full repo clone, `main`) | `~/zao-bot-live` |
| Bot working dir | `~/zao-bot-live/bot` |
| Secrets (Zaal-written, mode 600) | `~/.zao/zoe.env` |
| ZOE state (`ZOE_HOME`) | `~/.zao/zoe/` |
| Cockpit state | `~/.zao/cockpit/` |
| Unit file (installed copy) | `~/.config/systemd/user/zoe.service` |
| Unit source of truth | `~/zao-bot-live/deploy/pi/zoe.service` |
| Deploy log (sha + time per install/start) | `~/.zao/zoe-deploy.log` |
| Logs | `journalctl --user -u zoe` |

## 2. Secrets - the one thing only Zaal can do

Type this ON THE MAC. It opens an ssh to the Pi and writes `~/.zao/zoe.env` from a
quoted heredoc, so nothing is expanded or echoed locally. Replace every
`<placeholder>`. Keep the quotes around `EOF` - they stop the shell from
interpreting `$` inside the values.

```bash
ssh zaal@ansuz 'umask 077 && mkdir -p ~/.zao && cat > ~/.zao/zoe.env <<'"'"'EOF'"'"'
# ZOE on the Pi - written by hand by Zaal on <YYYY-MM-DD>. Mode 600. Never commit.

# --- boot-required (bot exits 1 without these) ---
ZOE_BOT_TOKEN=<telegram bot token for @zaoclaw_bot, from BotFather>
ZAAL_TELEGRAM_ID=<Zaal Telegram user id, digits>

# --- Telegram routing (optional; status falls back to DM without the group) ---
ZAAL_BOTZ_GROUP_ID=<group chat id, negative number>
ZAAL_BOTZ_RESEARCH_THREAD=<forum topic id>
ZAAL_BOTZ_HANDOFFS_THREAD=<forum topic id>
ZAO_DEVZ_CHAT_ID=<chat id>

# --- data (throws on first use if missing) ---
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
COWORK_TRACKER_URL=https://<cowork-project>.supabase.co
COWORK_TRACKER_KEY=<cowork service key>

# --- knowledge graph ---
BONFIRE_API_KEY=<key>
BONFIRE_ID=<bonfire id>
# BONFIRE_API_URL=https://tnt-v2.api.bonfires.ai   (default, only set if it moves)

# --- models (at least one) ---
ANTHROPIC_API_KEY=<anthropic api key>
OPENROUTER_API_KEY=<key>
# SURPLUS_API_KEY=<key>
# GROQ_API_KEY=<key>            voice memos
# AGENTMAIL_API_KEY=<key>       inbox ingest
# DISCORD_BOT_TOKEN=<token>     Discord surface, optional
# DISCORD_ZAAL_ID=<id>

# --- keep OFF on the Pi until decided ---
ZOE_ORCHESTRATOR_ENABLED=false
ZOE_USE_CLI=0
EOF
chmod 600 ~/.zao/zoe.env && ls -l ~/.zao/zoe.env && grep -c "=" ~/.zao/zoe.env'
```

The last line prints only the file mode and a COUNT of lines, never a value.
The full variable list (152, with the file that reads each) is in
`requirements.md` section 4.5; the ones above are what the VPS bot needed to be
useful. Values come from Zaal's password manager or, once the VPS is reachable,
from `~/zao-bot-live/bot/.env` there (`ssh vps 'cat ~/zao-bot-live/bot/.env'`
shows it to Zaal's eyes only - never paste it into a terminal an agent reads).

To change one value later: `ssh zaal@ansuz` then edit with `nano ~/.zao/zoe.env`,
then `systemctl --user restart zoe`.

## 3. The 409 gate - one poller per Telegram token

Telegram delivers updates to ONE `getUpdates` consumer per token. A second one
gets `409 Conflict: terminated by other getUpdates request` and the two bots eat
each other's messages: fragmented replies, "typing" forever, work that never
lands (`project_zoe_one_instance_409`, burn of 2026-06-29).

On the VPS, `zoe-bot.service` is enabled and `~/bin/zoe-autodeploy.sh` runs from
cron every 10 minutes. **The moment the VPS comes back up it resumes polling.**
So before the Pi starts, one of these must be true, and Zaal must know which:

- **VPS reachable** (this IS the case - measured 2026-08-27 22:28 EDT, see Status
  above): run this on the VPS first. It is the cutover tap.
- **VPS genuinely down**: the Pi can start, but the block below must be the first
  thing run when the VPS returns, or the Pi bot starts 409-ing. Verify "down" against
  `31.97.148.88`, not `187.77.3.104` (which times out and produced tonight's wrong
  premise).

```bash
ssh vps 'systemctl --user disable --now zoe-bot; touch /tmp/zoe-autodeploy.HOLD; systemctl --user is-active zoe-bot; ls -l /tmp/zoe-autodeploy.HOLD'
```

`disable --now` stops it and removes it from boot. The `HOLD` file is the pause
switch `zoe-autodeploy.sh` honours (`[ -f /tmp/zoe-autodeploy.HOLD ] && exit 0`),
so the cron cannot restart it either. Expected output: `inactive` and the HOLD
file listed.

Alternative if the VPS cannot be reached but might come back unattended:
regenerate the bot token in BotFather (`/revoke`) and put the NEW token in
`~/.zao/zoe.env` on the Pi. The old VPS copy then polls with a dead token and
gets 401, not 409. This is a Zaal action; it invalidates the VPS `.env`.

Detect a fight at any time: `journalctl --user -u zoe --since '15 min ago' | grep -ciE '409|conflict'`
Non-zero means something else is polling.

## 4. Install, start, stop, restart, status, logs

First install (no clone yet) - the script bootstraps itself from the public repo:

```bash
ssh zaal@ansuz 'curl -fsSL https://raw.githubusercontent.com/bettercallzaal/ZAOOS/main/deploy/pi/install.sh | bash'
```

Every later run (update to `origin/main`, re-verify, re-install the unit):

```bash
ssh zaal@ansuz 'bash ~/zao-bot-live/deploy/pi/install.sh'
```

Start (only after section 3; the flag is the acknowledgement):

```bash
ssh zaal@ansuz 'bash ~/zao-bot-live/deploy/pi/install.sh --start --i-stopped-the-vps'
```

The installer waits 12 s and then checks three things, the same gate
`scripts/zoe-deploy.sh` used on the VPS: unit active, no boot error in the
journal, and the line `[zoe/index] polling as @zaoclaw_bot`. It also fails on a
409 in the journal. A 0 exit means all three held.

Day-to-day:

```bash
systemctl --user status zoe            # state, PID, memory, last log lines
systemctl --user stop zoe              # stop (stays enabled; comes back at boot)
systemctl --user start zoe
systemctl --user restart zoe           # after editing ~/.zao/zoe.env
systemctl --user disable --now zoe     # stop AND remove from boot (the move-back step)
journalctl --user -u zoe -f            # follow logs
journalctl --user -u zoe --since today | grep -E '\[zoe/ran\]|polling as|error' | tail -40
journalctl --user -u zoe -b -p err     # only errors since boot
```

If `systemctl --user` says `Failed to connect to bus`, you are in a shell without
the user bus (cron, some ssh). Prefix with `XDG_RUNTIME_DIR=/run/user/1000`.

Verify it is actually polling (not just "active"): `journalctl --user -u zoe -n 50 | grep 'polling as'`.
Then DM the bot. Active without that line is a bot that booted and is not
listening - `silent-failure-guard.md` rule 2.

## 5. Linger (once, needs sudo)

Measured 2026-08-27: `Linger=no`. Without it, user units stop when Zaal's last
login ends and do not start at reboot. `start-fleet.sh` survives today only
because it is in root-independent cron. Passwordless sudo works on the Pi.

```bash
ssh zaal@ansuz 'sudo loginctl enable-linger zaal && loginctl show-user zaal -p Linger'
```

Expected: `Linger=yes`. Once. Reversible with `disable-linger`.

## 6. Update and rollback

Update = re-run the installer (section 4). It fast-forwards `~/zao-bot-live` to
`origin/main`, re-runs `npm ci` only if the lock changed, re-runs the bundle
verify, and only then re-installs the unit. It refuses if the clone has tracked
local edits or has diverged. Every install appends `time sha installed` to
`~/.zao/zoe-deploy.log`; every good start appends `time sha started-ok`.

Rollback to the previous good commit:

```bash
ssh zaal@ansuz 'grep started-ok ~/.zao/zoe-deploy.log | tail -3'        # pick the sha
ssh zaal@ansuz 'bash ~/zao-bot-live/deploy/pi/install.sh --ref <sha> --start --i-stopped-the-vps'
```

`--ref` pins the clone to that commit (detached HEAD), re-verifies, restarts.
Re-run without `--ref` to return to `main`. No history is rewritten, nothing is
deleted.

Rollback of the WHOLE move (ZOE back on the VPS) is section 8.

## 7. State: fresh on the Pi, then reconcile with the VPS

The Pi has no `~/.zao/zoe/`. First boot seeds `persona.md`, `human.md`,
`bootloader-template.md` from `memory.ts` defaults and starts with empty queues
(`tasks.json`, `recent/`, `topics.json` ...). ZOE will not remember VPS-era
threads until the VPS state is brought over.

When the VPS is reachable again, and ONLY while the Pi unit is stopped:

```bash
ssh zaal@ansuz 'systemctl --user stop zoe'
# Mac as the hop (both are reachable from it). Copies, never deletes on either side.
rsync -av --ignore-existing zaal@31.97.148.88:~/.zao/zoe/ /tmp/zoe-state-from-vps/
rsync -av --ignore-existing /tmp/zoe-state-from-vps/ zaal@ansuz:~/.zao/zoe/
ssh zaal@ansuz 'systemctl --user start zoe'
```

`--ignore-existing` means a file the Pi has already written wins over the VPS
copy; drop it if Zaal decides the VPS copy is canonical. Which VPS IP is current
is UNMEASURED (`187.77.3.104` vs `31.97.148.88`, the handoff says so) - use the
`ssh vps` alias from the Mac if it resolves. Do not run both bots during the copy.

## 8. Moving back to the VPS (the reverse)

1. On the Pi: `systemctl --user disable --now zoe` and confirm `inactive`.
2. Reconcile state Pi -> VPS (section 7 mirrored: rsync `~/.zao/zoe/` from the Pi
   to the VPS, Pi unit stopped).
3. On the VPS: `rm /tmp/zoe-autodeploy.HOLD` (a single temp file the deploy
   script created - the one delete an agent may do) and
   `systemctl --user enable --now zoe-bot`.
4. `journalctl --user -u zoe-bot -n 50 | grep 'polling as'` on the VPS, and
   `grep -ci 409` on both journals reads 0.
5. Leave the Pi unit installed but disabled; it is the warm standby. Or remove it:
   `systemctl --user disable zoe` then Zaal deletes
   `~/.config/systemd/user/zoe.service` (deletion is Zaal's, `no-rm-rf.md`).

Name map: the VPS unit is `zoe-bot`; the Pi unit is `zoe`. Same code, same
`ZOE_HOME`, different `WorkingDirectory` env (`ZOE_REPO_DIR`).

## 9. The Pi's ZOL pattern - where it fits, where it does not

ZOL runs as `tmux new-session -d -s zol "node zol-reply.js"`, healed every 15 min
by `start-fleet.sh` (`pgrep -f` on the process, respawn the session if dead).

Reused:
- `PATH` with `~/.npm-global/bin` (where `claude` lives) - copied into the unit.
- "Check the process, not the session name" - systemd does this natively; that is
  the whole reason to use it.
- `XDG_RUNTIME_DIR` handling for cron contexts - from `zoe-autodeploy.sh`.

Not reused, and why:
- No tmux for ZOE. A tmux session gives no restart-on-crash, no memory cap, no
  journald, and its liveness check is a 15-minute cron (`liveness-probe-guard`).
  systemd restarts in 10 s, caps memory at 1.2 GB so ZOL is protected, and logs
  are `journalctl`-able.
- Do NOT add a `start zoe ...` line to `start-fleet.sh`. Two supervisors on one
  process is `measurement-traps.md` trap 5 (a supervised process cannot be stopped
  by stopping it) - and with Telegram it is worse, because the resurrected copy
  409-fights the systemd copy.
- `pm2` exists in `~/.npm-global/bin` but is not on `PATH` and nothing uses it.
  Leave it.

## 10. What is expected to break on the Pi (and is not a bug in this kit)

From `requirements.md` section 7: Hermes fix-PRs, research-doc PRs, memory-git
push, cockpit `gh` adapters (no `gh`, no GitHub credential on the Pi), Codex
routing (no binary). Each errors at use with a logged line. Zaal decides later
whether the Pi gets `gh` + a token + `claude login`; none of that is in tonight's
scope and none is needed for ZOE to answer DMs.

## 11. Quick health check (copy-paste)

```bash
ssh zaal@ansuz 'XDG_RUNTIME_DIR=/run/user/1000 systemctl --user is-active zoe; journalctl --user -u zoe --since "30 min ago" --no-pager | grep -cE "polling as|\[zoe/ran\]"; journalctl --user -u zoe --since "30 min ago" --no-pager | grep -ciE "409|conflict|error"; free -m | awk "/Mem:/{print \"avail MB\", \$7}"'
```

Four numbers: `active`, a positive count of life signs, a zero count of
409/errors, and available memory. Anything else, read the journal.
