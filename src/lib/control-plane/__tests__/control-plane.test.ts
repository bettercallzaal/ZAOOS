import { describe, it, expect } from 'vitest';
import { ControlPlane, ControlPlaneError } from '../control-plane';
import type { OrganRegistration, HealthReport } from '../types';

const T0 = '2026-07-24T00:00:00.000Z';
function at(offsetMs: number): string {
  return new Date(new Date(T0).getTime() + offsetMs).toISOString();
}
function health(status: HealthReport['status'], m: Record<string, number> = {}): HealthReport {
  return { status, metrics: m, reportedAt: T0 };
}
function organ(over: Partial<OrganRegistration> = {}): OrganRegistration {
  return {
    organId: 'eyes',
    name: 'Eyes',
    version: '1.0.0',
    layer: 'core',
    capabilities: [{ name: 'perceive.github', version: '1.0.0', maxConcurrency: 4 }],
    dependencies: [],
    endpoints: [{ name: 'observe', address: 'internal:eyes', protocol: 'internal' }],
    secrets: [{ key: 'GITHUB_TOKEN', source: 'env' }],
    health: health('healthy'),
    ...over,
  };
}

describe('ControlPlane registration', () => {
  it('registers an organ and lists it with effective status', () => {
    const cp = new ControlPlane({ now: () => T0 });
    cp.register(organ());
    const list = cp.list();
    expect(list).toHaveLength(1);
    expect(list[0].effectiveStatus).toBe('healthy');
  });

  it('rejects a bad layer', () => {
    const cp = new ControlPlane({ now: () => T0 });
    expect(() => cp.register(organ({ layer: 'nowhere' as never }))).toThrow(/layer/);
  });

  it('REJECTS a secret that is not a reference - the plane never holds values', () => {
    const cp = new ControlPlane({ now: () => T0 });
    expect(() => cp.register(organ({ secrets: [{ key: 'GITHUB_TOKEN', source: 'inline' as never }] }))).toThrow(/reference/);
  });

  it('only exposes secret REFERENCES, never values', () => {
    const cp = new ControlPlane({ now: () => T0 });
    cp.register(organ());
    const refs = cp.secretRefs('eyes');
    expect(refs[0]).toEqual({ key: 'GITHUB_TOKEN', source: 'env' });
    expect(JSON.stringify(refs)).not.toMatch(/value/i); // structurally impossible to carry a value
  });
});

describe('heartbeat + staleness (liveness)', () => {
  it('a heartbeat refreshes health', () => {
    const cp = new ControlPlane({ now: () => T0 });
    cp.register(organ());
    expect(cp.heartbeat('eyes', health('degraded', { errorRate: 0.3 }))).toBe(true);
    expect(cp.get('eyes')?.health.status).toBe('degraded');
  });

  it('heartbeat on an unknown organ returns false', () => {
    const cp = new ControlPlane({ now: () => T0 });
    expect(cp.heartbeat('ghost', health('healthy'))).toBe(false);
  });

  it('an organ that stops heartbeating goes UNKNOWN after the TTL', () => {
    let now = T0;
    const cp = new ControlPlane({ livenessTtlMs: 90_000, now: () => now });
    cp.register(organ());
    now = at(120_000); // 2 min later, no heartbeat
    expect(cp.list()[0].effectiveStatus).toBe('unknown');
    const wentStale = cp.reapStale();
    expect(wentStale).toEqual(['eyes']);
  });
});

describe('capability registry + discovery', () => {
  it('lists capabilities and their providers', () => {
    const cp = new ControlPlane({ now: () => T0 });
    cp.register(organ({ organId: 'eyes', capabilities: [{ name: 'perceive.github', version: '1.0.0' }] }));
    cp.register(organ({ organId: 'ears', name: 'Ears', capabilities: [{ name: 'perceive.github', version: '2.0.0' }], endpoints: [], secrets: [] }));
    const caps = cp.capabilities();
    const gh = caps.find((c) => c.name === 'perceive.github')!;
    expect(gh.providers.map((p) => p.organId).sort()).toEqual(['ears', 'eyes']);
  });

  it('discover returns usable providers, healthy first, excludes failing/unknown', () => {
    const cp = new ControlPlane({ now: () => T0 });
    cp.register(organ({ organId: 'eyes', health: health('degraded') }));
    cp.register(organ({ organId: 'ears', name: 'Ears', health: health('healthy'), capabilities: [{ name: 'perceive.github', version: '1' }], endpoints: [], secrets: [] }));
    cp.register(organ({ organId: 'dead', name: 'Dead', health: health('failing'), capabilities: [{ name: 'perceive.github', version: '1' }], endpoints: [], secrets: [] }));
    const providers = cp.discover('perceive.github');
    expect(providers.map((p) => p.organId)).toEqual(['ears', 'eyes']); // healthy before degraded; failing excluded
  });
});

describe('dependencies + snapshot', () => {
  it('reports unmet dependencies (missing or unusable)', () => {
    const cp = new ControlPlane({ now: () => T0 });
    cp.register(organ({ organId: 'brain', name: 'Brain', dependencies: ['spine', 'memory'], capabilities: [] }));
    cp.register(organ({ organId: 'spine', name: 'Spine', health: health('healthy'), capabilities: [], endpoints: [], secrets: [] }));
    // memory not registered; spine healthy -> only memory is unmet
    expect(cp.unmetDependencies('brain')).toEqual(['memory']);
  });

  it('version registry maps organId -> version', () => {
    const cp = new ControlPlane({ now: () => T0 });
    cp.register(organ({ organId: 'eyes', version: '1.2.3' }));
    expect(cp.versions().eyes).toBe('1.2.3');
  });

  it('snapshot answers what exists / healthy / degraded / capabilities', () => {
    const cp = new ControlPlane({ now: () => T0 });
    cp.register(organ({ organId: 'eyes', health: health('healthy') }));
    cp.register(organ({ organId: 'ears', name: 'Ears', health: health('failing'), capabilities: [], endpoints: [], secrets: [] }));
    const s = cp.snapshot();
    expect(s.total).toBe(2);
    expect(s.healthy).toBe(1);
    expect(s.degraded).toBe(1);
  });
});
