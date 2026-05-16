// Post slate v1 - shared types.
// See bot/src/zoe/posts/README.md for full spec.

export type PostCategory = 'build' | 'ecosystem' | 'event' | 'personal';

export const ALL_CATEGORIES: PostCategory[] = ['build', 'ecosystem', 'event', 'personal'];

export interface PostDraft {
  category: PostCategory;
  text: string;
  meta: {
    sources: string[];
    draftedAt: string;
    model: 'sonnet' | 'haiku' | 'opus';
  };
}

export interface PostSourceSnapshot {
  build: { recentCommits: string[]; openPrs: Array<{ number: number; title: string }> };
  ecosystem: { repoActivity: string[] };
  event: { todaysEvents: string[]; tomorrowsEvents: string[] };
  personal: { voiceMemos: string[]; recentZaalMessages: string[] };
}
