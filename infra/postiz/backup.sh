#!/usr/bin/env bash
# Nightly Postiz backup on the VPS (doc 2667 phase 1 step 10). Runbook: README.md.
# Dumps both databases and the uploads volume to /var/backups/postiz.
# Fails loudly: set -euo pipefail, and any 0-byte output is an error.
set -euo pipefail

d=/var/backups/postiz
t=$(date +%F-%H%M)
uploads_volume=postiz_postiz-uploads # compose project "postiz" + volume "postiz-uploads"

docker volume inspect "$uploads_volume" >/dev/null # aborts if the name is wrong

docker exec postiz-postgres pg_dump -U postiz-user postiz-db-local | gzip >"$d/postiz-db-$t.sql.gz"
docker exec temporal-postgresql pg_dumpall -U temporal | gzip >"$d/temporal-db-$t.sql.gz"
docker run --rm -v "$uploads_volume":/u:ro -v "$d":/b alpine:3.20 tar czf "/b/uploads-$t.tgz" -C /u .

for f in "$d/postiz-db-$t.sql.gz" "$d/temporal-db-$t.sql.gz" "$d/uploads-$t.tgz"; do
  [ -s "$f" ] || { echo "BACKUP FAILED: $f is empty" >&2; exit 1; }
done

# No automatic deletion (.claude/rules/no-rm-rf.md: unattended jobs never delete).
# Pruning old dumps is a manual step for Zaal; this prints the total so growth is visible.
ls -lh "$d" | tail -4
du -sh "$d"
date -u +%FT%TZ >"$d/.last-ok" # heartbeat: README "Backups" says how it is watched
