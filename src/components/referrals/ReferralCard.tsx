"use client";

import { useState, useCallback, useEffect } from "react";

interface ReferralCode {
  id: string;
  code: string;
  max_uses: number;
  times_used: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  referrals: {
    pending: number;
    joined: number;
    active_d30: number;
    expired: number;
  };
}

interface CodesResponse {
  codes: ReferralCode[];
  activeCount: number;
  maxAllowed: number;
  canGenerate: boolean;
}

interface StatsResponse {
  totalInvited: number;
  pending: number;
  joined: number;
  activeD30: number;
  expired: number;
  activeCodes: number;
  totalCodes: number;
}

export default function ReferralCard() {
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [canGenerate, setCanGenerate] = useState(true);
  const [maxAllowed, setMaxAllowed] = useState(3);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [codesRes, statsRes] = await Promise.allSettled([
        fetch("/api/referrals"),
        fetch("/api/referrals/stats"),
      ]);

      if (codesRes.status === "fulfilled" && codesRes.value.ok) {
        const data: CodesResponse = await codesRes.value.json();
        setCodes(data.codes);
        setCanGenerate(data.canGenerate);
        setMaxAllowed(data.maxAllowed);
        setActiveCount(data.activeCount);
      }

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const data: StatsResponse = await statsRes.value.json();
        setStats(data);
      }
    } catch {
      setError("Failed to load referral data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateCode = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_uses: 1 }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to generate code");
        return;
      }
      await fetchData();
    } catch {
      setError("Failed to generate code");
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const copyInviteLink = async (code: string) => {
    const link = `${window.location.origin}?ref=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedCode(`link-${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setCopiedCode(`link-${code}`);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#0a1628]/80 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 rounded bg-white/10" />
          <div className="h-20 rounded bg-white/10" />
          <div className="h-10 w-32 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1628]/80 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Invite Codes</h3>
          <p className="text-sm text-white/50 mt-0.5">
            Invite others to join ZAO OS
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span>
            {activeCount}/{maxAllowed} active
          </span>
        </div>
      </div>

      {/* Stats */}
      {stats && stats.totalInvited > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-[#f5a623]">
              {stats.totalInvited}
            </div>
            <div className="text-xs text-white/50 mt-1">Invited</div>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-green-400">
              {stats.activeD30}
            </div>
            <div className="text-xs text-white/50 mt-1">Active (D30)</div>
          </div>
          <div className="rounded-lg bg-white/5 p-3 text-center">
            <div className="text-xl font-bold text-white/70">
              {stats.pending + stats.joined}
            </div>
            <div className="text-xs text-white/50 mt-1">Pending</div>
          </div>
        </div>
      )}

      {/* Codes list */}
      {codes.length > 0 ? (
        <div className="space-y-3">
          {codes.map((rc) => {
            const isExpired =
              rc.expires_at && new Date(rc.expires_at) < new Date();
            const isFullyUsed = rc.times_used >= rc.max_uses;
            const isDisabled = !rc.is_active || isExpired || isFullyUsed;

            return (
              <div
                key={rc.id}
                className={`rounded-lg border p-4 transition-colors ${
                  isDisabled
                    ? "border-white/5 bg-white/[0.02] opacity-50"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="font-mono text-lg font-bold tracking-widest text-[#f5a623]">
                      {rc.code}
                    </code>
                    <span className="text-xs text-white/40">
                      {rc.times_used}/{rc.max_uses} used
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => copyCode(rc.code)}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                      title="Copy code"
                    >
                      {copiedCode === rc.code ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={() => copyInviteLink(rc.code)}
                      className="rounded-md px-2.5 py-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                      title="Copy invite link"
                    >
                      {copiedCode === `link-${rc.code}` ? "Copied!" : "Link"}
                    </button>
                  </div>
                </div>
                {/* Status badges */}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {isExpired && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                      Expired
                    </span>
                  )}
                  {isFullyUsed && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/40">
                      Fully used
                    </span>
                  )}
                  {!isDisabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                      Active
                    </span>
                  )}
                  {rc.referrals.joined > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5a623]/20 text-[#f5a623]">
                      {rc.referrals.joined} joined
                    </span>
                  )}
                  {rc.referrals.active_d30 > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
                      {rc.referrals.active_d30} active D30
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-white/10 p-6 text-center">
          <p className="text-sm text-white/40">
            No referral codes yet. Generate one to start inviting.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={generateCode}
        disabled={!canGenerate || generating}
        className={`w-full rounded-lg py-3 px-4 text-sm font-semibold transition-colors ${
          canGenerate && !generating
            ? "bg-[#f5a623] text-[#0a1628] hover:bg-[#f5a623]/90 active:bg-[#f5a623]/80"
            : "bg-white/5 text-white/30 cursor-not-allowed"
        }`}
      >
        {generating
          ? "Generating..."
          : canGenerate
            ? "Generate New Code"
            : `Limit Reached (${maxAllowed}/${maxAllowed})`}
      </button>
    </div>
  );
}
