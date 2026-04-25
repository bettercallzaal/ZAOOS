interface Event {
  id: string;
  type: 'created' | 'edited' | 'status_change' | 'note' | 'share' | 'review_comment';
  content: string;
  member_name: string | null;
  created_at: string;
}

const TYPE_TINT: Record<Event['type'], string> = {
  created: 'text-emerald-300',
  edited: 'text-amber-300',
  status_change: 'text-blue-300',
  note: 'text-slate-300',
  share: 'text-purple-300',
  review_comment: 'text-rose-300',
};

const TYPE_LABEL: Record<Event['type'], string> = {
  created: 'created',
  edited: 'edited',
  status_change: 'status',
  note: 'note',
  share: 'shared',
  review_comment: 'review',
};

export function ActivityFeed({ events }: { events: Event[] }) {
  if (events.length === 0) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-5">
      <h3 className="text-sm font-bold text-amber-400">Activity</h3>
      <ul className="mt-3 space-y-2">
        {events.map((e) => (
          <li key={e.id} className="flex items-start gap-3 text-xs">
            <span
              className={`mt-0.5 inline-flex shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                TYPE_TINT[e.type]
              }`}
            >
              {TYPE_LABEL[e.type]}
            </span>
            <div className="flex-1 leading-relaxed text-slate-300">
              <span>{e.content}</span>
              <span className="ml-2 text-slate-500">
                · {e.member_name ?? 'system'} · {new Date(e.created_at).toLocaleString()}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
