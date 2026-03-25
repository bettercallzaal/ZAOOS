'use client';

import { createContext, useContext, ReactNode } from 'react';
import { usePlayerQueue } from '@/hooks/usePlayerQueue';

type QueueContextValue = ReturnType<typeof usePlayerQueue>;
const QueueContext = createContext<QueueContextValue | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const queue = usePlayerQueue();
  return <QueueContext.Provider value={queue}>{children}</QueueContext.Provider>;
}

export function useQueue() {
  const ctx = useContext(QueueContext);
  if (!ctx) throw new Error('useQueue must be used inside QueueProvider');
  return ctx;
}
