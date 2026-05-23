'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Configuration the user picks in the lobby before joining a voice_channel
 * (full A/V) room. Passed up to /spaces/[id]/page.tsx which forwards camera +
 * mic + device choices into the Stream call.
 */
export interface LobbyJoinConfig {
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioDeviceId: string | null;
  videoDeviceId: string | null;
}

interface PreJoinLobbyProps {
  roomTitle: string;
  hostName?: string;
  participantCount?: number;
  username?: string;
  pfpUrl?: string;
  onJoin: (config: LobbyJoinConfig) => void;
  onCancel: () => void;
}

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

const STORAGE_KEY = 'zao-lobby-prefs-v1';

interface LobbyPrefs {
  audioEnabled: boolean;
  videoEnabled: boolean;
  audioDeviceId: string | null;
  videoDeviceId: string | null;
}

function loadPrefs(): LobbyPrefs {
  if (typeof window === 'undefined') {
    return { audioEnabled: true, videoEnabled: true, audioDeviceId: null, videoDeviceId: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { audioEnabled: true, videoEnabled: true, audioDeviceId: null, videoDeviceId: null };
    const parsed = JSON.parse(raw) as Partial<LobbyPrefs>;
    return {
      audioEnabled: parsed.audioEnabled ?? true,
      videoEnabled: parsed.videoEnabled ?? true,
      audioDeviceId: parsed.audioDeviceId ?? null,
      videoDeviceId: parsed.videoDeviceId ?? null,
    };
  } catch {
    return { audioEnabled: true, videoEnabled: true, audioDeviceId: null, videoDeviceId: null };
  }
}

function savePrefs(prefs: LobbyPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* localStorage disabled — preferences just won't persist */
  }
}

/**
 * Pre-join lobby for Video Rooms. Renders a local camera preview, audio level
 * meter, device pickers, and toggles for whether to enter with mic/camera on.
 * Stream.io is intentionally NOT involved here — the preview runs off a plain
 * getUserMedia stream and is torn down before the room's Stream call joins,
 * so there is no "double mic" or token-mint race to worry about.
 */
export function PreJoinLobby({
  roomTitle,
  hostName,
  participantCount,
  username,
  pfpUrl,
  onJoin,
  onCancel,
}: PreJoinLobbyProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const initialPrefs = loadPrefs();
  const [audioEnabled, setAudioEnabled] = useState(initialPrefs.audioEnabled);
  const [videoEnabled, setVideoEnabled] = useState(initialPrefs.videoEnabled);
  const [audioDeviceId, setAudioDeviceId] = useState<string | null>(initialPrefs.audioDeviceId);
  const [videoDeviceId, setVideoDeviceId] = useState<string | null>(initialPrefs.videoDeviceId);

  const [audioDevices, setAudioDevices] = useState<MediaDeviceOption[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceOption[]>([]);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [error, setError] = useState<string | null>(null);
  const [micLevel, setMicLevel] = useState(0);

  const stopTracks = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const acquire = useCallback(async () => {
    stopTracks();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setPermissionState('unsupported');
      setError('Your browser does not support camera or microphone access.');
      return;
    }

    const constraints: MediaStreamConstraints = {
      audio: audioEnabled
        ? audioDeviceId
          ? { deviceId: { exact: audioDeviceId } }
          : true
        : false,
      video: videoEnabled
        ? videoDeviceId
          ? { deviceId: { exact: videoDeviceId } }
          : true
        : false,
    };

    if (!audioEnabled && !videoEnabled) {
      setPermissionState('granted');
      setError(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setPermissionState('granted');
      setError(null);

      if (audioEnabled && stream.getAudioTracks().length > 0) {
        try {
          const Ctx = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          if (Ctx) {
            const ctx = new Ctx();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            audioCtxRef.current = ctx;
            analyserRef.current = analyser;

            const buf = new Uint8Array(analyser.frequencyBinCount);
            const tick = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(buf);
              let sum = 0;
              for (const v of buf) sum += v;
              const avg = sum / buf.length / 255;
              setMicLevel(avg);
              rafRef.current = requestAnimationFrame(tick);
            };
            tick();
          }
        } catch {
          /* mic meter is best-effort */
        }
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioDevices(
          devices
            .filter((d) => d.kind === 'audioinput')
            .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Microphone ${i + 1}` })),
        );
        setVideoDevices(
          devices
            .filter((d) => d.kind === 'videoinput')
            .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Camera ${i + 1}` })),
        );
      } catch {
        /* device enumeration is best-effort */
      }
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : 'Error';
      const isPermission = name === 'NotAllowedError' || name === 'SecurityError';
      const isNotFound = name === 'NotFoundError' || name === 'OverconstrainedError';
      setPermissionState(isPermission ? 'denied' : 'granted');
      setError(
        isPermission
          ? 'Camera or microphone permission was blocked. Allow access in your browser and try again.'
          : isNotFound
            ? 'Could not find the selected camera or microphone. Pick a different device.'
            : 'Could not access camera or microphone.',
      );
    }
  }, [audioEnabled, videoEnabled, audioDeviceId, videoDeviceId, stopTracks]);

  useEffect(() => {
    acquire();
    return () => {
      stopTracks();
    };
  }, [acquire, stopTracks]);

  const handleJoin = () => {
    savePrefs({ audioEnabled, videoEnabled, audioDeviceId, videoDeviceId });
    stopTracks();
    onJoin({ audioEnabled, videoEnabled, audioDeviceId, videoDeviceId });
  };

  const handleCancel = () => {
    stopTracks();
    onCancel();
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] flex flex-col">
      <header className="border-b border-white/[0.08] bg-[#0d1b2a] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-white font-bold text-sm sm:text-base truncate">{roomTitle}</h1>
            <p className="text-gray-500 text-xs truncate mt-0.5">
              {hostName ? `Hosted by ${hostName}` : 'Video room'}
              {typeof participantCount === 'number' && participantCount > 0 && (
                <>
                  {' '}- {participantCount} {participantCount === 1 ? 'person' : 'people'} here
                </>
              )}
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white border border-white/[0.08] rounded-lg hover:bg-white/[0.04] transition-colors"
          >
            Back
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-3">
          <div className="relative aspect-video w-full max-w-3xl mx-auto rounded-2xl overflow-hidden border border-white/[0.08] bg-black">
            {videoEnabled && permissionState === 'granted' ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-500">
                {pfpUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pfpUrl}
                    alt={username ?? 'You'}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white/[0.08]"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f5a623] to-[#ffd700] flex items-center justify-center text-[#0a1628] text-3xl font-bold">
                    {(username ?? '?')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm">
                  {permissionState === 'denied'
                    ? 'Camera blocked'
                    : videoEnabled
                      ? 'Starting camera...'
                      : 'Camera off'}
                </span>
              </div>
            )}

            {/* Mic level meter */}
            {audioEnabled && permissionState === 'granted' && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="flex-1 h-1 rounded-full bg-black/60 overflow-hidden">
                  <div
                    className="h-full bg-[#f5a623] transition-all duration-75"
                    style={{ width: `${Math.min(100, micLevel * 200)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setAudioEnabled((v) => !v)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 border transition-colors ${
                audioEnabled
                  ? 'bg-[#1a2a3a] text-white border-white/[0.08] hover:border-gray-500'
                  : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20'
              }`}
            >
              {audioEnabled ? 'Mic on' : 'Mic off'}
            </button>
            <button
              type="button"
              onClick={() => setVideoEnabled((v) => !v)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 border transition-colors ${
                videoEnabled
                  ? 'bg-[#1a2a3a] text-white border-white/[0.08] hover:border-gray-500'
                  : 'bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20'
              }`}
            >
              {videoEnabled ? 'Camera on' : 'Camera off'}
            </button>
          </div>

          {error && (
            <div className="mx-auto max-w-md flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2.5 rounded-lg">
              <span>{error}</span>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5">
              Microphone
            </label>
            <select
              value={audioDeviceId ?? ''}
              onChange={(e) => setAudioDeviceId(e.target.value || null)}
              disabled={!audioEnabled || audioDevices.length === 0}
              className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none disabled:opacity-50"
            >
              <option value="">Default microphone</option>
              {audioDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-medium uppercase tracking-wider mb-1.5">
              Camera
            </label>
            <select
              value={videoDeviceId ?? ''}
              onChange={(e) => setVideoDeviceId(e.target.value || null)}
              disabled={!videoEnabled || videoDevices.length === 0}
              className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:border-[#f5a623] focus:outline-none disabled:opacity-50"
            >
              <option value="">Default camera</option>
              {videoDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleJoin}
            disabled={permissionState === 'denied' && (audioEnabled || videoEnabled)}
            className="w-full px-4 py-3 bg-[#f5a623] hover:bg-[#ffd700] text-[#0a1628] font-bold rounded-xl text-sm transition-colors shadow-lg shadow-[#f5a623]/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Join room
          </button>

          <p className="text-gray-600 text-xs leading-relaxed">
            You can change mic, camera, and screen share inside the room.
          </p>
        </aside>
      </main>
    </div>
  );
}
