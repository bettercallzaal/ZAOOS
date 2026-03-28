import type { Metadata } from 'next'
import HistoryClient from './HistoryClient'

export const metadata: Metadata = { title: 'Listening History — ZAO OS' }

export default function HistoryPage() {
  return <HistoryClient />
}
