'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useXMTPContext } from '@/contexts/XMTPContext';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import type { SessionData } from '@/types';

interface Profile {
  fid: number;
  zid: number | null;
  display_name: string | null;
  username: string | null;
  pfp_url: string | null;
  bio: string | null;
  primary_wallet: string;
  respect_wallet: string | null;
  role: string;
  custody_address: string | null;
  verified_addresses: string[];
  created_at: string | null;
}

interface SettingsClientProps {
  session: SessionData | null;
  profile: Profile | null;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

interface MessagingPrefs {
  autoJoinGroup: boolean;
  allowNonZaoDms: boolean;
}

const PREFS_DEFAULTS: MessagingPrefs = { autoJoinGroup: true, allowNonZaoDms: false };

export function SettingsClient({ session, profile }: SettingsClientProps) {
  const { logout, refetch } = useAuth();
  const { isConnected: xmtpConnected, activeXMTPAddress, switchWallet } = useXMTPContext();
  const [signerStatus, setSignerStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [signerError, setSignerError] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState(false);
  const signerContainerRef = useRef<HTMLDivElement>(null);

  // Messaging preferences
  const [msgPrefs, setMsgPrefs] = useState<MessagingPrefs>(PREFS_DEFAULTS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    if (!session?.fid) return;
    fetch('/api/users/messaging-prefs')
      .then((r) => r.ok ? r.json() : PREFS_DEFAULTS)
      .then((data) => setMsgPrefs({ ...PREFS_DEFAULTS, ...data }))
      .catch(() => {})
      .finally(() => setPrefsLoading(false));
  }, [session?.fid]);

  const togglePref = useCallback(async (key: keyof MessagingPrefs) => {
    const newVal = !msgPrefs[key];
    setMsgPrefs((prev) => ({ ...prev, [key]: newVal }));
    setPrefsSaving(true);
    try {
      const res = await fetch('/api/users/messaging-prefs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: newVal }),
      });
      if (res.ok) {
        const updated = await res.json();
        setMsgPrefs({ ...PREFS_DEFAULTS, ...updated });
      } else {
        // Revert on failure
        setMsgPrefs((prev) => ({ ...prev, [key]: !newVal }));
      }
    } catch {
      setMsgPrefs((prev) => ({ ...prev, [key]: !newVal }));
    } finally {
      setPrefsSaving(false);
    }
  }, [msgPrefs]);

  const hasSigner = !!session?.signerUuid;

  const handleSignerSuccess = useCallback(async (data: { signer_uuid: string; fid: string }) => {
    setSignerStatus('saving');
    setSignerError(null);
    try {
      const res = await fetch('/api/auth/signer/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signerUuid: data.signer_uuid,
          fid: parseInt(data.fid),
        }),
      });
      if (res.ok) {
        setSignerStatus('success');
        refetch();
      } else {
        setSignerStatus('error');
        setSignerError('Failed to save signer. Try again.');
      }
    } catch {
      setSignerStatus('error');
      setSignerError('Network error. Try again.');
    }
  }, [refetch]);

  // Register the global callback for Neynar SIWN
  useEffect(() => {
    window.onSIWNSuccess = handleSignerSuccess;
    return () => { delete window.onSIWNSuccess; };
  }, [handleSignerSuccess]);

  // Load the Neynar SIWN script after the div is in the DOM
  useEffect(() => {
    if (hasSigner) return;
    const container = signerContainerRef.current;
    if (!container) return;

    const SIWN_URL = 'https://neynarxyz.github.io/siwn/raw/1.2.0/index.js';
    const existing = document.querySelector(`script[src="${SIWN_URL}"]`);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.src = SIWN_URL;
    script.async = true;
    script.onerror = () => setScriptError(true);
    document.body.appendChild(script);

    return () => { script.remove(); };
  }, [hasSigner]);

  if (!session || !profile) {
    return (
      <div className="min-h-[100dvh] bg-[#0a1628] text-white flex items-center justify-center">
        <p className="text-gray-500">Log in to access settings</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white pb-20">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0d1b2a]">
        <h2 className="font-semibold text-sm text-gray-300">Settings</h2>
        <div className="flex items-center gap-2">
          <div className="md:hidden"><NotificationBell /></div>
          <Link href="/chat" className="text-xs text-gray-500 hover:text-white md:hidden">Back</Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* ── Connections ──────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Connections</p>
          <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800">
            <div className="space-y-3">
              {/* Wallet — always connected (it's how they logged in) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-400" />
                  <span className="text-sm text-white">Wallet</span>
                </div>
                <span className="text-xs text-gray-500 font-mono">
                  {session.walletAddress ? shortAddr(session.walletAddress) : 'Connected'}
                </span>
              </div>

              {/* Farcaster */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${session.fid ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className="text-sm text-white">Farcaster</span>
                </div>
                {session.fid ? (
                  <span className="text-xs text-gray-500">@{profile?.username || `FID ${session.fid}`}</span>
                ) : (
                  <span className="text-xs text-gray-500">Not connected</span>
                )}
              </div>

              {/* Signer (posting) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${session.signerUuid ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className="text-sm text-white">Posting</span>
                </div>
                {session.signerUuid ? (
                  <span className="text-xs text-green-500/70">Enabled</span>
                ) : (
                  <span className="text-xs text-[#f5a623]">Connect Farcaster first</span>
                )}
              </div>

              {/* XMTP Messaging */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${xmtpConnected ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <span className="text-sm text-white">Messaging</span>
                </div>
                <div className="flex items-center gap-2">
                  {xmtpConnected && activeXMTPAddress ? (
                    <>
                      <span className="text-xs text-gray-500 font-mono">{shortAddr(activeXMTPAddress)}</span>
                      <button
                        onClick={switchWallet}
                        className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors"
                      >
                        Switch
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-gray-500">
                      {xmtpConnected ? 'Enabled' : 'Enable in Messages'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Messaging Preferences ────────────────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Messaging</p>
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 divide-y divide-gray-800/50">
            {/* Auto-join ZAO group */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-sm text-white">Auto-join ZAO Group</p>
                <p className="text-xs text-gray-500">Automatically join the ZAO General group when messaging is enabled</p>
              </div>
              <button
                onClick={() => togglePref('autoJoinGroup')}
                disabled={prefsLoading || prefsSaving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  msgPrefs.autoJoinGroup ? 'bg-[#f5a623]' : 'bg-gray-700'
                }`}
                role="switch"
                aria-checked={msgPrefs.autoJoinGroup}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    msgPrefs.autoJoinGroup ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Allow DMs from non-ZAO members */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex-1 min-w-0 pr-3">
                <p className="text-sm text-white">Allow External DMs</p>
                <p className="text-xs text-gray-500">Accept direct messages from people outside the ZAO community</p>
              </div>
              <button
                onClick={() => togglePref('allowNonZaoDms')}
                disabled={prefsLoading || prefsSaving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  msgPrefs.allowNonZaoDms ? 'bg-[#f5a623]' : 'bg-gray-700'
                }`}
                role="switch"
                aria-checked={msgPrefs.allowNonZaoDms}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    msgPrefs.allowNonZaoDms ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* ── Profile ──────────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Profile</p>
          <div className="bg-[#0d1b2a] rounded-xl p-5 border border-gray-800">
            <div className="flex items-center gap-4 mb-4">
              {profile.pfp_url ? (
                <Image src={profile.pfp_url} alt={profile.display_name || 'avatar'} width={56} height={56} className="rounded-full" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-lg text-gray-400 font-bold">{(profile.display_name || '?')[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-white truncate">{profile.display_name || 'Anonymous'}</p>
                  {profile.zid && (
                    <span className="px-2 py-0.5 rounded-full bg-[#f5a623]/10 text-[#f5a623] text-xs font-bold flex-shrink-0">
                      ZID #{profile.zid}
                    </span>
                  )}
                </div>
                {profile.username && <p className="text-sm text-gray-400">@{profile.username}</p>}
                <p className="text-xs text-gray-600 mt-0.5">FID {profile.fid}</p>
              </div>
            </div>
            {profile.bio && (
              <p className="text-sm text-gray-400 leading-relaxed">{profile.bio}</p>
            )}
            <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center gap-3 text-xs text-gray-600">
              <span className="capitalize">{profile.role}</span>
              {profile.created_at && (
                <>
                  <span>·</span>
                  <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Farcaster Signer ─────────────────────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Write Access</p>
          <div className="bg-[#0d1b2a] rounded-xl p-5 border border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasSigner ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
                {hasSigner ? (
                  <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  {hasSigner ? 'Signer Connected' : 'Signer Not Connected'}
                </p>
                <p className="text-xs text-gray-500">
                  {hasSigner
                    ? 'You can post directly to Farcaster from ZAO OS'
                    : 'Connect to post casts, reply, and react directly from ZAO OS'}
                </p>
              </div>
            </div>

            {hasSigner ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/5 border border-green-500/10">
                <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-xs text-green-500/80">Signer active — {shortAddr(session.signerUuid || '')}</span>
              </div>
            ) : (
              <div>
                {signerStatus === 'success' && (
                  <div className="px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400 font-medium mb-3">
                    Signer connected successfully!
                  </div>
                )}
                {signerStatus === 'error' && signerError && (
                  <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 mb-3">
                    {signerError}
                  </div>
                )}
                {signerStatus === 'saving' && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#f5a623]/5 text-xs text-[#f5a623] mb-3">
                    <div className="w-3 h-3 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
                    Saving signer...
                  </div>
                )}

                {scriptError ? (
                  <p className="text-xs text-red-400">Failed to load signer script. Please refresh.</p>
                ) : (
                  <div ref={signerContainerRef}>
                    <div
                      className="neynar_signin"
                      data-client_id={process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID}
                      data-success-callback="onSIWNSuccess"
                      data-theme="dark"
                    />
                  </div>
                )}

                <p className="text-[10px] text-gray-600 mt-2">
                  This approves a managed signer for your Farcaster account via Neynar.
                  ZAO OS never has access to your personal wallet keys.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Wallets ──────────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Wallets</p>
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 divide-y divide-gray-800/50">
            {/* Primary wallet */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="w-8 h-8 rounded-lg bg-[#f5a623]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v6zm0 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6m-7.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Primary Wallet</p>
                <p className="text-sm text-white font-mono truncate">{profile.primary_wallet || 'Not set'}</p>
              </div>
            </div>

            {/* Respect wallet */}
            {profile.respect_wallet && (
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Respect Wallet</p>
                  <p className="text-sm text-white font-mono truncate">{profile.respect_wallet}</p>
                </div>
              </div>
            )}

            {/* Custody address */}
            {profile.custody_address && (
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Farcaster Custody</p>
                  <p className="text-sm text-white font-mono truncate">{profile.custody_address}</p>
                </div>
              </div>
            )}

            {/* Verified addresses */}
            {profile.verified_addresses.length > 0 && (
              <div className="px-5 py-4">
                <p className="text-xs text-gray-500 mb-2">Verified Addresses</p>
                <div className="space-y-1">
                  {profile.verified_addresses.map((addr) => (
                    <p key={addr} className="text-sm text-white font-mono truncate">{addr}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Account ──────────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Account</p>
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 divide-y divide-gray-800/50">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm text-white">Auth Method</p>
                <p className="text-xs text-gray-500 capitalize">{session.authMethod}</p>
              </div>
              <span className="text-xs text-gray-600 font-mono">{session.walletAddress ? shortAddr(session.walletAddress) : `FID ${session.fid}`}</span>
            </div>

            {session.isAdmin && (
              <Link href="/admin" className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#f5a623]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm text-white">Admin Panel</p>
                </div>
                <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            )}

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-red-500/5 transition-colors"
            >
              <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              <p className="text-sm text-red-400">Sign Out</p>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
