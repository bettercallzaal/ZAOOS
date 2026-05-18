import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ZAO NEXUS - Links Hub',
  description: 'Your central hub for all ZAO links, projects, and community resources',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
