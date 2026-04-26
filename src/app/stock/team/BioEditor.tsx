'use client';

import { useState } from 'react';

// Try to coerce common share-link formats into a direct image URL the
// browser can render in an <img> tag. Returns the original on no-op.
function normalizePhotoUrl(input: string): string {
  const url = input.trim();
  if (!url) return url;

  // Already an obvious direct image
  if (/\.(png|jpe?g|webp|gif|avif)(\?|#|$)/i.test(url)) return url;

  // Imgur single-image page: imgur.com/abc123 -> i.imgur.com/abc123.jpg
  const imgurSingle = url.match(/^https?:\/\/(?:www\.)?imgur\.com\/([A-Za-z0-9]{5,})(?:[?#].*)?$/);
  if (imgurSingle) return `https://i.imgur.com/${imgurSingle[1]}.jpg`;

  // i.imgur.com without extension
  const iImgur = url.match(/^https?:\/\/i\.imgur\.com\/([A-Za-z0-9]{5,})(?:[?#].*)?$/);
  if (iImgur) return `https://i.imgur.com/${iImgur[1]}.jpg`;

  return url;
}

const SCOPE_OPTIONS: Array<{ value: string; label: string; hint: string }> = [
  { value: '', label: 'Not picked yet', hint: 'decide later' },
  { value: 'ops', label: 'Operations', hint: 'logistics, partnerships, run-of-show' },
  { value: 'music', label: 'Music', hint: 'artist outreach, lineup, sound' },
  { value: 'design', label: 'Design', hint: 'shirts, signage, brand' },
];

interface Props {
  memberName: string;
  initialBio: string;
  initialLinks: string;
  initialPhotoUrl: string;
  initialScope: string;
  initialRole: string;
}

export function BioEditor({ memberName, initialBio, initialLinks, initialPhotoUrl, initialScope, initialRole }: Props) {
  const [bio, setBio] = useState(initialBio);
  const [links, setLinks] = useState(initialLinks);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [scope, setScope] = useState(initialScope);
  const [editing, setEditing] = useState(initialBio.trim().length === 0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [photoBroken, setPhotoBroken] = useState(false);

  const isAdvisor = initialRole === 'advisory';

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/stock/team/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, links, photo_url: photoUrl, scope }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMsg(data.error || 'Save failed');
      } else {
        setEditing(false);
        setPhotoBroken(false);
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
  const showPhoto = photoUrl.trim() && !photoBroken;

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
        <div className="flex items-start gap-3">
          {showPhoto && (
            <img
              src={photoUrl}
              alt={`${memberName} profile`}
              onError={() => setPhotoBroken(true)}
              className="w-16 h-16 rounded-full object-cover border border-white/[0.08] flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{bio}</p>
            {links.trim() && (
              <p className="text-[11px] text-gray-500">{links}</p>
            )}
          </div>
        </div>
      )}

      {(editing || !hasBio) && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">
            {hasBio
              ? `Editing ${memberName}'s profile.`
              : `Hey ${memberName}, drop a quick bio so the team knows who you are.`}
          </p>

          {showPhoto && (
            <img
              src={photoUrl}
              alt="Preview"
              onError={() => setPhotoBroken(true)}
              className="w-20 h-20 rounded-full object-cover border border-[#f5a623]/30"
            />
          )}

          <input
            value={photoUrl}
            onChange={(e) => { setPhotoUrl(e.target.value); setPhotoBroken(false); }}
            onBlur={(e) => {
              const normalized = normalizePhotoUrl(e.target.value);
              if (normalized !== e.target.value) { setPhotoUrl(normalized); setPhotoBroken(false); }
            }}
            placeholder="Photo URL (https://...) - paste your X/Farcaster/Imgur pfp link"
            maxLength={500}
            className="w-full bg-[#0a1628] border border-white/[0.08] rounded px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#f5a623]/30"
          />
          {photoBroken && photoUrl.trim() && (
            <div className="text-[10px] text-amber-400 space-y-0.5">
              <p>That URL didn&rsquo;t load as an image. A few quick fixes:</p>
              <ul className="ml-3 list-disc space-y-0.5 text-amber-300/80">
                <li>Imgur album (<code>imgur.com/a/...</code>): open the album, right-click the image, &ldquo;Copy image address&rdquo;.</li>
                <li>X profile pic: open your profile, right-click your avatar, &ldquo;Copy image address&rdquo;.</li>
                <li>Or upload to <a href="https://postimages.org" target="_blank" rel="noreferrer" className="underline">postimages.org</a> and use the &ldquo;Direct link&rdquo;.</li>
              </ul>
              <p>The URL must end in .jpg / .png / .webp.</p>
            </div>
          )}

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Who you are, what you bring to ZAOstock, what you're working on, anything you want the team to know..."
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

          {!isAdvisor && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                Your team (internal - controls which todos you see)
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setScope(opt.value)}
                    className={`text-left px-3 py-2 rounded border text-xs transition-colors ${
                      scope === opt.value
                        ? 'border-[#f5a623] bg-[#f5a623]/10 text-[#f5a623]'
                        : 'border-white/[0.08] bg-[#0a1628] text-gray-300 hover:border-white/20'
                    }`}
                  >
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{opt.hint}</div>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 italic">
                You can switch any time. Publicly you just show as &ldquo;Team member&rdquo;.
              </p>
            </div>
          )}

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
          <p className="text-[10px] text-gray-600 italic">
            For the photo: right-click your X or Farcaster profile pic, Copy Image Address, paste above. Or use any image URL that starts with https://.
          </p>
        </div>
      )}
    </div>
  );
}
