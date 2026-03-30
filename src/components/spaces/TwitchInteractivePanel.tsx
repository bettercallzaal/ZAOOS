'use client';

import { useState, useCallback } from 'react';

type Tab = 'polls' | 'predictions' | 'clips';

interface ClipEntry { id: string; editUrl: string; createdAt: string }
interface ActivePoll { id: string; title: string }
interface ActivePrediction { id: string; title: string; outcomes: { id: string; title: string }[] }

const DURATION_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '2m', value: 120 },
  { label: '5m', value: 300 },
];

export function TwitchInteractivePanel() {
  const [tab, setTab] = useState<Tab>('polls');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Polls state
  const [pollTitle, setPollTitle] = useState('');
  const [pollChoices, setPollChoices] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState(60);
  const [activePoll, setActivePoll] = useState<ActivePoll | null>(null);

  // Predictions state
  const [predTitle, setPredTitle] = useState('');
  const [predOutcomes, setPredOutcomes] = useState(['', '']);
  const [predDuration, setPredDuration] = useState(120);
  const [activePred, setActivePred] = useState<ActivePrediction | null>(null);

  // Clips state
  const [clips, setClips] = useState<ClipEntry[]>([]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const apiCall = async (url: string, method: string, body?: unknown) => {
    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      return data;
    } finally {
      setLoading(false);
    }
  };

  // --- Poll actions ---
  const startPoll = async () => {
    const choices = pollChoices.filter((c) => c.trim());
    if (!pollTitle.trim() || choices.length < 2) {
      showToast('Need a title and at least 2 choices');
      return;
    }
    try {
      const data = await apiCall('/api/twitch/poll', 'POST', {
        title: pollTitle, choices, duration: pollDuration,
      });
      setActivePoll({ id: data.pollId, title: pollTitle });
      setPollTitle('');
      setPollChoices(['', '']);
      showToast('Poll started!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create poll');
    }
  };

  const endPoll = async () => {
    if (!activePoll) return;
    try {
      await apiCall('/api/twitch/poll', 'PATCH', {
        pollId: activePoll.id, status: 'TERMINATED',
      });
      setActivePoll(null);
      showToast('Poll ended');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to end poll');
    }
  };

  // --- Prediction actions ---
  const startPrediction = async () => {
    const outcomes = predOutcomes.filter((o) => o.trim());
    if (!predTitle.trim() || outcomes.length < 2) {
      showToast('Need a title and at least 2 outcomes');
      return;
    }
    try {
      const data = await apiCall('/api/twitch/prediction', 'POST', {
        title: predTitle, outcomes, duration: predDuration,
      });
      setActivePred({ id: data.predictionId, title: predTitle, outcomes: data.outcomes });
      setPredTitle('');
      setPredOutcomes(['', '']);
      showToast('Prediction started!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create prediction');
    }
  };

  const resolvePrediction = async (winningOutcomeId: string) => {
    if (!activePred) return;
    try {
      await apiCall('/api/twitch/prediction', 'PATCH', {
        predictionId: activePred.id, winningOutcomeId,
      });
      setActivePred(null);
      showToast('Prediction resolved!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to resolve prediction');
    }
  };

  // --- Clip action ---
  const createClip = async () => {
    try {
      const data = await apiCall('/api/twitch/clip', 'POST');
      const entry: ClipEntry = { id: data.clipId, editUrl: data.editUrl, createdAt: new Date().toISOString() };
      setClips((prev) => [entry, ...prev].slice(0, 10));
      showToast('Clip created!');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create clip');
    }
  };

  const inputCls = 'w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#9146ff] focus:outline-none placeholder:text-gray-600';
  const btnPrimary = 'px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50';

  return (
    <div className="bg-[#0d1b2a] border border-gray-800 rounded-xl p-4">
      {/* Toast */}
      {toast && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-[#9146ff]/15 border border-[#9146ff]/30 text-sm text-purple-300">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#0a1628] rounded-lg p-1">
        {(['polls', 'predictions', 'clips'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
              tab === t ? 'bg-[#9146ff] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Polls */}
      {tab === 'polls' && (
        activePoll ? (
          <div className="text-center space-y-3">
            <p className="text-purple-300 text-sm font-medium">Active: {activePoll.title}</p>
            <button onClick={endPoll} disabled={loading} className={`${btnPrimary} bg-red-600 text-white hover:bg-red-500 w-full`}>
              {loading ? 'Ending...' : 'End Poll'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input value={pollTitle} onChange={(e) => setPollTitle(e.target.value)} placeholder="Poll question" maxLength={60} className={inputCls} />
            {pollChoices.map((c, i) => (
              <div key={i} className="flex gap-2">
                <input value={c} onChange={(e) => { const next = [...pollChoices]; next[i] = e.target.value; setPollChoices(next); }} placeholder={`Choice ${i + 1}`} maxLength={25} className={inputCls} />
                {pollChoices.length > 2 && (
                  <button onClick={() => setPollChoices(pollChoices.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 text-xs px-2">X</button>
                )}
              </div>
            ))}
            {pollChoices.length < 5 && (
              <button onClick={() => setPollChoices([...pollChoices, ''])} className="text-[#9146ff] text-xs hover:underline">+ Add choice</button>
            )}
            <div className="flex gap-1.5 flex-wrap">
              {DURATION_OPTIONS.map((d) => (
                <button key={d.value} onClick={() => setPollDuration(d.value)} className={`px-3 py-1 rounded-md text-xs transition-colors ${pollDuration === d.value ? 'bg-[#9146ff] text-white' : 'bg-[#0a1628] text-gray-400 border border-gray-700'}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <button onClick={startPoll} disabled={loading} className={`${btnPrimary} bg-[#9146ff] text-white hover:bg-[#7c3aed] w-full`}>
              {loading ? 'Creating...' : 'Start Poll'}
            </button>
          </div>
        )
      )}

      {/* Predictions */}
      {tab === 'predictions' && (
        activePred ? (
          <div className="space-y-3">
            <p className="text-purple-300 text-sm font-medium text-center">Active: {activePred.title}</p>
            <p className="text-gray-500 text-xs text-center">Pick the winner:</p>
            {activePred.outcomes.map((o) => (
              <button key={o.id} onClick={() => resolvePrediction(o.id)} disabled={loading} className={`${btnPrimary} w-full bg-[#0a1628] border border-[#9146ff]/40 text-purple-300 hover:bg-[#9146ff]/20`}>
                {o.title}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <input value={predTitle} onChange={(e) => setPredTitle(e.target.value)} placeholder="Prediction question" maxLength={45} className={inputCls} />
            {predOutcomes.map((o, i) => (
              <input key={i} value={o} onChange={(e) => { const next = [...predOutcomes]; next[i] = e.target.value; setPredOutcomes(next); }} placeholder={`Outcome ${i + 1}`} maxLength={25} className={inputCls} />
            ))}
            <div className="flex gap-1.5 flex-wrap">
              {DURATION_OPTIONS.map((d) => (
                <button key={d.value} onClick={() => setPredDuration(d.value)} className={`px-3 py-1 rounded-md text-xs transition-colors ${predDuration === d.value ? 'bg-[#9146ff] text-white' : 'bg-[#0a1628] text-gray-400 border border-gray-700'}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <button onClick={startPrediction} disabled={loading} className={`${btnPrimary} bg-[#9146ff] text-white hover:bg-[#7c3aed] w-full`}>
              {loading ? 'Creating...' : 'Start Prediction'}
            </button>
          </div>
        )
      )}

      {/* Clips */}
      {tab === 'clips' && (
        <div className="space-y-3">
          <button onClick={createClip} disabled={loading} className={`${btnPrimary} bg-[#9146ff] text-white hover:bg-[#7c3aed] w-full`}>
            {loading ? 'Clipping...' : 'Create Clip'}
          </button>
          {clips.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {clips.map((c) => (
                <a key={c.id} href={c.editUrl} target="_blank" rel="noopener noreferrer" className="block bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-purple-300 hover:border-[#9146ff]/50 truncate">
                  Clip {c.id.slice(0, 12)}... — {new Date(c.createdAt).toLocaleTimeString()}
                </a>
              ))}
            </div>
          )}
          {clips.length === 0 && <p className="text-gray-500 text-xs text-center">No clips yet — create one while live</p>}
        </div>
      )}
    </div>
  );
}
