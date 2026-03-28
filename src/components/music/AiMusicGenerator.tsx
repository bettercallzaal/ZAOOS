'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

type GenerateState = 'idle' | 'loading' | 'success' | 'error' | 'mock';

type GenerateResult = {
  audioUrl: string | null;
  mock?: boolean;
  message?: string;
  error?: string;
};

// ── Genre Pills ──────────────────────────────────────────────────────────────

const GENRES = [
  'Electronic',
  'Hip-Hop',
  'Lo-fi',
  'Ambient',
  'Jazz',
  'Rock',
  'Pop',
  'Classical',
] as const;

// ── Component ────────────────────────────────────────────────────────────────

export function AiMusicGenerator() {
  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState(30);
  const [state, setState] = useState<GenerateState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [mockMessage, setMockMessage] = useState('');
  const [elapsed, setElapsed] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Inject keyframes for the progress bar animation
  useEffect(() => {
    const id = 'ai-gen-progress-keyframes';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `@keyframes ai-gen-progress { 0% { left: -40%; } 100% { left: 100%; } }`;
    document.head.appendChild(style);
  }, []);

  // Append genre to prompt
  const handleGenrePill = useCallback((genre: string) => {
    setPrompt((prev) => {
      const trimmed = prev.trim();
      if (trimmed.toLowerCase().includes(genre.toLowerCase())) return prev;
      return trimmed ? `${trimmed}, ${genre.toLowerCase()}` : genre.toLowerCase();
    });
  }, []);

  // Start generation
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    setState('loading');
    setAudioUrl(null);
    setErrorMessage('');
    setMockMessage('');
    setElapsed(0);

    // Progress timer
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), duration }),
        signal: abortRef.current.signal,
      });

      const data: GenerateResult = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      if (data.mock) {
        setState('mock');
        setMockMessage(data.message || 'Set HF_TOKEN to enable AI generation');
      } else if (data.audioUrl) {
        setState('success');
        setAudioUrl(data.audioUrl);
      } else {
        throw new Error('No audio returned');
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setState('idle');
        return;
      }
      setState('error');
      setErrorMessage(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [prompt, duration]);

  // Download the generated audio
  const handleDownload = useCallback(() => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `zao-ai-${Date.now()}.wav`;
    link.click();
  }, [audioUrl]);

  // Reset to idle
  const handleReset = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (timerRef.current) clearInterval(timerRef.current);
    setState('idle');
    setAudioUrl(null);
    setErrorMessage('');
    setMockMessage('');
    setElapsed(0);
  }, []);

  const isGenerating = state === 'loading';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#f5a623]/20 to-purple-500/20 flex items-center justify-center">
          <SparklesIcon className="w-5 h-5 text-[#f5a623]" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">AI Music Generator</h2>
          <p className="text-xs text-gray-500">Powered by ACE-Step</p>
        </div>
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <label htmlFor="ai-prompt" className="text-sm font-medium text-gray-300">
          Describe your music
        </label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the music you want to create..."
          maxLength={500}
          rows={3}
          disabled={isGenerating}
          className="w-full bg-white/5 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#f5a623]/50 focus:border-[#f5a623]/50 disabled:opacity-50 transition-all"
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-600">{prompt.length}/500</p>
        </div>
      </div>

      {/* Genre Pills */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Genre suggestions</p>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((genre) => {
            const isActive = prompt.toLowerCase().includes(genre.toLowerCase());
            return (
              <button
                key={genre}
                onClick={() => handleGenrePill(genre)}
                disabled={isGenerating}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#f5a623]/20 text-[#f5a623] ring-1 ring-[#f5a623]/40'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                } disabled:opacity-50`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="ai-duration" className="text-sm font-medium text-gray-300">
            Duration
          </label>
          <span className="text-sm font-mono text-[#f5a623]">{duration}s</span>
        </div>
        <input
          id="ai-duration"
          type="range"
          min={5}
          max={60}
          step={5}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          disabled={isGenerating}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10 accent-[#f5a623] disabled:opacity-50"
        />
        <div className="flex justify-between text-xs text-gray-600">
          <span>5s</span>
          <span>30s</span>
          <span>60s</span>
        </div>
      </div>

      {/* Generate Button */}
      {(state === 'idle' || state === 'mock') && (
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-[#f5a623] to-[#e8941a] text-[#0a1628] hover:shadow-lg hover:shadow-[#f5a623]/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          Generate Music
        </button>
      )}

      {/* Loading State */}
      {state === 'loading' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-800 bg-white/[0.02] p-6 text-center space-y-4">
            {/* Animated spinner */}
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-gray-700" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#f5a623] animate-spin" />
              <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-purple-500 animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-[#f5a623] animate-pulse" />
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-white">Generating your track...</p>
              <p className="text-xs text-gray-500 mt-1">
                This can take up to 2 minutes
              </p>
            </div>

            {/* Elapsed time */}
            <div className="text-xs font-mono text-gray-500">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')} elapsed
            </div>

            {/* Progress bar (indeterminate-style) */}
            <div className="h-1 bg-white/5 rounded-full overflow-hidden relative">
              <div
                className="absolute h-full bg-gradient-to-r from-[#f5a623] to-purple-500 rounded-full"
                style={{
                  width: '40%',
                  animation: 'ai-gen-progress 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-400 bg-white/5 hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Success State */}
      {state === 'success' && audioUrl && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-[#f5a623]" />
              <p className="text-sm font-medium text-[#f5a623]">Track generated</p>
            </div>

            {/* Native audio player */}
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="w-full h-10 [&::-webkit-media-controls-panel]:bg-white/10 [&::-webkit-media-controls-panel]:rounded-lg"
            />

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-[#f5a623] text-[#0a1628] hover:bg-[#e8941a] transition-all active:scale-[0.98]"
              >
                <DownloadIcon className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 transition-all"
              >
                Create Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mock State */}
      {state === 'mock' && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <InfoIcon className="w-5 h-5 text-blue-400" />
            <p className="text-sm font-medium text-blue-400">Development Mode</p>
          </div>
          <p className="text-xs text-gray-400">
            {mockMessage}
          </p>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="space-y-3">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <ErrorIcon className="w-5 h-5 text-red-400" />
              <p className="text-sm font-medium text-red-400">Generation failed</p>
            </div>
            <p className="text-xs text-gray-400">{errorMessage}</p>
          </div>
          <button
            onClick={handleGenerate}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-white/5 hover:bg-white/10 transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Keyframes injected via useEffect below */}
    </div>
  );
}

// ── Icons ────────────────────────────────────────────────────────────────────

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
