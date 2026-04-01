'use client';

import Link from 'next/link';

interface Member {
  id: string;
  fid: number | null;
  username: string | null;
  displayName: string | null;
  pfpUrl: string | null;
  zid: string | null;
  tier: string;
  tags: string[];
  category: string | null;
  biography: string | null;
  soundcloud: string | null;
  spotify: string | null;
  audius: string | null;
}

interface Props {
  members: Member[];
}

const TIER_COLORS: Record<string, string> = {
  founder: 'text-[#f5a623]',
  og: 'text-[#f5a623]',
  artist: 'text-purple-400',
  musician: 'text-blue-400',
  producer: 'text-green-400',
  songwriter: 'text-pink-400',
  developer: 'text-cyan-400',
  community: 'text-gray-400',
};

function getRoleLabel(member: Member): string {
  if (member.category) return member.category;
  if (member.tags && member.tags.length > 0) return member.tags[0];
  return 'Creator';
}

function getRoleColor(role: string): string {
  const lower = role.toLowerCase();
  for (const [key, color] of Object.entries(TIER_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return 'text-gray-400';
}

export default function CommunityMembersClient({ members }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {members.map((member) => {
        const displayName = member.displayName || member.username || 'Anonymous';
        const role = getRoleLabel(member);
        const roleColor = getRoleColor(role);

        return (
          <Link
            key={member.id}
            href={`/members/${member.username}`}
            className="flex items-center gap-3 bg-[#0d1b2a] rounded-xl px-4 py-3 border border-gray-800 hover:border-[#f5a623]/30 transition-colors group"
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {member.pfpUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.pfpUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover bg-[#1a2a3a]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#1a2a3a] flex items-center justify-center text-gray-500 text-sm font-medium">
                  {(displayName[0] || '?').toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + Role */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white group-hover:text-[#f5a623] transition-colors truncate">
                {displayName}
              </p>
              <p className={`text-xs ${roleColor} truncate`}>{role}</p>
            </div>

            {/* ZID badge */}
            {member.zid && (
              <div className="flex-shrink-0">
                <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">
                  #{member.zid}
                </span>
              </div>
            )}

            {/* Arrow */}
            <svg
              className="w-4 h-4 text-gray-600 group-hover:text-[#f5a623] transition-colors flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </Link>
        );
      })}
    </div>
  );
}
