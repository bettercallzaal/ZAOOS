'use client';

import { useState } from 'react';

interface Props {
  memberName: string;
  initialBio: string;
  initialLinks: string;
}

export function BioEditor({ memberName, initialBio, initialLinks }: Props) {
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState(initialLinks);
  const [editing, setEditing] = useState(initialBio.trim().length === 0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/stock/team/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, links }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg(data.error || 'Save failed');
      } else {
        setEditing(false);
        setMsg('Saved');
        setTimeout(() => setMsg(null), 1500);
      }
    } catch {
      setMsg('Network error');
    } finally {
      setBusy(false);
    }
  }

  const hasBio = bio.trim().length > 0;

  return (
    <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-[#f5a623] font-bold">Your Profile</p>
        {!editing && hasBio && (
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] text-gray-500 hover:text-gray-300"
          >
            Edit
          </button>
        )}
      </div>

      {!editing && hasBio && (
        <div className="space-y-2">
          <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{bio}</p>
          {links.trim() && (
            <p className="text-[11px] text-gray-500">{links}</p>
          )}
        </div>
      )}

      {(editing || !hasBio) && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">
            {hasBio
              ? `Editing ${memberName}'s bio.`
              : `Hey ${memberName}, drop a quick bio so the team knows who you are.`}
          </p>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Who you are, what you bring to ZAOstock, what you're working on, anything you want the team and public to know..."
            rows={5}
            maxLength={2000}
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30 resize-none"
          />
          <input
            value={links}
            onChange={(e) => setLinks(e.target.value)}
            placeholder="Links (optional) - e.g. x.com/zaal, farcaster.xyz/zaal"
            maxLength={500}
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={busy}
              className="bg-[#f5a623] hover:bg-[#ffd700] disabled:opacity-50 text-black font-bold rounded px-3 py-1.5 text-xs transition-colors"
            >
              {busy ? 'Saving...' : 'Save'}
            </button>
            {hasBio && (
              <button
                onClick={() => setEditing(false)}
                disabled={busy}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Cancel
              </button>
            )}
            {msg && <p className="text-[10px] text-emerald-400 ml-auto">{msg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
