#!/usr/bin/env python3
"""Read-only skill inventory for doc 2624. Run from a ZAOOS checkout (or set ZAOOS_ROOT).
Writes inventory.json to OUT_DIR (default: the current directory). Deletes and edits nothing."""
import json, os, re, subprocess, sys

HOME = os.path.expanduser("~")
DOT_REPO = f"{HOME}/zaal-dotfiles"
DOT = f"{DOT_REPO}/claude/skills"
ZAOOS = os.environ.get("ZAOOS_ROOT") or subprocess.run(["git", "rev-parse", "--show-toplevel"], capture_output=True, text=True).stdout.strip()
ZSK = f"{ZAOOS}/.claude/skills"
OUT = os.environ.get("OUT_DIR") or os.getcwd()

# The retired-name pattern is NOT written here: this file lives in a public repo and
# the names are not to be re-typed. Pass it in: RETIRED_PATTERN='name1|name2' (case-insensitive).
# Unset means the retired-name columns are empty because nothing was searched, not because nothing was found.
RETIRED = re.compile(os.environ.get("RETIRED_PATTERN") or r"(?!x)x", re.I)
if not os.environ.get("RETIRED_PATTERN"):
    print("WARNING: RETIRED_PATTERN unset - retired-name scan NOT RUN (columns will read empty)", file=sys.stderr)


def git(repo, *args):
    r = subprocess.run(["git", "-C", repo, *args], capture_output=True, text=True)
    return r.stdout.strip(), r.returncode


def frontmatter(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    fm = {}
    if not m:
        return fm, False
    body = m.group(1)
    # naive yaml: key: value, with folded/multi-line continuation
    cur = None
    for line in body.split("\n"):
        km = re.match(r"^([A-Za-z_-]+):\s*(.*)$", line)
        if km and not line.startswith(" "):
            cur = km.group(1)
            fm[cur] = km.group(2).strip()
        elif cur and line.strip():
            fm[cur] = (fm[cur] + " " + line.strip()).strip()
    for k in list(fm):
        v = fm[k]
        if v in ("|", ">", "|-", ">-"):
            v = ""
        v = re.sub(r"^[|>]-?\s+", "", v)
        fm[k] = v.strip().strip('"').strip("'")
    return fm, True


def skill_file(d):
    for n in sorted(os.listdir(d)):
        if n.lower() == "skill.md":
            return os.path.join(d, n)
    return None


def record(root_label, repo, d, name):
    rec = {"root": root_label, "dir_name": name, "path": d}
    rec["is_symlink"] = os.path.islink(d)
    if rec["is_symlink"]:
        rec["link_target"] = os.readlink(d)
        rec["link_resolves"] = os.path.exists(d)
    real = os.path.realpath(d)
    rec["real_path"] = real
    sf = skill_file(d) if os.path.isdir(d) else None
    rec["skill_file"] = sf
    if not sf:
        rec["note"] = "no SKILL.md"
        try:
            rec["contents"] = sorted(os.listdir(d))[:12]
        except OSError as e:
            rec["contents"] = [f"ERR {e}"]
    else:
        text = open(sf, encoding="utf-8", errors="replace").read()
        fm, has = frontmatter(text)
        rec["has_frontmatter"] = has
        rec["fm_name"] = fm.get("name", "")
        rec["description"] = fm.get("description", "")
        rec["fm_keys"] = sorted(fm.keys())
        rec["bytes"] = len(text.encode("utf-8"))
        rec["lines"] = text.count("\n") + 1
        rec["words"] = len(text.split())
        rec["est_tokens"] = round(rec["bytes"] / 4)
        rec["skill_file_name"] = os.path.basename(sf)
        hits = sorted(set(m.group(0).lower() for m in RETIRED.finditer(text)))
        rec["retired_in_skill_md"] = hits
    # retired names anywhere in the dir (text files only, bounded)
    dir_hits = {}
    nfiles = 0
    total_bytes = 0
    if os.path.isdir(d):
        for base, dirs, files in os.walk(d, followlinks=True):
            dirs[:] = [x for x in dirs if x not in ("node_modules", ".git", "dist")]
            for f in files:
                p = os.path.join(base, f)
                nfiles += 1
                try:
                    sz = os.path.getsize(p)
                except OSError:
                    continue
                total_bytes += sz
                if sz > 2_000_000:
                    continue
                try:
                    t = open(p, encoding="utf-8").read()
                except (UnicodeDecodeError, OSError):
                    continue
                for m in RETIRED.finditer(t):
                    rel = os.path.relpath(p, d)
                    dir_hits.setdefault(rel, set()).add(m.group(0).lower())
    rec["files_in_dir"] = nfiles
    rec["dir_bytes"] = total_bytes
    rec["retired_in_dir"] = {k: sorted(v) for k, v in sorted(dir_hits.items())}
    # git facts: use the repo that holds the REAL path
    grepo = None
    for cand in (repo, DOT_REPO, ZAOOS):
        if cand and real.startswith(os.path.realpath(cand) + "/"):
            grepo = cand
            break
    rec["git_repo"] = grepo
    if grepo:
        rel = os.path.relpath(real, os.path.realpath(grepo))
        tracked, _ = git(grepo, "ls-files", "--", rel)
        rec["tracked_files"] = len(tracked.split("\n")) if tracked else 0
        untracked, _ = git(grepo, "ls-files", "--others", "--exclude-standard", "--", rel)
        rec["untracked_files"] = len(untracked.split("\n")) if untracked else 0
        ignored, _ = git(grepo, "ls-files", "--others", "--ignored", "--exclude-standard", "--", rel)
        rec["ignored_files"] = len(ignored.split("\n")) if ignored else 0
        if sf:
            sfrel = os.path.relpath(os.path.realpath(sf), os.path.realpath(grepo))
            t2, _ = git(grepo, "ls-files", "--", sfrel)
            rec["skill_md_tracked"] = bool(t2)
            created, _ = git(grepo, "log", "--diff-filter=A", "--follow", "--format=%cs %h", "--", sfrel)
            rec["skill_md_created"] = created.split("\n")[-1] if created else ""
            last, _ = git(grepo, "log", "-1", "--format=%cs %h", "--", sfrel)
            rec["skill_md_last_change"] = last
        dcreated, _ = git(grepo, "log", "--diff-filter=A", "--format=%cs %h", "--", rel)
        rec["dir_created"] = dcreated.split("\n")[-1] if dcreated else ""
        dlast, _ = git(grepo, "log", "-1", "--format=%cs %h", "--", rel)
        rec["dir_last_change"] = dlast
        ncommits, _ = git(grepo, "rev-list", "--count", "HEAD", "--", rel)
        rec["dir_commits"] = int(ncommits or 0)
    else:
        rec["tracked_files"] = None
    return rec


out = {"dotfiles": [], "zaoos": [], "commands": [], "plugins": []}
out["dotfiles_head"], _ = git(DOT_REPO, "log", "-1", "--format=%cs %h %s")
out["dotfiles_branch"], _ = git(DOT_REPO, "branch", "--show-current")
out["zaoos_head"], _ = git(ZAOOS, "log", "-1", "--format=%cs %h %s")

for name in sorted(os.listdir(DOT)):
    d = os.path.join(DOT, name)
    if os.path.isdir(d) or os.path.islink(d):
        out["dotfiles"].append(record("dotfiles", DOT_REPO, d, name))
    else:
        out["dotfiles"].append({"root": "dotfiles", "dir_name": name, "path": d, "note": "loose file"})

for name in sorted(os.listdir(ZSK)):
    d = os.path.join(ZSK, name)
    if os.path.isdir(d) or os.path.islink(d):
        out["zaoos"].append(record("zaoos", ZAOOS, d, name))
    else:
        out["zaoos"].append({"root": "zaoos", "dir_name": name, "path": d, "note": "loose file"})

# gstack nested skills (vendored), listed once from the ZAOOS copy and the dotfiles copy
for label, base in (("zaoos-gstack", f"{ZSK}/gstack"), ("dotfiles-gstack", f"{DOT}/gstack")):
    if os.path.isdir(base):
        for name in sorted(os.listdir(base)):
            d = os.path.join(base, name)
            if os.path.isdir(d) and skill_file(d):
                out.setdefault(label, []).append(record(label, None, d, name))

# commands
for label, base, repo in (("zaoos-commands", f"{ZAOOS}/.claude/commands", ZAOOS), ("user-commands", f"{HOME}/.claude/commands", None)):
    if not os.path.isdir(base):
        continue
    for base2, dirs, files in os.walk(base):
        for f in sorted(files):
            p = os.path.join(base2, f)
            rec = {"root": label, "path": p, "name": os.path.relpath(p, base), "bytes": os.path.getsize(p)}
            if repo:
                rel = os.path.relpath(p, repo)
                t, _ = git(repo, "ls-files", "--", rel)
                rec["tracked"] = bool(t)
                c, _ = git(repo, "log", "--diff-filter=A", "--format=%cs %h", "--", rel)
                rec["created"] = c.split("\n")[-1] if c else ""
                l, _ = git(repo, "log", "-1", "--format=%cs %h", "--", rel)
                rec["last_change"] = l
            else:
                rec["tracked"] = None
            if f.endswith(".md"):
                fm, has = frontmatter(open(p, encoding="utf-8", errors="replace").read())
                rec["description"] = fm.get("description", "")
            out["commands"].append(rec)

# plugins
ip = json.load(open(f"{HOME}/.claude/plugins/installed_plugins.json"))
for pname, entries in ip["plugins"].items():
    for e in entries:
        path = e["installPath"]
        skills, commands = [], []
        for base, dirs, files in os.walk(path):
            dirs[:] = [x for x in dirs if x not in ("node_modules", ".git")]
            for f in files:
                if f.lower() == "skill.md":
                    skills.append(os.path.relpath(os.path.join(base, f), path))
            if os.path.basename(base) == "commands":
                commands += [f for f in files if f.endswith(".md")]
        lic = [f for f in os.listdir(path) if f.upper().startswith("LICENSE")] if os.path.isdir(path) else []
        out["plugins"].append({"plugin": pname, "version": e.get("version"), "installedAt": e.get("installedAt"),
                               "lastUpdated": e.get("lastUpdated"), "sha": e.get("gitCommitSha"),
                               "path_exists": os.path.isdir(path), "skill_md_count": len(skills),
                               "command_count": len(commands), "license_files": lic,
                               "skill_dirs": sorted(os.path.basename(os.path.dirname(s)) for s in skills)})

json.dump(out, open(f"{OUT}/inventory.json", "w"), indent=1, default=str)
print("dotfiles entries", len(out["dotfiles"]), "zaoos entries", len(out["zaoos"]),
      "zaoos-gstack", len(out.get("zaoos-gstack", [])), "dotfiles-gstack", len(out.get("dotfiles-gstack", [])),
      "commands", len(out["commands"]), "plugins", len(out["plugins"]))
