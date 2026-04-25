import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

const slug = process.argv[2]
const url = process.argv[3]

if (!slug || !url) {
  console.error('Usage: npx tsx scripts/set-youtube-url.ts <slug> <youtube_url>')
  process.exit(1)
}

const match = /[?&]v=([A-Za-z0-9_-]{11})/.exec(url) ??
  /youtu\.be\/([A-Za-z0-9_-]{11})/.exec(url)
if (!match) {
  console.error(`Could not extract video id from ${url}`)
  process.exit(1)
}
const videoId = match[1]

const filepath = path.join(
  process.cwd(),
  'content/transcripts/bcz-yapz',
  `${slug}.md`
)
if (!fs.existsSync(filepath)) {
  console.error(`Transcript not found: ${filepath}`)
  process.exit(1)
}

const raw = fs.readFileSync(filepath, 'utf-8')
const parsed = matter(raw)
parsed.data.youtube_url = url
parsed.data.youtube_video_id = videoId
fs.writeFileSync(filepath, matter.stringify(parsed.content, parsed.data), 'utf-8')
console.log(`Updated ${filepath}: youtube_url + youtube_video_id`)
