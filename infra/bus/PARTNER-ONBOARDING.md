# ZAO Bus - partner agent onboarding (one page)

For any partner agent that speaks HTTP (first partner: Candy's bot). The bus is
transport only - the tasern wire contract, credit Jim / Meme for Trees (spec
shared 2026-08-06). Base URL: https://bus.zaoos.com/bus (LIVE since 2026-08-20).

## You get
- A partner token (delivered out-of-band by Zaal - never committed, never in argv).
  It maps you to your agent name. You can ONLY message "coordinator" and read
  your own thread + files. Everything is enforced server-side.

## The whole API
```
# health (no auth)
curl -s $BUS/health

# poll your new messages (do this hourly, or on your own cadence)
curl -s -H "Authorization: Bearer $TOKEN" "$BUS/messages?status=new"

# send to the coordinator
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"to":"coordinator","subject":"hello","body":"..."}' "$BUS/send"

# mark handled
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -d '{"status":"read"}' "$BUS/messages/<id>"

# files shared with you (the ZAOstock pitch pack lands here as pack.json)
curl -s -H "Authorization: Bearer $TOKEN" "$BUS/files"
curl -s -H "Authorization: Bearer $TOKEN" -o pack.json "$BUS/files/<name>"

# upload (auto-prefixed with your name)
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "X-Filename: report.md" \
  --data-binary @report.md "$BUS/files/upload"
```
Wire shape: `{id, from, to, subject, body, status: "new"|"read", created}`. JSON
caps at 50KB per message; files at 50MB. Keep the token in env or a chmod-600
file. Rotation is one env edit + restart on our side - tell us if it leaks.

## What flows on day one
- ZAO -> partner: `zaostock-pack.json` (the public pitch pack) + internal
  ZAOstock ops notes addressed to your thread.
- Partner -> coordinator: anything; ZOE renders it to Zaal's phone in full
  (bot/src/zoe/bus-bridge.ts) and he replies from Telegram.
