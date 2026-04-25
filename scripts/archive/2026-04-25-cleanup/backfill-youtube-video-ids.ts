import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const TRANSCRIPTS_DIR = path.join(
  process.cwd(),
  'content/transcripts/bcz-yapz'
)

function extractVideoId(url: string): string | null {
  const watchMatch = /[?&]v=([A-Za-z0-9_-]{11})/.exec(url)
  if (watchMatch) return watchMatch[1]
  const shortMatch = /youtu\.be\/([A-Za-z0-9_-]{11})/.exec(url)
  if (shortMatch) return shortMatch[1]
  const embedMatch = /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/.exec(url)
  if (embedMatch) return embedMatch[1]
  return null
}

function main() {
  const filenames = fs
    .readdirSync(TRANSCRIPTS_DIR)
    .filter((f) => f.endsWith('.md'))

  let backfilled = 0
  let alreadyHad = 0
  let noUrl = 0
  let parseFailed = 0

  for (const filename of filenames) {
    const filepath = path.join(TRANSCRIPTS_DIR, filename)
    const raw = fs.readFileSync(filepath, 'utf-8')
    const parsed = matter(raw)
    const data = parsed.data as Record<string, unknown>

    const url = typeof data.youtube_url === 'string' ? data.youtube_url : null
    if (!url) {
      noUrl++
      continue
    }

    if (typeof data.youtube_video_id === 'string' && data.youtube_video_id.length > 0) {
      alreadyHad++
      continue
    }

    const id = extractVideoId(url)
    if (!id) {
      console.warn(`[skip] ${filename}: could not extract video id from ${url}`)
      parseFailed++
      continue
    }

    data.youtube_video_id = id
    fs.writeFileSync(
      filepath,
      matter.stringify(parsed.content, data),
      'utf-8'
    )
    console.log(`[backfill] ${filename} -> ${id}`)
    backfilled++
  }

  console.log(
    `[summary] backfilled=${backfilled} alreadyHad=${alreadyHad} noUrl=${noUrl} parseFailed=${parseFailed}`
  )
}

main()
