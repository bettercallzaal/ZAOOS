'use client'

import { useEffect, useRef, ReactNode } from 'react'
import { usePlayerContext } from './PlayerProvider'

/**
 * TidalProvider — registers a TIDAL controller with PlayerProvider.
 * Since no public TIDAL Web Player SDK is available, playback opens tracks
 * externally in a new tab via window.open. Catalog search is handled
 * server-side via the TIDAL Open API client (src/lib/music/tidal.ts).
 */
export function TidalProvider({ children }: { children: ReactNode }) {
  const { registerController } = usePlayerContext()
  const registered = useRef(false)

  useEffect(() => {
    if (registered.current) return
    registered.current = true

    registerController('tidal', {
      play: () => {},
      pause: () => {},
      seek: () => {},
      load: (url: string) => {
        window.open(url, '_blank', 'noopener')
      },
      setVolume: () => {},
    })
  }, [registerController])

  return <>{children}</>
}
