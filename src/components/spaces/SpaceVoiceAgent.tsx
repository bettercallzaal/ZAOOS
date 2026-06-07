'use client';

import { useCallback, useState } from 'react';
import { useConversation } from '@elevenlabs/react';

/**
 * Live voice agent for ZAO spaces, powered by ElevenLabs ConvAI.
 *
 * Adapted from Songjam's `agent-conversation.tsx` but secured to ZAO
 * conventions: the agent id / API key never reach the browser — we fetch a
 * short-lived signed URL from `/api/spaces/voice-agent/token` (session-gated)
 * and hand it to the SDK. See `research/dev-workflows/815-songjam-site-fork-audit/`.
 *
 * NOTE: requires the `@elevenlabs/react` dependency (pending approval).
 */

type AgentStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnecting'
  | 'error';

interface SpaceVoiceAgentProps {
  /** Agent slug; must match an allowlisted agent in the token route. */
  agent?: 'zoe';
  /** Display label under the orb. */
  label?: string;
  /** Optional client tool the agent can invoke to raise the caller's hand. */
  onRaiseHand?: () => void;
  /** Notified whenever the connection status changes. */
  onStatusChange?: (status: AgentStatus) => void;
}

interface TokenResponse {
  success?: boolean;
  signedUrl?: string;
  error?: string;
}

export function SpaceVoiceAgent({
  agent = 'zoe',
  label = 'ZOE',
  onRaiseHand,
  onStatusChange,
}: SpaceVoiceAgentProps) {
  const [status, setStatus] = useState<AgentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setAgentStatus = useCallback(
    (next: AgentStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange],
  );

  const conversation = useConversation({
    onConnect: () => setAgentStatus('connected'),
    onDisconnect: () => setAgentStatus('idle'),
    onError: () => {
      setErrorMessage('Voice connection error. Try again.');
      setAgentStatus('error');
    },
    clientTools: {
      // Controlled allowlist of actions — no raw window.open / redirects.
      raiseHand: () => {
        onRaiseHand?.();
        return 'Hand raised';
      },
    },
  });

  const start = useCallback(async () => {
    setErrorMessage(null);
    setAgentStatus('connecting');
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const res = await fetch('/api/spaces/voice-agent/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent }),
      });
      const data = (await res.json()) as TokenResponse;
      if (!res.ok || !data.signedUrl) {
        throw new Error(data.error || 'Could not start voice session');
      }

      // Signed URLs use the WebSocket transport; WebRTC needs a separate
      // conversation token. See @elevenlabs/client SessionConfig union.
      await conversation.startSession({
        signedUrl: data.signedUrl,
        connectionType: 'websocket',
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setErrorMessage('Enable microphone permissions to talk to the agent.');
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to connect',
        );
      }
      setAgentStatus('error');
    }
  }, [agent, conversation, setAgentStatus]);

  const stop = useCallback(async () => {
    setAgentStatus('disconnecting');
    await conversation.endSession();
    setAgentStatus('idle');
  }, [conversation, setAgentStatus]);

  const handleClick = useCallback(() => {
    if (status === 'connected') {
      void stop();
    } else if (status === 'idle' || status === 'error') {
      void start();
    }
  }, [status, start, stop]);

  const statusText: Record<AgentStatus, string> = {
    idle: 'Tap to talk',
    connecting: 'Connecting…',
    connected: 'Listening — tap to end',
    disconnecting: 'Ending…',
    error: 'Tap to retry',
  };

  const isLive = status === 'connected';

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        aria-label={isLive ? 'End voice session' : 'Start voice session'}
        className={`relative flex size-24 items-center justify-center rounded-full border-2 transition-all sm:size-28 ${
          isLive
            ? 'border-[#f5a623] bg-[#f5a623]/20 shadow-[0_0_24px_rgba(245,166,35,0.5)]'
            : 'border-[#f5a623]/60 bg-[#0a1628] hover:border-[#f5a623]'
        }`}
      >
        {isLive && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#f5a623]/30" />
        )}
        <span className="text-lg font-semibold text-[#f5a623]">{label}</span>
      </button>
      <p className="text-sm text-white/70">{statusText[status]}</p>
      {errorMessage && (
        <p className="max-w-[14rem] text-center text-xs text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
