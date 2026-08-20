# zao-bus - deployed state (2026-08-20)

- Host: VPS 1 (31.97.148.88), user `zaal`, systemd user unit `zao-bus.service`
  (this directory holds the tracked copy of the live unit).
- Binary: `/home/zaal/zao-bus/bus.js` = a copy of `infra/bus/bus.js` (scp on
  deploy; re-scp + `systemctl --user restart zao-bus` to upgrade).
- Env: `/home/zaal/.zao/private/bus.env` (chmod 600). Tokens minted 2026-08-20
  with `openssl rand -hex 32`: admin, guest (zoe), partners CANDY / JIM /
  BRANDON. Values live only there. Rotate = edit env + restart.
- Public URL: https://bus.zaoos.com/bus (cloudflared ingress -> localhost:3099,
  DNS route added 2026-08-20; config backup at ~/.cloudflared/config.yml.bak-20260820).
- Wire contract + partner instructions: ../PARTNER-ONBOARDING.md. Spec credit:
  Jim / Meme for Trees (tasern coordinator), shared 2026-08-06.
- History: an Aug-4 localhost-only prototype (`~/.zao/private/zao-bus-server.js`,
  https://127.0.0.1:8790, partners zao/jim/brandon/sam, 5 setup-day messages)
  ran under this unit until 2026-08-20. File + store preserved in place; unit
  backup at `~/.config/systemd/user/zao-bus.service.bak-20260820`.
- First traffic on the new bus: coordinator -> candy welcome message +
  `coordinator-zaostock-pack.json` in /bus/files.
- NOT yet wired: ZOE polling OUR bus (cron polls tasern.quest only - see
  bus-poll-run.sh on the VPS) and ZOE bus-bridge env. One cron line + bot env,
  both operator steps.
