import { describe, it, expect } from 'vitest';
import { classifyDiffComplexity } from '../types';

// Helper: build a unified-diff-ish body from added lines.
function diffWith(addedLines: string[], headerLines: string[] = []): string {
  return [...headerLines, ...addedLines.map((l) => `+${l}`)].join('\n');
}

describe('classifyDiffComplexity', () => {
  it('treats a docs-only small change as simple', () => {
    const result = classifyDiffComplexity({
      diff: diffWith(['# New heading', 'some prose']),
      filesChanged: ['research/foo/README.md'],
    });
    expect(result).toBe('simple');
  });

  it('treats a small low-risk code change as simple', () => {
    const result = classifyDiffComplexity({
      diff: diffWith(['const x = 1;']),
      filesChanged: ['bot/src/foo.ts'],
    });
    expect(result).toBe('simple');
  });

  it('escalates to complex when >=30 lines are added', () => {
    const added = Array.from({ length: 30 }, (_, i) => `line ${i}`);
    const result = classifyDiffComplexity({
      diff: diffWith(added),
      filesChanged: ['bot/src/foo.ts'],
    });
    expect(result).toBe('complex');
  });

  it('does NOT count +++ file headers as added lines', () => {
    // 29 real added lines + a +++ header => still under the 30 threshold => simple.
    const added = Array.from({ length: 29 }, (_, i) => `line ${i}`);
    const result = classifyDiffComplexity({
      diff: diffWith(added, ['+++ b/bot/src/foo.ts']),
      filesChanged: ['bot/src/foo.ts'],
    });
    expect(result).toBe('simple');
  });

  it.each([
    ['eval(', 'const r = eval("2+2");'],
    ['dangerouslySetInnerHTML', '<div dangerouslySetInnerHTML={{ __html: x }} />'],
    ['child_process', "import cp from 'child_process';"],
    ['SUPABASE_SERVICE_ROLE', 'const k = process.env.SUPABASE_SERVICE_ROLE_KEY;'],
    ['NEYNAR_API_KEY', 'const k = process.env.NEYNAR_API_KEY;'],
    ['SESSION_SECRET', 'const s = process.env.SESSION_SECRET;'],
    ['APP_SIGNER_PRIVATE_KEY', 'const p = process.env.APP_SIGNER_PRIVATE_KEY;'],
    ['api/admin path', "fetch('/api/admin/users');"],
    ['.sql file op', 'await run(".sql migration");'],
    ['spawn(', 'spawn("ls", []);'],
    ['exec(', 'exec("rm -rf /");'],
  ])('flags a small diff as complex when it touches a risk pattern: %s', (_label, line) => {
    const result = classifyDiffComplexity({
      diff: diffWith([line]),
      filesChanged: ['bot/src/foo.ts'],
    });
    expect(result).toBe('complex');
  });

  it('falls through to complex for an unrecognized, non-docs, non-code file', () => {
    const result = classifyDiffComplexity({
      diff: diffWith(['FROM node:22']),
      filesChanged: ['Dockerfile'],
    });
    expect(result).toBe('complex');
  });

  it('treats a mixed code+docs small low-risk change as simple (code path wins)', () => {
    const result = classifyDiffComplexity({
      diff: diffWith(['const x = 1;', '# heading']),
      filesChanged: ['bot/src/foo.ts', 'README.md'],
    });
    expect(result).toBe('simple');
  });

  it('is conservative: an empty diff with only docs files is simple', () => {
    expect(
      classifyDiffComplexity({ diff: '', filesChanged: ['notes.md'] }),
    ).toBe('simple');
  });
});
