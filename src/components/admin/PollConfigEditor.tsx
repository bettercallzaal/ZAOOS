'use client';

import { useState, useEffect, useCallback } from 'react';

interface PollConfig {
  choices: string[];
  pollTitleTemplate: string;
  pollBodyTemplate: string | null;
  votingDurationDays: number;
  updatedAt: string | null;
  updatedByFid: number | null;
}

export function PollConfigEditor() {
  const [config, setConfig] = useState<PollConfig | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [titleTemplate, setTitleTemplate] = useState('');
  const [bodyTemplate, setBodyTemplate] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [newChoice, setNewChoice] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/poll-config');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: PollConfig = await res.json();
      setConfig(data);
      setChoices(data.choices);
      setTitleTemplate(data.pollTitleTemplate);
      setBodyTemplate(data.pollBodyTemplate || '');
      setDurationDays(data.votingDurationDays);
    } catch {
      setFeedback({ type: 'error', message: 'Failed to load poll config' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    if (choices.length < 2) {
      setFeedback({ type: 'error', message: 'At least 2 choices are required' });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/poll-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choices,
          pollTitleTemplate: titleTemplate,
          pollBodyTemplate: bodyTemplate || undefined,
          votingDurationDays: durationDays,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      const data: PollConfig = await res.json();
      setConfig(data);
      setFeedback({ type: 'success', message: 'Poll config saved successfully' });
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  const addChoice = () => {
    const trimmed = newChoice.trim();
    if (!trimmed) return;
    if (choices.length >= 20) {
      setFeedback({ type: 'error', message: 'Maximum 20 choices allowed' });
      return;
    }
    setChoices([...choices, trimmed]);
    setNewChoice('');
  };

  const removeChoice = (index: number) => {
    setChoices(choices.filter((_, i) => i !== index));
  };

  const moveChoice = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= choices.length) return;
    const updated = [...choices];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setChoices(updated);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingText(choices[index]);
  };

  const finishEditing = () => {
    if (editingIndex === null) return;
    const trimmed = editingText.trim();
    if (trimmed) {
      const updated = [...choices];
      updated[editingIndex] = trimmed;
      setChoices(updated);
    }
    setEditingIndex(null);
    setEditingText('');
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  if (loading) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl p-6 border border-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-700 rounded w-48" />
          <div className="h-10 bg-gray-700 rounded" />
          <div className="h-10 bg-gray-700 rounded" />
          <div className="h-10 bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d1b2a] rounded-xl p-6 border border-gray-800 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#f5a623]">Weekly Poll Configuration</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage choices for the Snapshot weekly priority vote
          </p>
        </div>
        {config?.updatedAt && (
          <div className="text-right">
            <p className="text-[10px] text-gray-500">
              Last updated: {new Date(config.updatedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </p>
            {config.updatedByFid && (
              <p className="text-[10px] text-gray-600">by FID {config.updatedByFid}</p>
            )}
          </div>
        )}
      </div>

      {/* Title Template */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Poll Title Template</label>
        <input
          type="text"
          value={titleTemplate}
          onChange={(e) => setTitleTemplate(e.target.value)}
          placeholder="ZAO Weekly Priority Vote — Week of {date}"
          className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
        />
        <p className="text-[10px] text-gray-600">Use {'{date}'} as a placeholder for the week date</p>
      </div>

      {/* Body Template */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Poll Body Template (optional)</label>
        <textarea
          value={bodyTemplate}
          onChange={(e) => setBodyTemplate(e.target.value)}
          placeholder="Custom body text for the poll..."
          rows={3}
          className="w-full bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none resize-none"
        />
      </div>

      {/* Duration */}
      <div className="space-y-1.5">
        <label className="text-xs text-gray-400 font-medium">Voting Duration (days)</label>
        <input
          type="number"
          min={1}
          max={30}
          value={durationDays}
          onChange={(e) => setDurationDays(Math.max(1, Math.min(30, parseInt(e.target.value) || 7)))}
          className="w-24 bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-[#f5a623]/50 focus:outline-none"
        />
      </div>

      {/* Choices */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400 font-medium">
            Poll Choices ({choices.length}/20)
          </label>
        </div>

        <div className="space-y-1">
          {choices.map((choice, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-[#0a1628] rounded-lg px-3 py-2 border border-gray-800 group"
            >
              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveChoice(index, 'up')}
                  disabled={index === 0}
                  className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                  title="Move up"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => moveChoice(index, 'down')}
                  disabled={index === choices.length - 1}
                  className="text-gray-600 hover:text-gray-300 disabled:opacity-20 transition-colors"
                  title="Move down"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Choice text (editable or static) */}
              {editingIndex === index ? (
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing();
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  onBlur={finishEditing}
                  autoFocus
                  maxLength={200}
                  className="flex-1 bg-[#0d1b2a] border border-[#f5a623]/30 rounded px-2 py-1 text-sm text-white focus:border-[#f5a623]/50 focus:outline-none"
                />
              ) : (
                <span
                  className="flex-1 text-sm text-gray-300 cursor-pointer hover:text-white transition-colors"
                  onClick={() => startEditing(index)}
                  title="Click to edit"
                >
                  {choice}
                </span>
              )}

              {/* Edit button */}
              {editingIndex !== index && (
                <button
                  onClick={() => startEditing(index)}
                  className="text-gray-600 hover:text-[#f5a623] opacity-0 group-hover:opacity-100 transition-all"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              {/* Delete button */}
              <button
                onClick={() => removeChoice(index)}
                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                title="Remove"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Add new choice */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newChoice}
            onChange={(e) => setNewChoice(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addChoice(); }}
            placeholder="Add a new choice..."
            maxLength={200}
            className="flex-1 bg-[#0a1628] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
          />
          <button
            onClick={addChoice}
            disabled={!newChoice.trim() || choices.length >= 20}
            className="px-4 py-2 bg-[#f5a623]/10 text-[#f5a623] border border-[#f5a623]/30 rounded-lg text-sm font-medium hover:bg-[#f5a623]/20 disabled:opacity-40 transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`text-sm px-3 py-2 rounded-lg ${
          feedback.type === 'success'
            ? 'bg-green-900/30 text-green-400 border border-green-800'
            : 'bg-red-900/30 text-red-400 border border-red-800'
        }`}>
          {feedback.message}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || choices.length < 2}
        className="w-full bg-[#f5a623] text-black rounded-lg py-3 text-sm font-bold hover:bg-[#ffd700] disabled:opacity-40 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
