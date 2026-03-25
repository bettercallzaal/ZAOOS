'use client';

import { useState, useCallback } from 'react';
import type { TrackMetadata } from '@/types/music';

export interface QueueTrack {
  id: string; // unique queue entry id
  metadata: TrackMetadata;
  addedAt: number;
}

export function usePlayerQueue() {
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addNext = useCallback((metadata: TrackMetadata) => {
    // Insert after current track
    const entry: QueueTrack = { id: crypto.randomUUID(), metadata, addedAt: Date.now() };
    setQueue(prev => {
      const idx = currentIndex + 1;
      return [...prev.slice(0, idx), entry, ...prev.slice(idx)];
    });
  }, [currentIndex]);

  const addToQueue = useCallback((metadata: TrackMetadata) => {
    // Append to end
    const entry: QueueTrack = { id: crypto.randomUUID(), metadata, addedAt: Date.now() };
    setQueue(prev => [...prev, entry]);
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setQueue(prev => {
      const removedIndex = prev.findIndex(t => t.id === id);
      if (removedIndex === -1) return prev;
      const next = prev.filter(t => t.id !== id);
      // Adjust currentIndex if a track before or at currentIndex was removed
      if (removedIndex <= currentIndex) {
        setCurrentIndex(ci => Math.max(-1, ci - 1));
      }
      return next;
    });
  }, [currentIndex]);

  const moveTrack = useCallback((fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(-1);
  }, []);

  const playNext = useCallback(() => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return queue[currentIndex + 1]?.metadata ?? null;
    }
    return null;
  }, [currentIndex, queue]);

  const playPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return queue[currentIndex - 1]?.metadata ?? null;
    }
    return null;
  }, [currentIndex, queue]);

  const skipTo = useCallback((index: number) => {
    if (index >= 0 && index < queue.length) {
      setCurrentIndex(index);
      return queue[index]?.metadata ?? null;
    }
    return null;
  }, [queue]);

  return {
    queue,
    currentIndex,
    addNext,
    addToQueue,
    removeFromQueue,
    moveTrack,
    clearQueue,
    playNext,
    playPrev,
    skipTo,
    queueLength: queue.length,
    hasNext: currentIndex < queue.length - 1,
    hasPrev: currentIndex > 0,
  };
}
