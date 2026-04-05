'use client';

import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'fishbowlz_onboarded';

interface OnboardingModalProps {
  onClose: () => void;
}

const steps = [
  {
    icon: '🐟',
    title: 'Welcome to FISHBOWLZ',
    description: 'Persistent audio rooms with a twist — the hot seat rotates speakers in and out, fishbowl-style.',
  },
  {
    icon: '🔥',
    title: 'The Hot Seat',
    description: 'Only a few speakers at a time. When the hot seat is full, listeners can rotate in — the longest-seated speaker steps out.',
  },
  {
    icon: '📝',
    title: 'Everything is Recorded',
    description: 'Transcripts capture the conversation. Chat alongside the audio. Share rooms with a link. Rooms persist even after they end.',
  },
];

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const finish = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    onClose();
  };

  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e3148] rounded-2xl p-8 w-full max-w-md border border-white/[0.08] text-center">
        {/* Step indicator */}
        <div className="flex justify-center gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? 'w-6 bg-[#f5a623]' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-[#0a1628] border-2 border-[#f5a623]/30 flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">{steps[step].icon}</span>
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-white mb-3">{steps[step].title}</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">{steps[step].description}</p>

        {/* Actions */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 border border-white/20 py-2.5 rounded-lg text-sm hover:bg-white/5 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={isLast ? finish : () => setStep(step + 1)}
            className="flex-1 bg-[#f5a623] text-[#0a1628] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#ffd700] transition-colors"
          >
            {isLast ? 'Get Started' : 'Next'}
          </button>
        </div>

        {/* Skip */}
        <button
          onClick={finish}
          className="mt-4 text-xs text-gray-500 hover:text-gray-400 transition-colors"
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}

/** Hook to check if onboarding should show */
export function useShowOnboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) setShow(true);
  }, []);

  return { show, dismiss: () => setShow(false) };
}
