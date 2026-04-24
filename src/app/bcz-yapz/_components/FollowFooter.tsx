import Link from 'next/link'
import { BCZ_YAPZ_PAGE } from '@/lib/bcz-yapz/config'

export function FollowFooter() {
  const { follow, youtubeChannel } = BCZ_YAPZ_PAGE

  return (
    <section className="border-t border-white/10 bg-[#0a1628] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-4 text-sm">
        <div>
          <Link
            href={youtubeChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md bg-[#f5a623] px-4 py-2 font-semibold text-[#0a1628] transition hover:brightness-110"
          >
            Subscribe on YouTube
          </Link>
        </div>
        <ul className="space-y-1 text-white/70">
          <li>
            Follow Zaal on Farcaster:{' '}
            <Link
              href={follow.farcaster.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5a623] hover:underline"
            >
              {follow.farcaster.handle}
            </Link>
          </li>
          <li>
            Follow on X:{' '}
            <Link
              href={follow.x.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5a623] hover:underline"
            >
              {follow.x.handle}
            </Link>
          </li>
          <li>
            The ZAO channel:{' '}
            <Link
              href={follow.zaoChannel.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5a623] hover:underline"
            >
              {follow.zaoChannel.handle}
            </Link>
          </li>
          <li>
            The ZAO site:{' '}
            <Link
              href={follow.zaoSite.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5a623] hover:underline"
            >
              {follow.zaoSite.label}
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}
