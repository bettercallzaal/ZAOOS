#!/usr/bin/env python3
"""zao-board-vault-check - do the vault's card citations still match the board?

Lane briefs and queue files cite cowork card ids. When a card closes, the
citation does not, so a lane can boot and start work that is already done.
This walks zao-vault/handoffs (archives excluded) and checks every cited card
against the live board.

Needs SUPABASE_URL + SUPABASE_SERVICE_KEY (source ~/.zao/zao.env).
Run: python3 scripts/agents/zao-board-vault-check.py

FIVE INSTRUMENT BUGS were found and fixed on its first run, 2026-08-19, and
they are worth knowing because each one produced a confident lie:

1. PostgREST caps responses at 1000 rows and IGNORES limit=5000, so cards
   created the same day read as "NOT ON BOARD" - a FABRICATED ABSENCE, exactly
   what confirm-before-claiming-absence.md exists to prevent. Now paged.
2. PostgREST cannot LIKE a uuid column, so every 8-char prefix lookup 404'd and
   would have been read as missing. Now matched locally.
3. in_progress was counted as stale. It is ACTIVE work - the check fired on the
   healthy case (noisy-signal-guard.md).
4. uuids inside URLs and filesystem paths (Paragraph chat links, scratchpad
   session dirs, Farcaster space ids) were treated as card ids.
5. Extraction lived in a separate script writing a cached JSON file, so fixing
   the regex here silently changed nothing. Folded in: one tool, one pass.

After the fixes: 1 flagged citation of 13, and that one is a DONE card cited
inside GRILL-QUEUE's RESOLVED section, which is correct.
"""
import json, os, urllib.request

# SELF-CONTAINED EXTRACTION. This used to read a JSON file written by a
# separate inline script, so a regex fix here silently did nothing - the check
# kept reporting stale results from a cached extraction. One tool, one pass.
import re, glob
VAULT = os.path.expanduser("~/zao-vault")
# A uuid preceded by "/" or "-" is part of a URL or path (Paragraph chat links,
# scratchpad session dirs, Farcaster space ids) - not a board card id.
uuid_re = re.compile(r"(?<![/\w-])([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\b")
short_re = re.compile(r"\bcards?\s+([0-9a-f]{8})\b", re.I)
ids = {}
vfiles = [f for f in glob.glob(VAULT + "/handoffs/**/*.md", recursive=True) if "/archive/" not in f]
for f in vfiles:
    body = open(f, errors="replace").read()
    rel = os.path.relpath(f, VAULT)
    for m in uuid_re.finditer(body):
        ids.setdefault(m.group(1), set()).add(rel)
    for m in short_re.finditer(body):
        ids.setdefault(m.group(1), set()).add(rel)
ids = {k: sorted(v) for k, v in ids.items()}
print("vault files scanned: " + str(len(vfiles)) + " | card ids cited: " + str(len(ids)))
root = os.environ["SUPABASE_URL"].rstrip("/")
key = os.environ["SUPABASE_SERVICE_KEY"]
hdr = {"apikey": key, "Authorization": "Bearer " + key}

full = sorted(i for i in ids if len(i) == 36)
short = sorted(i for i in ids if len(i) == 8)

by = {}
if full:
    url = root + "/rest/v1/tasks?id=in.(" + ",".join(full) + ")&select=id,status,title,archived_at"
    rows = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=hdr), timeout=20))
    by = {r["id"]: r for r in rows}

print("=== full-id citations ===")
stale = 0
for i in full:
    r = by.get(i)
    where = ", ".join(ids[i])
    if not r:
        print("  NOT ON BOARD: " + i[:8] + "  <- " + where)
        stale += 1
    elif r["status"] not in ("todo", "in_progress") or r["archived_at"]:
        st = r["status"].upper() + (" +archived" if r["archived_at"] else "")
        print("  " + st + ": " + i[:8] + " " + r["title"][:50] + "  <- " + where)
        stale += 1

# INSTRUMENT FIX 2026-08-19: PostgREST cannot LIKE a uuid column, so every
# prefix lookup 404'd and would have read as "not on the board" - a check that
# reports absence when it simply could not ask. Pull the id list once and match
# prefixes locally instead.
# INSTRUMENT FIX 2 (same run): PostgREST caps a response at 1000 rows and
# IGNORES limit=5000 - so cards created today read as "NOT ON BOARD". That is a
# FABRICATED ABSENCE, the exact failure confirm-before-claiming-absence.md
# exists to prevent: the checker could not see the row and reported it missing.
# Page with Range headers and assert we reached the end.
allrows = []
page = 0
while True:
    req = urllib.request.Request(
        root + "/rest/v1/tasks?select=id,status,title,archived_at&order=created_at.asc", headers=dict(hdr))
    req.add_header("Range-Unit", "items")
    req.add_header("Range", str(page * 1000) + "-" + str(page * 1000 + 999))
    batch = json.load(urllib.request.urlopen(req, timeout=40))
    allrows += batch
    if len(batch) < 1000:
        break
    page += 1
    if page > 20:
        raise SystemExit("refusing to page past 20k rows - check the query")
print("\n=== 8-char prefix citations (matched locally against " + str(len(allrows)) + " cards) ===")
for i in short:
    rows = [r for r in allrows if r["id"].startswith(i)]
    if not rows:
        print("  NOT ON BOARD: " + i + "  <- " + ", ".join(ids[i]))
        stale += 1
    else:
        r = rows[0]
        flag = "" if r["status"] == "todo" else "  [" + r["status"].upper() + "]"
        print("  " + i + " " + r["status"] + flag + " " + r["title"][:46] + "  <- " + ", ".join(ids[i]))
        # in_progress is ACTIVE work, not a stale citation. Counting it as
        # stale made the check fire on the healthy case (noisy-signal-guard).
        if r["status"] not in ("todo", "in_progress"):
            stale += 1

print("\nSTALE CITATIONS TOTAL: " + str(stale) + " of " + str(len(ids)))
