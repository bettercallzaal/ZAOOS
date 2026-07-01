import { describe, it, expect } from 'vitest';
import { checkFleetLiveness } from '../fleet-health';

describe('checkFleetLiveness', () => {
  it('no alerts when all units active', async () => {
    const alerts = await checkFleetLiveness(['a', 'b'], async () => true);
    expect(alerts).toEqual([]);
  });

  it('one alert listing all down units', async () => {
    const alerts = await checkFleetLiveness(['a', 'b', 'c'], async (u) => u === 'a');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].code).toBe('unit-down');
    expect(alerts[0].message).toContain('b');
    expect(alerts[0].message).toContain('c');
    expect(alerts[0].message).not.toContain('DOWN: a');
  });

  it('treats a throwing checker as down', async () => {
    const alerts = await checkFleetLiveness(['x'], async () => {
      throw new Error('boom');
    });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toContain('x');
  });
});
