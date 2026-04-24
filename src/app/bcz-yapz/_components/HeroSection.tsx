import Link from 'next/link'
import { BCZ_YAPZ_PAGE } from '@/lib/bcz-yapz/config'

export function HeroSection() {
  const { title, tagline, hostName, hostFarcaster, youtubeChannel, about } =
    BCZ_YAPZ_PAGE

  return (
    <section className="border-b border-white/10 bg-[#0a1628] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-[#f5a623] sm:text-5xl">
          {title}
        </h1>
        <p className="text-lg text-white/80 sm:text-xl">{tagline}</p>
        <p className="text-sm text-white/60">
          Hosted by{' '}
          <Link
            href={hostFarcaster}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f5a623] hover:underline"
          >
            {hostName}
          </Link>
        </p>
        <div>
          <Link
            href={youtubeChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-[#f5a623] px-5 py-2.5 text-sm font-semibold text-[#0a1628] transition hover:brightness-110"
          >
            Subscribe on YouTube
          </Link>
        </div>
        <div className="pt-6 text-sm leading-relaxed text-white/70">
          <p>{about}</p>
        </div>
      </div>
    </section>
  )
}
