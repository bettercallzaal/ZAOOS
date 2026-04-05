'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string | null;
  eventName: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function getTimeLeft(target: Date): TimeLeft | null {
  const now = new Date().getTime();
  const diff = target.getTime() - now;
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({ targetDate, eventName }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!targetDate) return;

    const target = new Date(targetDate);
    setTimeLeft(getTimeLeft(target));

    const interval = setInterval(() => {
      const tl = getTimeLeft(target);
      setTimeLeft(tl);
      if (!tl) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl sm:text-3xl font-bold text-[#f5a623]">
          Date Announcement Coming Soon
        </p>
        <p className="text-gray-400 mt-2 text-sm">{eventName} date will be revealed shortly</p>
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 text-sm">Loading countdown...</p>
      </div>
    );
  }

  if (!timeLeft) {
    return (
      <div className="text-center py-8">
        <p className="text-2xl sm:text-3xl font-bold text-[#f5a623]">{eventName} is here!</p>
      </div>
    );
  }

  const units = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="text-center py-6">
      <div className="flex justify-center gap-3 sm:gap-6">
        {units.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <span className="text-3xl sm:text-5xl font-bold text-[#f5a623] tabular-nums">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-xs sm:text-sm text-gray-400 mt-1 uppercase tracking-wider">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
