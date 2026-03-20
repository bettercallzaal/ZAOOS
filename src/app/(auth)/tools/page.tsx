import Link from 'next/link';
import { getSessionData } from '@/lib/auth/session';
import { getUserByFid } from '@/lib/farcaster/neynar';
import { supabaseAdmin } from '@/lib/db/supabase';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { ProfileCard } from './ProfileCard';

async function fetchUserProfile(fid: number) {
  try {
    const [user, usersResult] = await Promise.all([
      getUserByFid(fid),
      supabaseAdmin
        .from('users')
        .select('zid, primary_wallet, respect_wallet, bio, display_name, username, pfp_url')
        .eq('fid', fid)
        .eq('is_active', true)
        .maybeSingle(),
    ]);

    const usersRow = usersResult.data;

    return {
      zid: usersRow?.zid || null,
      display_name: usersRow?.display_name || user?.display_name || null,
      username: usersRow?.username || user?.username || null,
      fid,
      pfp_url: usersRow?.pfp_url || user?.pfp_url || null,
      bio: user?.profile?.bio?.text || null,
      primary_wallet: usersRow?.primary_wallet || '',
      respect_wallet: usersRow?.respect_wallet || null,
    };
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
    return null;
  }
}

export default async function ToolsPage() {
  const session = await getSessionData();
  const profile = session?.fid ? await fetchUserProfile(session.fid) : null;

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <h2 className="font-semibold text-sm text-gray-300">Tools</h2>
        <div className="flex items-center gap-2">
          <div className="md:hidden"><NotificationBell /></div>
          <Link href="/chat" className="text-xs text-gray-500 hover:text-white md:hidden">Back to Chat</Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* ZID Profile Card */}
        {profile ? (
          <ProfileCard profile={profile} />
        ) : (
          <div className="bg-[#0d1b2a] rounded-xl p-6 border border-gray-800 text-center">
            <p className="text-sm text-gray-400">Log in to see your profile</p>
          </div>
        )}

        {/* Tool sections */}
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1">Artist Tools</p>

          <Link
            href="/chat"
            className="block bg-[#0d1b2a] rounded-xl p-4 border border-[#f5a623]/20 hover:border-[#f5a623]/40 transition-colors bg-gradient-to-r from-[#f5a623]/5 to-transparent"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Music</p>
                <p className="text-xs text-gray-500">Submit songs, listen to radio, browse the queue</p>
              </div>
            </div>
          </Link>

          <Link
            href="/calls"
            className="block bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 hover:border-[#f5a623]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Calls</p>
                <p className="text-xs text-gray-500">Voice rooms for fractal calls, listening sessions, and hangouts</p>
              </div>
            </div>
          </Link>

          <Link
            href="/social"
            className="block bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 hover:border-[#f5a623]/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Social Graph</p>
                <p className="text-xs text-gray-500">Followers & Following</p>
              </div>
            </div>
          </Link>

          <a
            href="/chat"
            className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 hover:border-[#f5a623]/30 transition-colors block"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Cross-Post</p>
                <p className="text-xs text-gray-500">Post to multiple channels at once — use the share icon in chat</p>
              </div>
            </div>
          </a>

          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 opacity-60">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">AI Agent</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 opacity-60">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Taste Profile</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
