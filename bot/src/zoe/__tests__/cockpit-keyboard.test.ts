import { describe, it, expect } from 'vitest';
import { buildCockpitKeyboard } from '../button-bar';

describe('buildCockpitKeyboard', () => {
  it('creates an inline keyboard with all 6 operational actions', () => {
    const keyboard = buildCockpitKeyboard(false);
    expect(keyboard).toBeDefined();
    expect(keyboard.inline_keyboard).toHaveLength(3); // 3 rows

    const row1 = keyboard.inline_keyboard[0];
    const row2 = keyboard.inline_keyboard[1];
    const row3 = keyboard.inline_keyboard[2];

    expect(row1[0]).toMatchObject({ text: 'Refresh', callback_data: 'cp:refresh' });
    expect(row1[1]).toMatchObject({ text: 'Needs Me', callback_data: 'cp:needsme' });

    expect(row2[0]).toMatchObject({ text: 'Agenda', callback_data: 'cp:agenda' });
    expect(row2[1]).toMatchObject({ text: 'Board', callback_data: 'cp:board' });

    expect(row3[0]).toMatchObject({ text: 'Pulse', callback_data: 'cp:pulse' });
    expect(row3[1]).toMatchObject({ text: 'Focus', callback_data: 'cp:focus' });
  });

  it('updates the Focus button label to Unfocus when focus mode is active', () => {
    const keyboard = buildCockpitKeyboard(true);
    const row3 = keyboard.inline_keyboard[2];
    expect(row3[1]).toMatchObject({ text: 'Unfocus', callback_data: 'cp:focus' });
  });
});
