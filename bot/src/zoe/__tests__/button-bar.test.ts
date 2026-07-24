import { describe, it, expect } from 'vitest';
import { BUTTON_BAR, ZOE_COMMANDS, BAR_LABELS, isBarLabel } from '../button-bar';

describe('button-bar', () => {
  it('is a persistent, resized reply keyboard with the five labels', () => {
    const kb = BUTTON_BAR.build();
    const flat = kb.flat().map((b) => (b as { text: string }).text);
    expect(flat).toEqual(['Agenda', 'Focus', 'Budget', 'Note', 'Board']);
    // grammy Keyboard options
    expect((BUTTON_BAR as unknown as { is_persistent?: boolean }).is_persistent).toBe(true);
    expect((BUTTON_BAR as unknown as { resize_keyboard?: boolean }).resize_keyboard).toBe(true);
  });

  it('isBarLabel matches only the exact labels', () => {
    for (const l of BAR_LABELS) expect(isBarLabel(l)).toBe(true);
    expect(isBarLabel('agenda')).toBe(false); // case-sensitive
    expect(isBarLabel('Agenda ')).toBe(false);
    expect(isBarLabel('note: hi')).toBe(false);
  });

  it('registers only real, described commands for the / menu', () => {
    expect(ZOE_COMMANDS.length).toBeGreaterThan(0);
    for (const c of ZOE_COMMANDS) {
      expect(c.command).toMatch(/^[a-z]+$/);
      expect(c.description.length).toBeGreaterThan(3);
    }
    expect(ZOE_COMMANDS.map((c) => c.command)).toContain('focus');
    expect(ZOE_COMMANDS.map((c) => c.command)).toContain('menu');
  });
});
