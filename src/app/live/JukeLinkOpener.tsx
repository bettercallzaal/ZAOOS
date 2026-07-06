'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { parseJukeSpaceId } from '@/lib/spaces/juke';

/**
 * Client component for the "paste any Juke link" form on /live. Extracted so
 * the parent server component can stay server-rendered.
 */
export function JukeLinkOpener() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openSpace = () => {
    const spaceId = parseJukeSpaceId(value);
    if (!spaceId) {
      setError('That is not a Juke space link or ID. Paste a juke.audio link.');
      return;
    }
    setError(null);
    router.push(`/live/${spaceId}`);
  };

  return (
    <form
      className="w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        openSpace();
      }}
    >
      <label htmlFor="juke-space" className="sr-only">
        Juke space link or ID
      </label>
      <div className="flex gap-2">
        <input
          id="juke-space"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="https://juke.audio/embed/..."
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          className="flex-1 rounded-xl border border-white/[0.08] bg-[#0d1b2a] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-[#f5a623]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623]"
        />
        <button
          type="submit"
          disabled={value.trim().length === 0}
          className="rounded-xl bg-[#f5a623] hover:bg-[#ffd700] px-4 py-2.5 text-sm font-bold text-[#0a1628] transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f5a623] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1628]"
        >
          Open
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </form>
  );
}
