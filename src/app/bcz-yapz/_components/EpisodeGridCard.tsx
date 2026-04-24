import Image from 'next/image'
import Link from 'next/link'
import type { Episode } from '@/lib/bcz-yapz/types'

interface EpisodeGridCardProps {
  episode: Episode
  displayIndex: number
}

export function EpisodeGridCard({ episode, displayIndex }: EpisodeGridCardProps) {
  const { frontmatter, hasYoutube, thumbnailUrl } = episode
  const epNumber = frontmatter.episode ?? displayIndex

  const content = (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:border-white/30">
      <div className="relative aspect-video w-full bg-[#0a1628]">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={`${frontmatter.guest} - BCZ YapZ episode ${epNumber}`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/40">
            No thumbnail
          </div>
        )}
      </div>
      <div className="p-3 text-white">
        <p className="text-sm font-semibold">
          {frontmatter.guest}{' '}
          <span className="text-white/60">· Ep {epNumber}</span>
        </p>
        <p className="mt-0.5 text-xs text-white/60">
          {episode.displayDate ?? 'TBD'}
          {frontmatter.duration_min ? ` · ${frontmatter.duration_min} min` : ''}
        </p>
      </div>
    </div>
  )

  if (hasYoutube && frontmatter.youtube_url) {
    return (
      <Link
        href={frontmatter.youtube_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </Link>
    )
  }

  return <div className="opacity-60">{content}</div>
}
