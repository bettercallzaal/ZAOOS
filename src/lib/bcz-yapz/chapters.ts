import fs from 'node:fs'
import path from 'node:path'

export interface Chapter {
  timestamp: string
  title: string
}

const DESCRIPTIONS_DIR = path.join(
  process.cwd(),
  'content/youtube-descriptions/bcz-yapz'
)

const CHAPTER_LINE = /^(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(.+)$/

export async function parseChapters(slug: string): Promise<Chapter[] | null> {
  const filepath = path.join(DESCRIPTIONS_DIR, `${slug}.md`)
  if (!fs.existsSync(filepath)) return null

  const raw = fs.readFileSync(filepath, 'utf-8')
  const lines = raw.split('\n')

  let inChaptersBlock = false
  const chapters: Chapter[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === 'CHAPTERS') {
      inChaptersBlock = true
      continue
    }
    if (!inChaptersBlock) continue
    if (trimmed === '' || trimmed.startsWith('MENTIONED') || trimmed.startsWith('FOLLOW') || trimmed.startsWith('##')) {
      if (chapters.length > 0) break
      continue
    }
    const match = CHAPTER_LINE.exec(trimmed)
    if (match) {
      chapters.push({ timestamp: match[1], title: match[2].trim() })
    }
  }

  return chapters.length > 0 ? chapters : null
}
