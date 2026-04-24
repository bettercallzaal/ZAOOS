import { HeroSection } from './_components/HeroSection'
import { EpisodeList } from './_components/EpisodeList'
import { FollowFooter } from './_components/FollowFooter'
import { getAllEpisodes } from '@/lib/bcz-yapz/episodes'
import { parseChapters, type Chapter } from '@/lib/bcz-yapz/chapters'

export const revalidate = 3600

export default async function BczYapzPage() {
  const episodes = await getAllEpisodes()
  const chaptersBySlug: Record<string, Chapter[] | null> = {}
  for (const ep of episodes) {
    chaptersBySlug[ep.slug] = await parseChapters(ep.slug)
  }

  return (
    <main className="min-h-screen bg-[#0a1628]">
      <HeroSection />
      <EpisodeList episodes={episodes} chaptersBySlug={chaptersBySlug} />
      <FollowFooter />
    </main>
  )
}
