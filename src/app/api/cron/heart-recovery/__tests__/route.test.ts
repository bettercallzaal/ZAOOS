import { describe, it, expect, vi, beforeEach } from 'vitest';

const reclaimExpiredLeases = vi.fn();
const reclaimDeadInstanceRuns = vi.fn();

vi.mock('@/lib/heart', () => ({
  reclaimExpiredLeases: (...a: unknown[]) => reclaimExpiredLeases(...a),
  reclaimDeadInstanceRuns: (...a: unknown[]) => reclaimDeadInstanceRuns(...a),
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

import { GET } from '../route';

function req(auth?: string): Request {
  return new Request('https://x/api/cron/heart-recovery', {
    headers: auth ? { authorization: auth } : {},
  });
}

describe('GET /api/cron/heart-recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'secret123';
    reclaimExpiredLeases.mockResolvedValue({ reclaimedCount: 0, reclaimedIds: [], errors: [] });
    reclaimDeadInstanceRuns.mockResolvedValue({ deadInstanceIds: [], reclaimedCount: 0, reclaimedIds: [], errors: [] });
  });

  it('rejects a missing/wrong bearer token with 401', async () => {
    const res = await GET(req('Bearer wrong') as never);
    expect(res.status).toBe(401);
    expect(reclaimExpiredLeases).not.toHaveBeenCalled();
  });

  it('500s when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(req('Bearer secret123') as never);
    expect(res.status).toBe(500);
  });

  it('runs BOTH recovery passes and returns their counts', async () => {
    reclaimExpiredLeases.mockResolvedValue({ reclaimedCount: 2, reclaimedIds: ['a', 'b'], errors: [] });
    reclaimDeadInstanceRuns.mockResolvedValue({ deadInstanceIds: ['inst-x'], reclaimedCount: 3, reclaimedIds: ['c', 'd', 'e'], errors: [] });
    const res = await GET(req('Bearer secret123') as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(reclaimExpiredLeases).toHaveBeenCalledOnce();
    expect(reclaimDeadInstanceRuns).toHaveBeenCalledOnce();
    expect(body.expired_leases_reclaimed).toBe(2);
    expect(body.dead_instance_runs_reclaimed).toBe(3);
    expect(body.dead_instances).toBe(1);
  });

  it('surfaces reclaim errors without failing the request', async () => {
    reclaimDeadInstanceRuns.mockResolvedValue({ deadInstanceIds: [], reclaimedCount: 0, reclaimedIds: [], errors: [{ id: 'x', error: 'db down' }] });
    const res = await GET(req('Bearer secret123') as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.errors).toContain('db down');
  });

  it('500s if a recovery pass throws', async () => {
    reclaimExpiredLeases.mockRejectedValue(new Error('boom'));
    const res = await GET(req('Bearer secret123') as never);
    expect(res.status).toBe(500);
  });
});
