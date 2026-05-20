#!/usr/bin/env python3
"""
Ingest GitHub repo READMEs for bettercallzaal/* into the ZABAL bonfire.

Each repo becomes one episode containing description + truncated README
body. Goes through the secret-scan filter; flagged HIGH severity hits
block by default (set --sanitize to redact-and-send instead).

Run:
    set -a; . /root/cowork-zaodevz/agent/.env; set +a
    # Refresh repos.json if stale (uses gh CLI; needs gh auth)
    python3 scripts/bonfire-ingest/ingest_github_readmes.py [--sanitize] [--repos-json PATH]
"""

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from bonfire_client import IngestPipeline


UA = "Mozilla/5.0 (compatible; ZAOcoworkingBot/0.3.1; +https://zaoos.com)"
README_CAP = 3500


def fetch_readme(repo, default_branch, gh_token=None):
    branches = [default_branch, "main", "master", "canon"]
    seen = set()
    for branch in branches:
        if branch in seen or not branch:
            continue
        seen.add(branch)
        for fn in ("README.md", "readme.md", "Readme.md", "README"):
            url = f"https://raw.githubusercontent.com/bettercallzaal/{repo}/{branch}/{fn}"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=10) as r:
                    body = r.read().decode("utf-8", errors="replace")
                    if body.strip():
                        return body, "public", branch
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    continue
            except Exception:
                continue

    if gh_token:
        try:
            url = f"https://api.github.com/repos/bettercallzaal/{repo}/readme"
            req = urllib.request.Request(url, headers={
                "Authorization": f"Bearer {gh_token}",
                "Accept": "application/vnd.github.raw",
                "User-Agent": UA,
            })
            with urllib.request.urlopen(req, timeout=15) as r:
                body = r.read().decode("utf-8", errors="replace")
                if body.strip():
                    return body, "private", "via-api"
        except Exception:
            pass

    return None, None, None


def build_episode(repo, readme, kind):
    name = repo["name"]
    desc = repo.get("description", "") or "(no description)"
    lang = repo.get("language") or "unspecified"
    pushed = repo.get("pushedAt", "")[:10]
    visibility = repo.get("visibility", "UNKNOWN").lower()
    branch = repo.get("defaultBranch", "main")

    header = (
        f"GitHub repo bettercallzaal/{name} ({visibility}, primary language {lang}, "
        f"default branch {branch}, last pushed {pushed}). "
        f"Description: {desc}. "
        f"Built by Zaal Panthaki under the ZABAL / BCZ Strategies LLC umbrella."
    )
    if not readme:
        return header + " (No README accessible.)"
    truncated = readme[:README_CAP]
    suffix = "" if len(readme) <= README_CAP else f" ...[truncated, full README at github.com/bettercallzaal/{name}]"
    return header + " README excerpt: " + truncated + suffix


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sanitize", action="store_true", help="redact HIGH-severity hits and post; default = block")
    ap.add_argument("--repos-json", default="/tmp/repos.json", help="path to JSON list of repos")
    ap.add_argument("--dry-run", action="store_true", help="don't actually POST")
    args = ap.parse_args()

    if not os.path.exists(args.repos_json):
        print(f"missing {args.repos_json}. Generate with:")
        print(f"  gh repo list bettercallzaal --limit 200 --json name,description,visibility,isArchived,isFork,pushedAt,primaryLanguage,defaultBranchRef -q '[.[] | select(.isArchived == false and .isFork == false) | {{name, description: (.description // \"\"), visibility, pushedAt, language: (.primaryLanguage.name // \"\"), defaultBranch: .defaultBranchRef.name}}]' > {args.repos_json}")
        sys.exit(2)

    repos = json.load(open(args.repos_json))
    print(f"=== {len(repos)} repos to ingest ===")
    print(f"sanitize mode: {args.sanitize}, dry run: {args.dry_run}")
    print()

    gh_token = os.environ.get("GITHUB_TOKEN")
    p = IngestPipeline(label="github-readmes", sanitize=args.sanitize, dry_run=args.dry_run)

    no_readme = 0
    for i, repo in enumerate(repos):
        name = repo["name"]
        readme, kind, _branch = fetch_readme(name, repo.get("defaultBranch") or "main", gh_token=gh_token)
        if not readme:
            no_readme += 1
        body = build_episode(repo, readme, kind)
        print(f"[{i+1:2d}/{len(repos)}] {name}:")
        p.ingest(
            name=f"github:{name}",
            body=body,
            source_description=f"bettercallzaal-github:{name}",
        )
        time.sleep(0.25)

    p.report()
    print(f"\nno_readme: {no_readme}")


if __name__ == "__main__":
    main()
