'use client';

import { useMemo } from 'react';

interface Member {
  bio?: string;
  links?: string;
  photo_url?: string;
  scope?: string;
}

interface Props {
  member: Member;
  inAnyCircle: boolean;
  hasFirstActivity: boolean;
}

interface ChecklistItem {
  key: string;
  done: boolean;
  label: string;
  hint: string;
  weight: number;
}

export function OnboardingChecklist({ member, inAnyCircle, hasFirstActivity }: Props) {
  const items: ChecklistItem[] = useMemo(() => [
    {
      key: 'bio',
      done: Boolean((member.bio ?? '').trim().length >= 30),
      label: 'Add a bio (1-3 sentences)',
      hint: 'Click "Your Profile" above. Tell the team who you are and what you bring.',
      weight: 30,
    },
    {
      key: 'photo',
      done: Boolean((member.photo_url ?? '').trim()),
      label: 'Add a profile photo',
      hint: 'Right-click your X or Farcaster avatar -> Copy image address -> paste in Your Profile.',
      weight: 20,
    },
    {
      key: 'scope',
      done: Boolean((member.scope ?? '').trim()),
      label: 'Pick your team',
      hint: 'Operations, Music, or Design. Affects which todos surface for you.',
      weight: 15,
    },
    {
      key: 'links',
      done: Boolean((member.links ?? '').trim()),
      label: 'Drop a link or two',
      hint: 'X handle, Farcaster, your music, anything.',
      weight: 10,
    },
    {
      key: 'circle',
      done: inAnyCircle,
      label: 'Join a circle in the bot',
      hint: 'DM @ZAOstockTeamBot, send /circles, then /join <slug>. Music, ops, partners, finance, merch, marketing, media, host.',
      weight: 15,
    },
    {
      key: 'activity',
      done: hasFirstActivity,
      label: 'Say hi or log your first contribution',
      hint: 'Use the Quick Add box above to log something you worked on, or send /idea in the bot.',
      weight: 10,
    },
  ], [member, inAnyCircle, hasFirstActivity]);

  const completedWeight = items.filter((i) => i.done).reduce((sum, i) => sum + i.weight, 0);
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  const pct = Math.round((completedWeight / totalWeight) * 100);
  const allDone = items.every((i) => i.done);

  if (allDone) return null;

  const remaining = items.filter((i) => !i.done);
  const completed = items.filter((i) => i.done);

  return (
    <div className="bg-[#0d1b2a] rounded-xl p-4 border border-[#f5a623]/30 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#f5a623] font-bold">Get started</p>
          <p className="text-sm text-white mt-0.5">
            {pct === 0 ? 'Welcome - quick onboarding below' : `Profile ${pct}% complete - ${remaining.length} thing${remaining.length === 1 ? '' : 's'} left`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-bold text-[#f5a623]">{pct}%</p>
        </div>
      </div>

      <div className="h-1.5 w-full bg-[#0a1628] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#f5a623] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {remaining.map((item) => (
          <li key={item.key} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 inline-block w-4 h-4 rounded border border-white/20 flex-shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <div className="text-gray-200 font-medium">{item.label}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{item.hint}</div>
            </div>
          </li>
        ))}
      </ul>

      {completed.length > 0 && (
        <details className="text-[11px] text-gray-500">
          <summary className="cursor-pointer hover:text-gray-400 select-none">
            {completed.length} done
          </summary>
          <ul className="mt-1 space-y-1 pl-2">
            {completed.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-gray-500 line-through">
                <span aria-hidden>&#10003;</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
