'use client';

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { QuotedCastData } from '@/types';
import { MentionAutocomplete } from './MentionAutocomplete';
import { communityConfig } from '@/../community.config';

const ALL_CHANNELS = communityConfig.farcaster.channels.map((id) => ({ id, label: `#${id}` }));

export interface ReplyContext {
  hash: string;
  authorName: string;
  text: string;
}

interface ComposeBarProps {
  hasSigner: boolean;
  onSend: (text: string, parentHash?: string, embedHash?: string, crossPostChannels?: string[], embedUrls?: string[], embedFid?: number) => Promise<void>;
  sending?: boolean;
  channel?: string;
  quotedCast?: QuotedCastData | null;
  onClearQuote?: () => void;
  onSchedule?: () => void;
  replyTo?: ReplyContext | null;
  onClearReply?: () => void;
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
}, ref) {
  const [text, setText] = useState('');
  const [showCrossPost, setShowCrossPost] = useState(false);
  const [crossPostChannels, setCrossPostChannels] = useState<Set<string>>(new Set());
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [imagePreview, setImagePreview] = useState<{ url: string; file?: File } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

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
        await onSend(msg || ' ', parentHash, quotedCast?.hash, crossPost, embedUrls, quotedCast?.author.fid);
        setText('');
        removeImage();
        onClearQuote?.();
        onClearReply?.();
        setCrossPostChannels(new Set());
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
    } catch {
      // Error silently
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

  const otherChannels = ALL_CHANNELS.filter((ch) => ch.id !== channel);

  return (
    <div className="border-t border-gray-800 bg-[#0d1b2a] relative">
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
        <div className="px-3 pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500">Also post to:</span>
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
        </div>
      )}

      <div className="p-3">
        <div className="flex gap-2 items-end">
          {/* Cross-post toggle */}
          {hasSigner && (
            <button
              onClick={() => {
                if (showCrossPost) {
                  // Closing: clear selections too
                  setShowCrossPost(false);
                  setCrossPostChannels(new Set());
                } else {
                  setShowCrossPost(true);
                }
              }}
              className={`relative flex-shrink-0 p-2.5 rounded-lg transition-colors ${
                showCrossPost || crossPostChannels.size > 0
                  ? 'text-[#f5a623] bg-[#f5a623]/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
              title="Cross-post to other channels"
              aria-label="Cross-post to other channels"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              {crossPostChannels.size > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#f5a623] text-[#0a1628] rounded-full text-[8px] font-bold flex items-center justify-center">
                  {crossPostChannels.size}
                </span>
              )}
            </button>
          )}

          {/* Image upload */}
          {hasSigner && (
            <>
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
                className={`flex-shrink-0 p-2.5 rounded-lg transition-colors ${
                  imagePreview
                    ? 'text-[#f5a623] bg-[#f5a623]/10'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
                title="Attach image"
                aria-label="Attach image"
                disabled={uploading}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a2.25 2.25 0 002.25-2.25V5.25a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
              </button>
            </>
          )}

          {/* Schedule toggle */}
          {hasSigner && (
            <button
              onClick={() => setShowSchedule(!showSchedule)}
              className={`flex-shrink-0 p-2.5 rounded-lg transition-colors ${
                showSchedule
                  ? 'text-[#f5a623] bg-[#f5a623]/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
              title="Schedule post"
              aria-label="Schedule post"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={
              replyTo
                ? `Reply to ${replyTo.authorName}...`
                : quotedCast
                  ? 'Add a comment...'
                  : hasSigner
                    ? `Message #${channel}... (type @ to mention)`
                    : `Message #${channel}, post via Farcaster...`
            }
            rows={1}
            maxLength={1024}
            disabled={sending}
            className="flex-1 bg-[#1a2a3a] text-white text-sm rounded-lg px-4 py-2.5 resize-none placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#f5a623] disabled:opacity-50"
          />
          <button
            onClick={handleSubmit}
            disabled={(!text.trim() && !imagePreview) || sending}
            className="bg-[#f5a623] text-[#0a1628] font-medium px-4 py-2.5 rounded-lg text-sm hover:bg-[#ffd700] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
          >
            {sending ? (
              <span className="w-4 h-4 border-2 border-[#0a1628] border-t-transparent rounded-full animate-spin" />
            ) : !hasSigner ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            )}
            {sending ? 'Sending' : crossPostChannels.size > 0 ? `Post (${crossPostChannels.size + 1})` : 'Post'}
          </button>
        </div>
        {!hasSigner && (
          <p className="text-xs text-gray-600 mt-1.5">Opens in Farcaster to post to /{channel} channel</p>
        )}
      </div>
    </div>
  );
});
