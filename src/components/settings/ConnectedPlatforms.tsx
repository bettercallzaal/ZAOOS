'use client';

import { useState, useEffect, useCallback } from 'react';

import { LensConnect } from '@/components/settings/LensConnect';

// ── Types ──────────────────────────────────────────────────────────

interface PlatformStatus {
  bluesky_handle: string | null;
  lens_profile_id: string | null;
  hive_username: string | null;
  x_handle: string | null;
}

interface ConnectedPlatformsProps {
  isAdmin: boolean;
  initialStatus: PlatformStatus;
}

type PlatformId = 'bluesky' | 'lens' | 'hive' | 'x';

// ── Platform SVG Icons ─────────────────────────────────────────────

function BlueskyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 568 501" className={className} fill="currentColor">
      <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.793 166.471-20.155 71.454-93.57 89.708-159.534 78.663 115.346 19.729 144.665 85.021 81.294 150.313-120.758 124.562-173.715-31.256-187.093-71.174-2.41-7.186-3.542-10.549-2.874-7.688-0.668-2.861-0.464 0.502-2.874 7.688-13.378 39.918-66.335 195.736-187.093 71.174-63.371-65.292-34.052-130.584 81.294-150.313-65.964 11.045-139.379-7.209-159.534-78.663C9.945 203.659 0 75.293 0 57.947 0-28.906 76.135-1.611 123.121 33.664Z" />
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

// ── Platform Card ──────────────────────────────────────────────────

interface PlatformCardProps {
  id: PlatformId;
  name: string;
  icon: React.ReactNode;
  accentColor: string;
  connectedAs: string | null;
  onConnect?: (data: Record<string, string>) => Promise<void>;
  onDisconnect?: () => Promise<void>;
  connectFields?: Array<{
    key: string;
    label: string;
    placeholder: string;
    type?: string;
    helpText?: string;
  }>;
  statusOnly?: boolean;
  statusText?: string;
}

function PlatformCard({
  name,
  icon,
  accentColor,
  connectedAs,
  onConnect,
  onDisconnect,
  connectFields,
  statusOnly,
  statusText,
}: PlatformCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleConnect = async () => {
    if (!onConnect || !connectFields) return;
    const missing = connectFields.some((f) => !formData[f.key]?.trim());
    if (missing) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await onConnect(formData);
      setSuccess('Connected successfully');
      setShowForm(false);
      setFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    }
    setLoading(false);
  };

  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await onDisconnect();
      setSuccess('Disconnected');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    }
    setLoading(false);
  };

  const isConnected = !!connectedAs;

  return (
    <div className="bg-[#0d1b2a] rounded-xl border border-gray-800 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-600'}`} />
              <span className={`text-xs ${isConnected ? 'text-gray-400' : 'text-gray-600'}`}>
                {statusOnly
                  ? (statusText || 'Not configured')
                  : isConnected
                    ? `Connected as @${connectedAs}`
                    : 'Not connected'}
              </span>
            </div>
          </div>
        </div>

        {!statusOnly && (
          <div>
            {isConnected ? (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {loading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            ) : (
              <button
                onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
                className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                style={{
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                }}
              >
                Connect
              </button>
            )}
          </div>
        )}
      </div>

      {/* Success / Error feedback */}
      {(error || success) && (
        <div className="px-4 pb-3">
          {error && <p className="text-xs text-red-400">{error}</p>}
          {success && <p className="text-xs text-green-400">{success}</p>}
        </div>
      )}

      {/* Inline connect form */}
      {showForm && !isConnected && connectFields && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-800/50 pt-3">
          {connectFields.map((field) => (
            <div key={field.key}>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                {field.label}
              </label>
              <input
                value={formData[field.key] || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                type={field.type || 'text'}
                className="w-full bg-[#0a1628] text-white text-base md:text-xs rounded-lg px-3 py-2 placeholder-gray-600 border border-gray-700 focus:outline-none focus:ring-1 focus:border-transparent transition-colors"
                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
              />
              {field.helpText && (
                <p className="text-[10px] text-gray-600 mt-1">{field.helpText}</p>
              )}
            </div>
          ))}
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full text-xs font-medium py-2.5 rounded-lg text-white transition-colors disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {loading ? 'Connecting...' : `Connect ${name}`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────

export function ConnectedPlatforms({ isAdmin, initialStatus }: ConnectedPlatformsProps) {
  const [status, setStatus] = useState<PlatformStatus>(initialStatus);
  const [loaded, setLoaded] = useState(false);

  // Fetch latest connection status on mount
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/profile/platforms');
        if (res.ok) {
          const data = await res.json();
          setStatus({
            bluesky_handle: data.bluesky_handle ?? null,
            lens_profile_id: data.lens_profile_id ?? null,
            hive_username: data.hive_username ?? null,
            x_handle: data.x_handle ?? null,
          });
        }
      } catch {
        // Fall back to initial status
      }
      setLoaded(true);
    }
    fetchStatus();
  }, []);

  // ── Bluesky handlers ────────────────────────────────

  const connectBluesky = useCallback(async (data: Record<string, string>) => {
    const res = await fetch('/api/bluesky', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: data.handle, appPassword: data.appPassword }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to connect Bluesky');
    setStatus((prev) => ({ ...prev, bluesky_handle: json.handle }));
  }, []);

  const disconnectBluesky = useCallback(async () => {
    const res = await fetch('/api/bluesky', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to disconnect');
    setStatus((prev) => ({ ...prev, bluesky_handle: null }));
  }, []);

  // Lens auth is handled by the <LensConnect> component

  // ── Hive handlers ───────────────────────────────────

  const connectHive = useCallback(async (data: Record<string, string>) => {
    const res = await fetch('/api/platforms/hive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: data.username,
        postingKey: data.postingKey,
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to connect Hive');
    setStatus((prev) => ({ ...prev, hive_username: json.username }));
  }, []);

  const disconnectHive = useCallback(async () => {
    const res = await fetch('/api/platforms/hive', { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to disconnect');
    setStatus((prev) => ({ ...prev, hive_username: null }));
  }, []);

  // Don't render until we've attempted to load fresh status
  if (!loaded && !initialStatus.bluesky_handle && !initialStatus.lens_profile_id && !initialStatus.hive_username) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between px-1 mb-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider">Connected Platforms</p>
        <span className="text-[10px] text-gray-600">
          Cross-post to other networks
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Bluesky */}
        <PlatformCard
          id="bluesky"
          name="Bluesky"
          icon={<BlueskyIcon className="w-4 h-4 text-blue-400" />}
          accentColor="#3b82f6"
          connectedAs={status.bluesky_handle}
          onConnect={connectBluesky}
          onDisconnect={disconnectBluesky}
          connectFields={[
            {
              key: 'handle',
              label: 'Handle',
              placeholder: 'yourname.bsky.social',
            },
            {
              key: 'appPassword',
              label: 'App Password',
              placeholder: 'xxxx-xxxx-xxxx-xxxx',
              type: 'password',
              helpText: 'Create one at bsky.app/settings/app-passwords',
            },
          ]}
        />

        {/* Lens Protocol — V3 wallet-based auth with signless */}
        <LensConnect
          initialHandle={status.lens_profile_id}
          onStatusChange={(handle) => setStatus((prev) => ({ ...prev, lens_profile_id: handle }))}
        />

        {/* Hive / InLeo */}
        <PlatformCard
          id="hive"
          name="Hive / InLeo"
          icon={<HiveIcon className="w-4 h-4 text-red-400" />}
          accentColor="#e31337"
          connectedAs={status.hive_username}
          onConnect={connectHive}
          onDisconnect={disconnectHive}
          connectFields={[
            {
              key: 'username',
              label: 'Hive Username',
              placeholder: 'yourusername',
            },
            {
              key: 'postingKey',
              label: 'Posting Key',
              placeholder: '5K...',
              type: 'password',
              helpText: 'Your posting key is encrypted and never shared',
            },
          ]}
        />

        {/* X / Twitter — admin only */}
        {isAdmin && (
          <PlatformCard
            id="x"
            name="X / Twitter"
            icon={<XIcon className="w-4 h-4 text-white" />}
            accentColor="#ffffff"
            connectedAs={null}
            statusOnly
            statusText={status.x_handle ? `Configured by ZAO (@${status.x_handle})` : 'Configured via environment'}
          />
        )}
      </div>
    </section>
  );
}
