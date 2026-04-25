import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const CHANNEL_URL = 'https://www.youtube.com/@bettercallzaal'
const TRANSCRIPTS_DIR = path.join(
  process.cwd(),
  'content/transcripts/bcz-yapz'
)
const GAPS_LOG = path.join(
  process.cwd(),
  'scripts/sync-youtube-urls.gaps.log'
)

interface YtEntry {
  id: string
  title: string
  upload_date: string
}

function fetchYoutubeEntries(): YtEntry[] {
  console.log(`[yt-dlp] fetching video list from ${CHANNEL_URL}...`)
  const raw = execSync(`yt-dlp --flat-playlist -J "${CHANNEL_URL}"`, {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
  })
  const payload = JSON.parse(raw) as { entries?: YtEntry[] }
  const entries = payload.entries ?? []
  console.log(`[yt-dlp] got ${entries.length} video entries`)
  return entries
}

function isYapzVideo(entry: YtEntry): boolean {
  const t = entry.title.toLowerCase()
  return (
    t.startsWith('bcz yapz') ||
    t.startsWith('better call zaal yap') ||
    t.includes(' yapz ')
  )
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function matchEntry(
  entries: YtEntry[],
  guest: string,
  frontmatterDate: string | null
): YtEntry | null {
  const needle = normalize(guest)
  const candidates = entries.filter((e) => normalize(e.title).includes(needle))
  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  if (!frontmatterDate) return candidates[0]

  const target = frontmatterDate.replace(/-/g, '')
  let best: YtEntry | null = null
  let bestDiff = Number.POSITIVE_INFINITY
  for (const c of candidates) {
    const diff = Math.abs(parseInt(c.upload_date, 10) - parseInt(target, 10))
    if (diff < bestDiff) {
      bestDiff = diff
      best = c
    }
  }
  return best
}

function main() {
  const entries = fetchYoutubeEntries().filter(isYapzVideo)
  console.log(`[filter] ${entries.length} BCZ YapZ videos`)

  const filenames = fs
    .readdirSync(TRANSCRIPTS_DIR)
    .filter((f) => f.endsWith('.md'))

  let matched = 0
  let skipped = 0
  const gaps: string[] = []

  for (const filename of filenames) {
    const filepath = path.join(TRANSCRIPTS_DIR, filename)
    const raw = fs.readFileSync(filepath, 'utf-8')
    const parsed = matter(raw)
    const data = parsed.data as Record<string, unknown>

    if (data.youtube_url) {
      skipped++
      continue
    }

    const guest = String(data.guest ?? '')
    const fmDate =
      typeof data.date === 'string'
        ? data.date
        : typeof data.published === 'string'
          ? data.published
          : null

    const match = matchEntry(entries, guest, fmDate)
    if (!match) {
      gaps.push(`${filename} (guest=${guest}, date=${fmDate})`)
      continue
    }

    data.youtube_url = `https://www.youtube.com/watch?v=${match.id}`
    data.youtube_video_id = match.id
    if (!data.published && match.upload_date) {
      const d = match.upload_date
      data.published = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
    }

    const updated = matter.stringify(parsed.content, data)
    fs.writeFileSync(filepath, updated, 'utf-8')
    console.log(`[match] ${filename} -> ${match.id} (${match.title})`)
    matched++
  }

  if (gaps.length > 0) {
    fs.writeFileSync(
      GAPS_LOG,
      gaps.join('\n') + '\n',
      'utf-8'
    )
    console.log(`[gaps] ${gaps.length} unmatched - see ${GAPS_LOG}`)
  }

  console.log(`[summary] matched=${matched} skipped=${skipped} gaps=${gaps.length}`)
}

main()
