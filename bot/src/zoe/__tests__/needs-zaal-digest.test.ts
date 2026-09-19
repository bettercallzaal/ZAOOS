import { describe, it, expect } from 'vitest';
import {
  parseLaneGrillSections,
  filterNeedsZaalTasks,
  buildNeedsZaalButtons,
  formatNeedsZaalDigest,
  type LaneGrillItem,
  type NeedsZaalTask,
} from '../needs-zaal-digest';

describe('needs-zaal-digest', () => {
  describe('parseLaneGrillSections', () => {
    it('extracts open bullets and ignores struck bullets', () => {
      const mockFiles: Record<string, string> = {
        'zorca.md': `# Zorca Status
## recent
Some stuff here.
## for the grill
- **Does zorca stay a pointer? Recommended: no - refill it, deliberately.** Zaal retirement note.
- ~~**Old question already answered**~~ **ANSWERED 2026-09-10**
- *(struck 2026-09-11: parked)*
## lane detail
More notes here.
`,
        'skills.md': `# Skills
## for the grill
- Order of the nine cards in notes/skills-lens-2026-09-16.md (recommended: 9, 7, 1, then the rest)
- Card 9772 single owner for fleet-claude-auth.state (recommended: zoe sole writer)
- Plain bullet without recommendation
`,
      };

      const items = parseLaneGrillSections(
        '/mock/vault',
        (p) => {
          const base = p.split('/').pop()!;
          return mockFiles[base] ?? null;
        },
        Object.keys(mockFiles),
      );

      expect(items.length).toBe(4);

      const zorcaItem = items.find((i) => i.lane === 'zorca');
      expect(zorcaItem).toBeDefined();
      expect(zorcaItem?.text).toContain('Does zorca stay a pointer?');
      expect(zorcaItem?.recommended?.toLowerCase()).toContain('no - refill it');

      const skillsItems = items.filter((i) => i.lane === 'skills');
      expect(skillsItems.length).toBe(3);
      expect(skillsItems[0].recommended).toBe('9, 7, 1, then the rest');
      expect(skillsItems[1].recommended).toBe('zoe sole writer');
      expect(skillsItems[1].cardId).toBe('9772');
      expect(skillsItems[2].recommended).toBeUndefined();
    });

    it('returns empty array on nonexistent vault directory without throwing', () => {
      const items = parseLaneGrillSections('/nonexistent/path/never/exists');
      expect(items).toEqual([]);
    });
  });

  describe('filterNeedsZaalTasks', () => {
    const now = new Date('2026-09-17T12:00:00Z');

    it('identifies tasks due within 48h as dueSoon', () => {
      const tasks: NeedsZaalTask[] = [
        {
          id: 'task-due-12h',
          title: 'Sign venue insurance agreement',
          status: 'todo',
          priority: 'P0',
          due: '2026-09-17T23:59:00Z', // in 12 hours
          notes: 'Crucial for ZAOstock',
          metadata: {},
        },
        {
          id: 'task-due-36h',
          title: 'Review production budget',
          status: 'in_progress',
          priority: 'P1',
          due: '2026-09-18T20:00:00Z', // in 32 hours
          notes: 'Recommended: approve allocation',
          metadata: {},
        },
        {
          id: 'task-due-5days',
          title: 'Q4 roadmap draft',
          status: 'todo',
          priority: 'P2',
          due: '2026-09-22T12:00:00Z', // in 5 days
          notes: null,
          metadata: {},
        },
        {
          id: 'task-completed-due-soon',
          title: 'Already finished task',
          status: 'done',
          priority: 'P0',
          due: '2026-09-17T15:00:00Z',
          notes: null,
          metadata: {},
        },
      ];

      const { dueSoon } = filterNeedsZaalTasks(tasks, now);
      expect(dueSoon.length).toBe(2);
      expect(dueSoon.map((t) => t.id)).toEqual(['task-due-12h', 'task-due-36h']);
      expect(dueSoon[1].recommended).toBe('approve allocation');
    });

    it('identifies board decisions needing Zaal', () => {
      const tasks: NeedsZaalTask[] = [
        {
          id: 'card-human-route',
          title: 'Pick marketing agency: Agency A / Agency B',
          status: 'todo',
          priority: 'P1',
          due: null,
          notes: 'Recommended: Agency A',
          metadata: { route: 'human' },
        },
        {
          id: 'card-decision-flag',
          title: 'Approve token ticker $ZAO',
          status: 'in_progress',
          priority: 'P0',
          due: null,
          notes: null,
          metadata: { decision: true },
        },
        {
          id: 'card-agent-task',
          title: 'Fix typo in css',
          status: 'todo',
          priority: 'P3',
          due: null,
          notes: null,
          metadata: { route: 'agent' },
        },
      ];

      const { decisions } = filterNeedsZaalTasks(tasks, now);
      expect(decisions.length).toBe(2);
      expect(decisions.map((t) => t.id)).toEqual(['card-human-route', 'card-decision-flag']);
      expect(decisions[0].recommended).toBe('Agency A');
    });
  });

  describe('buildNeedsZaalButtons', () => {
    it('places recommended option as the FIRST button when recommended is work', () => {
      const buttons = buildNeedsZaalButtons('card-123', 'work');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
      // First button must be the recommended action
      expect(buttons[0][0].text).toContain('★');
      expect(buttons[0][0].text.toLowerCase()).toContain('work');
      expect(buttons[0][0].data).toBe('bg:work:card-123');

      // The remaining buttons should include the other standard options
      const allData = buttons.flat().map((b) => b.data);
      expect(allData).toContain('bg:done:card-123');
      expect(allData).toContain('bg:keep:card-123');
      expect(allData).toContain('bg:park:card-123');
      expect(allData).toContain('bg:skip:card-123');
    });

    it('places recommended option as the FIRST button when recommended is done', () => {
      const buttons = buildNeedsZaalButtons('card-456', 'done');
      expect(buttons[0][0].text).toContain('★');
      expect(buttons[0][0].text.toLowerCase()).toContain('done');
      expect(buttons[0][0].data).toBe('bg:done:card-456');
    });

    it('falls back to standard buttons if no recommendation is provided', () => {
      const buttons = buildNeedsZaalButtons('card-789');
      expect(buttons[0][0].text).toBe('1 Done');
      expect(buttons[0][0].data).toBe('bg:done:card-789');
    });

    it('keeps callback_data under 64 bytes for any valid taskId', () => {
      const longUuid = '12345678-1234-1234-1234-1234567890ab';
      const buttons = buildNeedsZaalButtons(longUuid, 'park');
      for (const row of buttons) {
        for (const btn of row) {
          expect(Buffer.byteLength(btn.data, 'utf8')).toBeLessThanOrEqual(64);
        }
      }
    });
  });

  describe('formatNeedsZaalDigest', () => {
    it('formats a complete digest with due cards, lane asks, and decisions', () => {
      const text = formatNeedsZaalDigest({
        timeSlot: 'morning',
        dueSoon: [
          {
            id: 'task-1',
            title: 'Sign vendor agreement',
            due: '2026-09-17T18:00:00Z',
            priority: 'P0',
            status: 'todo',
            notes: null,
            metadata: {},
          },
        ],
        laneAsks: [
          {
            lane: 'zorca',
            text: 'Does zorca stay a pointer?',
            recommended: 'no - refill it, deliberately',
            sourceFile: 'handoffs/status/zorca.md',
          },
        ],
        decisions: [
          {
            id: 'card-9772',
            title: 'Single owner for fleet-claude-auth.state',
            status: 'todo',
            priority: 'P1',
            due: null,
            notes: 'Two writers causing flaps',
            metadata: {},
            recommended: 'zoe sole writer',
          },
        ],
      });

      expect(text).toContain('Needs Zaal Digest — 08:00 ET');
      expect(text).toContain('DUE < 48 HOURS');
      expect(text).toContain('Sign vendor agreement');
      expect(text).toContain('LANE GRILL QUESTIONS');
      expect(text).toContain('[**zorca**]');
      expect(text).toContain('Does zorca stay a pointer?');
      expect(text).toContain('Recommended: no - refill it, deliberately');
      expect(text).toContain('BOARD DECISIONS');
      expect(text).toContain('Single owner for fleet-claude-auth.state');
      expect(text).toContain('Recommended: zoe sole writer');
    });

    it('formats evening digest header when timeSlot is evening', () => {
      const text = formatNeedsZaalDigest({
        timeSlot: 'evening',
        dueSoon: [],
        laneAsks: [],
        decisions: [],
      });

      expect(text).toContain('Needs Zaal Digest — 20:00 ET');
      expect(text).toContain('All clear');
    });
  });

  describe('runNeedsZaalDigest execution', () => {
    it('sends overview digest and individual interactive cards with inline buttons', async () => {
      const sentMessages: { chatId: number; text: string; options?: any }[] = [];
      const mockBotApi = {
        sendMessage: async (chatId: number, text: string, options?: any) => {
          sentMessages.push({ chatId, text, options });
          return { message_id: sentMessages.length };
        },
      };

      const { runNeedsZaalDigest } = await import('../needs-zaal-digest');

      const result = await runNeedsZaalDigest({
        botApi: mockBotApi,
        zaalTgId: 12345678,
        timeSlot: 'morning',
        now: new Date('2026-09-17T12:00:00Z'),
        vaultDir: '/nonexistent/vault',
      });

      expect(result.delivered).toBe(true);
      expect(sentMessages.length).toBeGreaterThanOrEqual(1);
      expect(sentMessages[0].text).toContain('Needs Zaal Digest');
      expect(sentMessages[0].chatId).toBe(12345678);
    });

    const mkApi = () => {
      const sent: { text: string }[] = [];
      return { sent, api: { sendMessage: async (_c: number, text: string) => { sent.push({ text }); return { message_id: sent.length }; } } };
    };
    const stale = {
      state: 'STALE' as const, behind: 64, ahead: 0, dirty: true, pulled: 0,
      headCommittedAt: new Date('2026-09-17T07:52:00Z'), reason: 'the copy has uncommitted changes, so it was not moved',
    };

    it('puts the age of the vault copy on the FIRST line, before the digest, when it is stale', async () => {
      const { sent, api } = mkApi();
      const { runNeedsZaalDigest } = await import('../needs-zaal-digest');
      const result = await runNeedsZaalDigest({
        botApi: api, zaalTgId: 1, timeSlot: 'evening', vaultDir: '/nonexistent/vault',
        now: new Date('2026-09-17T20:00:00Z'), refresh: async () => stale,
      });
      const first = sent[0].text.split('\n')[0];
      expect(first).toContain('64 commits BEHIND');
      expect(first).toMatch(/may be out of date/);
      expect(sent[0].text.indexOf('vault copy:')).toBeLessThan(sent[0].text.indexOf('Needs Zaal Digest'));
      expect(result.vault.state).toBe('STALE');
    });

    it('says current and does not warn when the copy is fresh', async () => {
      const { sent, api } = mkApi();
      const { runNeedsZaalDigest } = await import('../needs-zaal-digest');
      await runNeedsZaalDigest({
        botApi: api, zaalTgId: 1, timeSlot: 'evening', vaultDir: '/nonexistent/vault',
        refresh: async () => ({ ...stale, state: 'FRESH' as const, behind: 0, dirty: false, pulled: 3, reason: '' }),
      });
      expect(sent[0].text.split('\n')[0]).toBe('vault copy: current, pulled 3 new commits just now');
      expect(sent[0].text).not.toMatch(/may be out of date/);
    });

    it('calls the refresh BEFORE it reads the vault, and with the vault dir', async () => {
      const { api } = mkApi();
      const { runNeedsZaalDigest } = await import('../needs-zaal-digest');
      const calls: string[] = [];
      await runNeedsZaalDigest({
        botApi: api, zaalTgId: 1, timeSlot: 'morning', vaultDir: '/some/vault',
        refresh: async (dir) => { calls.push(dir); return { ...stale, state: 'FRESH' as const, behind: 0, reason: '' }; },
      });
      expect(calls).toEqual(['/some/vault']);
    });

    it('still delivers the digest when the freshness check THROWS, and says the age is UNKNOWN', async () => {
      const { sent, api } = mkApi();
      const { runNeedsZaalDigest } = await import('../needs-zaal-digest');
      const result = await runNeedsZaalDigest({
        botApi: api, zaalTgId: 1, timeSlot: 'morning', vaultDir: '/nonexistent/vault',
        refresh: async () => { throw new Error('git exploded'); },
      });
      expect(result.delivered).toBe(true);
      expect(sent[0].text.split('\n')[0]).toContain('age UNKNOWN');
      expect(sent[0].text).toContain('Needs Zaal Digest');
      expect(result.vault.state).toBe('UNKNOWN');
    });
  });
});
