#!/usr/bin/env python3
"""
One-time migration: ZAO CRM AGENTIC (Airtable, doc 737) -> Supabase CRM (doc 772).

Reads every contact + activity row from the Airtable base and writes them into
the Supabase crm_contacts / crm_interactions tables (the new native CRM). Stamps
each contact's Airtable record id into legacy_airtable_id so the migration is
re-runnable without duplicating.

SAFE BY DEFAULT: prints a dry-run summary and writes NOTHING unless you pass
--apply. PII (emails, notes) is read from one private store (Airtable) and
written to another (Supabase, RLS-locked) — neither leaves the server. This
script contains NO hardcoded PII; it all comes from Airtable at runtime.

Idempotency: --apply first deletes prior migrated rows (crm_contacts WHERE
legacy_airtable_id IS NOT NULL, cascading their interactions) then re-inserts.
Manually-added contacts (legacy_airtable_id NULL) are never touched. NOTE: a
re-run resets migrated rows, so any manual edit to a MIGRATED contact (e.g.
flipping it public) is lost on re-run. Run once; publish/edit after.

Env (source both before running):
  AIRTABLE_CRM_TOKEN, AIRTABLE_CRM_BASE_ID      (~/.zao/zao.env, per doc 737)
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY       (the bot's .env)

Usage:
  source ~/.zao/zao.env && set -a && . ~/zao-os/bot/.env && set +a
  python3 scripts/zao-crm-sync/airtable-to-supabase.py            # dry run
  python3 scripts/zao-crm-sync/airtable-to-supabase.py --apply    # write
"""
import json, os, re, sys, urllib.request, urllib.error

AIRTABLE_TOKEN = os.environ["AIRTABLE_CRM_TOKEN"]
AIRTABLE_BASE = os.environ["AIRTABLE_CRM_BASE_ID"]
CONTACTS_TABLE = "tbld4piB9auXPXYEn"
ACTIVITY_TABLE = "tblHGmWeoH0ijetPH"

SUPABASE_URL = os.environ["SUPABASE_URL"].rstrip("/")
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Substring (lowercased) that identifies the CRM owner's own contact row. The
# owner is migrated as a contact but is NOT the *target* of an interaction
# (interactions are about the other person). Adjust if the owner name differs.
OWNER_NAME_MATCH = "zaal"

# Airtable activity type -> crm_interactions.type (free text, no DB check).
TYPE_MAP = {
    "email-received": "email",
    "email-sent": "email",
    "email": "email",
    "gcal-event": "gcal",
    "call": "call",
    "meeting": "meeting",
    "message": "message",
}


# ---------------------------------------------------------------- http helpers
def _req(url, method, headers, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            txt = r.read()
            return r.status, (json.loads(txt) if txt else None)
    except urllib.error.HTTPError as e:
        txt = e.read()
        try:
            return e.code, json.loads(txt)
        except Exception:
            return e.code, {"raw": txt.decode(errors="replace")[:500]}


def airtable_list(table):
    """Fetch every record from an Airtable table (paginated)."""
    headers = {"Authorization": f"Bearer {AIRTABLE_TOKEN}"}
    out, offset = [], None
    while True:
        url = f"https://api.airtable.com/v0/{AIRTABLE_BASE}/{table}?pageSize=100"
        if offset:
            url += f"&offset={offset}"
        status, resp = _req(url, "GET", headers)
        if status != 200:
            sys.exit(f"Airtable list {table} failed ({status}): {resp}")
        out.extend(resp.get("records", []))
        offset = resp.get("offset")
        if not offset:
            return out


def sb(method, path, body=None, prefer=None):
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return _req(f"{SUPABASE_URL}/rest/v1{path}", method, headers, body)


# ---------------------------------------------------------------- mapping
def slugify(value):
    s = re.sub(r"[^a-z0-9]+", "-", (value or "").lower().strip().lstrip("@"))
    return re.sub(r"^-+|-+$", "", s)[:64]


def contact_slug(name, rec_id):
    """Deterministic + unique: slugify(name) + a short stable suffix from the
    Airtable record id (so two people sharing a name never collide)."""
    base = slugify(name) or "contact"
    return f"{base}-{rec_id[-4:].lower()}"[:64]


def map_contact(rec):
    f = rec.get("fields", {})
    name = f.get("name") or "(unnamed)"
    # Fold Airtable-only fields with no native column into private_notes so
    # nothing is lost in the move.
    meta = []
    for key in ("first_contact_date", "last_touch_date", "consent_for_graph",
                "zao_connection", "research_docs", "memory_slug"):
        if f.get(key) not in (None, "", [], False):
            meta.append(f"{key}={f.get(key)}")
    notes = f.get("notes") or ""
    if meta:
        notes = (notes + "\n\n[airtable] " + " | ".join(map(str, meta))).strip()
    return {
        "name": name,
        "slug": contact_slug(name, rec["id"]),
        "role": f.get("role"),
        "org": f.get("org"),
        "how_we_met": f.get("met_via"),
        "email": f.get("email_primary"),
        "private_notes": notes or None,
        "is_public": False,          # migrated rows start private; publish later
        "legacy_airtable_id": rec["id"],
    }


def map_interaction(activity, contact_id):
    f = activity.get("fields", {})
    return {
        "contact_id": contact_id,
        "type": TYPE_MAP.get((f.get("type") or "").lower(), "note"),
        "title": f.get("title"),
        # Migrated interactions are private; keep the summary off the public
        # projection. Visibility=private means it never shows on /network.
        "private_notes": f.get("summary"),
        "visibility": "private",
        "occurred_at": f.get("date"),
        "source": "airtable-migration",
        "bonfire_episode_id": f.get("bonfire_episode_id") or None,
        "created_by": "migration",
    }


def compact(d):
    return {k: v for k, v in d.items() if v is not None}


# ---------------------------------------------------------------- main
def main():
    apply = "--apply" in sys.argv

    contacts = airtable_list(CONTACTS_TABLE)
    activities = airtable_list(ACTIVITY_TABLE)
    print(f"Airtable: {len(contacts)} contacts, {len(activities)} activity rows.")

    # Which Airtable rec ids are the owner (excluded as interaction targets).
    owner_ids = {
        rec["id"]
        for rec in contacts
        if OWNER_NAME_MATCH in (rec.get("fields", {}).get("name") or "").lower()
    }

    contact_rows = [compact(map_contact(r)) for r in contacts]

    # Plan interactions: one per (activity, non-owner linked contact).
    planned = []  # (legacy_contact_rec_id, activity)
    for a in activities:
        linked = a.get("fields", {}).get("contacts") or []
        targets = [rid for rid in linked if rid not in owner_ids]
        for rid in targets:
            planned.append((rid, a))

    print(f"Plan: upsert {len(contact_rows)} contacts, insert {len(planned)} interactions.")
    print("Sample contacts:", ", ".join(
        f"{c['name']} ({c['slug']})" for c in contact_rows[:5]))

    if not apply:
        print("\nDRY RUN — nothing written. Re-run with --apply to migrate.")
        return

    # 1. Clear prior migrated rows (cascade removes their interactions).
    status, _ = sb("DELETE", "/crm_contacts?legacy_airtable_id=not.is.null",
                   prefer="return=minimal")
    print(f"Cleared prior migrated contacts (HTTP {status}).")

    # 2. Insert contacts, get back id<->legacy_airtable_id.
    legacy_to_id = {}
    for i in range(0, len(contact_rows), 50):
        batch = contact_rows[i:i + 50]
        status, resp = sb("POST", "/crm_contacts", batch, prefer="return=representation")
        if status not in (200, 201):
            sys.exit(f"contact insert failed ({status}): {resp}")
        for row in resp:
            legacy_to_id[row["legacy_airtable_id"]] = row["id"]
    print(f"Inserted {len(legacy_to_id)} contacts.")

    # 3. Insert interactions resolved to their new contact_id.
    inter_rows = []
    for legacy_rid, activity in planned:
        cid = legacy_to_id.get(legacy_rid)
        if cid:
            inter_rows.append(compact(map_interaction(activity, cid)))
    inserted = 0
    for i in range(0, len(inter_rows), 50):
        batch = inter_rows[i:i + 50]
        status, resp = sb("POST", "/crm_interactions", batch, prefer="return=representation")
        if status not in (200, 201):
            sys.exit(f"interaction insert failed ({status}): {resp}")
        inserted += len(resp or [])
    print(f"Inserted {inserted} interactions.")
    print("\nDONE. View at zaoos.com/crm")


if __name__ == "__main__":
    main()
