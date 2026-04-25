#!/usr/bin/env bash
# ============================================================================
# Daily Supabase backup -> age-encrypted -> Cloudflare R2 (free 10GB tier)
# ============================================================================
# Belt-and-suspenders backup. Native Supabase backups + this = 2 parachutes.
# OSS-only stack: pg_dump (Postgres native) + age (modern OSS encryption) +
# rclone (OSS S3 client, talks to R2).
#
# Run via cron on VPS 1:  0 2 * * *  /home/zaal/bin/backup-supabase.sh
#
# Setup once on VPS 1:
#   1. apt install postgresql-client age rclone
#   2. age-keygen -o ~/.config/age/zao-backup.key  # save pubkey + privkey
#      (commit pubkey to repo, KEEP privkey offline + somewhere safe)
#   3. rclone config  # add 'r2' remote with Cloudflare R2 access key + secret
#      (Cloudflare dashboard -> R2 -> Manage R2 API tokens)
#   4. mkdir -p ~/zao-backups
#   5. cp .env.backup.example ~/zao-backups/.env  # see template at bottom
#   6. chmod 600 ~/zao-backups/.env
#   7. crontab -e -> add: 0 2 * * * /home/zaal/zaostock-bot/scripts/backup-supabase.sh
#
# Restore drill (quarterly):
#   bash bot/scripts/restore-supabase-drill.sh <YYYY-MM-DD>
# ============================================================================

set -euo pipefail

# ---- config ----------------------------------------------------------------
ENV_FILE="${HOME}/zao-backups/.env"
BACKUP_DIR="${HOME}/zao-backups"
LOG_FILE="${BACKUP_DIR}/backup.log"
KEEP_LOCAL_DAYS=3      # keep 3 days of local copies
RCLONE_REMOTE="r2:zao-supabase-backups"
AGE_RECIPIENT_FILE="${HOME}/.config/age/zao-backup.pub"

mkdir -p "${BACKUP_DIR}"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "${LOG_FILE}"; }

# ---- preflight -------------------------------------------------------------
if [ ! -f "${ENV_FILE}" ]; then
  log "ERROR: ${ENV_FILE} missing. See setup notes at top of script."
  exit 1
fi

# shellcheck disable=SC1090
set -a; . "${ENV_FILE}"; set +a

: "${SUPABASE_DB_URL:?SUPABASE_DB_URL required in ${ENV_FILE}}"
: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF required in ${ENV_FILE}}"

if [ ! -f "${AGE_RECIPIENT_FILE}" ]; then
  log "ERROR: age public key missing at ${AGE_RECIPIENT_FILE}. Run age-keygen first."
  exit 1
fi

for cmd in pg_dump age rclone gzip; do
  if ! command -v "${cmd}" >/dev/null 2>&1; then
    log "ERROR: ${cmd} not installed. apt install postgresql-client age rclone"
    exit 1
  fi
done

# ---- dump ------------------------------------------------------------------
DATE_TAG="$(date -u +%Y-%m-%d)"
TIME_TAG="$(date -u +%H%M%SZ)"
DUMP_NAME="${SUPABASE_PROJECT_REF}-${DATE_TAG}-${TIME_TAG}.sql.gz"
DUMP_PATH="${BACKUP_DIR}/${DUMP_NAME}"
ENC_PATH="${DUMP_PATH}.age"

log "Starting pg_dump for ${SUPABASE_PROJECT_REF}"

# Use custom format would be smaller but plain SQL is portable + diff-friendly.
# --no-owner / --no-privileges so dump is restorable on a fresh project.
# --schema=public + --schema=auth covers app data + Supabase auth metadata.
pg_dump \
  --dbname="${SUPABASE_DB_URL}" \
  --no-owner \
  --no-privileges \
  --no-comments \
  --quote-all-identifiers \
  --schema=public \
  --schema=auth \
  --schema=storage \
  --exclude-table-data='auth.refresh_tokens' \
  --exclude-table-data='auth.sessions' \
  --exclude-table-data='auth.flow_state' \
  --exclude-table-data='audit_log' \
  --format=plain \
  | gzip -9 > "${DUMP_PATH}"

DUMP_SIZE="$(du -h "${DUMP_PATH}" | cut -f1)"
log "Dump complete: ${DUMP_NAME} (${DUMP_SIZE})"

# ---- encrypt ---------------------------------------------------------------
age -R "${AGE_RECIPIENT_FILE}" -o "${ENC_PATH}" "${DUMP_PATH}"
ENC_SIZE="$(du -h "${ENC_PATH}" | cut -f1)"
log "Encrypted: ${ENC_PATH##*/} (${ENC_SIZE})"
rm -f "${DUMP_PATH}"  # remove plaintext

# ---- upload to R2 ----------------------------------------------------------
log "Uploading to ${RCLONE_REMOTE}/${ENC_PATH##*/}"
rclone copy "${ENC_PATH}" "${RCLONE_REMOTE}/" --no-traverse --quiet

# verify upload landed
if rclone lsf "${RCLONE_REMOTE}/" --include="${ENC_PATH##*/}" | grep -q .; then
  log "Upload verified."
else
  log "ERROR: upload verification failed."
  exit 1
fi

# ---- prune local + remote --------------------------------------------------
log "Pruning local files older than ${KEEP_LOCAL_DAYS} days"
find "${BACKUP_DIR}" -name "${SUPABASE_PROJECT_REF}-*.sql.gz.age" -mtime +${KEEP_LOCAL_DAYS} -delete

# Remote retention: keep 30 days. R2 lifecycle rules handle this best - configure
# in Cloudflare R2 dashboard: Bucket -> Settings -> Object lifecycle -> Delete after 30 days.
# Manual prune fallback (commented):
# rclone delete "${RCLONE_REMOTE}/" --min-age 30d --include="${SUPABASE_PROJECT_REF}-*.sql.gz.age"

log "Backup complete: ${ENC_PATH##*/}"
echo "OK: ${ENC_PATH##*/} (${ENC_SIZE})"

# ============================================================================
# Template for ${HOME}/zao-backups/.env (chmod 600):
#
# SUPABASE_PROJECT_REF=abcdefghijklmnop
# SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
#
# Get DB URL from: Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI
# Use the "Session Pooler" or "Direct connection" string - NOT transaction pooler (it doesn't support pg_dump).
# ============================================================================
