#!/usr/bin/env python3
"""
Log a cold-outreach touch to the ZAO CRM AGENTIC Airtable base.

Called by the cold-outreach skill AFTER the user manually sends a drafted DM
or email. Writes one activity row and optionally creates/updates a contact row.

Usage:
  cold-outreach-write.py \\
    --name "Illia Polosukhin" \\
    --channel linkedin-dm-sent \\
    --angle C \\
    --summary "First touch - ZABAL Games builder bootcamp pitch + binary question about NEAR ecosystem builders" \\
    [--linkedin-url https://linkedin.com/in/illia-polosukhin] \\
    [--company "NEAR Protocol"] \\
    [--title "Co-founder"] \\
    [--bonfire-episode-id meeting:2026-05-25:cold-outreach:illia]

Channels: linkedin-dm-sent | email-sent | x-dm-sent | farcaster-dm-sent
Angles:   A (Fractal) | B (Music) | C (ZABAL Games) | D (Festivals) | umbrella

Env: AIRTABLE_CRM_TOKEN + AIRTABLE_CRM_BASE_ID (from ~/.zao/zao.env)
"""
import argparse
import json
import os
import sys
import urllib.request
import urllib.error
import datetime
import subprocess

TOKEN = os.environ.get("AIRTABLE_CRM_TOKEN")
BASE_ID = os.environ.get("AIRTABLE_CRM_BASE_ID")

if not TOKEN or not BASE_ID:
    # Try sourcing ~/.zao/zao.env
    env_file = os.path.expanduser("~/.zao/zao.env")
    if os.path.isfile(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                v = v.strip().strip('"').strip("'")
                os.environ.setdefault(k.strip(), v)
        TOKEN = os.environ.get("AIRTABLE_CRM_TOKEN", TOKEN)
        BASE_ID = os.environ.get("AIRTABLE_CRM_BASE_ID", BASE_ID)

if not TOKEN or not BASE_ID:
    sys.exit("ERROR: AIRTABLE_CRM_TOKEN + AIRTABLE_CRM_BASE_ID required (not in env or ~/.zao/zao.env)")

CONTACTS_TABLE = "tbld4piB9auXPXYEn"
ACTIVITY_TABLE = "tblHGmWeoH0ijetPH"

ZAAL_ID = "recQYQ3mawligl4fn"

ANGLE_TO_RELEVANCE = {
    "A": ["Fractal"],
    "B": ["WaveWarZ", "ZAO-Music"],
    "C": ["ZABAL-Games"],
    "D": ["ZAOstock"],
    "umbrella": ["ops"],
}

ANGLE_TO_ZAO_CONNECTION = {
    "A": ["investor", "advisor"],
    "B": ["WaveWarZ-collab", "inbound-builder"],
    "C": ["inbound-builder"],
    "D": ["partner-org"],
    "umbrella": ["cold-intro"],
}


def api(method, path, body=None):
    url = f"https://api.airtable.com/v0/{BASE_ID}{path}"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def find_contact_by_name(name):
    """Look up an existing contact by exact name match (case-insensitive)."""
    import urllib.parse
    formula = f'LOWER({{name}})=LOWER("{name}")'
    q = urllib.parse.quote(formula)
    status, resp = api("GET", f"/{CONTACTS_TABLE}?filterByFormula={q}&maxRecords=1")
    if status == 200 and resp.get("records"):
        return resp["records"][0]["id"]
    return None


def ensure_contact(args):
    """Find or create the contact row, return its ID."""
    existing = find_contact_by_name(args.name)
    if existing:
        print(f"  contact exists: {existing}  ({args.name})")
        # Optionally PATCH last_touch_date
        today = datetime.date.today().isoformat()
        api("PATCH", f"/{CONTACTS_TABLE}/{existing}", {"fields": {"last_touch_date": today}})
        return existing

    print(f"  creating new contact: {args.name}")
    fields = {
        "name": args.name,
        "met_via": f"cold-outreach skill {datetime.date.today().isoformat()}",
        "first_contact_date": datetime.date.today().isoformat(),
        "last_touch_date": datetime.date.today().isoformat(),
        "consent_for_graph": False,
        "zao_connection": ANGLE_TO_ZAO_CONNECTION.get(args.angle, ["cold-intro"]),
        "notes": f"Auto-created by cold-outreach-write.py for {args.channel} touch on {datetime.date.today().isoformat()}. Angle: {args.angle}. Verify role + relationship before next touch.",
    }
    if args.company:
        fields["org"] = args.company
    if args.title:
        fields["role"] = args.title
    if args.linkedin_url:
        fields["notes"] += f" LinkedIn: {args.linkedin_url}"
    if args.email:
        fields["email_primary"] = args.email

    status, resp = api("POST", f"/{CONTACTS_TABLE}", {"records": [{"fields": fields}]})
    if status not in (200, 201):
        print(f"  FAILED contact create ({status}): {resp}", file=sys.stderr)
        sys.exit(2)
    new_id = resp["records"][0]["id"]
    print(f"  new contact: {new_id}")
    return new_id


def write_activity(args, contact_id):
    """Write one activity row for the outreach touch."""
    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    title = f"Cold outreach - {args.channel} to {args.name}"

    raw_source = args.raw_source or f"~/.zao/private/cold-outreach-{datetime.date.today().isoformat()}.txt"

    fields = {
        "title": title,
        "date": now_iso,
        "type": args.channel,
        "contacts": [contact_id, ZAAL_ID],
        "direction": "outbound",
        "source": "cold-outreach-skill",
        "raw_source": raw_source,
        "zao_relevance": ANGLE_TO_RELEVANCE.get(args.angle, ["ops"]),
        "summary": args.summary,
        "bonfire_episode_id": args.bonfire_episode_id or "",
    }

    print(f"  inserting activity row...")
    status, resp = api("POST", f"/{ACTIVITY_TABLE}", {"records": [{"fields": fields}]})
    if status not in (200, 201):
        print(f"  FAILED activity create ({status}): {resp}", file=sys.stderr)
        sys.exit(3)
    new_id = resp["records"][0]["id"]
    print(f"  activity: {new_id}")
    return new_id


def main():
    p = argparse.ArgumentParser(description="Log a cold-outreach touch to Airtable CRM")
    p.add_argument("--name", required=True, help="Target full name (e.g. 'Illia Polosukhin')")
    p.add_argument("--channel", required=True, choices=[
        "linkedin-dm-sent", "email-sent", "x-dm-sent", "farcaster-dm-sent", "telegram-dm-sent"
    ], help="Channel the message was sent on")
    p.add_argument("--angle", required=True, choices=["A", "B", "C", "D", "umbrella"],
                   help="ZAO pitch angle: A=Fractal B=Music C=ZABAL Games D=Festivals umbrella=multi")
    p.add_argument("--summary", required=True,
                   help="1-line synthesis of what was sent (NOT the full message body)")
    p.add_argument("--linkedin-url", help="Target's LinkedIn URL (optional, stored in contact notes)")
    p.add_argument("--company", help="Target's company")
    p.add_argument("--title", help="Target's role/title")
    p.add_argument("--email", help="Target's email (if known)")
    p.add_argument("--bonfire-episode-id", help="Bonfire episode name if this touch generated one")
    p.add_argument("--raw-source", help="Path to raw message dump in ~/.zao/private/ (optional)")
    args = p.parse_args()

    print(f"cold-outreach-write: logging {args.channel} touch to {args.name} ({args.angle})")
    contact_id = ensure_contact(args)
    activity_id = write_activity(args, contact_id)

    print()
    print("=" * 60)
    print(f"DONE")
    print(f"  contact:  {contact_id}  ({args.name})")
    print(f"  activity: {activity_id}  ({args.channel}, angle {args.angle})")
    print("=" * 60)


if __name__ == "__main__":
    main()
