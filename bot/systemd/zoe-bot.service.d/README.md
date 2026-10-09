# Runbook: move ZOE's cowork token out of the systemd Environment line (card 9371)

Zaal's hand, on the VPS. No step prints the token. Moving it and rotating it are
two separate jobs: this runbook moves it; rotation (card 9809, the token burned in a
public PR comment on 2026-09-16) is its own step at the end.

## Why

As of 2026-09-19 (vault `decisions/grill-2026-09-19-seat-afternoon.md` item 13),
ZOE's copy of the token lives in `~/.config/systemd/user/zoe-bot.service.d/cowork.conf`
as a line starting `Environment=COWORK_BOT_TOKEN=`. A value in a unit file is
printed by `systemctl --user show zoe-bot -p Environment` and shows up in any
copy of the unit. An `EnvironmentFile=` with mode 600 keeps the value in one file
only the owner can read.

## The trap this runbook guards against

`bot/src/lib/cowork.ts` is DORMANT BY DEFAULT: if `COWORK_BOT_TOKEN` or
`COWORK_API_URL` is missing, every board call silently returns `skipped: true`.
A botched move does not crash ZOE, it quietly unplugs her from the board. So step
5 checks the running process positively, not just "the bot started".

## Steps

1. **Back up the current drop-in** (copy, never delete):

       cp ~/.config/systemd/user/zoe-bot.service.d/cowork.conf \
          ~/.config/systemd/user/zoe-bot.service.d/cowork.conf.bak-$(date +%Y%m%d)

2. **Create the env file from the existing lines, without printing them:**

       umask 077 && mkdir -p ~/.zao/private && \
       grep -E '^Environment=COWORK_(API_URL|BOT_TOKEN)=' \
         ~/.config/systemd/user/zoe-bot.service.d/cowork.conf \
         | sed 's/^Environment=//' > ~/.zao/private/zoe-cowork.env && \
       chmod 600 ~/.zao/private/zoe-cowork.env && \
       grep -c '^COWORK_' ~/.zao/private/zoe-cowork.env

   Expect `2` (or `1` if the API URL is set elsewhere; then check step 3).
   If a value was quoted in the unit (`Environment="COWORK_BOT_TOKEN=..."`),
   stop and tell the lane: the sed above does not strip the quotes.

3. **Check bot/.env does not also set them** (names only):

       grep -c '^COWORK_' ~/zao-bot-live/bot/.env

   Expect `0`. If not 0, the drop-in still wins, but note which file is canonical.

4. **Swap the drop-in for the repo template, reload, restart:**

       cp ~/zao-bot-live/bot/systemd/zoe-bot.service.d/cowork.conf \
          ~/.config/systemd/user/zoe-bot.service.d/cowork.conf && \
       systemctl --user daemon-reload && \
       systemctl --user restart zoe-bot

   (Needs this PR merged and autodeployed, so the template is in `~/zao-bot-live`.)

5. **Verify, names and counts only:**

       systemctl --user show zoe-bot -p Environment | grep -c COWORK_BOT_TOKEN
       # expect 0: the value is no longer in the unit

       PID=$(systemctl --user show zoe-bot -p MainPID --value)
       tr '\0' '\n' < /proc/$PID/environ | grep -c '^COWORK_BOT_TOKEN=.'
       # expect 1: the running process has a non-empty token

       systemctl --user is-active zoe-bot
       # expect active

   If the second check prints 0, restore the backup from step 1, daemon-reload,
   restart, and tell the lane.

6. **Rotate (card 9809), now a one-file edit:** mint the new token on the board
   side, replace the `COWORK_BOT_TOKEN=` line in `~/.zao/private/zoe-cowork.env`,
   restart, repeat step 5, then retire the old token on the board side last.

7. **Leave the `.bak` file** for Zaal to delete when satisfied; it still holds
   the old value.
