'use client';

import { useState } from 'react';
import { LIBRARY_TAGS, type LibraryTag } from '@/lib/validation/library-schemas';

interface SubmitFormProps {
  onSubmitted: () => void;
}

export default function SubmitForm({ onSubmitted }: SubmitFormProps) {
  const [input, setInput] = useState('');
  const [note, setNote] = useState('');
  const [tags, setTags] = useState<LibraryTag[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleTag = (tag: LibraryTag) => {
    setTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < 3
          ? [...prev, tag]
          : prev,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || submitting) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/library/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          note: note.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setInput('');
      setNote('');
      setTags([]);
      setFeedback({ type: 'success', message: 'Submitted! AI summary generating...' });
      onSubmitted();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to submit',
      });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a URL or type a topic to research..."
          className="w-full rounded-lg bg-[#1a2a3a] px-4 py-3 text-white placeholder-gray-400 outline-none ring-1 ring-gray-700 focus:ring-[#f5a623]"
          maxLength={2000}
        />
      </div>

      <div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Why is this interesting? (optional)"
          rows={2}
          className="w-full rounded-lg bg-[#1a2a3a] px-4 py-3 text-white placeholder-gray-400 outline-none ring-1 ring-gray-700 focus:ring-[#f5a623] resize-none"
          maxLength={1000}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {LIBRARY_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              tags.includes(tag)
                ? 'bg-[#f5a623] text-[#0a1628]'
                : 'bg-[#1a2a3a] text-gray-300 hover:bg-[#243447]'
            }`}
          >
            {tag}
          </button>
        ))}
        {tags.length >= 3 && (
          <span className="text-xs text-gray-500 self-center">Max 3 tags</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!input.trim() || submitting}
          className="rounded-lg bg-[#f5a623] px-6 py-2 font-medium text-[#0a1628] transition-colors hover:bg-[#ffd700] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>

        {feedback && (
          <span
            className={`text-sm ${
              feedback.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {feedback.message}
          </span>
        )}
      </div>
    </form>
  );
}
