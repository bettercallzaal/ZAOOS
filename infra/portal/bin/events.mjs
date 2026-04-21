// Unified append-only event log. One sink for bot.mjs / random_tip.py /
// spawn-server.js / session-watcher.mjs per doc 465 Part 2.
//
// Design: dependency-free, sync writes, one JSON object per line. Readers
// (daily digest, /activity slash command) tail the file and group by event.
// Rotation is size-based: file renamed to events-YYYYMMDD.jsonl.gz when it
// exceeds MAX_BYTES. Rotation is lazy — the writer triggers it on first
// write past the threshold.

import { appendFileSync, mkdirSync, statSync, renameSync, existsSync } from "fs";
import { randomBytes } from "crypto";
import { execSync } from "child_process";

const EVENTS_DIR = process.env.EVENTS_DIR || (process.env.HOME + "/zoe-bot");
const EVENTS_FILE = EVENTS_DIR + "/events.jsonl";
const MAX_BYTES = 50 * 1024 * 1024;

export function traceId() {
  return randomBytes(3).toString("hex");
}

function ensureDir() {
  try { mkdirSync(EVENTS_DIR, { recursive: true }); } catch {}
}

function maybeRotate() {
  if (!existsSync(EVENTS_FILE)) return;
  let size = 0;
  try { size = statSync(EVENTS_FILE).size; } catch { return; }
  if (size < MAX_BYTES) return;
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rotated = EVENTS_DIR + "/events-" + stamp + "-" + Date.now() + ".jsonl";
  try {
    renameSync(EVENTS_FILE, rotated);
    // Best-effort gzip; don't fail emit if gzip binary missing.
    try { execSync("gzip -q " + JSON.stringify(rotated), { timeout: 10000 }); } catch {}
  } catch (e) {
    console.error("events rotate error:", e.message);
  }
}

// emit({ source, event, ...fields })
// source: "bot" | "spawn" | "pings" | "watcher" | etc. REQUIRED.
// event: short event name (inbound, outbound, slash_handled, claude_call, ...). REQUIRED.
// trace_id: optional correlation id; generate via traceId() at request entry.
// Never throws — swallows all IO errors so a broken log never breaks the caller.
export function emit(obj) {
  if (!obj || typeof obj !== "object") return;
  const enriched = {
    ts: new Date().toISOString(),
    pid: process.pid,
    ...obj,
  };
  const line = JSON.stringify(enriched) + "\n";
  try {
    ensureDir();
    maybeRotate();
    appendFileSync(EVENTS_FILE, line);
  } catch (e) {
    console.error("events.emit error:", e.message);
  }
}

// Shortcut for timing a block:
//   const t = startTimer();
//   ... work ...
//   emit({ source: "bot", event: "claude_call", duration_ms: t.ms(), ... });
export function startTimer() {
  const started = Date.now();
  return { ms: () => Date.now() - started };
}
