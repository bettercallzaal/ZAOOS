import { Metadata } from 'next';
import Link from 'next/link';
import { ApplyForm } from './ApplyForm';

export const metadata: Metadata = {
  title: 'Volunteer with ZAOstock | October 3, 2026',
  description: 'Sign up to volunteer at ZAOstock, a community music festival in Ellsworth, Maine on October 3, 2026.',
};

const ROLES: Array<{ value: string; label: string; hint: string }> = [
  { value: 'setup', label: 'Setup', hint: 'Morning load-in, stage rigging, tents, signage' },
  { value: 'checkin', label: 'Check-in', hint: 'Attendee welcome, wristbands, info booth' },
  { value: 'water', label: 'Water / Hydration', hint: 'Keep the crowd watered, work the bar line' },
  { value: 'safety', label: 'Safety', hint: 'Crowd flow, first-aid point, keep eyes open' },
  { value: 'teardown', label: 'Teardown', hint: 'Strike the stage, pack out, leave no trace' },
  { value: 'floater', label: 'Floater', hint: 'Available where needed, fill gaps, problem solver' },
  { value: 'content', label: 'Content / Media', hint: 'Photos, short video, social amplification during the day' },
  { value: 'unassigned', label: 'Pick for me', hint: 'You decide where you need me' },
];

const SHIFTS: Array<{ value: string; label: string }> = [
  { value: 'early', label: 'Early morning load-in (~8am-12pm)' },
  { value: 'block1', label: 'Block 1 (12pm-3pm)' },
  { value: 'block2', label: 'Block 2 (3pm-6pm)' },
  { value: 'teardown', label: 'Teardown (6pm-9pm)' },
  { value: 'allday', label: 'All day, I am in' },
];

export default function ApplyPage() {
  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-12">
      <header className="sticky top-0 z-40 bg-[#0a1628]/95 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/stock" className="text-xs text-gray-400 hover:text-[#f5a623]">
            &larr; ZAOstock
          </Link>
          <span className="text-xs text-gray-500">Volunteer signup</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <p className="inline-block rounded-full bg-[#f5a623]/10 px-3 py-1 text-xs text-[#f5a623] font-medium border border-[#f5a623]/30">
            Join the crew
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Volunteer with ZAOstock</h1>
          <p className="text-sm text-gray-400 max-w-lg mx-auto">
            October 3, 2026. Franklin Street Parklet, Ellsworth Maine. Community-built, community-run.
          </p>
        </div>

        <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08] space-y-3">
          <p className="text-xs text-[#f5a623] uppercase tracking-wider font-bold">What you get</p>
          <ul className="text-sm text-gray-300 space-y-1.5">
            <li>- Free entry to the festival for the day</li>
            <li>- A ZAOstock crew shirt</li>
            <li>- Food and water covered during your shift</li>
            <li>- First look at next year and standing invite to future ZAO events</li>
            <li>- The satisfaction of building something local from scratch</li>
          </ul>
        </div>

        <ApplyForm roles={ROLES} shifts={SHIFTS} />

        <div className="bg-[#0d1b2a] rounded-xl p-5 border border-white/[0.08]">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2">Not sure yet?</p>
          <p className="text-sm text-gray-400">
            Apply anyway. We will reach out, answer questions, and you can opt out any time before Oct 3. No commitment yet.
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              href="/stock"
              className="text-xs bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              Back to ZAOstock
            </Link>
            <Link
              href="/stock/program"
              className="text-xs bg-white/[0.06] hover:bg-white/[0.12] text-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              See the program
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
