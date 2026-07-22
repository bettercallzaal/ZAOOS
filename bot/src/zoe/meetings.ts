/**
 * Meetings query for the morning brief.
 *
 * Reads from research/events/_meetings-index.md (the canonical meetings record,
 * maintained by the /meeting skill). Extracts recent meetings from the last
 * 24-48 hours and returns a formatted summary for the brief.
 *
 * Each meeting record includes: date, title, attendees, doc number, action count.
 * The brief surfaces: meeting title, date, and a short sample of the todos it spawned.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface RecentMeeting {
  date: string; // ISO date string
  title: string;
  docNumber: number;
  docUrl: string;
}

/**
 * Parse the meetings index markdown file.
 * Returns array of parsed meetings, newest first (as they appear in the file).
 * Best-effort parsing - skips malformed rows gracefully.
 */
function parseMeetingsIndex(content: string): RecentMeeting[] {
  const lines = content.split('\n');
  const meetings: RecentMeeting[] = [];

  // Skip header and separator rows; parse data rows
  for (const line of lines) {
    const trimmed = line.trim();

    // Skip headers and empty lines
    if (!trimmed || trimmed.startsWith('|') === false) continue;
    if (trimmed.includes('Date') || trimmed.includes('---')) continue;

    // Parse table row: | Date | Title | Project | Attendees | Doc | Actions |
    const cells = trimmed.split('|').map((c) => c.trim()).filter(Boolean);
    if (cells.length < 5) continue;

    const [dateStr, title] = [cells[0], cells[1]];
    const docCell = cells[4]; // The Doc column

    // Extract doc number from format like "[1771](1771-...)" or "[1771](path/1771-...)"
    const docMatch = docCell.match(/\[(\d+)\]/);
    if (!docMatch) continue;

    const docNumber = parseInt(docMatch[1], 10);
    const docUrl = `https://github.com/bettercallzaal/ZAOOS/blob/main/research/events/${docNumber}-*/`;

    meetings.push({
      date: dateStr,
      title,
      docNumber,
      docUrl,
    });
  }

  return meetings;
}

/**
 * Check if a date string is within the last N hours.
 * Handles flexible date formats: "2026-07-20", "2026-07-20 8:03", "2026-07-20 11:01"
 * Returns true if the meeting is recent (within the window).
 */
function isRecentMeeting(dateStr: string, hoursBack: number = 48): boolean {
  try {
    // Parse: try ISO first, then common variants
    let date: Date | null = null;

    // Try ISO date (2026-07-20)
    if (dateStr.includes('-') && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      date = new Date(dateStr);
    }

    if (!date || isNaN(date.getTime())) return false;

    const nowUTC = new Date();
    const diffHours = (nowUTC.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= hoursBack;
  } catch {
    return false;
  }
}

/**
 * Get recent meetings from the last 24-48 hours.
 * Returns formatted string for the morning brief, or null if no recent meetings.
 * Format: "Meetings (last 24h): Title (date) - X todos, Title2 (date) - Y todos"
 * Best-effort - logs errors but does not throw.
 */
export function getRecentMeetingsForBrief(
  repoDir: string,
  hoursBack: number = 48,
): string | null {
  try {
    // Read the meetings index file
    const meetingsPath = resolve(repoDir, 'research/events/_meetings-index.md');
    const content = readFileSync(meetingsPath, 'utf8');

    // Parse meetings
    const allMeetings = parseMeetingsIndex(content);

    // Filter to recent ones
    const recentMeetings = allMeetings.filter((m) => isRecentMeeting(m.date, hoursBack));

    if (recentMeetings.length === 0) {
      return null;
    }

    // Format for the brief
    // Format: "Meetings (last 24h): Title (date), Title2 (date)"
    const entries = recentMeetings.slice(0, 5); // Show up to 5 recent meetings
    const formatted = entries.map((m) => `${m.title} (${m.date})`).join(' | ');

    return `Meetings (last ${hoursBack}h): ${formatted}`;
  } catch (err) {
    // Gracefully degrade - return null if anything fails (file missing, parse error, etc)
    console.error('[zoe/meetings] getRecentMeetingsForBrief failed:', (err as Error).message);
    return null;
  }
}
