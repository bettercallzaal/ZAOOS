'use client';

import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [previewMode, setPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isAdvisor = initialRole === 'advisory';

  // ----- Markdown formatting helpers -----------------------------------------
  function applyToSelection(transform: (selected: string, before: string, after: string) => { text: string; cursorOffset?: number }) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = bio.slice(0, start);
    const selected = bio.slice(start, end);
    const after = bio.slice(end);
    const result = transform(selected, before, after);
    setBio(result.text);
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = result.cursorOffset ?? start + (result.text.length - bio.length);
      ta.setSelectionRange(cursor, cursor);
    });
  }

  function wrap(open: string, close: string = open, placeholder: string = '') {
    applyToSelection((sel, before, after) => {
      const inner = sel || placeholder;
      const text = before + open + inner + close + after;
      const cursorOffset = sel
        ? before.length + open.length + sel.length + close.length
        : before.length + open.length;
      return { text, cursorOffset };
    });
  }

  function prefixLines(prefix: string, placeholder: string = '') {
    applyToSelection((sel, before, after) => {
      const lineStart = before.lastIndexOf('\n') + 1;
      const beforeLine = bio.slice(0, lineStart);
      const restOfLine = bio.slice(lineStart, before.length) + sel;
      const inner = restOfLine.trim().length === 0 ? placeholder : restOfLine;
      const lines = inner.split('\n').map((l) => (l.trim().length ? `${prefix}${l}` : l)).join('\n');
      const text = beforeLine + lines + after;
      return { text };
    });
  }

  function insertText(snippet: string, placeholderLen: number = 0) {
    applyToSelection((_sel, before, after) => {
      const text = before + snippet + after;
      const cursorOffset = before.length + snippet.length - placeholderLen;
      return { text, cursorOffset };
    });
  }

  const TOOLBAR: Array<{ key: string; label: string; title: string; action: () => void }> = [
    { key: 'b', label: 'B', title: 'Bold (wraps selection in **)', action: () => wrap('**', '**', 'bold text') },
    { key: 'i', label: 'I', title: 'Italic', action: () => wrap('*', '*', 'italic text') },
    { key: 'h2', label: 'H', title: 'Heading', action: () => prefixLines('## ', 'Section title') },
    { key: 'ul', label: '• List', title: 'Bullet list', action: () => prefixLines('- ', 'item') },
    { key: 'ol', label: '1. List', title: 'Numbered list', action: () => prefixLines('1. ', 'item') },
    { key: 'quote', label: '" Quote', title: 'Blockquote', action: () => prefixLines('> ', 'a quote') },
    { key: 'link', label: 'Link', title: 'Link', action: () => wrap('[', '](https://)', 'link text') },
    { key: 'hr', label: '— Divider', title: 'Horizontal rule', action: () => insertText('\n\n---\n\n') },
    { key: 'para', label: '¶ Para', title: 'New paragraph', action: () => insertText('\n\n') },
  ];

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

          {/* Bio editor: tabs + toolbar + textarea/preview */}
          <div className="border border-white/[0.08] rounded overflow-hidden">
            {/* Tab strip */}
            <div className="flex bg-[#0a1628] border-b border-white/[0.08]">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${!previewMode ? 'text-[#f5a623] bg-[#0d1b2a]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-1.5 text-[11px] font-semibold transition-colors ${previewMode ? 'text-[#f5a623] bg-[#0d1b2a]' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Preview
              </button>
              <div className="ml-auto px-3 py-1.5 text-[10px] text-gray-600 self-center">
                {bio.length}/2000
              </div>
            </div>

            {!previewMode && (
              <>
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 bg-[#0a1628] border-b border-white/[0.08] px-2 py-1.5">
                  {TOOLBAR.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      title={t.title}
                      onClick={t.action}
                      className="text-[11px] px-2 py-1 rounded text-gray-300 hover:bg-[#f5a623]/10 hover:text-[#f5a623] transition-colors font-mono"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={textareaRef}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={`Who you are, what you bring to ZAOstock, what you're working on, anything you want the team to know.\n\nHit Enter twice for a new paragraph. Use the toolbar above for bold/italic/lists/links.`}
                  rows={10}
                  maxLength={2000}
                  className="w-full bg-[#0a1628] px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none resize-y font-mono leading-relaxed border-0"
                />
              </>
            )}

            {previewMode && (
              <div className="bg-[#0a1628] px-4 py-3 min-h-[260px]">
                {bio.trim().length === 0 ? (
                  <p className="text-xs text-gray-600 italic">Nothing to preview yet. Switch back to Write.</p>
                ) : (
                  <div className="bio-rendered text-sm text-gray-200 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{bio}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>

          <details className="text-[10px] text-gray-500">
            <summary className="cursor-pointer hover:text-gray-400">Formatting cheat sheet</summary>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 leading-relaxed pl-2">
              <span><code className="text-gray-300">**bold**</code> &rarr; <strong className="text-white">bold</strong></span>
              <span><code className="text-gray-300">*italic*</code> &rarr; <em className="text-amber-400">italic</em></span>
              <span><code className="text-gray-300">## Heading</code></span>
              <span><code className="text-gray-300">### Subheading</code></span>
              <span><code className="text-gray-300">- bullet</code> for a list</span>
              <span><code className="text-gray-300">1. item</code> numbered</span>
              <span><code className="text-gray-300">[label](https://url)</code></span>
              <span><code className="text-gray-300">&gt; quote</code> blockquote</span>
              <span><code className="text-gray-300">---</code> horizontal divider</span>
              <span><strong className="text-gray-400">Blank line</strong> &rarr; new paragraph</span>
            </div>
          </details>
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
