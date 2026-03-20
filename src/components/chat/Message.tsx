'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Cast, CastEmbed, QuotedCastData } from '@/types';
import { isMusicUrl } from '@/lib/music/isMusicUrl';
import { MusicEmbed } from '@/components/music/MusicEmbed';
import { ShareToFarcaster, shareTemplates } from '@/components/social/ShareToFarcaster';

interface MessageProps {
  cast: Cast;
  isAdmin: boolean;
  currentFid: number;
  hasSigner: boolean;
  onHide: (hash: string) => void;
  onOpenThread?: (hash: string) => void;
  onQuote?: (cast: QuotedCastData) => void;
  onOpenProfile?: (fid: number) => void;
  onReply?: (hash: string, authorName: string, text: string) => void;
}

function timeAgo(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  // Show date for older messages
  const isThisYear = date.getFullYear() === now.getFullYear();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  if (isThisYear) return `${month} ${day}, ${time}`;
  return `${month} ${day}, ${date.getFullYear()}`;
}

function safeHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url.slice(0, 40); }
}

function isImageUrl(url: string, embed?: CastEmbed): boolean {
  const contentType = embed?.metadata?.content_type || '';
  if (contentType.startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
}

function isVideoUrl(url: string, embed?: CastEmbed): boolean {
  const contentType = embed?.metadata?.content_type || '';
  if (contentType.startsWith('video/')) return true;
  return /\.(mp4|webm|mov|m3u8)(\?|$)/i.test(url);
}

function EmbedMedia({ embed, castHash }: { embed: CastEmbed; castHash: string }) {
  if (!embed.url) return null;

  // Music embed — replaces OG card for music URLs
  const contentType = embed.metadata?.content_type ?? '';
  if (contentType.startsWith('audio/') || isMusicUrl(embed.url)) {
    return <MusicEmbed url={embed.url} castHash={castHash} />;
  }

  if (isImageUrl(embed.url, embed)) {
    return (
      <a href={embed.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <div className="rounded-lg overflow-hidden max-w-sm bg-gray-800/50" style={{ minHeight: '120px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- external user-shared image URL */}
          <img
            src={embed.url}
            alt="Embedded image"
            className="rounded-lg max-w-full max-h-80 object-cover"
            loading="lazy"
            decoding="async"
            onLoad={(e) => {
              const container = (e.target as HTMLImageElement).parentElement;
              if (container) container.style.minHeight = '0';
            }}
          />
        </div>
      </a>
    );
  }

  if (isVideoUrl(embed.url, embed)) {
    return (
      <video
        src={embed.url}
        controls
        preload="metadata"
        className="rounded-lg max-w-full max-h-80 mt-2"
      />
    );
  }

  const og = embed.metadata?.html;
  if (og && (og.ogTitle || og.ogImage?.[0]?.url)) {
    return (
      <a
        href={embed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 rounded-xl border border-gray-800/60 overflow-hidden hover:border-gray-700 transition-colors group/link"
      >
        {og.ogImage?.[0]?.url && (
          <div className="w-full bg-gray-800/30" style={{ minHeight: '80px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- external OG image URL */}
            <img
              src={og.ogImage[0].url}
              alt={og.ogTitle || 'Link preview image'}
              className="w-full max-h-48 object-cover group-hover/link:opacity-90 transition-opacity"
              loading="lazy"
              decoding="async"
              onLoad={(e) => {
                const container = (e.target as HTMLImageElement).parentElement;
                if (container) container.style.minHeight = '0';
              }}
            />
          </div>
        )}
        {(og.ogTitle || og.ogDescription) && (
          <div className="px-3.5 py-2.5 bg-[#0d1b2a]/80">
            {og.ogTitle && (
              <p className="text-sm font-medium text-gray-200 truncate group-hover/link:text-white transition-colors">{og.ogTitle}</p>
            )}
            {og.ogDescription && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{og.ogDescription}</p>
            )}
            <p className="text-[11px] text-gray-600 mt-1.5 truncate">{safeHostname(embed.url)}</p>
          </div>
        )}
      </a>
    );
  }

  return null;
}

function QuotedCastCard({ cast }: { cast: QuotedCastData }) {
  return (
    <div className="mt-2 flex gap-2.5 px-3 py-2.5 rounded-xl bg-[#0a1628] border border-gray-800/60">
      {cast.author.pfp_url ? (
        <Image
          src={cast.author.pfp_url}
          alt={`${cast.author.display_name || cast.author.username} avatar`}
          width={20}
          height={20}
          className="rounded-full object-cover flex-shrink-0 mt-0.5"
        />
      ) : (
        <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[8px] text-gray-400 font-medium">
            {(cast.author.display_name || cast.author.username || '?')[0]?.toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-gray-300">
          {cast.author.display_name || cast.author.username}
        </span>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-3 break-words">{cast.text}</p>
      </div>
    </div>
  );
}

async function toggleReaction(type: 'like' | 'recast', hash: string, isActive: boolean) {
  const method = isActive ? 'DELETE' : 'POST';
  const res = await fetch('/api/chat/react', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, hash }),
  });
  return res.ok;
}

export function Message({ cast, isAdmin, currentFid, hasSigner, onHide, onOpenThread, onQuote, onOpenProfile, onReply }: MessageProps) {
  const [showMenu, setShowMenu] = useState(false);

  const initialLiked = cast.reactions?.likes?.some((l) => l.fid === currentFid) ?? false;
  const initialRecasted = cast.reactions?.recasts?.some((r) => r.fid === currentFid) ?? false;

  const [liked, setLiked] = useState(initialLiked);
  const [recasted, setRecasted] = useState(initialRecasted);
  const [likeCount, setLikeCount] = useState(cast.reactions?.likes_count ?? 0);
  const [recastCount, setRecastCount] = useState(cast.reactions?.recasts_count ?? 0);

  const embeds = cast.embeds?.filter((e) => e.url) || [];

  // Fallback: scan cast.text for music URLs not already in embeds
  // (Neynar sometimes doesn't resolve embed metadata for music platforms)
  const embedUrls = new Set(embeds.map((e) => e.url));
  const textMusicUrls: string[] = [];
  const urlMatches = cast.text.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/g) ?? [];
  for (const u of urlMatches) {
    if (!embedUrls.has(u) && isMusicUrl(u)) {
      textMusicUrls.push(u);
    }
  }

  const handleLike = async () => {
    if (!hasSigner) return;
    const prev = liked;
    setLiked(!prev);
    setLikeCount((c) => c + (prev ? -1 : 1));
    const ok = await toggleReaction('like', cast.hash, prev);
    if (!ok) {
      setLiked(prev);
      setLikeCount((c) => c + (prev ? 1 : -1));
    }
  };

  const handleRecast = async () => {
    if (!hasSigner) return;
    const prev = recasted;
    setRecasted(!prev);
    setRecastCount((c) => c + (prev ? -1 : 1));
    const ok = await toggleReaction('recast', cast.hash, prev);
    if (!ok) {
      setRecasted(prev);
      setRecastCount((c) => c + (prev ? 1 : -1));
    }
  };

  return (
    <div
      className="group flex gap-3 px-4 py-3 hover:bg-white/[0.02] relative transition-colors"
      onContextMenu={(e) => {
        if (isAdmin) {
          e.preventDefault();
          setShowMenu(!showMenu);
        }
      }}
    >
      {/* Avatar */}
      <button
        onClick={() => onOpenProfile?.(cast.author.fid)}
        className="w-9 h-9 flex-shrink-0 mt-0.5 relative cursor-pointer hover:opacity-80 transition-opacity"
        aria-label={`View ${cast.author.display_name || cast.author.username} profile`}
      >
        {cast.author.pfp_url ? (
          <Image
            src={cast.author.pfp_url}
            alt={cast.author.display_name}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1a2a3a] to-[#0d1b2a] border border-gray-700/50 flex items-center justify-center">
            <span className="text-sm text-gray-400 font-medium">
              {(cast.author.display_name || cast.author.username || '?')[0]?.toUpperCase()}
            </span>
          </div>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {cast.parent_hash && (
          <div className="flex items-center gap-1 mb-0.5">
            <svg className="w-3 h-3 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l-3 3m0 0l-3-3m3 3V4a1 1 0 011-1h10a1 1 0 011 1v3" />
            </svg>
            <span className="text-[10px] text-gray-600">reply</span>
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <button
            onClick={() => onOpenProfile?.(cast.author.fid)}
            className="font-medium text-sm text-white hover:text-[#f5a623] transition-colors cursor-pointer"
          >
            {cast.author.display_name || cast.author.username}
          </button>
          <span className="text-xs text-gray-500">{timeAgo(cast.timestamp)}</span>
        </div>
        <p className="text-sm text-gray-300 break-words whitespace-pre-wrap">{cast.text}</p>

        {/* Quoted casts (cast embeds) */}
        {embeds
          .filter((e) => e.cast)
          .map((e, i) => (
            <QuotedCastCard key={i} cast={e.cast!} />
          ))}

        {/* Media embeds (URL embeds) */}
        {embeds.filter((e) => e.url).length > 0 && (
          <div className="space-y-2">
            {embeds
              .filter((e) => e.url)
              .map((embed, i) => (
                <EmbedMedia key={i} embed={embed} castHash={cast.hash} />
              ))}
          </div>
        )}

        {/* Music URLs found in text but not in embeds */}
        {textMusicUrls.map((url) => (
          <MusicEmbed key={url} url={url} castHash={cast.hash} />
        ))}

        {/* Reactions bar */}
        <div className="flex items-center gap-0.5 mt-2 -ml-2">
          {/* Like */}
          <button
            onClick={handleLike}
            disabled={!hasSigner}
            className={`flex items-center gap-1.5 text-xs min-w-[44px] min-h-[36px] px-2.5 py-1.5 rounded-lg transition-colors ${
              liked ? 'text-red-400 bg-red-400/10' : 'text-gray-500 hover:text-red-400 hover:bg-white/5'
            } disabled:opacity-40 disabled:cursor-default`}
            aria-label={liked ? 'Unlike' : 'Like'}
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {/* Recast */}
          <button
            onClick={handleRecast}
            disabled={!hasSigner}
            className={`flex items-center gap-1.5 text-xs min-w-[44px] min-h-[36px] px-2.5 py-1.5 rounded-lg transition-colors ${
              recasted ? 'text-green-400 bg-green-400/10' : 'text-gray-500 hover:text-green-400 hover:bg-white/5'
            } disabled:opacity-40 disabled:cursor-default`}
            aria-label={recasted ? 'Undo recast' : 'Recast'}
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
            {recastCount > 0 && <span>{recastCount}</span>}
          </button>

          {/* Reply */}
          <button
            onClick={() => onReply?.(cast.hash, cast.author.display_name || cast.author.username, cast.text)}
            className="flex items-center gap-1.5 text-xs min-w-[44px] min-h-[36px] px-2.5 py-1.5 rounded-lg transition-colors text-gray-500 hover:text-[#f5a623] hover:bg-white/5"
            title="Reply"
            aria-label="Reply"
          >
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
          </button>

          {/* Quote */}
          {hasSigner && onQuote && (
            <button
              onClick={() => onQuote(cast)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#f5a623] hover:bg-white/5 min-w-[44px] min-h-[36px] px-2.5 py-1.5 rounded-lg transition-colors"
              aria-label="Quote cast"
            >
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </button>
          )}

          {/* Share to Farcaster */}
          <ShareToFarcaster
            variant="icon"
            className="min-w-[44px] min-h-[36px] !p-1.5 rounded-lg hover:bg-white/5"
            template={shareTemplates.custom(
              (cast.text.length > 200 ? cast.text.slice(0, 200) + '...' : cast.text) + '\n\nvia The ZAO',
              ['https://zaoos.com'],
              'zao',
            )}
          />
        </div>

        {/* Thread bar — prominent clickable indicator when replies exist */}
        {cast.replies.count > 0 && (
          <button
            onClick={() => onOpenThread?.(cast.hash)}
            className="flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg bg-[#f5a623]/5 border border-[#f5a623]/15 hover:bg-[#f5a623]/10 hover:border-[#f5a623]/30 transition-colors w-full text-left group/thread"
          >
            <svg className="w-4 h-4 text-[#f5a623] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
            </svg>
            <span className="text-xs font-medium text-[#f5a623]">
              {cast.replies.count} {cast.replies.count === 1 ? 'reply' : 'replies'}
            </span>
            <span className="text-[10px] text-gray-500 group-hover/thread:text-gray-400 ml-auto">
              View thread &rarr;
            </span>
          </button>
        )}
      </div>

      {/* Admin context menu */}
      {isAdmin && showMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
          <div className="absolute right-4 top-2 bg-[#1a2a3a] border border-gray-700 rounded-xl shadow-xl z-40 overflow-hidden min-w-[140px]">
            <button
              onClick={() => {
                onHide(cast.hash);
                setShowMenu(false);
              }}
              className="px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 w-full text-left transition-colors"
            >
              Hide message
            </button>
            <button
              onClick={() => setShowMenu(false)}
              className="px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 w-full text-left transition-colors border-t border-gray-800/50"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
