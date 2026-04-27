'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { RichBioEditor } from './RichBioEditor';

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
  const [saveError, setSaveError] = useState<string | null>(null);

  const isAdvisor = initialRole === 'advisory';

  // Profile completeness across the four fields the team page shows
  const completeness = (() => {
    let pct = 0;
    if (bio.trim().length >= 30) pct += 40;
    else if (bio.trim().length > 0) pct += 20;
    if (photoUrl.trim().length > 0) pct += 30;
    if (scope.trim().length > 0 || isAdvisor) pct += 20;
    if (links.trim().length > 0) pct += 10;
    return pct;
  })();

  async function save() {
    setBusy(true);
    setMsg(null);
    setSaveError(null);
    try {
      const res = await fetch('/api/stock/team/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, links, photo_url: photoUrl, scope }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const fallback = res.status === 401
          ? 'Session expired. Refresh the page and log in again.'
          : res.status === 413
            ? 'Bio is too long - keep it under 2000 characters.'
            : `Save failed (HTTP ${res.status})`;
        setSaveError(data?.error || fallback);
      } else {
        setEditing(false);
        setPhotoBroken(false);
        setMsg('Profile saved');
        setTimeout(() => setMsg(null), 2500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown';
      setSaveError(`Network error - ${message}. Check your connection and try again.`);
    } finally {
      setBusy(false);
    }
  }

  const hasBio = bio.trim().length > 0;
  const showPhoto = photoUrl.trim() && !photoBroken;

  return (
    <div className="bg-[#0d1b2a] rounded-xl p-4 border border-white/[0.08] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-[#f5a623] font-bold">Your Profile</p>
          <span className="text-[10px] text-gray-600">·</span>
          <span className={`text-[10px] font-bold ${completeness === 100 ? 'text-emerald-400' : completeness >= 60 ? 'text-amber-300' : 'text-gray-500'}`}>
            {completeness}% complete
          </span>
        </div>
        {!editing && hasBio && (
          <button
            onClick={() => setEditing(true)}
            className="text-[10px] text-gray-500 hover:text-gray-300"
          >
            Edit
          </button>
        )}
      </div>
      <div className="h-0.5 w-full bg-[#0a1628] rounded-full overflow-hidden -mt-2">
        <div
          className={`h-full transition-all duration-500 ${completeness === 100 ? 'bg-emerald-400' : 'bg-[#f5a623]'}`}
          style={{ width: `${completeness}%` }}
        />
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
            <div className="bio-rendered text-sm text-gray-200 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{bio}</ReactMarkdown>
            </div>
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

          {/* Rich text bio editor (Tiptap) - WYSIWYG with markdown storage */}
          <RichBioEditor
            value={bio}
            onChange={setBio}
            placeholder={`Who you are, what you bring to ZAOstock, what you're working on. Hit Enter for new paragraphs. Use the toolbar above for bold, italic, headings, lists, links.`}
            maxLength={2000}
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

          {saveError && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-lg px-3 py-2.5 text-[12px] text-red-300 leading-relaxed">
              <strong className="text-red-200">Couldn&rsquo;t save.</strong> {saveError}
            </div>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={save}
              disabled={busy}
              className="bg-[#f5a623] hover:bg-[#ffd700] disabled:opacity-50 text-black font-bold rounded px-4 py-2 text-sm transition-colors min-w-[88px]"
            >
              {busy ? 'Saving...' : 'Save'}
            </button>
            {hasBio && (
              <button
                onClick={() => { setEditing(false); setSaveError(null); }}
                disabled={busy}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1"
              >
                Cancel
              </button>
            )}
            {msg && (
              <div className="flex items-center gap-1.5 ml-auto bg-emerald-500/10 border border-emerald-500/40 rounded-full px-3 py-1">
                <span className="text-emerald-400 text-xs" aria-hidden>&#10003;</span>
                <span className="text-[11px] text-emerald-300 font-medium">{msg}</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-600 italic">
            For the photo: right-click your X or Farcaster profile pic, Copy Image Address, paste above. Or use any image URL that starts with https://.
          </p>
        </div>
      )}
      <style>{`
        .bio-rendered p { margin-bottom: 0.65rem; }
        .bio-rendered p:last-child { margin-bottom: 0; }
        .bio-rendered h1, .bio-rendered h2, .bio-rendered h3 {
          color: #f5a623; font-weight: 700; margin: 0.75rem 0 0.4rem;
        }
        .bio-rendered h1 { font-size: 1.05rem; }
        .bio-rendered h2 { font-size: 0.95rem; }
        .bio-rendered h3 { font-size: 0.875rem; }
        .bio-rendered ul, .bio-rendered ol { margin: 0.4rem 0 0.65rem 1.25rem; }
        .bio-rendered ul { list-style: disc; }
        .bio-rendered ol { list-style: decimal; }
        .bio-rendered li { margin-bottom: 0.2rem; }
        .bio-rendered strong { color: #fff; font-weight: 700; }
        .bio-rendered em { color: #fbbf24; font-style: italic; }
        .bio-rendered a { color: #f5a623; text-decoration: underline; }
        .bio-rendered code {
          background: #0a1628; padding: 1px 5px; border-radius: 3px;
          font-size: 0.85em; color: #c7d2fe;
        }
        .bio-rendered blockquote {
          border-left: 2px solid rgba(245, 166, 35, 0.5);
          padding-left: 0.75rem; margin: 0.5rem 0;
          color: #cbd5e1; font-style: italic;
        }
        .bio-rendered hr {
          border: 0; border-top: 1px solid rgba(255,255,255,0.1);
          margin: 0.75rem 0;
        }
      `}</style>
    </div>
  );
}
