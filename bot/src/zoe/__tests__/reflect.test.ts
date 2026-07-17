// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockCallClaudeCli = vi.hoisted(() => vi.fn());
const mockRecordCall = vi.hoisted(() => vi.fn());
const mockListOpenTasks = vi.hoisted(() => vi.fn());
const mockListLiveThreads = vi.hoisted(() => vi.fn());
const mockIsOverdue = vi.hoisted(() => vi.fn());
const mockExecSync = vi.hoisted(() => vi.fn());

vi.mock('../../hermes/claude-cli', () => ({ callClaudeCli: mockCallClaudeCli }));
vi.mock('../cost-ledger', () => ({ recordCall: mockRecordCall }));
vi.mock('../tasks', () => ({ listOpenTasks: mockListOpenTasks }));
vi.mock('../threads', () => ({
  listLiveThreads: mockListLiveThreads,
  isOverdue: mockIsOverdue,
}));
vi.mock('node:child_process', () => ({ execSync: mockExecSync }));

import { generateEveningReflection } from '../reflect';

afterEach(() => vi.clearAllMocks());

const REPO_DIR = '/tmp/fake-repo';
const LONG_REFLECTION =
  'Evening reflection — Thu Jul 17 9pm\n\nThree quick:\n\n1. What shipped today?\n2. What\'s stuck?\n3. Tomorrow\'s first task?';

function setupHappyPath(claudeText = LONG_REFLECTION) {
  mockExecSync
    .mockReturnValueOnce('feat: add feature\nfix: bug fix') // git log
    .mockReturnValueOnce(JSON.stringify([{ number: 42, title: 'Add new thing' }])); // gh pr list
  mockListOpenTasks.mockResolvedValue([
    { id: 't1', title: 'Finish reflection tests', priority: 'high' },
  ]);
  mockListLiveThreads.mockReturnValue([]);
  mockCallClaudeCli.mockResolvedValue({ text: claudeText });
}

describe('generateEveningReflection', () => {
  it('returns Claude output when text is >= 60 chars', async () => {
    setupHappyPath();
    const result = await generateEveningReflection({ repoDir: REPO_DIR });
    expect(result).toContain('Evening reflection');
    expect(mockCallClaudeCli).toHaveBeenCalledOnce();
  });

  it('falls back to hardcoded 3-question prompt when Claude returns short text', async () => {
    mockExecSync
      .mockReturnValueOnce('')
      .mockReturnValueOnce('[]');
    mockListOpenTasks.mockResolvedValue([]);
    mockListLiveThreads.mockReturnValue([]);
    mockCallClaudeCli.mockResolvedValue({ text: 'short' }); // < 60 chars
    const result = await generateEveningReflection({ repoDir: REPO_DIR });
    expect(result).toContain('1. What shipped today?');
    expect(result).toContain("2. What's stuck?");
  });

  it('always calls recordCall with the Claude result', async () => {
    setupHappyPath();
    await generateEveningReflection({ repoDir: REPO_DIR });
    expect(mockRecordCall).toHaveBeenCalledWith('reflect', expect.any(Object));
  });

  it('handles execSync throws gracefully (empty commits and PRs)', async () => {
    mockExecSync.mockImplementation(() => { throw new Error('git not found'); });
    mockListOpenTasks.mockResolvedValue([]);
    mockListLiveThreads.mockReturnValue([]);
    mockCallClaudeCli.mockResolvedValue({ text: LONG_REFLECTION });
    await expect(generateEveningReflection({ repoDir: REPO_DIR })).resolves.toBeDefined();
    // user prompt should reflect empty state
    const promptArg = mockCallClaudeCli.mock.calls[0][0].prompt as string;
    expect(promptArg).toContain('(none)');
  });

  it('includes anchor thread summary in the user prompt when a live thread exists', async () => {
    mockExecSync
      .mockReturnValueOnce('')
      .mockReturnValueOnce('[]');
    mockListOpenTasks.mockResolvedValue([]);
    const thread = {
      id: 'th1',
      summary: 'Ship the music module',
      status: 'open',
      createdAt: new Date().toISOString(),
      dueAt: null,
    };
    mockListLiveThreads.mockReturnValue([thread]);
    mockIsOverdue.mockReturnValue(false);
    mockCallClaudeCli.mockResolvedValue({ text: LONG_REFLECTION });
    await generateEveningReflection({ repoDir: REPO_DIR });
    const promptArg = mockCallClaudeCli.mock.calls[0][0].prompt as string;
    expect(promptArg).toContain('Ship the music module');
    expect(promptArg).toContain('LEAD with ONE contextual question');
  });

  it('slices listOpenTasks to the top 5 in the prompt', async () => {
    mockExecSync
      .mockReturnValueOnce('')
      .mockReturnValueOnce('[]');
    const tasks = Array.from({ length: 10 }, (_, i) => ({
      id: `t${i}`,
      title: `Task ${i}`,
      priority: 'low',
    }));
    mockListOpenTasks.mockResolvedValue(tasks);
    mockListLiveThreads.mockReturnValue([]);
    mockCallClaudeCli.mockResolvedValue({ text: LONG_REFLECTION });
    await generateEveningReflection({ repoDir: REPO_DIR });
    const promptArg = mockCallClaudeCli.mock.calls[0][0].prompt as string;
    // Task 5 and beyond should NOT appear in the prompt (sliced to 3 from the top 5)
    expect(promptArg).not.toContain('Task 5');
  });
});
