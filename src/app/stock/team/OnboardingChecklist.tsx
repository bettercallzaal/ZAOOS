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
  // Where to scroll on click. 'anchor' is an element id on this page;
  // 'href' wins if both are set (used for off-page nav like the bot link).
  anchor?: string;
  href?: string;
}

function scrollToAnchor(id: string) {
  if (typeof window === 'undefined') return;
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // Subtle pulse so the user sees what was targeted
  el.classList.add('onboarding-pulse');
  setTimeout(() => el.classList.remove('onboarding-pulse'), 1500);
}

export function OnboardingChecklist({ member, inAnyCircle, hasFirstActivity }: Props) {
  const items: ChecklistItem[] = useMemo(() => [
    {
      key: 'bio',
      done: Boolean((member.bio ?? '').trim().length >= 30),
      label: 'Add a bio',
      hint: '1-3 sentences. Who you are and what you bring.',
      weight: 30,
      anchor: 'profile-anchor',
    },
    {
      key: 'photo',
      done: Boolean((member.photo_url ?? '').trim()),
      label: 'Add a profile photo',
      hint: 'Right-click your X / Farcaster avatar -> Copy image address -> paste.',
      weight: 20,
      anchor: 'profile-anchor',
    },
    {
      key: 'scope',
      done: Boolean((member.scope ?? '').trim()),
      label: 'Pick your team',
      hint: 'Operations, Music, or Design. Filters which todos you see.',
      weight: 15,
      anchor: 'profile-anchor',
    },
    {
      key: 'links',
      done: Boolean((member.links ?? '').trim()),
      label: 'Drop a link or two',
      hint: 'X, Farcaster, your music, anything. Hit + Add another link for more.',
      weight: 10,
      anchor: 'profile-anchor',
    },
    {
      key: 'circle',
      done: inAnyCircle,
      label: 'Join a circle in the bot',
      hint: 'DM @ZAOstockTeamBot, send /circles, then /join <slug>.',
      weight: 15,
      href: 'https://t.me/ZAOstockTeamBot',
    },
    {
      key: 'activity',
      done: hasFirstActivity,
      label: 'Log your first contribution',
      hint: 'Use the Quick Add box or send /idea in the bot.',
      weight: 10,
      anchor: 'quick-add-anchor',
    },
  ], [member, inAnyCircle, hasFirstActivity]);

  const completedWeight = items.filter((i) => i.done).reduce((sum, i) => sum + i.weight, 0);
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
  const pct = Math.round((completedWeight / totalWeight) * 100);
  const allDone = items.every((i) => i.done);

  if (allDone) return null;

  // First not-done item is the "active" one. Anything past it is greyed.
  const firstUndoneIdx = items.findIndex((i) => !i.done);

  function handleClick(item: ChecklistItem) {
    if (item.href) {
      window.open(item.href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (item.anchor) scrollToAnchor(item.anchor);
  }

  return (
    <div className="bg-[#0d1b2a] rounded-xl p-4 border border-[#f5a623]/30 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#f5a623] font-bold">Get started</p>
          <p className="text-sm text-white mt-0.5">
            {pct === 0
              ? 'Welcome - 6 quick steps to a complete profile'
              : `Profile ${pct}% complete - click the next step to jump there`}
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

      <ol className="space-y-1.5">
        {items.map((item, i) => {
          const stepNum = i + 1;
          const isActive = !item.done && i === firstUndoneIdx;
          const isFuture = !item.done && i > firstUndoneIdx;
          const clickable = !item.done;

          return (
            <li key={item.key}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => handleClick(item)}
                className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#f5a623]/10 border border-[#f5a623]/30 hover:bg-[#f5a623]/15 cursor-pointer'
                    : isFuture
                      ? 'border border-white/[0.04] cursor-pointer hover:bg-white/[0.02] opacity-60'
                      : 'border border-emerald-500/20 bg-emerald-500/[0.04] cursor-default opacity-70'
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 text-[10px] font-bold ${
                    item.done
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : isActive
                        ? 'bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/50'
                        : 'bg-white/[0.04] text-gray-600 border border-white/[0.08]'
                  }`}
                  aria-hidden
                >
                  {item.done ? '✓' : stepNum}
                </span>

                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-medium leading-snug ${
                      item.done
                        ? 'text-emerald-300/70 line-through'
                        : isActive
                          ? 'text-white'
                          : 'text-gray-500'
                    }`}
                  >
                    Step {stepNum}: {item.label}
                    {isActive && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider font-bold text-[#f5a623]">
                        Next
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 leading-relaxed ${
                      isActive ? 'text-gray-300' : 'text-gray-600'
                    }`}
                  >
                    {item.hint}
                  </div>
                </div>

                {clickable && (
                  <span
                    className={`text-base flex-shrink-0 self-center ${
                      isActive ? 'text-[#f5a623]' : 'text-gray-700'
                    }`}
                    aria-hidden
                  >
                    &rarr;
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <style>{`
        .onboarding-pulse {
          animation: onboarding-pulse 1.5s ease-out;
        }
        @keyframes onboarding-pulse {
          0% { box-shadow: 0 0 0 0 rgba(245, 166, 35, 0.5); }
          100% { box-shadow: 0 0 0 16px rgba(245, 166, 35, 0); }
        }
      `}</style>
    </div>
  );
}
