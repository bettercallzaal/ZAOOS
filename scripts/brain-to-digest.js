#!/usr/bin/env node
// brain-to-digest.js
// Reads BRAIN/**/*.md and writes a compact synthesis to BRAIN/_meta/DIGEST.md.
// The digest is what ZOE + spawned AO agents load at session start to know
// ZAO's current canonical state — projects, people, open conflicts, freshness.
//
// Zero-dep Node. Runs via `npm run brain:digest`. Output is committed to git
// so the VPS deploy pipeline reads the digest without running Node.
//
// Pattern per doc 462 (Hyperspell company-brain synthesis).

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const BRAIN_DIR = path.join(REPO_ROOT, "BRAIN");
const OUT = path.join(BRAIN_DIR, "_meta", "DIGEST.md");
const NOW_ISO = new Date().toISOString();
const STALE_DAYS = 30;

function readIfExists(p) {
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
}

function listMd(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".md") && f !== "README.md")
    .map(f => path.join(dir, f));
}

// Simple YAML-front-matter parser. Handles scalar + flow-list fields we actually
// use (slug, status, last_confirmed_at, canonical_name, fid). Nested mappings
// are returned raw-string so callers can eyeball them.
function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { fm: {}, body: text };
  const fm = {};
  for (const raw of m[1].split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const kv = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, k, vRaw] = kv;
    let v = vRaw.trim();
    if (v.startsWith("'") && v.endsWith("'")) v = v.slice(1, -1);
    else if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    fm[k] = v;
  }
  return { fm, body: text.slice(m[0].length) };
}

function firstHeadingOrLine(body) {
  const lines = body.split("\n").map(l => l.trim()).filter(Boolean);
  for (const l of lines) {
    if (l.startsWith("# ")) return l.replace(/^#+\s*/, "");
  }
  return (lines[0] || "").replace(/^#+\s*/, "").slice(0, 120);
}

function firstParagraph(body, maxChars = 280) {
  const lines = body.split("\n");
  let started = false;
  const buf = [];
  for (const raw of lines) {
    const l = raw.trim();
    if (!started) {
      if (l.startsWith("#") || l === "") continue;
      started = true;
    }
    if (l === "") break;
    if (l.startsWith("#")) break;
    buf.push(l);
  }
  let s = buf.join(" ").replace(/\s+/g, " ").trim();
  s = s.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
  if (s.length > maxChars) s = s.slice(0, maxChars - 1).replace(/\s+\S*$/, "") + "...";
  return s;
}

function ageInDays(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 86400000);
}

function stalenessTag(days) {
  if (days == null) return "(unknown)";
  if (days <= 7) return "fresh";
  if (days <= STALE_DAYS) return `${days}d`;
  return `STALE (${days}d)`;
}

// --------- Gather ---------

const projectFiles = listMd(path.join(BRAIN_DIR, "projects"));
const peopleFiles = listMd(path.join(BRAIN_DIR, "people"));
const relFiles = listMd(path.join(BRAIN_DIR, "relationships"));
const decisionFiles = listMd(path.join(BRAIN_DIR, "decisions"));

const projects = projectFiles.map(p => {
  const text = fs.readFileSync(p, "utf8");
  const { fm, body } = parseFrontmatter(text);
  return {
    file: path.relative(REPO_ROOT, p),
    slug: fm.slug || path.basename(p, ".md"),
    status: fm.status || "unknown",
    event_date: fm.event_date || null,
    last_confirmed_at: fm.last_confirmed_at || null,
    title: firstHeadingOrLine(body),
    summary: firstParagraph(body),
  };
});

const people = peopleFiles.map(p => {
  const text = fs.readFileSync(p, "utf8");
  const { fm, body } = parseFrontmatter(text);
  return {
    file: path.relative(REPO_ROOT, p),
    fid: fm.fid || null,
    slug: fm.slug || path.basename(p, ".md"),
    canonical_name: fm.canonical_name || firstHeadingOrLine(body),
    last_confirmed_at: fm.last_confirmed_at || null,
    primary_role: firstParagraph(body, 160),
  };
});

const relationships = relFiles.map(p => ({
  file: path.relative(REPO_ROOT, p),
  slug: path.basename(p, ".md"),
}));

const decisions = decisionFiles.map(p => ({
  file: path.relative(REPO_ROOT, p),
  slug: path.basename(p, ".md"),
}));

// Pull open conflicts from _meta/conflicts.md — headings "### " that don't say
// "RESOLVED" anywhere in the block are treated as open.
const conflictsRaw = readIfExists(path.join(BRAIN_DIR, "_meta", "conflicts.md")) || "";
const conflictBlocks = conflictsRaw.split(/\n(?=### )/);
const openConflicts = [];
for (const block of conflictBlocks) {
  if (!block.startsWith("### ")) continue;
  const header = block.split("\n", 1)[0].replace(/^###\s*/, "");
  const resolved = /\bRESOLVED\b/i.test(block) || /\bWINNER:/i.test(block);
  if (!resolved) openConflicts.push(header);
}

// --------- Render ---------

const lines = [];
lines.push("# BRAIN Digest");
lines.push("");
lines.push(`> Auto-generated by \`scripts/brain-to-digest.js\`. Do not hand-edit. Run \`npm run brain:digest\` to refresh.`);
lines.push(`> Generated: ${NOW_ISO}`);
lines.push("");
lines.push("Consumers: ZOE (VPS), spawned AO agents, `/worksession` preflight, any future agent that needs ZAO's canonical state without re-reading the whole research library.");
lines.push("");

lines.push("## Active Projects");
lines.push("");
if (projects.length === 0) {
  lines.push("_(none)_");
} else {
  lines.push("| Slug | Status | Event Date | Freshness | Title |");
  lines.push("|------|--------|-----------|-----------|-------|");
  for (const p of projects.sort((a, b) => (a.event_date || "").localeCompare(b.event_date || ""))) {
    const fresh = stalenessTag(ageInDays(p.last_confirmed_at));
    lines.push(`| \`${p.slug}\` | ${p.status} | ${p.event_date || "-"} | ${fresh} | ${p.title} |`);
  }
  lines.push("");
  for (const p of projects) {
    lines.push(`### ${p.title}`);
    lines.push(`Source: [\`${p.file}\`](../../${p.file})  \nLast confirmed: ${p.last_confirmed_at || "unknown"}  `);
    lines.push("");
    lines.push(p.summary);
    lines.push("");
  }
}

lines.push("## Canonical People");
lines.push("");
if (people.length === 0) {
  lines.push("_(none)_");
} else {
  lines.push("| FID | Slug | Canonical Name | Freshness |");
  lines.push("|-----|------|----------------|-----------|");
  for (const person of people.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const fresh = stalenessTag(ageInDays(person.last_confirmed_at));
    lines.push(`| ${person.fid || "-"} | \`${person.slug}\` | ${person.canonical_name} | ${fresh} |`);
  }
  lines.push("");
}

lines.push("## Open Conflicts");
lines.push("");
if (openConflicts.length === 0) {
  lines.push("_(none — all logged conflicts currently show a WINNER / RESOLVED marker)_");
} else {
  for (const c of openConflicts) {
    lines.push(`- ${c}`);
  }
}
lines.push("");
lines.push("Full log: [`BRAIN/_meta/conflicts.md`](./conflicts.md)");
lines.push("");

if (relationships.length) {
  lines.push("## Relationship Networks");
  lines.push("");
  for (const r of relationships) {
    lines.push(`- [\`${r.slug}\`](../../${r.file})`);
  }
  lines.push("");
}

if (decisions.length) {
  lines.push("## Decisions");
  lines.push("");
  for (const d of decisions) {
    lines.push(`- [\`${d.slug}\`](../../${d.file})`);
  }
  lines.push("");
}

lines.push("## How to use this file");
lines.push("");
lines.push("**Agents:** read this digest at session start. If a fact here contradicts an older research doc or auto-memory, trust the digest (Tier 2+ synthesis beats Tier 3+ raw sources — see [`source_authority.md`](./source_authority.md)).");
lines.push("");
lines.push("**Humans:** open the linked entity file for full context. The digest is a map, not the territory.");
lines.push("");
lines.push(`**Stale threshold:** entries with \`last_confirmed_at\` older than ${STALE_DAYS} days are flagged STALE — run the synthesis Routine or hand-confirm before trusting them.`);
lines.push("");

fs.writeFileSync(OUT, lines.join("\n") + "\n");

console.log(`[brain-to-digest] wrote ${path.relative(REPO_ROOT, OUT)} — ${projects.length} projects, ${people.length} people, ${openConflicts.length} open conflicts.`);
