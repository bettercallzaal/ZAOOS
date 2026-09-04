# ZOE on the Pi

ZOE (`bot/src/zoe`, `@zaoclaw_bot`) can run on the Pi `ansuz` instead of the VPS.
Decided by Zaal 2026-08-27 ("Move ZOE to the Pi now, VPS later") while the VPS
has been down since 2026-08-23. The kit lives in `deploy/pi/`:

| File | What |
|---|---|
| `deploy/pi/requirements.md` | What ZOE needs to boot (entry, 176-file graph, all 152 env vars with the file that reads each and which are secrets, endpoints, data paths) + the Pi measured on 2026-08-27 |
| `deploy/pi/zoe.service` | systemd user unit, `Restart=always`, `MemoryMax=1200M`, secrets from `~/.zao/zoe.env` |
| `deploy/pi/install.sh` | idempotent: clone/ff `~/zao-bot-live`, `npm ci`, esbuild boot-verify, install + enable the unit. `--start` is gated behind `--i-stopped-the-vps` |
| `deploy/pi/RUNBOOK.md` | secrets heredoc Zaal types, the 409 one-poller gate, start/stop/logs, rollback, state reconcile, move back to the VPS |

Three things that are not obvious from `bot/systemd/zoe-bot.service`:

1. **No `--omit=dev`.** `tsx` is a devDependency and there is no build step
   (`tsconfig.json` is `noEmit`). Production install is a full `npm ci`.
2. **Whole-repo clone.** The graph imports `packages/heart-fleet` outside `bot/`.
3. **One poller.** The VPS `zoe-bot` must be stopped + disabled (and
   `/tmp/zoe-autodeploy.HOLD` touched) before the Pi polls, or both 409.

Status 2026-08-27 22:3x EDT: kit run for real on the Pi - installed, verified,
booted, polled as `@zaoclaw_bot` for 14 s, then 409: the VPS (`31.97.148.88`) was
never down, its `zoe-bot` is active and polling. Pi unit stopped + disabled = warm
standby. Cutover is Zaal's tap (`deploy/pi/RUNBOOK.md` Status + section 3).
