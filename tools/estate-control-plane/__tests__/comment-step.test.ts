import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The "Upsert sticky PR comment" step in .github/workflows/estate-health.yml is
// inline JavaScript run by actions/github-script. This test lifts that script
// out of the workflow file and runs it against fakes, so the rule it carries
// is tested where it lives: on a fork PR a 403 from the comment API is a
// warning plus a job summary, and everything else still fails the step.

const WORKFLOW = join(process.cwd(), '.github/workflows/estate-health.yml');
const workflow = readFileSync(WORKFLOW, 'utf8');

function stepBlock(name: string): string {
  const lines = workflow.split('\n');
  const start = lines.findIndex((l) => l.trim() === `- name: ${name}`);
  if (start < 0) throw new Error(`step not found: ${name}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s*- name: /.test(lines[i]) || /^\s{2}\S/.test(lines[i])) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function stepScript(name: string): string {
  const lines = stepBlock(name).split('\n');
  const at = lines.findIndex((l) => l.trim() === 'script: |');
  if (at < 0) throw new Error(`no inline script in step: ${name}`);
  const body = lines.slice(at + 1).filter((l) => l.trim() !== '');
  if (body.length === 0) throw new Error('empty script');
  return body.join('\n');
}

const script = stepScript('Upsert sticky PR comment');
const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;

type Opts = {
  headRepo: string | null;
  failWith?: { status: number; message: string };
  failOn?: 'list' | 'create' | 'update';
  existing?: boolean;
};

async function run(opts: Opts) {
  const calls: string[] = [];
  const warnings: string[] = [];
  const summary: string[] = [];
  const fail = (which: string) => {
    if (opts.failWith && (opts.failOn ?? 'list') === which) {
      throw Object.assign(new Error(opts.failWith.message), { status: opts.failWith.status });
    }
  };
  const github = {
    rest: {
      issues: {
        listComments: async () => {
          calls.push('list');
          fail('list');
          return {
            data: opts.existing ? [{ id: 7, body: 'old <!-- estate-control-plane -->' }] : [],
          };
        },
        updateComment: async () => {
          calls.push('update');
          fail('update');
        },
        createComment: async () => {
          calls.push('create');
          fail('create');
        },
      },
    },
  };
  const context = {
    repo: { owner: 'bettercallzaal', repo: 'ZAOOS' },
    issue: { number: 1 },
    payload: {
      pull_request: { head: { repo: opts.headRepo ? { full_name: opts.headRepo } : null } },
    },
  };
  const core = {
    warning: (m: string) => warnings.push(m),
    summary: {
      addRaw(text: string) {
        summary.push(text);
        return this;
      },
      async write() {
        summary.push('WRITTEN');
      },
    },
  };
  const fakeRequire = (m: string) => {
    if (m !== 'fs') throw new Error(`unexpected require: ${m}`);
    return { readFileSync: () => 'REPORT <!-- estate-control-plane -->' };
  };
  let error: unknown = null;
  try {
    await new AsyncFunction('github', 'context', 'core', 'require', script)(
      github,
      context,
      core,
      fakeRequire,
    );
  } catch (e) {
    error = e;
  }
  return { calls, warnings, summary, error };
}

const DENIED = { status: 403, message: 'Resource not accessible by integration' };

describe('estate-health: Upsert sticky PR comment step', () => {
  it('same-repo PR with no comment yet: creates one, no warning', async () => {
    const r = await run({ headRepo: 'bettercallzaal/ZAOOS' });
    expect(r.error).toBeNull();
    expect(r.calls).toEqual(['list', 'create']);
    expect(r.warnings).toEqual([]);
    expect(r.summary).toEqual([]);
  });

  it('same-repo PR with a comment: updates it', async () => {
    const r = await run({ headRepo: 'bettercallzaal/ZAOOS', existing: true });
    expect(r.error).toBeNull();
    expect(r.calls).toEqual(['list', 'update']);
  });

  it('fork PR, 403 on create: warns, writes the report to the summary, does not throw', async () => {
    const r = await run({ headRepo: 'ZAODEVZ/ZAOOS', failWith: DENIED, failOn: 'create' });
    expect(r.error).toBeNull();
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain('ZAODEVZ/ZAOOS');
    expect(r.summary).toEqual(['REPORT <!-- estate-control-plane -->', 'WRITTEN']);
  });

  it('fork PR, 403 on update: same soft path', async () => {
    const r = await run({
      headRepo: 'ZAODEVZ/ZAOOS',
      existing: true,
      failWith: DENIED,
      failOn: 'update',
    });
    expect(r.error).toBeNull();
    expect(r.warnings).toHaveLength(1);
  });

  it('fork whose head repo is gone, 403: soft path', async () => {
    const r = await run({ headRepo: null, failWith: DENIED, failOn: 'create' });
    expect(r.error).toBeNull();
    expect(r.warnings).toHaveLength(1);
  });

  it('same-repo PR, 403: still fails the step', async () => {
    const r = await run({ headRepo: 'bettercallzaal/ZAOOS', failWith: DENIED, failOn: 'create' });
    expect((r.error as Error).message).toBe(DENIED.message);
    expect(r.warnings).toEqual([]);
  });

  it('fork PR, an error that is not 403: still fails the step', async () => {
    const r = await run({
      headRepo: 'ZAODEVZ/ZAOOS',
      failWith: { status: 500, message: 'server error' },
    });
    expect((r.error as Error).message).toBe('server error');
    expect(r.warnings).toEqual([]);
  });
});

describe('estate-health: the ratchet still fails closed', () => {
  const comment = stepBlock('Upsert sticky PR comment');
  const ratchet = stepBlock('Enforce ratchet');

  it('the comment step is not blanket continue-on-error', () => {
    expect(comment).not.toContain('continue-on-error');
  });

  it('Enforce ratchet runs on a non-zero checks exit and exits 1, with no fork or soft-fail condition', () => {
    expect(ratchet).toContain("if: steps.checks.outputs.exit != '0'");
    expect(ratchet).toContain('exit 1');
    expect(ratchet).not.toContain('continue-on-error');
    expect(ratchet).not.toContain('fork');
  });

  it('Enforce ratchet comes after the comment step', () => {
    expect(workflow.indexOf('- name: Enforce ratchet')).toBeGreaterThan(
      workflow.indexOf('- name: Upsert sticky PR comment'),
    );
  });
});
