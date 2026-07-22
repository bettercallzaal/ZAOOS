/**
 * Tests for bot/src/zoe/meetings.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { getRecentMeetingsForBrief } from '../meetings';

describe('meetings', () => {
  let testDir: string;
  let meetingsPath: string;

  beforeAll(() => {
    // Create a temporary directory structure for testing
    testDir = resolve(tmpdir(), `zoe-meetings-test-${Date.now()}`);
    const researchDir = resolve(testDir, 'research', 'events');
    mkdirSync(researchDir, { recursive: true });
    meetingsPath = resolve(researchDir, '_meetings-index.md');
  });

  afterAll(() => {
    // Clean up temporary directory
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should return null when meetings index does not exist', () => {
    const result = getRecentMeetingsForBrief(testDir, 48);
    expect(result).toBeNull();
  });

  it('should return null when no meetings in the window', () => {
    // Create a meetings index with only old meetings (>48h ago)
    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const content = `# Meetings Index

| Date | Title | Project | Attendees | Doc | Actions |
|------|-------|---------|-----------|-----|---------|
| ${oldDate} | Old Meeting | Project A | Attendees | [1234](1234-old-meeting/) | 3 |
`;
    writeFileSync(meetingsPath, content);

    const result = getRecentMeetingsForBrief(testDir, 48);
    expect(result).toBeNull();
  });

  it('should parse and return recent meetings', () => {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const content = `# Meetings Index

| Date | Title | Project | Attendees | Doc | Actions |
|------|-------|---------|-----------|-----|---------|
| ${today} | Latest Meeting | Project A | Zaal, Alice | [1771](1771-latest-meeting/) | 5 |
| ${yesterday} | Yesterday Meeting | Project B | Zaal, Bob | [1770](1770-yesterday-meeting/) | 3 |
`;
    writeFileSync(meetingsPath, content);

    const result = getRecentMeetingsForBrief(testDir, 48);
    expect(result).not.toBeNull();
    expect(result).toContain('Latest Meeting');
    expect(result).toContain('Yesterday Meeting');
    expect(result).toContain(today);
    expect(result).toContain(yesterday);
  });

  it('should handle dates with times', () => {
    const today = new Date().toISOString().slice(0, 10);

    const content = `# Meetings Index

| Date | Title | Project | Attendees | Doc | Actions |
|------|-------|---------|-----------|-----|---------|
| ${today} 8:03 | Timed Meeting | Project A | Zaal | [1771](1771-timed-meeting/) | 2 |
`;
    writeFileSync(meetingsPath, content);

    const result = getRecentMeetingsForBrief(testDir, 48);
    expect(result).not.toBeNull();
    expect(result).toContain('Timed Meeting');
  });

  it('should skip malformed rows', () => {
    const today = new Date().toISOString().slice(0, 10);

    const content = `# Meetings Index

| Date | Title | Project | Attendees | Doc | Actions |
|------|-------|---------|-----------|-----|---------|
| ${today} | Valid Meeting | Project A | Zaal | [1771](1771-valid/) | 2 |
| ${today} | Malformed | No doc column | Zaal |
| ${today} | Another Valid | Project B | Zaal | [1770](1770-valid2/) | 1 |
`;
    writeFileSync(meetingsPath, content);

    const result = getRecentMeetingsForBrief(testDir, 48);
    expect(result).not.toBeNull();
    expect(result).toContain('Valid Meeting');
    expect(result).toContain('Another Valid');
    expect(result).not.toContain('Malformed');
  });

  it('should limit output to 5 recent meetings', () => {
    const today = new Date().toISOString().slice(0, 10);

    let rows = '| Date | Title | Project | Attendees | Doc | Actions |\n';
    rows += '|------|-------|---------|-----------|-----|----------|\n';

    for (let i = 1; i <= 10; i++) {
      rows += `| ${today} | Meeting ${i} | Project | Zaal | [${1771 - i}](${1771 - i}-meeting/) | 1 |\n`;
    }

    const content = `# Meetings Index\n\n${rows}`;
    writeFileSync(meetingsPath, content);

    const result = getRecentMeetingsForBrief(testDir, 48);
    expect(result).not.toBeNull();

    // Count how many meetings are in the result
    const meetingCount = (result?.match(/Meeting \d/g) || []).length;
    expect(meetingCount).toBeLessThanOrEqual(5);
    expect(result).toContain('Meeting 1');
  });

  it('should format as expected for the brief', () => {
    const today = new Date().toISOString().slice(0, 10);

    const content = `# Meetings Index

| Date | Title | Project | Attendees | Doc | Actions |
|------|-------|---------|-----------|-----|---------|
| ${today} | William Meeting | ZAO | Zaal, William | [1771](1771-william/) | 3 |
`;
    writeFileSync(meetingsPath, content);

    const result = getRecentMeetingsForBrief(testDir, 48);
    expect(result).not.toBeNull();
    expect(result).toMatch(/Meetings \(last \d+h\):/);
    expect(result).toContain('William Meeting');
  });

  it('should gracefully handle date parse errors', () => {
    const content = `# Meetings Index

| Date | Title | Project | Attendees | Doc | Actions |
|------|-------|---------|-----------|-----|---------|
| invalid-date | Bad Date Meeting | Project | Zaal | [1771](1771-bad/) | 1 |
`;
    writeFileSync(meetingsPath, content);

    const result = getRecentMeetingsForBrief(testDir, 48);
    // Should return null since no valid dates
    expect(result).toBeNull();
  });
});
