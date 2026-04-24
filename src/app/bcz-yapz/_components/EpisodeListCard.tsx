'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { Episode } from '@/lib/bcz-yapz/types'
import type { Chapter } from '@/lib/bcz-yapz/chapters'

interface EpisodeListCardProps {
  episode: Episode
  displayIndex: number
  chapters: Chapter[] | null
}

export function EpisodeListCard({
  episode,
  displayIndex,
  chapters,
}: EpisodeListCardProps) {
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const { frontmatter, hasYoutube } = episode
  const epNumber = frontmatter.episode ?? displayIndex
  const topics = frontmatter.topics.slice(0, 3)

  return (
    <article className="rounded-lg border border-white/10 bg-white/5 p-4 text-white">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/60">
        <span className="font-semibold text-[#f5a623]">Ep {epNumber}</span>
        <span>·</span>
        <span>{episode.displayDate ?? 'TBD'}</span>
        {frontmatter.duration_min ? (
          <>
            <span>·</span>
            <span>{frontmatter.duration_min} min</span>
          </>
        ) : null}
      </div>
      <h2 className="mt-1 text-lg font-semibold">
        {frontmatter.guest}
        {frontmatter.guest_org ? (
          <span className="text-white/60"> · {frontmatter.guest_org}</span>
        ) : null}
      </h2>
      {frontmatter.summary ? (
        <p className="mt-2 text-sm text-white/80">{frontmatter.summary}</p>
      ) : null}
      {topics.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2 text-xs">
          {topics.map((topic) => (
            <li
              key={topic}
              className="rounded-full border border-white/10 px-2 py-0.5 text-white/60"
            >
              {topic.replace(/-/g, ' ')}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {hasYoutube && frontmatter.youtube_url ? (
          <Link
            href={frontmatter.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-[#f5a623] px-3 py-1.5 text-xs font-semibold text-[#0a1628] transition hover:brightness-110"
          >
            Watch on YouTube
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/40"
          >
            Not yet posted
          </button>
        )}
        {chapters && chapters.length > 0 ? (
          <button
            type="button"
            onClick={() => setChaptersOpen((v) => !v)}
            className="inline-flex items-center rounded-md border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/30"
          >
            {chaptersOpen ? 'Hide chapters' : `Chapters (${chapters.length})`}
          </button>
        ) : null}
      </div>
      {chapters && chaptersOpen ? (
        <ol className="mt-3 space-y-1 font-mono text-xs text-white/70">
          {chapters.map((chapter) => (
            <li key={`${chapter.timestamp}-${chapter.title}`}>
              <span className="text-[#f5a623]">{chapter.timestamp}</span>
              <span className="mx-2">-</span>
              <span>{chapter.title}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </article>
  )
}
