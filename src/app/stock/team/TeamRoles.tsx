'use client';

interface Member {
  id: string;
  name: string;
  role: string;
  scope: string;
  bio?: string;
  links?: string;
}

const SCOPE_LABEL: Record<string, string> = {
  ops: 'Operations',
  finance: 'Finance',
  design: 'Design',
  music: 'Music',
};

const SCOPE_COLOR: Record<string, string> = {
  ops: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  finance: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  design: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  music: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

const ROLE_LABEL: Record<string, string> = {
  lead: 'Lead',
  '2nd': '2nd',
  member: 'Member',
};

export function TeamRoles({ members }: { members: Member[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white">Team</h2>
      <p className="text-xs text-gray-500">
        Each teammate edits their own profile from the Home tab. If yours is blank, login and add a bio.
      </p>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-white">{m.name}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${SCOPE_COLOR[m.scope] || SCOPE_COLOR.ops}`}>
                {SCOPE_LABEL[m.scope] || m.scope} - {ROLE_LABEL[m.role] || m.role}
              </span>
            </div>
            {m.bio && m.bio.trim() ? (
              <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">{m.bio}</p>
            ) : (
              <p className="text-[11px] text-gray-600 italic">No bio yet.</p>
            )}
            {m.links && m.links.trim() && (
              <p className="text-[10px] text-gray-500">{m.links}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
