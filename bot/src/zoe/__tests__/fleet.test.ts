import { describe, it, expect } from 'vitest';
import { FLEET, activeFleet } from '../fleet';

describe('fleet registry', () => {
  it('entry 0 is ZOE with no ICM box (its brain stays PERSONA_DEFAULT)', () => {
    expect(FLEET[0].name).toBe('ZOE');
    expect(FLEET[0].icmBoxId).toBeNull();
  });

  it('activeFleet includes a bot only when its token env var is set', () => {
    const env = { ZOE_BOT_TOKEN: 't0', ZAODEVZ_BOT_TOKEN: 't1' } as unknown as NodeJS.ProcessEnv;
    const names = activeFleet(env).map((b) => b.name);
    expect(names).toContain('ZOE');
    expect(names).toContain('ZAO Devz');
  });

  it('activeFleet skips a bot whose token is missing (no crash)', () => {
    const env = { ZOE_BOT_TOKEN: 't0' } as unknown as NodeJS.ProcessEnv;
    expect(activeFleet(env).map((b) => b.name)).toEqual(['ZOE']);
  });
});
