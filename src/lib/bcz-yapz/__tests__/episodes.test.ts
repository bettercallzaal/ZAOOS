import { describe, it, expect, vi } from 'vitest'
import { getAllEpisodes } from '../episodes'
import type { Episode } from '../types'

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs')
  return { ...actual }
})

describe('getAllEpisodes', () => {
  it('returns episodes sorted by published date descending', async () => {
    const episodes = await getAllEpisodes()
    expect(Array.isArray(episodes)).toBe(true)
    expect(episodes.length).toBeGreaterThan(0)
    for (let i = 0; i + 1 < episodes.length; i++) {
      const a = episodes[i].displayDate
      const b = episodes[i + 1].displayDate
      if (a && b) {
        expect(a >= b).toBe(true)
      }
    }
  })

  it('each episode has a slug derived from filename', async () => {
    const episodes = await getAllEpisodes()
    for (const ep of episodes) {
      expect(ep.slug).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}-|^undated-/)
      expect(ep.slug).not.toMatch(/\.md$/)
    }
  })

  it('each episode exposes hasYoutube boolean derived from youtube_url', async () => {
    const episodes = await getAllEpisodes()
    for (const ep of episodes) {
      expect(typeof ep.hasYoutube).toBe('boolean')
      if (ep.frontmatter.youtube_url) {
        expect(ep.hasYoutube).toBe(true)
      } else {
        expect(ep.hasYoutube).toBe(false)
      }
    }
  })

  it('returns thumbnailUrl built from youtube_video_id when present', async () => {
    const episodes = await getAllEpisodes()
    for (const ep of episodes) {
      if (ep.frontmatter.youtube_video_id) {
        expect(ep.thumbnailUrl).toBe(
          `https://img.youtube.com/vi/${ep.frontmatter.youtube_video_id}/hqdefault.jpg`
        )
      } else {
        expect(ep.thumbnailUrl).toBeNull()
      }
    }
  })
})
