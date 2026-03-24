'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useXMTPContextSafe } from '@/contexts/XMTPContext';
import { useLensAuth } from '@/hooks/useLensAuth';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { SolanaWalletConnect } from '@/components/solana/SolanaWalletConnect';
import type { SessionData } from '@/types';
import { ShareToFarcaster, shareTemplates } from '@/components/social/ShareToFarcaster';

interface Profile {
  fid: number;
  zid: number | null;
  fc_display_name: string | null;
  username: string | null;
  pfp_url: string | null;
  fc_bio: string | null;
  follower_count: number;
  following_count: number;
  power_badge: boolean;
  zao_display_name: string;
  zao_bio: string;
  ign: string;
  real_name: string;
  primary_wallet: string;
  respect_wallet: string | null;
  role: string;
  custody_address: string | null;
  verified_addresses: string[];
  created_at: string | null;
  bluesky_handle: string | null;
  lens_profile_id: string | null;
  lens_has_token: boolean;
  hive_username: string | null;
  solana_wallet: string | null;
  x_handle: string | null;
  instagram_handle: string | null;
  soundcloud_url: string | null;
  spotify_url: string | null;
  audius_handle: string | null;
}

interface SettingsClientProps {
  session: SessionData | null;
  profile: Profile | null;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

type WalletKey = 'primary_wallet' | 'respect_wallet' | 'custody_address' | 'verified_addresses' | `verified_${string}`;

interface MessagingPrefs {
  autoJoinGroup: boolean;
  allowNonZaoDms: boolean;
}

const PREFS_DEFAULTS: MessagingPrefs = { autoJoinGroup: true, allowNonZaoDms: false };

interface RespectData {
  member: {
    total_respect: number;
    fractal_respect: number;
    onchain_og: number;
    onchain_zor: number;
    fractal_count: number;
    first_respect_at: string | null;
  } | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="text-[10px] text-gray-600 hover:text-[#f5a623] transition-colors flex-shrink-0"
      title="Copy address"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Platform SVG Icons ─────────────────────────────────────────────

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h5.25A2.25 2.25 0 0121 6v6zm0 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6m-7.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function FarcasterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.5 3h13v1.5h1V6h1v12h-1v1.5h-1V21h-1.5v-1.5H7V21H5.5v-1.5h-1V18h-1V6h1V4.5h1V3zm2 6v4.5h1.5V9H7.5zm7.5 0v4.5H16.5V9H15z" />
    </svg>
  );
}

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 568 501" className={className} fill="currentColor">
      <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.793 166.471-20.155 71.454-93.57 89.708-159.534 78.663 115.346 19.729 144.665 85.021 81.294 150.313-120.758 124.562-173.715-31.256-187.093-71.174-2.41-7.186-3.542-10.549-2.874-7.688-0.668-2.861-0.464 0.502-2.874 7.688-13.378 39.918-66.335 195.736-187.093 71.174-63.371-65.292-34.052-130.584 81.294-150.313-65.964 11.045-139.379-7.209-159.534-78.663C9.945 203.659 0 75.293 0 57.947 0-28.906 76.135-1.611 123.121 33.664Z" />
    </svg>
  );
}

function LensIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 3a3.5 3.5 0 013.5 3.5c0 1.655-1.156 3.042-2.702 3.393a.75.75 0 00-.548.548C11.9 14.087 10.513 15.243 8.858 15.243A3.5 3.5 0 015.358 11.743c0-1.655 1.156-3.042 2.702-3.393a.75.75 0 00.548-.548C8.958 6.156 10.345 5 12 5zm4.5 6.5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function HiveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.506 1.063L7.326 9.3h10.348L12.506 1.063zM18.65 10.3H6.35L1.17 18.537h22.66L18.65 10.3zM6.862 19.537l5.644 3.4 5.644-3.4H6.862z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ── Status Dot ────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'connected' | 'partial' | 'disconnected' }) {
  const colors = {
    connected: 'bg-[#22c55e]',
    partial: 'bg-[#f59e0b]',
    disconnected: 'bg-[#4b5563]',
  };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[status]}`} />;
}

// ── Account Row ───────────────────────────────────────────────────

interface AccountRowProps {
  icon: React.ReactNode;
  name: string;
  status: 'connected' | 'partial' | 'disconnected';
  detail?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

function AccountRow({ icon, name, status, detail, action, children }: AccountRowProps) {
  return (
    <div>
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <StatusDot status={status} />
          <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">{icon}</span>
          <span className="text-sm text-white">{name}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {detail && <span className="text-xs text-gray-500 font-mono">{detail}</span>}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Feature Row ───────────────────────────────────────────────────

interface FeatureRowProps {
  name: string;
  detail: string;
  action: React.ReactNode;
}

function FeatureRow({ name, detail, action }: FeatureRowProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1 min-w-0 pr-3">
        <p className="text-sm text-white">{name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}

// ── Toggle Switch ─────────────────────────────────────────────────

function ToggleSwitch({ on, onToggle, disabled, label }: { on: boolean; onToggle: () => void; disabled?: boolean; label: string }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        on ? 'bg-green-500' : 'bg-gray-600'
      } ${disabled ? 'opacity-50' : ''}`}
      role="switch"
      aria-checked={on}
      aria-label={label}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function SocialsSection({ profile }: { profile: Profile }) {
  const [xHandle, setXHandle] = useState(profile.x_handle || '');
  const [instagram, setInstagram] = useState(profile.instagram_handle || '');
  const [soundcloud, setSoundcloud] = useState(profile.soundcloud_url || '');
  const [spotify, setSpotify] = useState(profile.spotify_url || '');
  const [audius, setAudius] = useState(profile.audius_handle || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveSocials = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/users/socials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          x_handle: xHandle || null,
          instagram_handle: instagram || null,
          soundcloud_url: soundcloud || null,
          spotify_url: spotify || null,
          audius_handle: audius || null,
        }),
      });
      if (res.ok) setSaved(true);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const fields = [
    { label: 'X (Twitter)', value: xHandle, set: setXHandle, placeholder: 'username (no @)', prefix: '@', link: xHandle ? `https://x.com/${xHandle}` : null },
    { label: 'Instagram', value: instagram, set: setInstagram, placeholder: 'username', prefix: '@', link: instagram ? `https://instagram.com/${instagram}` : null },
    { label: 'SoundCloud', value: soundcloud, set: setSoundcloud, placeholder: 'https://soundcloud.com/...', prefix: null, link: soundcloud || null },
    { label: 'Spotify', value: spotify, set: setSpotify, placeholder: 'https://open.spotify.com/artist/...', prefix: null, link: spotify || null },
    { label: 'Audius', value: audius, set: setAudius, placeholder: 'username', prefix: '@', link: audius ? `https://audius.co/${audius}` : null },
  ];

  const connectedCount = fields.filter(f => !!f.value).length;

  return (
    <section>
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Socials</p>
        <span className="text-[10px] text-gray-600">{connectedCount} of {fields.length} linked</span>
      </div>
      <div className="bg-[#0d1b2a] rounded-xl p-4 border border-gray-800 space-y-3">
        {profile.x_handle && (
          <p className="text-[10px] text-emerald-400">X handle auto-imported from your Farcaster profile</p>
        )}
        {fields.map((f) => (
          <div key={f.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400">{f.label}</label>
              {f.link && (
                <a href={f.link} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#f5a623] hover:text-[#ffd700]">
                  View
                </a>
              )}
            </div>
            <div className="flex items-center gap-1">
              {f.prefix && <span className="text-xs text-gray-600">{f.prefix}</span>}
              <input
                type="text"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.placeholder}
                className="flex-1 bg-[#0a1628] text-sm text-white rounded-lg px-3 py-2 border border-gray-700 focus:border-[#f5a623] outline-none placeholder:text-gray-600"
              />
            </div>
          </div>
        ))}
        <button
          onClick={saveSocials}
          disabled={saving}
          className="w-full text-xs font-medium py-2 rounded-lg bg-[#f5a623] text-[#0a1628] hover:bg-[#ffd700] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Socials'}
        </button>
      </div>
    </section>
  );
}

export function SettingsClient({ session, profile }: SettingsClientProps) {
  const { logout, refetch } = useAuth();
  const { isConnected: xmtpConnected, activeXMTPAddress, switchWallet } = useXMTPContextSafe();
  const [signerStatus, setSignerStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [signerError, setSignerError] = useState<string | null>(null);
  const [scriptError, setScriptError] = useState(false);
  const signerContainerRef = useRef<HTMLDivElement>(null);

  // Messaging preferences
  const [msgPrefs, setMsgPrefs] = useState<MessagingPrefs>(PREFS_DEFAULTS);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);

  // Wallet visibility
  const [hiddenWallets, setHiddenWallets] = useState<WalletKey[]>([]);
  const [walletVisLoading, setWalletVisLoading] = useState(true);
  const [walletVisSaving, setWalletVisSaving] = useState(false);

  // ZAO profile editing
  const [zaoFields, setZaoFields] = useState({
    display_name: '',
    bio: '',
    ign: '',
    real_name: '',
  });
  const [zaoEditing, setZaoEditing] = useState(false);
  const [zaoSaving, setZaoSaving] = useState(false);
  const [zaoSaved, setZaoSaved] = useState(false);

  // Respect token data
  const [respect, setRespect] = useState<RespectData>({ member: null });
  const [respectLoading, setRespectLoading] = useState(true);

  // Initialize ZAO fields from profile
  useEffect(() => {
    if (profile) {
      setZaoFields({
        display_name: profile.zao_display_name,
        bio: profile.zao_bio,
        ign: profile.ign,
        real_name: profile.real_name,
      });
    }
  }, [profile]);

  // Fetch messaging prefs
  useEffect(() => {
    if (!session?.fid) return;
    fetch('/api/users/messaging-prefs')
      .then((r) => r.ok ? r.json() : PREFS_DEFAULTS)
      .then((data) => setMsgPrefs({ ...PREFS_DEFAULTS, ...data }))
      .catch(() => {})
      .finally(() => setPrefsLoading(false));
  }, [session?.fid]);

  // Fetch wallet visibility
  useEffect(() => {
    if (!session?.fid) return;
    fetch('/api/users/wallet-visibility')
      .then((r) => r.ok ? r.json() : { hidden_wallets: [] })
      .then((data) => setHiddenWallets(data.hidden_wallets ?? []))
      .catch(() => {})
      .finally(() => setWalletVisLoading(false));
  }, [session?.fid]);

  // Fetch respect data
  useEffect(() => {
    if (!session?.fid) return;
    fetch(`/api/respect/member?fid=${session.fid}`)
      .then((r) => r.ok ? r.json() : { member: null })
      .then((data) => setRespect(data))
      .catch(() => {})
      .finally(() => setRespectLoading(false));
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
        setMsgPrefs((prev) => ({ ...prev, [key]: !newVal }));
      }
    } catch {
      setMsgPrefs((prev) => ({ ...prev, [key]: !newVal }));
    } finally {
      setPrefsSaving(false);
    }
  }, [msgPrefs]);

  const toggleWalletVisibility = useCallback(async (key: WalletKey) => {
    const isHidden = hiddenWallets.includes(key);
    const updated = isHidden
      ? hiddenWallets.filter((k) => k !== key)
      : [...hiddenWallets, key];
    setHiddenWallets(updated);
    setWalletVisSaving(true);
    try {
      const res = await fetch('/api/users/wallet-visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden_wallets: updated }),
      });
      if (res.ok) {
        const data = await res.json();
        setHiddenWallets(data.hidden_wallets);
      } else {
        setHiddenWallets(hiddenWallets);
      }
    } catch {
      setHiddenWallets(hiddenWallets);
    } finally {
      setWalletVisSaving(false);
    }
  }, [hiddenWallets]);

  const saveZaoProfile = useCallback(async () => {
    setZaoSaving(true);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(zaoFields),
      });
      if (res.ok) {
        const updated = await res.json();
        setZaoFields(updated);
        setZaoEditing(false);
        setZaoSaved(true);
        setTimeout(() => setZaoSaved(false), 2000);
      }
    } catch {
      // Silently fail — user can retry
    } finally {
      setZaoSaving(false);
    }
  }, [zaoFields]);

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

  // Solana wallet state
  const [solanaWallet, setSolanaWallet] = useState(profile?.solana_wallet || null);

  // Bluesky connection state
  const [blueskyHandle, setBlueskyHandle] = useState(profile?.bluesky_handle || null);
  const [showBlueskyConnect, setShowBlueskyConnect] = useState(false);
  const [bskyHandle, setBskyHandle] = useState('');
  const [bskyAppPassword, setBskyAppPassword] = useState('');
  const [bskyConnecting, setBskyConnecting] = useState(false);
  const [bskyError, setBskyError] = useState('');

  const connectBluesky = async () => {
    if (!bskyHandle || !bskyAppPassword) return;
    setBskyConnecting(true);
    setBskyError('');
    try {
      const res = await fetch('/api/bluesky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: bskyHandle, appPassword: bskyAppPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setBlueskyHandle(data.handle);
        setShowBlueskyConnect(false);
        setBskyHandle('');
        setBskyAppPassword('');
      } else {
        setBskyError(data.error || 'Failed to connect');
      }
    } catch {
      setBskyError('Connection failed');
    }
    setBskyConnecting(false);
  };

  const disconnectBluesky = async () => {
    try {
      const res = await fetch('/api/bluesky', { method: 'DELETE' });
      if (res.ok) setBlueskyHandle(null);
    } catch { /* ignore */ }
  };

  // Lens connection state
  const [lensHandle, setLensHandle] = useState(profile?.lens_profile_id || null);
  const [lensConnecting, setLensConnecting] = useState(false);
  const [lensError, setLensError] = useState<string | null>(null);
  const [lensDisconnecting, setLensDisconnecting] = useState(false);
  const [lensNeedsAuth, setLensNeedsAuth] = useState(!!profile?.lens_profile_id && !profile?.lens_has_token);

  // SDK hook for wallet-based auth (gets posting tokens)
  const { connect: lensSDKConnect, isConnecting: lensSDKConnecting, error: lensSDKError, connectedHandle: lensSDKHandle, walletAddress: lensWalletAddr } = useLensAuth();

  // Sync SDK state to local state
  useEffect(() => {
    if (lensSDKHandle) { setLensHandle(lensSDKHandle); setLensNeedsAuth(false); }
    if (lensSDKError) setLensError(lensSDKError);
  }, [lensSDKHandle, lensSDKError]);

  const lensConnect = async () => {
    setLensConnecting(true);
    setLensError(null);

    // Always use server-side lookup first (works with all wallets from Farcaster)
    try {
      const wallet = session?.walletAddress;
      if (!wallet) { setLensError('No wallet connected'); setLensConnecting(false); return; }
      const res = await fetch('/api/platforms/lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.handle) {
        setLensHandle(data.handle);
        setLensNeedsAuth(true); // Profile found but no tokens yet
        setLensError('Profile found! Connect wallet below to enable posting.');
      } else {
        setLensHandle(null);
        setLensError(data.message || 'No Lens profile found');
      }
    } catch (err) {
      setLensError(err instanceof Error ? err.message : 'Failed to connect');
    }
    setLensConnecting(false);
  };

  const lensAuthorize = async () => {
    setLensConnecting(true);
    setLensError(null);
    await lensSDKConnect();
    setLensConnecting(false);
  };

  const disconnectLens = async () => {
    setLensDisconnecting(true);
    try {
      const res = await fetch('/api/platforms/lens', { method: 'DELETE' });
      if (res.ok) { setLensHandle(null); setLensError(null); }
    } catch { /* ignore */ }
    setLensDisconnecting(false);
  };

  // Hive connection state
  const [hiveUsername, setHiveUsername] = useState(profile?.hive_username || null);
  const [showHiveConnect, setShowHiveConnect] = useState(false);
  const [hiveUser, setHiveUser] = useState('');
  const [hivePostingKey, setHivePostingKey] = useState('');
  const [hiveConnecting, setHiveConnecting] = useState(false);
  const [hiveError, setHiveError] = useState('');

  const connectHive = async () => {
    if (!hiveUser || !hivePostingKey) return;
    setHiveConnecting(true);
    setHiveError('');
    try {
      const res = await fetch('/api/platforms/hive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: hiveUser, postingKey: hivePostingKey }),
      });
      const data = await res.json();
      if (res.ok) {
        setHiveUsername(data.username);
        setShowHiveConnect(false);
        setHiveUser('');
        setHivePostingKey('');
      } else {
        setHiveError(data.error || 'Failed to connect');
      }
    } catch {
      setHiveError('Connection failed');
    }
    setHiveConnecting(false);
  };

  const disconnectHive = async () => {
    try {
      const res = await fetch('/api/platforms/hive', { method: 'DELETE' });
      if (res.ok) setHiveUsername(null);
    } catch { /* ignore */ }
  };

  // Push notification state
  const [pushEnabled, setPushEnabled] = useState<boolean | null>(null);
  const [pushToggling, setPushToggling] = useState(false);

  useEffect(() => {
    if (!session?.fid) return;
    // Check if this user has push notifications enabled
    fetch('/api/notifications/status')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.enabled === 'boolean') {
          setPushEnabled(data.enabled);
        } else {
          setPushEnabled(false);
        }
      })
      .catch(() => setPushEnabled(false));
  }, [session?.fid]);

  const togglePushNotifications = async () => {
    if (pushToggling) return;
    setPushToggling(true);
    try {
      // Use the miniapp SDK to request/revoke notification permissions
      const { sdk } = await import('@farcaster/miniapp-sdk');
      const inMiniApp = await sdk.isInMiniApp();

      if (!inMiniApp) {
        // Show alert — push notifications require the Farcaster mini app
        alert('Push notifications can only be enabled when using ZAO OS as a Farcaster Mini App. Open ZAO OS from Warpcast to enable.');
        setPushToggling(false);
        return;
      }

      if (pushEnabled) {
        // Disable: tell the webhook we're disabling
        await fetch('/api/miniapp/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'notifications_disabled',
            fid: session?.fid,
          }),
        });
        setPushEnabled(false);
      } else {
        // Enable: prompt user to add miniapp (which grants notification permission)
        // The SDK triggers the webhook with notificationDetails on success
        const result = await sdk.actions.addMiniApp();
        if (result?.notificationDetails) {
          setPushEnabled(true);
        }
      }
    } catch (err) {
      console.error('Failed to toggle push notifications:', err);
    }
    setPushToggling(false);
  };

  // Account count for progress indicator
  const accountConnections = [
    !!session?.walletAddress,
    !!session?.fid,
    !!blueskyHandle,
    !!lensHandle,
    !!hiveUsername,
    !!solanaWallet,
  ];
  const accountConnectedCount = accountConnections.filter(Boolean).length;

  // Cross-posting platform count
  const crossPostPlatforms = [!!blueskyHandle, !!lensHandle, !!hiveUsername].filter(Boolean).length;
  const totalCrossPostPlatforms = 3;

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

        {/* ── ACCOUNTS ──────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Accounts</p>
            <span className="text-[10px] text-gray-600">{accountConnectedCount} of {accountConnections.length} connected</span>
          </div>
          <div className="bg-[#0d1b2a] rounded-xl px-4 border border-gray-800 divide-y divide-gray-800/50">

            {/* 1. Wallet — always connected */}
            <AccountRow
              icon={<WalletIcon className="w-4 h-4 text-[#f5a623]" />}
              name="Wallet"
              status="connected"
              detail={session.walletAddress ? shortAddr(session.walletAddress) : 'Connected'}
              action={<span className="text-[10px] text-gray-600">Primary</span>}
            />

            {/* 2. Farcaster */}
            <AccountRow
              icon={<FarcasterIcon className="w-4 h-4 text-purple-400" />}
              name="Farcaster"
              status={session.fid ? 'connected' : 'disconnected'}
              detail={session.fid ? `@${profile?.username || `FID ${session.fid}`}` : 'Not connected'}
              action={
                session.signerUuid ? (
                  <span className="text-[10px] text-green-500/70">Posting &#10003;</span>
                ) : session.fid ? (
                  <span className="text-[10px] text-[#f59e0b]">No signer</span>
                ) : null
              }
            />

            {/* 3. Bluesky */}
            <AccountRow
              icon={<BlueskyIcon className="w-4 h-4 text-blue-400" />}
              name="Bluesky"
              status={blueskyHandle ? 'connected' : 'disconnected'}
              detail={blueskyHandle ? `@${blueskyHandle}` : undefined}
              action={
                blueskyHandle ? (
                  <button
                    onClick={disconnectBluesky}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowBlueskyConnect(!showBlueskyConnect); setBskyError(''); }}
                    className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors"
                  >
                    Connect
                  </button>
                )
              }
            >
              {/* Bluesky inline connect form */}
              {showBlueskyConnect && !blueskyHandle && (
                <div className="pb-3 space-y-2">
                  <input
                    value={bskyHandle}
                    onChange={(e) => setBskyHandle(e.target.value)}
                    placeholder="yourname.bsky.social"
                    className="w-full bg-[#0a1628] text-white text-base md:text-xs rounded-lg px-3 py-2 placeholder-gray-600 border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    value={bskyAppPassword}
                    onChange={(e) => setBskyAppPassword(e.target.value)}
                    placeholder="App password (xxxx-xxxx-xxxx-xxxx)"
                    type="password"
                    className="w-full bg-[#0a1628] text-white text-base md:text-xs rounded-lg px-3 py-2 placeholder-gray-600 border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[10px] text-gray-600">Create one at bsky.app/settings/app-passwords</p>
                  {bskyError && <p className="text-[10px] text-red-400">{bskyError}</p>}
                  <button
                    onClick={connectBluesky}
                    disabled={bskyConnecting}
                    className="w-full text-xs font-medium py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50 transition-colors"
                  >
                    {bskyConnecting ? 'Connecting...' : 'Connect Bluesky'}
                  </button>
                </div>
              )}
            </AccountRow>

            {/* 4. Lens */}
            <AccountRow
              icon={<LensIcon className="w-4 h-4 text-green-400" />}
              name="Lens"
              status={lensHandle ? 'connected' : 'disconnected'}
              detail={lensHandle || undefined}
              action={
                lensHandle ? (
                  <button
                    onClick={disconnectLens}
                    disabled={lensDisconnecting}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    {lensDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={lensConnect}
                    disabled={lensConnecting || !session?.walletAddress}
                    className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors disabled:opacity-50"
                  >
                    {lensConnecting ? 'Checking...' : 'Connect'}
                  </button>
                )
              }
            >
              {lensError && (
                <div className="pb-3">
                  <p className="text-[10px] text-amber-400">{lensError}</p>
                </div>
              )}
              {lensNeedsAuth && lensHandle && (
                <div className="pb-3 space-y-2">
                  <p className="text-[10px] text-gray-500">Profile found — authorize posting with your wallet:</p>
                  {lensWalletAddr ? (
                    <button
                      onClick={lensAuthorize}
                      disabled={lensConnecting}
                      className="text-[10px] px-3 py-1.5 rounded-lg bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623] font-medium hover:bg-[#f5a623]/20 transition-colors disabled:opacity-50"
                    >
                      {lensConnecting ? 'Signing with wallet...' : 'Authorize Posting'}
                    </button>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-[10px] text-amber-400">Connect your wallet first (RainbowKit button in the Wallet row above), then come back here.</p>
                    </div>
                  )}
                </div>
              )}
              {!lensHandle && !session?.walletAddress && (
                <div className="pb-3">
                  <p className="text-[10px] text-gray-600">No wallet detected</p>
                </div>
              )}
            </AccountRow>

            {/* 5. Hive */}
            <AccountRow
              icon={<HiveIcon className="w-4 h-4 text-red-400" />}
              name="Hive"
              status={hiveUsername ? 'connected' : 'disconnected'}
              detail={hiveUsername ? `@${hiveUsername}` : undefined}
              action={
                hiveUsername ? (
                  <button
                    onClick={disconnectHive}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowHiveConnect(!showHiveConnect); setHiveError(''); }}
                    className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors"
                  >
                    Connect
                  </button>
                )
              }
            >
              {/* Hive inline connect form */}
              {showHiveConnect && !hiveUsername && (
                <div className="pb-3 space-y-2">
                  <input
                    value={hiveUser}
                    onChange={(e) => setHiveUser(e.target.value)}
                    placeholder="Hive username"
                    className="w-full bg-[#0a1628] text-white text-base md:text-xs rounded-lg px-3 py-2 placeholder-gray-600 border border-gray-700 focus:outline-none focus:border-red-500"
                  />
                  <input
                    value={hivePostingKey}
                    onChange={(e) => setHivePostingKey(e.target.value)}
                    placeholder="Posting key (5K...)"
                    type="password"
                    className="w-full bg-[#0a1628] text-white text-base md:text-xs rounded-lg px-3 py-2 placeholder-gray-600 border border-gray-700 focus:outline-none focus:border-red-500"
                  />
                  <p className="text-[10px] text-gray-600">Your posting key is encrypted and never shared</p>
                  {hiveError && <p className="text-[10px] text-red-400">{hiveError}</p>}
                  <button
                    onClick={connectHive}
                    disabled={hiveConnecting}
                    className="w-full text-xs font-medium py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 transition-colors"
                  >
                    {hiveConnecting ? 'Connecting...' : 'Connect Hive'}
                  </button>
                </div>
              )}
            </AccountRow>

            {/* 6. Solana */}
            <div className="py-3">
              <SolanaWalletConnect
                savedWallet={solanaWallet}
                onSaved={setSolanaWallet}
              />
            </div>

            {/* 7. X / Twitter — admin only */}
            {!!session.isAdmin && (
              <AccountRow
                icon={<XIcon className="w-4 h-4 text-white" />}
                name="X / Twitter"
                status={profile.x_handle ? 'connected' : 'disconnected'}
                detail={profile.x_handle ? `Configured by ZAO` : 'Not configured'}
                action={
                  profile.x_handle ? (
                    <span className="text-[10px] text-gray-600">@{profile.x_handle}</span>
                  ) : null
                }
              />
            )}
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Features</p>
          </div>
          <div className="bg-[#0d1b2a] rounded-xl px-4 border border-gray-800 divide-y divide-gray-800/50">

            {/* Messaging (XMTP) */}
            <FeatureRow
              name="Messaging (XMTP)"
              detail={
                xmtpConnected && activeXMTPAddress
                  ? shortAddr(activeXMTPAddress)
                  : xmtpConnected
                    ? 'Enabled'
                    : 'Not enabled'
              }
              action={
                xmtpConnected && activeXMTPAddress ? (
                  <button
                    onClick={switchWallet}
                    className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors"
                  >
                    Switch
                  </button>
                ) : !xmtpConnected ? (
                  <Link href="/messages" className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors">
                    Enable in Messages
                  </Link>
                ) : null
              }
            />

            {/* Cross-posting */}
            <FeatureRow
              name="Cross-posting"
              detail={`${crossPostPlatforms} of ${totalCrossPostPlatforms} platforms connected`}
              action={
                <span className="text-[10px] text-gray-500">
                  {crossPostPlatforms > 0 ? 'Active' : 'Connect accounts above'}
                </span>
              }
            />

            {/* Push Notifications */}
            <FeatureRow
              name="Push Notifications"
              detail={pushEnabled === null ? 'Checking...' : pushEnabled ? 'Enabled' : 'Disabled'}
              action={
                pushEnabled !== null ? (
                  <ToggleSwitch
                    on={pushEnabled}
                    onToggle={togglePushNotifications}
                    disabled={pushToggling}
                    label={pushEnabled ? 'Disable push notifications' : 'Enable push notifications'}
                  />
                ) : null
              }
            />
          </div>
        </section>

        {/* ── Socials ──────────────────────────────────────────────── */}
        <SocialsSection profile={profile} />

        {/* ── Farcaster Identity (read-only) ─────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Farcaster Identity</p>
          <div className="bg-[#0d1b2a] rounded-xl p-5 border border-gray-800">
            <div className="flex items-center gap-4 mb-4">
              {profile.pfp_url ? (
                <Image src={profile.pfp_url} alt={profile.fc_display_name || 'avatar'} width={56} height={56} className="rounded-full" unoptimized />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <span className="text-lg text-gray-400 font-bold">{(profile.fc_display_name || '?')[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-white truncate">{profile.fc_display_name || 'Anonymous'}</p>
                  {profile.power_badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold flex-shrink-0">
                      Power
                    </span>
                  )}
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
            {profile.fc_bio && (
              <p className="text-sm text-gray-400 leading-relaxed mb-4">{profile.fc_bio}</p>
            )}

            {/* Farcaster Stats */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800/50">
              <div className="text-center">
                <p className="text-lg font-bold text-white">{formatNumber(profile.follower_count)}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white">{formatNumber(profile.following_count)}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Following</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-white capitalize">{profile.role}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Role</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center gap-3 text-xs text-gray-600">
              {profile.created_at && (
                <span>Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              )}
              <span>·</span>
              <a
                href={`https://farcaster.xyz/${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f5a623]/60 hover:text-[#f5a623] transition-colors"
              >
                View on Farcaster
              </a>
            </div>

            {/* Share your ZID */}
            <div className="mt-3 pt-3 border-t border-gray-800/50">
              <ShareToFarcaster
                template={shareTemplates.profile(profile.zid, profile.fc_display_name || profile.zao_display_name || 'ZAO Member')}
                variant="button"
                label="Share your ZID"
                className="w-full justify-center"
              />
            </div>
          </div>
        </section>

        {/* ── ZAO Profile (editable) ──────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <p className="text-xs text-gray-500 uppercase tracking-wider">ZAO Profile</p>
            {!zaoEditing && (
              <button
                onClick={() => setZaoEditing(true)}
                className="text-[10px] text-[#f5a623] hover:text-[#ffd700] transition-colors"
              >
                Edit
              </button>
            )}
          </div>
          <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 divide-y divide-gray-800/50">
            {zaoEditing ? (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Display Name</label>
                  <input
                    type="text"
                    value={zaoFields.display_name}
                    onChange={(e) => setZaoFields((f) => ({ ...f, display_name: e.target.value }))}
                    maxLength={50}
                    placeholder="Override your Farcaster name within ZAO"
                    className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-base md:text-sm text-white placeholder-gray-600 focus:border-[#f5a623] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Bio</label>
                  <textarea
                    value={zaoFields.bio}
                    onChange={(e) => setZaoFields((f) => ({ ...f, bio: e.target.value }))}
                    maxLength={300}
                    rows={3}
                    placeholder="ZAO-specific bio (supplements your Farcaster bio)"
                    className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-base md:text-sm text-white placeholder-gray-600 focus:border-[#f5a623] focus:outline-none resize-none"
                  />
                  <p className="text-[10px] text-gray-600 mt-1">{zaoFields.bio.length}/300</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">IGN (In-Game Name)</label>
                  <input
                    type="text"
                    value={zaoFields.ign}
                    onChange={(e) => setZaoFields((f) => ({ ...f, ign: e.target.value }))}
                    maxLength={30}
                    placeholder="Community handle"
                    className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-base md:text-sm text-white placeholder-gray-600 focus:border-[#f5a623] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Real Name</label>
                  <input
                    type="text"
                    value={zaoFields.real_name}
                    onChange={(e) => setZaoFields((f) => ({ ...f, real_name: e.target.value }))}
                    maxLength={80}
                    placeholder="Optional — visible to community members"
                    className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-base md:text-sm text-white placeholder-gray-600 focus:border-[#f5a623] focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={saveZaoProfile}
                    disabled={zaoSaving}
                    className="px-4 py-2 bg-[#f5a623] text-black text-sm font-medium rounded-lg hover:bg-[#ffd700] transition-colors disabled:opacity-50"
                  >
                    {zaoSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setZaoEditing(false);
                      if (profile) {
                        setZaoFields({
                          display_name: profile.zao_display_name,
                          bio: profile.zao_bio,
                          ign: profile.ign,
                          real_name: profile.real_name,
                        });
                      }
                    }}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {zaoSaved && (
                  <div className="px-5 py-2 bg-green-500/5 text-xs text-green-400">
                    Profile saved
                  </div>
                )}
                <div className="px-5 py-4">
                  <p className="text-xs text-gray-500">Display Name</p>
                  <p className="text-sm text-white mt-0.5">{zaoFields.display_name || <span className="text-gray-600 italic">Not set</span>}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-gray-500">Bio</p>
                  <p className="text-sm text-white mt-0.5">{zaoFields.bio || <span className="text-gray-600 italic">Not set</span>}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-gray-500">IGN (In-Game Name)</p>
                  <p className="text-sm text-white mt-0.5">{zaoFields.ign || <span className="text-gray-600 italic">Not set</span>}</p>
                </div>
                <div className="px-5 py-4">
                  <p className="text-xs text-gray-500">Real Name</p>
                  <p className="text-sm text-white mt-0.5">{zaoFields.real_name || <span className="text-gray-600 italic">Not set</span>}</p>
                </div>
                <div className="px-5 py-3">
                  <p className="text-[10px] text-gray-600">ZAO profile fields supplement your Farcaster identity within the community.</p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Respect Tokens ──────────────────────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Respect Tokens</p>
          <div className="bg-[#0d1b2a] rounded-xl p-5 border border-gray-800">
            {respectLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : respect.member ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-[#f5a623]">{respect.member.total_respect}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Total Respect</p>
                  </div>
                  <div className="bg-[#0a1628] rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-400">{respect.member.fractal_count}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Fractals Attended</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Fractal Respect</span>
                    <span className="text-sm text-white font-mono">{respect.member.fractal_respect}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">On-chain OG Respect</span>
                    <span className="text-sm text-white font-mono">{respect.member.onchain_og}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">On-chain ZOR</span>
                    <span className="text-sm text-white font-mono">{respect.member.onchain_zor}</span>
                  </div>
                </div>
                {respect.member.first_respect_at && (
                  <div className="mt-3 pt-3 border-t border-gray-800/50">
                    <p className="text-[10px] text-gray-600">
                      First respect earned {new Date(respect.member.first_respect_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-800/50">
                  <Link href="/respect" className="text-xs text-[#f5a623]/60 hover:text-[#f5a623] transition-colors">
                    View full leaderboard
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No respect tokens yet</p>
                <p className="text-xs text-gray-600 mt-1">Earn respect by attending Fractal sessions</p>
              </div>
            )}
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
              {profile.primary_wallet && <CopyButton text={profile.primary_wallet} />}
              <button
                onClick={() => toggleWalletVisibility('primary_wallet')}
                disabled={walletVisLoading || walletVisSaving}
                className="ml-1 p-1 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
                title={hiddenWallets.includes('primary_wallet') ? 'Hidden from profile' : 'Visible on profile'}
              >
                {hiddenWallets.includes('primary_wallet') ? (
                  <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
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
                <CopyButton text={profile.respect_wallet} />
                <button
                  onClick={() => toggleWalletVisibility('respect_wallet')}
                  disabled={walletVisLoading || walletVisSaving}
                  className="ml-1 p-1 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
                  title={hiddenWallets.includes('respect_wallet') ? 'Hidden from profile' : 'Visible on profile'}
                >
                  {hiddenWallets.includes('respect_wallet') ? (
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Solana wallet */}
            {solanaWallet && (
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-purple-400">SOL</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Solana Wallet</p>
                  <p className="text-sm text-white font-mono truncate">{solanaWallet}</p>
                </div>
                <CopyButton text={solanaWallet} />
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
                <CopyButton text={profile.custody_address} />
                <button
                  onClick={() => toggleWalletVisibility('custody_address')}
                  disabled={walletVisLoading || walletVisSaving}
                  className="ml-1 p-1 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
                  title={hiddenWallets.includes('custody_address') ? 'Hidden from profile' : 'Visible on profile'}
                >
                  {hiddenWallets.includes('custody_address') ? (
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            )}

            {/* Verified addresses */}
            {profile.verified_addresses.length > 0 && (
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-500">Verified Addresses</p>
                  <button
                    onClick={() => toggleWalletVisibility('verified_addresses')}
                    disabled={walletVisLoading || walletVisSaving}
                    className="p-1 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
                    title={hiddenWallets.includes('verified_addresses') ? 'Hidden from profile' : 'Visible on profile'}
                  >
                    {hiddenWallets.includes('verified_addresses') ? (
                      <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="space-y-2">
                  {profile.verified_addresses.map((addr) => {
                    const addrKey = `verified_${addr.toLowerCase()}` as WalletKey;
                    const isHidden = hiddenWallets.includes(addrKey);
                    return (
                      <div key={addr} className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-mono truncate flex-1 min-w-0 ${isHidden ? 'text-gray-600' : 'text-white'}`}>{addr}</p>
                        <CopyButton text={addr} />
                        <button
                          onClick={() => toggleWalletVisibility(addrKey)}
                          disabled={walletVisLoading || walletVisSaving}
                          className="p-1 rounded hover:bg-white/5 transition-colors disabled:opacity-50"
                          title={isHidden ? 'Hidden from profile — tap to show' : 'Visible on profile — tap to hide'}
                        >
                          {isHidden ? (
                            <svg className="w-4 h-4 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visibility hint */}
            <div className="px-5 py-3">
              <p className="text-[10px] text-gray-600">
                Toggle the eye icon to show or hide each wallet on your public profile. Hidden wallets are still visible to you here.
              </p>
            </div>
          </div>
        </section>

        {/* ── Invite ──────────────────────────────────────────────── */}
        <section>
          <p className="text-xs text-gray-500 uppercase tracking-wider px-1 mb-3">Spread the Word</p>
          <div className="bg-[#0d1b2a] rounded-xl p-5 border border-gray-800">
            <ShareToFarcaster
              template={shareTemplates.invite()}
              variant="button"
              label="Invite to ZAO"
              className="w-full justify-center"
            />
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
