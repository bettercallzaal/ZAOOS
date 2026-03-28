'use client';

import { useState, useEffect } from 'react';

interface Reminders {
  within24h: boolean;
  within6h: boolean;
  within1h: boolean;
}

interface DiscordEvent {
  id: string;
  name: string;
  description?: string | null;
  day_of_week: string;
  time: string;
  timezone: string;
  channel_name?: string | null;
  next_occurrence: string;
  countdown: string;
  countdown_ms: number;
  is_today: boolean;
  is_within_24h: boolean;
  reminders: Reminders;
}

export function EventsCalendar() {
  const [events, setEvents] = useState<DiscordEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/discord/events')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load events');
        return r.json();
      })
      .then((d) => setEvents(d.events ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#0d1b2a] rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 text-sm">Failed to load events</p>
        <p className="text-xs text-gray-600 mt-1">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-3xl mb-3 opacity-50">
          <svg className="w-10 h-10 mx-auto text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm font-medium">No events scheduled</p>
        <p className="text-xs text-gray-600 mt-1">
          Check back later — events will appear here when scheduled via Discord.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2">
      {events.map((evt) => {
        const nextDate = new Date(evt.next_occurrence);
        const dateStr = nextDate.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

        return (
          <div
            key={evt.id}
            className={`bg-[#0d1b2a] rounded-xl border overflow-hidden transition-colors ${
              evt.is_within_24h
                ? 'border-[#f5a623]/40 bg-[#f5a623]/5'
                : 'border-gray-800'
            }`}
          >
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white truncate">{evt.name}</h3>
                    {evt.is_today && (
                      <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider bg-[#f5a623]/20 text-[#f5a623] px-1.5 py-0.5 rounded">
                        Today
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {evt.day_of_week}s at {evt.time} {evt.timezone}
                    {evt.channel_name && (
                      <span className="text-gray-600"> · #{evt.channel_name}</span>
                    )}
                  </p>
                  {evt.description && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{evt.description}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-mono font-bold ${
                    evt.reminders.within1h
                      ? 'text-red-400'
                      : evt.reminders.within6h
                      ? 'text-orange-400'
                      : evt.reminders.within24h
                      ? 'text-[#f5a623]'
                      : 'text-gray-300'
                  }`}>
                    {evt.countdown}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5">{dateStr}</p>
                </div>
              </div>

              {/* Reminder status markers */}
              {evt.is_within_24h && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-800/50">
                  <div className={`flex items-center gap-1 text-[10px] ${
                    evt.reminders.within24h ? 'text-[#f5a623]' : 'text-gray-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      evt.reminders.within24h ? 'bg-[#f5a623]' : 'bg-gray-700'
                    }`} />
                    24h
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] ${
                    evt.reminders.within6h ? 'text-orange-400' : 'text-gray-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      evt.reminders.within6h ? 'bg-orange-400' : 'bg-gray-700'
                    }`} />
                    6h
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] ${
                    evt.reminders.within1h ? 'text-red-400' : 'text-gray-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      evt.reminders.within1h ? 'bg-red-400' : 'bg-gray-700'
                    }`} />
                    1h
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
