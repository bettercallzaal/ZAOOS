#!/usr/bin/env node
/**
 * door-check - is this action a two-way door an unattended lane may take, or a
 * one-way door that stops for Zaal? And a written record of the answer.
 *
 * Antigravity's review (2026-09-17) proposed that lanes auto-resolve reversible
 * decisions and escalate only one-way doors. Two things make that auditable:
 *
 *   1. THE LIST IS DATA. Every door, pattern and standing grant is in
 *      doors.json. This file only looks the declared facts up; it holds no
 *      judgement. A door changes by a reviewed edit to the JSON.
 *   2. EVERY VERDICT IS WRITTEN DOWN, before it is returned. One JSONL line per
 *      call: what the lane was about to do, why it thinks it may, what the list
 *      said, and which pattern matched. An autopilot whose reasoning is not
 *      recorded cannot be audited after it gets one wrong. If the line cannot be
 *      written, the verdict is not given (exit 2).
 *
 * The lane declares FACTS, not a conclusion: the commands it will run, the
 * paths it will write, the tools it will call, the recipient if any. An action
 * with no facts is not classifiable and escalates - fail closed.
 *
 *   node scripts/autopilot/door-check.mjs --lane zj \
 *     --summary "open PR for the alarm fix" --why "a PR is reviewable and revertable" \
 *     --command "gh pr create --base main ..." --path bot/src/zoe/repo-improver.ts
 *
 *   --command CMD      a shell command the action runs (repeatable)
 *   --path PATH        a file the action writes (repeatable)
 *   --tool NAME        a tool the action calls, e.g. mcp__claude_ai_Gmail__send_message (repeatable)
 *   --recipient WHO    who an outbound action reaches
 *   --doors FILE       the door list (default: doors.json beside this file)
 *   --log FILE         the decision log (default: $ZAO_DOOR_LOG or ~/.zao/autopilot/door-decisions.jsonl)
 *
 * Exit: 0 two-way door (act, then say so), 3 one-way door (write NEEDS-ZAAL and
 * move on), 2 usage error or the decision could not be recorded.
 */
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXIT = { two_way: 0, one_way: 3, error: 2 };

const re = (pattern) => new RegExp(pattern, 'i');

/** Load and minimally validate the door list. Throws on a malformed file. */
export function loadDoors(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(data.doors) || data.doors.length === 0) throw new Error(`${file}: no doors`);
  for (const d of data.doors) {
    if (!d.id || !d.label) throw new Error(`${file}: a door has no id or label`);
    for (const k of ['tools', 'commands', 'paths', 'unless_commands']) {
      for (const p of d[k] ?? []) re(p);
    }
  }
  data.grants = data.grants ?? [];
  return data;
}

function firstMatch(patterns, values, kind) {
  for (const pattern of patterns ?? []) {
    for (const value of values) {
      if (re(pattern).test(value)) return { kind, pattern, value };
    }
  }
  return null;
}

/**
 * Classify declared facts against a door list. Pure.
 * Returns { verdict: 'two_way' | 'one_way', reason, doors: [{id, match}], grant }.
 */
export function classify(facts, list) {
  // Each segment of a compound command is judged alone, so an exemption for
  // one segment (rm -rf "$TMPDIR/x") cannot cover the next (&& rm -rf ~/x).
  const commands = (facts.commands ?? []).flatMap((c) =>
    c.split(/\s*(?:&&|\|\||;|\||\n)\s*/).filter((segment) => segment.trim()),
  );
  const paths = facts.paths ?? [];
  const tools = facts.tools ?? [];
  if (commands.length + paths.length + tools.length === 0) {
    return { verdict: 'one_way', reason: 'no facts declared: nothing to classify, so it stops', doors: [], grant: null };
  }

  const hits = [];
  for (const door of list.doors) {
    const cmds = commands.filter((c) => !(door.unless_commands ?? []).some((u) => re(u).test(c)));
    const byTool = tools.filter((t) => (door.tools ?? []).some((p) => re(p).test(t)));
    const byOther = cmds.length + paths.length === 0 ? null : firstMatch(door.commands, cmds, 'command') ?? firstMatch(door.paths, paths, 'path');
    const match = firstMatch(door.tools, tools, 'tool') ?? byOther;
    if (match) hits.push({ id: door.id, match, byTool, byOther });
  }
  if (hits.length === 0) {
    return { verdict: 'two_way', reason: 'no door in the list matches the declared facts', doors: [], grant: null };
  }

  // A standing grant opens one door, and only when the door was opened by tools
  // alone, every one of those tools is in the grant, and the recipient matches.
  const covering = (h) =>
    list.grants.find(
      (g) =>
        g.door === h.id &&
        !h.byOther &&
        typeof facts.recipient === 'string' &&
        re(g.recipient).test(facts.recipient) &&
        h.byTool.every((t) => (g.tools ?? []).some((p) => re(p).test(t))),
    ) ?? null;
  const report = (h) => ({ id: h.id, match: h.match });
  const open = hits.filter((h) => !covering(h));
  if (open.length === 0) {
    const grants = [...new Set(hits.map((h) => covering(h).decision))];
    return {
      verdict: 'two_way',
      reason: `door ${hits.map((h) => h.id).join(', ')} opened by standing grant ${grants.join(', ')}`,
      doors: hits.map(report),
      grant: covering(hits[0]),
    };
  }
  return {
    verdict: 'one_way',
    reason: `one-way door: ${open.map((h) => `${h.id} (${h.match.kind} ${JSON.stringify(h.match.value)} matched /${h.match.pattern}/)`).join('; ')}`,
    doors: open.map(report),
    grant: null,
  };
}

/** The log line for one decision. Pure apart from the clock passed in. */
export function decisionLine({ lane, summary, why, facts, result, now }) {
  return JSON.stringify({
    ts: now.toISOString(),
    lane,
    summary,
    why,
    verdict: result.verdict,
    reason: result.reason,
    doors: result.doors,
    grant: result.grant ? result.grant.decision : null,
    facts,
  });
}

export function parseArgs(argv) {
  const out = { commands: [], paths: [], tools: [] };
  const many = { '--command': 'commands', '--path': 'paths', '--tool': 'tools' };
  const one = { '--lane': 'lane', '--summary': 'summary', '--why': 'why', '--recipient': 'recipient', '--doors': 'doors', '--log': 'log' };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (!(flag in many) && !(flag in one)) throw new Error(`unknown argument ${flag}`);
    if (value === undefined) throw new Error(`${flag} needs a value`);
    if (flag in many) out[many[flag]].push(value);
    else out[one[flag]] = value;
    i++;
  }
  for (const k of ['lane', 'summary', 'why']) {
    if (!out[k]?.trim()) throw new Error(`--${k} is required: a decision without it cannot be audited`);
  }
  return out;
}

export function main(argv, env = process.env, now = new Date()) {
  let args;
  let list;
  try {
    args = parseArgs(argv);
    const here = dirname(fileURLToPath(import.meta.url));
    list = loadDoors(args.doors ?? join(here, 'doors.json'));
  } catch (err) {
    process.stderr.write(`door-check: ${err.message}\n`);
    return EXIT.error;
  }
  const facts = { commands: args.commands, paths: args.paths, tools: args.tools, recipient: args.recipient ?? null };
  const result = classify(facts, list);
  const log = args.log ?? env.ZAO_DOOR_LOG ?? join(homedir(), '.zao', 'autopilot', 'door-decisions.jsonl');
  try {
    mkdirSync(dirname(log), { recursive: true });
    appendFileSync(log, `${decisionLine({ lane: args.lane, summary: args.summary, why: args.why, facts, result, now })}\n`);
  } catch (err) {
    process.stderr.write(`door-check: could not record the decision in ${log} (${err.message}); no verdict given\n`);
    return EXIT.error;
  }
  const word = result.verdict === 'two_way' ? 'TWO-WAY: act, then say so' : 'ONE-WAY: stop, write NEEDS-ZAAL';
  process.stdout.write(`${word} - ${result.reason}\n`);
  return EXIT[result.verdict];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main(process.argv.slice(2));
}
