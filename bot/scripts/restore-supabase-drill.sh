#!/usr/bin/env bash
# ============================================================================
# Restore drill - quarterly test that backups actually work
# ============================================================================
# Pulls a backup from R2, decrypts, restores to a *temporary* Supabase project
# OR a local Postgres, verifies row counts. NEVER restores over production.
#
# Usage:
#   bash bot/scripts/restore-supabase-drill.sh 2026-04-25
#   bash bot/scripts/restore-supabase-drill.sh latest
# ============================================================================

set -euo pipefail

DATE_OR_LATEST="${1:-latest}"
ENV_FILE="${HOME}/zao-backups/.env"
BACKUP_DIR="${HOME}/zao-backups"
DRILL_DIR="${BACKUP_DIR}/drill-$(date -u +%Y%m%d-%H%M%S)"
RCLONE_REMOTE="r2:zao-supabase-backups"
AGE_KEY_FILE="${HOME}/.config/age/zao-backup.key"

mkdir -p "${DRILL_DIR}"

if [ ! -f "${ENV_FILE}" ]; then
  echo "ERROR: ${ENV_FILE} missing. Run backup-supabase.sh first to set up."
  exit 1
fi

# shellcheck disable=SC1090
set -a; . "${ENV_FILE}"; set +a

: "${SUPABASE_PROJECT_REF:?SUPABASE_PROJECT_REF required}"
: "${RESTORE_TARGET_DB_URL:?RESTORE_TARGET_DB_URL required for drill - see notes below}"

if [ ! -f "${AGE_KEY_FILE}" ]; then
  echo "ERROR: age private key missing at ${AGE_KEY_FILE}"
  exit 1
fi

# ---- pick the backup file --------------------------------------------------
if [ "${DATE_OR_LATEST}" = "latest" ]; then
  BACKUP_FILE="$(rclone lsf "${RCLONE_REMOTE}/" --include="${SUPABASE_PROJECT_REF}-*.sql.gz.age" | sort | tail -1)"
else
  BACKUP_FILE="$(rclone lsf "${RCLONE_REMOTE}/" --include="${SUPABASE_PROJECT_REF}-${DATE_OR_LATEST}-*.sql.gz.age" | sort | tail -1)"
fi

if [ -z "${BACKUP_FILE}" ]; then
  echo "ERROR: no backup found for ${DATE_OR_LATEST}"
  echo "Available:"
  rclone lsf "${RCLONE_REMOTE}/" | tail -10
  exit 1
fi

echo "[drill] Using backup: ${BACKUP_FILE}"
echo "[drill] Target DB: ${RESTORE_TARGET_DB_URL%%@*}@***"
echo "[drill] Drill dir: ${DRILL_DIR}"
echo

# ---- safety guard - never restore to production ----------------------------
if echo "${RESTORE_TARGET_DB_URL}" | grep -q "${SUPABASE_PROJECT_REF}"; then
  echo "REFUSING: RESTORE_TARGET_DB_URL points at the same project as the backup."
  echo "Create a separate Supabase project (free) for drills, or use a local Postgres."
  exit 1
fi

# ---- download + decrypt ----------------------------------------------------
rclone copy "${RCLONE_REMOTE}/${BACKUP_FILE}" "${DRILL_DIR}/"
ENC_PATH="${DRILL_DIR}/${BACKUP_FILE}"
SQL_GZ_PATH="${ENC_PATH%.age}"

age -d -i "${AGE_KEY_FILE}" -o "${SQL_GZ_PATH}" "${ENC_PATH}"
echo "[drill] Decrypted to ${SQL_GZ_PATH##*/}"

# ---- restore ---------------------------------------------------------------
echo "[drill] Restoring..."
gunzip -c "${SQL_GZ_PATH}" | psql "${RESTORE_TARGET_DB_URL}" --quiet --single-transaction --set ON_ERROR_STOP=on

# ---- verify ----------------------------------------------------------------
echo "[drill] Verifying row counts on critical tables..."
for table in stock_team_members stock_circles stock_sponsors stock_artists stock_onepagers; do
  count=$(psql "${RESTORE_TARGET_DB_URL}" -tAc "SELECT count(*) FROM ${table}" 2>/dev/null || echo "missing")
  echo "  ${table}: ${count}"
done

echo
echo "[drill] DONE. Backup ${BACKUP_FILE} restored + verified at $(date -u)."
echo "[drill] Remember to wipe the drill DB if not needed: drop tables or delete project."

# ============================================================================
# Add to ${HOME}/zao-backups/.env:
#
# RESTORE_TARGET_DB_URL=postgresql://postgres:<password>@<host>:5432/postgres
#
# Best target: a separate free Supabase project named "zao-drill". Free tier OK
# since drill DB is wiped after each test.
# Alternative: local Postgres via Docker - `docker run -d -p 5432:5432
#   -e POSTGRES_PASSWORD=drill postgres:15` and use postgres://postgres:drill@localhost:5432/postgres
# ============================================================================
