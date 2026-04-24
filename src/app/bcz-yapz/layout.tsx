import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { BCZ_YAPZ_PAGE } from '@/lib/bcz-yapz/config'

export const metadata: Metadata = {
  title: `${BCZ_YAPZ_PAGE.title} - The ZAO`,
  description: BCZ_YAPZ_PAGE.tagline,
  openGraph: {
    title: `${BCZ_YAPZ_PAGE.title} - The ZAO`,
    description: BCZ_YAPZ_PAGE.tagline,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BCZ_YAPZ_PAGE.title} - The ZAO`,
    description: BCZ_YAPZ_PAGE.tagline,
  },
}

export default function BczYapzLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
