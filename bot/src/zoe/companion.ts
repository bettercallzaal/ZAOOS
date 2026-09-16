/**
 * companion.ts - ZOE active companion engine: situational estate awareness,
 * time-of-day rhythms, ZAOstock countdown, and proactive companion check-ins.
 *
 * Replaces static generic inactivity pings with an active companion pulse
 * grounded in live estate reality (BLACKBOARD.md and board-snapshot.json).
 *
 * Rules: zero emojis, zero em dashes, house spelling, pure date math.
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { ZOE_PATHS } from "./memory";
import { readLaneSnapshot } from "./lanes-board";
import type { Candidate } from "./proactive";

export type TimeOfDayRhythm = "morning-kickoff" | "midday-flow" | "evening-reflection" | "night-quiet";

export interface ActiveLaneInfo {
  name: string;
  state: string;
  details?: string;
}

export interface EstatePulse {
  now: number;
  timeOfDay: TimeOfDayRhythm;
  timeString: string;
  zaostockCountdownDays: number;
  activeLanes: ActiveLaneInfo[];
  blockers: string[];
  waitingCount: number;
  source: "blackboard" | "snapshot" | "fallback";
}

const ZAOSTOCK_TARGET_DATE = "2026-10-03T00:00:00-04:00";
const lastSeenPath = () => join(ZOE_PATHS.home, "last-seen.txt");
const seenFilePath = () => join(ZOE_PATHS.home, "events-seen.json");
const COMPANION_INACTIVITY_HOURS = 3;

/**
 * Determine time-of-day rhythm based on America/New_York local time.
 */
export function getTimeOfDayRhythm(nowDate: Date = new Date()): TimeOfDayRhythm {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    hour12: false,
  }).format(nowDate);
  const hour = Number.parseInt(hourStr, 10);

  if (hour >= 6 && hour < 12) return "morning-kickoff";
  if (hour >= 12 && hour < 18) return "midday-flow";
  if (hour >= 18 && hour < 24) return "evening-reflection";
  return "night-quiet";
}

/**
 * Calculate days remaining until ZAOstock 2026 (October 3, 2026).
 */
export function getDaysUntilZaostock(nowDate: Date = new Date()): number {
  const targetMs = Date.parse(ZAOSTOCK_TARGET_DATE);
  const diffMs = targetMs - nowDate.getTime();
  const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return Math.max(0, diffDays);
}

/**
 * Parse BLACKBOARD.md content to extract active lanes, blockers, and waiting count.
 */
export function parseBlackboardPulse(content: string): {
  activeLanes: ActiveLaneInfo[];
  blockers: string[];
  waitingCount: number;
} {
  const activeLanes: ActiveLaneInfo[] = [];
  const blockers: string[] = [];
  let waitingCount = 0;

  const lines = content.split("\n");
  let currentSection = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      currentSection = trimmed.slice(3).trim().toUpperCase();
      continue;
    }

    if (currentSection.includes("WORK PACKETS")) {
      if (trimmed.startsWith("|") && !trimmed.startsWith("|---") && !trimmed.includes("Lane | What is claimed")) {
        const parts = trimmed.split("|").map((p) => p.trim()).filter(Boolean);
        if (parts.length >= 1) {
          const rawLane = parts[0];
          const cleanName = rawLane.split("(")[0].trim();
          const details = parts[1] ?? "";
          if (cleanName && cleanName.length > 0) {
            let state = "active";
            if (details.includes("PARKED") || details.includes("IDLE")) state = "parked";
            else if (details.includes("BLOCKED")) state = "blocked";
            else if (details.includes("WORKING")) state = "working";
            activeLanes.push({ name: cleanName, state, details: details.slice(0, 80) });
          }
        }
      }
    } else if (currentSection.includes("BLOCKERS")) {
      if (trimmed.startsWith("- ")) {
        const item = trimmed.slice(2).trim();
        if (item) blockers.push(item);
      }
    } else if (currentSection.includes("WAITING FOR ZAAL") || currentSection.includes("THE LIST")) {
      if (trimmed.startsWith("- ") || (trimmed.startsWith("|") && !trimmed.startsWith("|---"))) {
        waitingCount++;
      }
    }
  }

  return { activeLanes, blockers, waitingCount };
}

/**
 * Resolve the path to BLACKBOARD.md across typical environment locations.
 */
export async function findBlackboardPath(customVaultDir?: string): Promise<string | null> {
  const candidates = [
    customVaultDir ? join(customVaultDir, "BLACKBOARD.md") : null,
    process.env.ZAO_VAULT_DIR ? join(process.env.ZAO_VAULT_DIR, "BLACKBOARD.md") : null,
    "/Users/zaalpanthaki/zao-vault/BLACKBOARD.md",
    join(homedir(), "zao-vault", "BLACKBOARD.md"),
    join(homedir(), "Documents", "zao-vault", "BLACKBOARD.md"),
  ].filter((p): p is string => Boolean(p));

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // not found, try next
    }
  }
  return null;
}

/**
 * Assemble real-time estate pulse from BLACKBOARD.md or fallback snapshot.
 */
export async function getCompanionPulse(
  now: number = Date.now(),
  customVaultDir?: string,
): Promise<EstatePulse> {
  const nowDate = new Date(now);
  const timeOfDay = getTimeOfDayRhythm(nowDate);
  const zaostockCountdownDays = getDaysUntilZaostock(nowDate);
  const timeString = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(nowDate);

  const bbPath = await findBlackboardPath(customVaultDir);
  if (bbPath) {
    try {
      const content = await fs.readFile(bbPath, "utf8");
      const { activeLanes, blockers, waitingCount } = parseBlackboardPulse(content);
      return {
        now,
        timeOfDay,
        timeString,
        zaostockCountdownDays,
        activeLanes,
        blockers,
        waitingCount,
        source: "blackboard",
      };
    } catch {
      // fall through to snapshot
    }
  }

  // Fallback to local snapshot
  const snap = await readLaneSnapshot();
  if (snap && Array.isArray(snap.rows)) {
    const activeLanes: ActiveLaneInfo[] = snap.rows
      .filter((r) => r.state === "working" || r.state === "waiting")
      .map((r) => ({
        name: r.title || r.repo,
        state: r.state,
        details: r.question ? r.question.slice(0, 80) : undefined,
      }));
    const blockers: string[] = snap.rows
      .filter((r) => r.critical || r.state === "ctx-critical" || r.state === "choice-prompt" || r.state === "asked-question")
      .map((r) => `${r.title || r.repo}: ${r.question || r.state}`);

    return {
      now,
      timeOfDay,
      timeString,
      zaostockCountdownDays,
      activeLanes,
      blockers,
      waitingCount: blockers.length,
      source: "snapshot",
    };
  }

  // Pure fallback
  return {
    now,
    timeOfDay,
    timeString,
    zaostockCountdownDays,
    activeLanes: [],
    blockers: [],
    waitingCount: 0,
    source: "fallback",
  };
}

/**
 * Format companion overview text for Telegram command (/companion) and system prompts.
 * Strictly zero emojis, zero em dashes.
 */
export function renderCompanionOverview(pulse: EstatePulse): string {
  const lines: string[] = [];
  lines.push(
    `ZOE Companion Pulse: ${pulse.zaostockCountdownDays} days until ZAOstock (Oct 3, 2026). Rhythm: ${pulse.timeOfDay} (${pulse.timeString} ET).`,
  );

  if (pulse.activeLanes.length > 0) {
    lines.push("", `ACTIVE LANES (${pulse.activeLanes.length}):`);
    for (const lane of pulse.activeLanes.slice(0, 8)) {
      lines.push(`- ${lane.name} [${lane.state}]${lane.details ? ": " + lane.details : ""}`);
    }
  } else {
    lines.push("", "ACTIVE LANES: None recorded in live view.");
  }

  if (pulse.blockers.length > 0) {
    lines.push("", `BLOCKERS / WAITING ON ZAAL (${pulse.blockers.length}):`);
    for (const b of pulse.blockers.slice(0, 6)) {
      lines.push(`- ${b}`);
    }
  } else if (pulse.waitingCount > 0) {
    lines.push("", `WAITING ON ZAAL (${pulse.waitingCount} items): Check BLACKBOARD.md THE list.`);
  } else {
    lines.push("", "BLOCKERS / WAITING ON ZAAL: Clean. No blocking items.");
  }

  lines.push("", "SUGGESTED NEXT ACTIONS:");
  if (pulse.blockers.length > 0) {
    lines.push("- Review and unblock top item in WAITING FOR ZAAL.");
  }
  if (pulse.zaostockCountdownDays <= 21) {
    lines.push(`- Prioritize ZAOstock deliverables (${pulse.zaostockCountdownDays} days out).`);
  }
  lines.push("- Delegate autonomous research or brief generation via DM.");

  return lines.join("\n");
}

/**
 * Generate context-aware companion check-in candidate.
 */
export async function generateCompanionCheckin(
  now: number = Date.now(),
  customVaultDir?: string,
): Promise<Candidate | null> {
  // Waking hours: 9am-9pm EDT (UTC-4 summer) = 13:00-01:00 UTC
  const hourUtc = new Date(now).getUTCHours();
  if (hourUtc < 13 && hourUtc >= 1) return null; // not daytime EDT

  let lastSeen: number;
  try {
    const raw = await fs.readFile(lastSeenPath(), "utf8");
    lastSeen = Number(raw.trim());
    if (!Number.isFinite(lastSeen)) return null;
  } catch {
    return null;
  }

  const silentHrs = (now - lastSeen) / 3_600_000;
  if (silentHrs < COMPANION_INACTIVITY_HOURS) return null;

  // Once per day dedup
  let seen: Record<string, number> = {};
  try {
    const rawSeen = await fs.readFile(seenFilePath(), "utf8");
    seen = JSON.parse(rawSeen) as Record<string, number>;
  } catch {
    seen = {};
  }

  const today = new Date(now).toISOString().slice(0, 10);
  const key = `companion-checkin:${today}`;
  if (seen[key]) return null;

  const pulse = await getCompanionPulse(now, customVaultDir);
  const activeCount = pulse.activeLanes.length;
  const blockerCount = pulse.blockers.length + pulse.waitingCount;

  const parts: string[] = [
    `${pulse.zaostockCountdownDays} days until ZAOstock.`,
  ];
  if (activeCount > 0) {
    parts.push(`${activeCount} lane${activeCount === 1 ? "" : "s"} active.`);
  }
  if (blockerCount > 0) {
    parts.push(`${blockerCount} item${blockerCount === 1 ? "" : "s"} in waiting/blockers.`);
  }
  parts.push("Everything on track, or what should we push forward next?");

  return {
    kind: "companion-pulse",
    score: 0.65,
    tier: "standard",
    dedupKey: key,
    message: parts.join(" "),
  };
}
