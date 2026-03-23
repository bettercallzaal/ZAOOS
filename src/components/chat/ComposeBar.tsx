'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { QuotedCastData } from '@/types';
import { MentionAutocomplete } from './MentionAutocomplete';
import { PlatformToggles } from '@/components/compose/PlatformToggles';
import { PublishButton } from '@/components/compose/PublishButton';
import { communityConfig } from '@/../community.config';

const ALL_CHANNELS = communityConfig.farcaster.channels.map((id) => ({ id, label: `#${id}` }));

export interface ReplyContext {
  hash: string;
  authorName: string;
  text: string;
}

interface ComposeBarProps {
  hasSigner: boolean;
  onSend: (text: string, parentHash?: string, embedHash?: string, crossPostChannels?: string[], embedUrls?: string[], embedFid?: number, crossPostBluesky?: boolean, crossPostLens?: boolean, crossPostX?: boolean, crossPostHive?: boolean) => Promise<void>;
  sending?: boolean;
  channel?: string;
  quotedCast?: QuotedCastData | null;
  onClearQuote?: () => void;
  onSchedule?: () => void;
  replyTo?: ReplyContext | null;
  onClearReply?: () => void;
  isAdmin?: boolean;
}

export interface ComposeBarHandle {
  focus: () => void;
}

export const ComposeBar = forwardRef<ComposeBarHandle, ComposeBarProps>(function ComposeBar({
  hasSigner,
  onSend,
  sending,
  channel = 'zao',
  quotedCast,
  onClearQuote,
  onSchedule,
  replyTo,
  onClearReply,
  isAdmin = false,
}, ref) {
  const [text, setText] = useState('');
  const [showCrossPost, setShowCrossPost] = useState(false);
  const [crossPostChannels, setCrossPostChannels] = useState<Set<string>>(new Set());
  const [crossPostBluesky, setCrossPostBluesky] = useState(false);
  const [crossPostLens, setCrossPostLens] = useState(false);
  const [crossPostX, setCrossPostX] = useState(false);
  const [crossPostHive, setCrossPostHive] = useState(false);
  const [crossPostEnabled, setCrossPostEnabled] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  const [platformToast, setPlatformToast] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [imagePreview, setImagePreview] = useState<{ url: string; file?: File } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  // Fetch connected platforms and publishing prefs on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users/profile');
        if (!res.ok) return;
        const data = await res.json();
        const profile = data.profile || data;
        const connected = new Set<string>();
        if (profile.bluesky_handle) connected.add('bluesky');
        if (profile.lens_profile_id) connected.add('lens');
        if (profile.hive_username) connected.add('hive');
        if (isAdmin) connected.add('x');
        setConnectedPlatforms(connected);

        // Apply saved publishing defaults
        const prefs = profile.publishing_prefs;
        if (prefs) {
          if (prefs.crossPostBluesky && connected.has('bluesky')) setCrossPostBluesky(true);
          if (prefs.crossPostLens && connected.has('lens')) setCrossPostLens(true);
          if (prefs.crossPostX && connected.has('x')) setCrossPostX(true);
          if (prefs.crossPostHive && connected.has('hive')) setCrossPostHive(true);
          if (prefs.crossPostBluesky || prefs.crossPostLens || prefs.crossPostX || prefs.crossPostHive) {
            setCrossPostEnabled(true);
          }
        }
      } catch {
        // Silently fail — user can still post to Farcaster
      }
    })();
  }, [isAdmin]);

  // Revoke any active blob URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview?.url.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview.url);
      }
    };
  }, [imagePreview]);

  const handleImageSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return;

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setImagePreview({ url: previewUrl, file });
  };

  const removeImage = () => {
    if (imagePreview?.url.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    const msg = text.trim();
    if (!msg && !imagePreview) return;

    if (hasSigner) {
      try {
        setUploadError(null);
        let embedUrls: string[] | undefined;

        // Upload image if attached
        if (imagePreview?.file) {
          setUploading(true);
          const formData = new FormData();
          formData.append('file', imagePreview.file);
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
          if (!uploadRes.ok) throw new Error('Image upload failed');
          const { url: imageUrl } = await uploadRes.json();
          embedUrls = [imageUrl];
          setUploading(false);
        }

        const crossPost = crossPostChannels.size > 0 ? [...crossPostChannels] : undefined;
        const parentHash = replyTo?.hash || undefined;
        await onSend(
          msg || ' ',
          parentHash,
          quotedCast?.hash,
          crossPost,
          embedUrls,
          quotedCast?.author.fid,
          crossPostBluesky || undefined,
          crossPostLens || undefined,
          crossPostX || undefined,
          crossPostHive || undefined,
        );
        setText('');
        removeImage();
        onClearQuote?.();
        onClearReply?.();
        setCrossPostChannels(new Set());
        setCrossPostBluesky(false);
        setCrossPostLens(false);
        setCrossPostX(false);
        setCrossPostHive(false);
        setShowCrossPost(false);
      } catch (err) {
        setUploading(false);
        setUploadError(err instanceof Error ? err.message : 'Failed to upload image');
      }
    } else {
      const encoded = encodeURIComponent(msg);
      const url = `https://warpcast.com/~/compose?text=${encoded}&channelKey=${channel}`;
      window.open(url, '_blank');
      setText('');
    }
  };

  const handleSchedule = async () => {
    const msg = text.trim();
    if (!msg || !scheduleTime) return;

    try {
      const crossPost = crossPostChannels.size > 0 ? [...crossPostChannels] : undefined;
      const res = await fetch('/api/chat/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: msg,
          channel,
          scheduledFor: new Date(scheduleTime).toISOString(),
          crossPostChannels: crossPost,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to schedule');
      }
      setText('');
      setShowSchedule(false);
      setScheduleTime('');
      setCrossPostChannels(new Set());
      setShowCrossPost(false);
      onSchedule?.();
    } catch (err) {
      console.error('[ComposeBar] send failed:', err);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    // Detect @mention
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);

    // Find the last @ that starts a mention (preceded by space or start of string)
    const mentionMatch = textBeforeCursor.match(/(^|[\s])@([a-zA-Z0-9._-]*)$/);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[2]);
      setMentionStart(cursorPos - mentionMatch[2].length);
    } else {
      setMentionQuery(null);
    }
  };

  const handleMentionSelect = useCallback((username: string) => {
    // Replace the @query with @username
    const before = text.slice(0, mentionStart);
    const after = text.slice(mentionStart + (mentionQuery?.length || 0));
    const newText = `${before}${username} ${after}`;
    setText(newText);
    setMentionQuery(null);

    // Refocus textarea
    setTimeout(() => {
      const pos = mentionStart + username.length + 1;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(pos, pos);
    }, 0);
  }, [text, mentionStart, mentionQuery]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If mention dropdown is open, let it handle arrow/enter/tab/esc
    if (mentionQuery !== null && mentionQuery.length >= 1) {
      if (['ArrowDown', 'ArrowUp', 'Tab', 'Escape'].includes(e.key)) {
        return; // handled by MentionAutocomplete
      }
      if (e.key === 'Enter') {
        return; // let MentionAutocomplete handle Enter for selection
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !sending) handleSubmit();
    }
  };

  const toggleCrossPost = (ch: string) => {
    setCrossPostChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file);
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) handleImageSelect(file);
        return;
      }
    }
  }, []);

  const otherChannels = ALL_CHANNELS.filter((ch) => ch.id !== channel);

  // Compute selectedPlatforms for PlatformToggles
  const selectedPlatforms = new Set<string>();
  selectedPlatforms.add('farcaster');
  if (crossPostBluesky) selectedPlatforms.add('bluesky');
  if (crossPostLens) selectedPlatforms.add('lens');
  if (crossPostX) selectedPlatforms.add('x');
  if (crossPostHive) selectedPlatforms.add('hive');

  const handlePlatformToggle = (platform: string) => {
    switch (platform) {
      case 'bluesky': setCrossPostBluesky((v) => !v); break;
      case 'lens': setCrossPostLens((v) => !v); break;
      case 'x': setCrossPostX((v) => !v); break;
      case 'hive': setCrossPostHive((v) => !v); break;
    }
  };

  // Total platform count (farcaster + selected cross-posts + farcaster cross-post channels)
  const platformCount = selectedPlatforms.size + crossPostChannels.size;

  return (
    <div
      className="border-t border-gray-800 bg-[#0d1b2a] relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag-and-drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#0a1628]/80 border-2 border-dashed border-[#f5a623] rounded-lg pointer-events-none">
          <span className="text-[#f5a623] text-sm font-medium">Drop image here</span>
        </div>
      )}

      {/* Mention autocomplete */}
      {mentionQuery !== null && mentionQuery.length >= 1 && (
        <MentionAutocomplete
          query={mentionQuery}
          onSelect={handleMentionSelect}
          onClose={() => setMentionQuery(null)}
          position={{ bottom: 70, left: 16 }}
        />
      )}

      {/* Reply preview */}
      {replyTo && (
        <div className="px-3 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a1628] border border-[#f5a623]/30">
            <svg className="w-3.5 h-3.5 text-[#f5a623] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[#f5a623]">
                Replying to {replyTo.authorName}
              </span>
              <p className="text-xs text-gray-500 truncate">{replyTo.text}</p>
            </div>
            <button
              onClick={onClearReply}
              className="text-gray-500 hover:text-white flex-shrink-0"
              aria-label="Cancel reply"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Quote preview */}
      {quotedCast && (
        <div className="px-3 pt-2">
          <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[#0a1628] border border-gray-700">
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-[#f5a623]">
                Quoting {quotedCast.author.display_name || quotedCast.author.username}
              </span>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{quotedCast.text}</p>
            </div>
            <button
              onClick={onClearQuote}
              className="text-gray-500 hover:text-white flex-shrink-0 mt-0.5"
              aria-label="Remove quote"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="px-3 pt-2">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob preview URL not compatible with next/image */}
            <img
              src={imagePreview.url}
              alt="Upload preview"
              className="h-20 rounded-lg border border-gray-700 object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-400"
              aria-label="Remove image"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload error message */}
      {uploadError && (
        <div className="px-3 pt-1">
          <p className="text-xs text-red-400">{uploadError}</p>
        </div>
      )}

      {/* Schedule picker */}
      {showSchedule && hasSigner && (
        <div className="px-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Schedule ({Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()}):</span>
            <input
              type="datetime-local"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              min={(() => { const d = new Date(Date.now() + 60_000); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; })()}
              className="bg-[#1a2a3a] text-white text-xs rounded-lg px-2 py-1.5 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-[#f5a623]"
            />
            <button
              onClick={handleSchedule}
              disabled={!text.trim() || !scheduleTime}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#f5a623] text-[#0a1628] font-medium disabled:opacity-50 hover:bg-[#ffd700] transition-colors"
            >
              Schedule
            </button>
            <button
              onClick={() => { setShowSchedule(false); setScheduleTime(''); }}
              className="text-xs text-gray-500 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Cross-post selector */}
      {showCrossPost && hasSigner && (
        <div className="px-3 pt-2 space-y-2">
          {/* Farcaster cross-post channels */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Farcaster channels:</span>
            {otherChannels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => toggleCrossPost(ch.id)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  crossPostChannels.has(ch.id)
                    ? 'border-[#f5a623] bg-[#f5a623]/10 text-[#f5a623]'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>
          {/* Platform toggles */}
          <PlatformToggles
            selectedPlatforms={selectedPlatforms}
            onToggle={handlePlatformToggle}
            onNotConnected={(platform) => {
              setPlatformToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} not connected`);
              setTimeout(() => setPlatformToast(null), 3000);
            }}
            connectedPlatforms={connectedPlatforms}
            isAdmin={isAdmin}
          />
          {platformToast && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400">
              <span>{platformToast} —</span>
              <a href="/settings" className="text-[#f5a623] font-medium hover:underline">Go to Settings</a>
            </div>
          )}
        </div>
      )}

      <div className="p-3">
        {/* Action buttons row — above the input */}
        {hasSigner && (
          <div className="flex gap-1 mb-2 px-1">
            {/* Cross-post toggle — now handled by PublishButton below */}

            {/* Image upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageSelect(file);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                imagePreview
                  ? 'text-[#f5a623] bg-[#f5a623]/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
              title="Attach image"
              aria-label="Attach image"
              disabled={uploading}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </button>

            {/* Schedule toggle */}
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${
                showSchedule
                  ? 'text-[#f5a623] bg-[#f5a623]/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
              title="Schedule post"
              aria-label="Schedule post"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        )}

        {/* Input row — textarea + send only */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              replyTo
                ? `Reply to ${replyTo.authorName}...`
                : quotedCast
                  ? 'Add a comment...'
                  : hasSigner
                    ? `Message #${channel}... (type @ to mention)`
                    : 'Connect Farcaster to post in channels...'
            }
            rows={1}
            maxLength={1024}
            disabled={sending}
            className="flex-1 bg-[#1a2a3a] text-white text-base md:text-sm rounded-lg px-4 py-2.5 resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] disabled:opacity-50"
          />
          {hasSigner ? (
            <PublishButton
              platformCount={platformCount}
              crossPostEnabled={crossPostEnabled}
              onToggleCrossPost={() => {
                const next = !crossPostEnabled;
                setCrossPostEnabled(next);
                if (next) {
                  setShowCrossPost(true);
                } else {
                  setShowCrossPost(false);
                  setCrossPostChannels(new Set());
                  setCrossPostBluesky(false);
                  setCrossPostLens(false);
                  setCrossPostX(false);
                  setCrossPostHive(false);
                }
              }}
              onSubmit={handleSubmit}
              disabled={(!text.trim() && !imagePreview) || false}
              loading={sending || false}
            />
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!text.trim() && !imagePreview}
              className="bg-[#f5a623] text-[#0a1628] font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-[#ffd700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
              Post
            </button>
          )}
        </div>
        {!hasSigner && (
          <p className="text-xs text-gray-600 mt-1.5">Opens in Farcaster to post to /{channel} channel</p>
        )}
      </div>
    </div>
  );
});
