'use client';

import { useState } from 'react';

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to THE ZAO',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    description: 'You\'re part of a private music community on Farcaster. Everything here is gated to allowlisted members only.',
  },
  {
    title: 'Connect Your Signer',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    description: 'To post messages, you need to connect a Farcaster signer. Look for the purple "Connect to post" banner above the compose bar. This lets ZAO OS post on your behalf.',
  },
  {
    title: 'Browse Channels',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
      </svg>
    ),
    description: 'Use the sidebar to switch between channels: #zao (main), #zabal (off-topic), #cocconcertz (live music). Each channel is a Farcaster channel.',
  },
  {
    title: 'Share Music',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    ),
    description: 'Paste a link to Spotify, SoundCloud, YouTube, or any music platform. The player auto-detects tracks and lets everyone listen inline. Click the music note to see the queue.',
  },
  {
    title: 'Reactions & Replies',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    description: 'Like, recast, reply, or quote any message. Click the speech bubble to open the thread drawer and see the full conversation.',
  },
  {
    title: 'Private Messages',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    description: 'Click "Private DMs & Groups" in the sidebar for encrypted messaging. DM other members or create private group chats — completely separate from the public channels.',
  },
  {
    title: 'Keyboard Shortcuts',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    description: 'Cmd+K to search, / to focus compose, Esc to close panels, Cmd+B to toggle sidebar, M to toggle music queue.',
  },
];

interface TutorialPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialPanel({ isOpen, onClose }: TutorialPanelProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLast = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#0d1b2a] border border-gray-700 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pt-5">
            {TUTORIAL_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentStep ? 'bg-[#f5a623]' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="px-8 py-6 text-center">
            <div className="flex justify-center mb-4 text-[#f5a623]">
              {step.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">{step.description}</p>
          </div>

          {/* Step counter */}
          <p className="text-center text-xs text-gray-600 mb-4">
            {currentStep + 1} of {TUTORIAL_STEPS.length}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800">
            {isFirst ? (
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-white transition-colors">
                Skip
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            {isLast ? (
              <button
                onClick={() => { setCurrentStep(0); onClose(); }}
                className="px-5 py-2 text-sm font-medium bg-[#f5a623] text-black rounded-lg hover:bg-[#ffd700] transition-colors"
              >
                Got it!
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2 text-sm font-medium bg-[#f5a623] text-black rounded-lg hover:bg-[#ffd700] transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
