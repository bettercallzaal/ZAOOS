import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { EpisodeFrontmatterSchema, type Episode } from './types'

const TRANSCRIPTS_DIR = path.join(
  process.cwd(),
  'content/transcripts/bcz-yapz'
)

function slugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, '')
}

function buildThumbnailUrl(videoId: string | undefined): string | null {
  if (!videoId) return null
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

function pickDisplayDate(
  published: string | undefined,
  date: string | null | undefined
): string | null {
  if (published) return published
  if (date) return date
  return null
}

export async function getAllEpisodes(): Promise<Episode[]> {
  if (!fs.existsSync(TRANSCRIPTS_DIR)) return []

  const filenames = fs
    .readdirSync(TRANSCRIPTS_DIR)
    .filter((name) => name.endsWith('.md'))

  const episodes: Episode[] = []

  for (const filename of filenames) {
    const filepath = path.join(TRANSCRIPTS_DIR, filename)
    const raw = fs.readFileSync(filepath, 'utf-8')
    const parsed = matter(raw)

    const result = EpisodeFrontmatterSchema.safeParse(parsed.data)
    if (!result.success) {
      console.warn(
        `[bcz-yapz] skipping ${filename}: frontmatter invalid`,
        result.error.flatten()
      )
      continue
    }

    const frontmatter = result.data
    const slug = slugFromFilename(filename)

    episodes.push({
      slug,
      frontmatter,
      hasYoutube: Boolean(frontmatter.youtube_url),
      displayDate: pickDisplayDate(frontmatter.published, frontmatter.date),
      thumbnailUrl: buildThumbnailUrl(frontmatter.youtube_video_id),
    })
  }

  episodes.sort((a, b) => {
    const aDate = a.displayDate ?? ''
    const bDate = b.displayDate ?? ''
    return bDate.localeCompare(aDate)
  })

  return episodes
}
