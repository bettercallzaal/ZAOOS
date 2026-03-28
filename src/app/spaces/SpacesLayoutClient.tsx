'use client';

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AuthAudioProviders } from '@/app/(auth)/providers';
import { BottomNav } from '@/components/navigation/BottomNav';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LazyPlayer } from '@/components/music/LazyPlayer';
import { LazyGlobalSearch } from '@/components/search/LazyGlobalSearch';
import ChannelSidebar from '@/components/spaces/ChannelSidebar';
import ChannelStrip from '@/components/spaces/ChannelStrip';
import ConnectedBanner from '@/components/spaces/ConnectedBanner';
import { getSupabaseBrowser } from '@/lib/db/supabase';
import type { Room } from '@/lib/spaces/roomsDb';

/**
 * Client-side spaces layout — voice channels sidebar (desktop) / pill strip (mobile),
 * live stages in main content, full chrome for authenticated users.
 */
export function SpacesLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Voice channels + live stages state
  const [channels, setChannels] = useState<Room[]>([]);
  const [stages, setStages] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  // Connected voice channel state
  const [connectedRoomId, setConnectedRoomId] = useState<string | null>(null);
  const [connectedDuration, setConnectedDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRooms = useCallback(async () => {
    const supabase = getSupabaseBrowser();

    const [channelResult, stageResult] = await Promise.allSettled([
      supabase
        .from('rooms')
        .select('*')
        .eq('persistent', true)
        .eq('room_type', 'voice_channel')
        .order('title'),
      supabase
        .from('rooms')
        .select('*')
        .eq('room_type', 'stage')
        .eq('state', 'live')
        .order('created_at', { ascending: false }),
    ]);

    if (channelResult.status === 'fulfilled' && channelResult.value.data) {
      setChannels(channelResult.value.data as Room[]);
    }
    if (stageResult.status === 'fulfilled' && stageResult.value.data) {
      setStages(stageResult.value.data as Room[]);
    }
    setRoomsLoading(false);
  }, []);

  // Fetch rooms + Supabase Realtime subscription
  useEffect(() => {
    const supabase = getSupabaseBrowser();

    fetchRooms();

    const channel = supabase
      .channel('spaces-rooms')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms' },
        () => fetchRooms()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchRooms]);

  // Duration timer for connected voice channel
  useEffect(() => {
    if (connectedRoomId) {
      setConnectedDuration(0);
      durationRef.current = setInterval(() => {
        setConnectedDuration((d) => d + 1);
      }, 1000);
    } else {
      setConnectedDuration(0);
      if (durationRef.current) {
        clearInterval(durationRef.current);
        durationRef.current = null;
      }
    }
    return () => {
      if (durationRef.current) clearInterval(durationRef.current);
    };
  }, [connectedRoomId]);

  const handleJoinChannel = useCallback(
    (room: Room) => {
      router.push(`/spaces/${room.id}`);
    },
    [router]
  );

  const handleLeaveChannel = useCallback(() => {
    setConnectedRoomId(null);
    setIsMuted(false);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  const connectedRoom = channels.find((c) => c.id === connectedRoomId);

  // Authenticated users get full layout with channel sidebar
  if (user) {
    return (
      <AuthAudioProviders>
        <div className="md:pt-10 min-h-[100dvh] bg-[#0a1628]">
          {/* Mobile: channel pill strip */}
          <ChannelStrip channels={channels} onJoinChannel={handleJoinChannel} />

          {/* Mobile: connected banner */}
          {connectedRoom && (
            <ConnectedBanner
              roomName={connectedRoom.title}
              duration={connectedDuration}
              isMuted={isMuted}
              onToggleMute={handleToggleMute}
              onLeave={handleLeaveChannel}
            />
          )}

          {/* Desktop: sidebar + main */}
          <div className="flex min-h-[calc(100dvh-2.5rem)]">
            <ChannelSidebar
              channels={channels}
              connectedRoomId={connectedRoomId}
              connectedDuration={connectedDuration}
              onJoinChannel={handleJoinChannel}
              onLeaveChannel={handleLeaveChannel}
              onToggleMute={handleToggleMute}
              isMuted={isMuted}
            />

            <main className="flex-1 overflow-y-auto pb-32">
              <ErrorBoundary>
                {/* Pass stages + loading + auth down via children render */}
                {children}
              </ErrorBoundary>
            </main>
          </div>

          <Suspense fallback={null}>
            <LazyGlobalSearch />
          </Suspense>
          <LazyPlayer />
          <BottomNav />
        </div>
      </AuthAudioProviders>
    );
  }

  // Guest users get minimal layout with channel strip (read-only feel)
  return (
    <div className="min-h-[100dvh] bg-[#0a1628]">
      <ChannelStrip channels={channels} onJoinChannel={handleJoinChannel} />
      <main className="pb-16">
        {children}
      </main>
    </div>
  );
}

// Export context for page to consume layout data
export { type Room };
