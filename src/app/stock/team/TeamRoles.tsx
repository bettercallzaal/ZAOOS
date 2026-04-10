'use client';

interface Member {
  id: string;
  name: string;
  role: string;
  scope: string;
}

export function TeamRoles({ members }: { members: Member[] }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-white">Team</h2>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="bg-[#0d1b2a] rounded-lg border border-white/[0.06] p-3">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-medium text-[#f5a623]">{m.name}</span>
              <span className="text-xs text-gray-400">{m.role}</span>
            </div>
            {m.scope && <p className="text-xs text-gray-500 mt-1">{m.scope}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
