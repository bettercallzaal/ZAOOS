'use client';

import { useState } from 'react';

const ISSUE_TYPES = [
  { value: 'bug', label: 'Bug Report', icon: '🐛', description: 'Something is broken' },
  { value: 'feature', label: 'Feature Request', icon: '✨', description: 'New functionality' },
  { value: 'improvement', label: 'Improvement', icon: '🔧', description: 'Make something better' },
  { value: 'question', label: 'Question', icon: '❓', description: 'Need help or clarity' },
] as const;

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'text-gray-400' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
  { value: 'high', label: 'High', color: 'text-red-400' },
] as const;

export function IssueSubmitForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<string>('feature');
  const [priority, setPriority] = useState<string>('medium');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/community-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, type, priority }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
      setTitle('');
      setDescription('');
      setType('feature');
      setPriority('medium');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-[#0d1b2a] rounded-xl p-6 border border-green-800/50 text-center">
        <p className="text-green-400 font-medium text-lg">Issue Submitted</p>
        <p className="text-gray-400 text-sm mt-2">
          Your issue has been sent to the ZAO CEO agent for review and prioritization.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-[#f5a623] hover:text-[#ffd700] transition-colors"
        >
          Submit another issue
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type selector */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Type</label>
        <div className="grid grid-cols-2 gap-2">
          {ISSUE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                type === t.value
                  ? 'border-[#f5a623]/50 bg-[#f5a623]/10 text-white'
                  : 'border-white/[0.08] bg-[#0d1b2a] text-gray-400 hover:border-white/[0.08]'
              }`}
            >
              <span className="text-lg">{t.icon}</span>
              <p className="text-xs font-medium mt-1">{t.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="issue-title" className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
          Title
        </label>
        <input
          id="issue-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief description of the issue"
          required
          minLength={5}
          maxLength={200}
          className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="issue-desc" className="text-xs text-gray-500 uppercase tracking-wider block mb-1">
          Description
        </label>
        <textarea
          id="issue-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What happened? What did you expect? Steps to reproduce..."
          required
          minLength={10}
          maxLength={5000}
          rows={5}
          className="w-full bg-[#0d1b2a] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-[#f5a623]/50 focus:outline-none resize-none"
        />
      </div>

      {/* Priority */}
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-wider block mb-2">Priority</label>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriority(p.value)}
              className={`px-4 py-2 rounded-lg border text-xs font-medium transition-colors ${
                priority === p.value
                  ? 'border-[#f5a623]/50 bg-[#f5a623]/10 text-white'
                  : 'border-white/[0.08] bg-[#0d1b2a] text-gray-400 hover:border-white/[0.08]'
              }`}
            >
              <span className={p.color}>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || title.length < 5 || description.length < 10}
        className="w-full bg-[#f5a623] text-black font-medium py-2.5 rounded-lg text-sm hover:bg-[#ffd700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit Issue to ZAO'}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Issues are reviewed by the ZAO AI CEO and assigned to the right team member.
      </p>
    </form>
  );
}
