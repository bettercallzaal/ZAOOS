'use client';

import { useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type FeedbackType = 'bug' | 'feature' | 'feedback';

export function IssueReporter() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Don't render for unauthenticated users or on landing page
  if (!user || pathname === '/') return null;

  const handleScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setResult({ success: false, message: 'Image must be under 3MB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    setResult(null);

    try {
      const browser = `${navigator.userAgent.slice(0, 150)}`;
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          page: pathname,
          browser,
          screenshot: screenshot || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: `Submitted! (#${data.issueNumber})` });
        setTitle('');
        setDescription('');
        setScreenshot(null);
        setTimeout(() => {
          setIsOpen(false);
          setResult(null);
        }, 2000);
      } else {
        setResult({ success: false, message: data.error || 'Failed to submit' });
      }
    } catch {
      setResult({ success: false, message: 'Network error. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setIsOpen(false);
    setResult(null);
    setTitle('');
    setDescription('');
    setScreenshot(null);
    setType('bug');
  };

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-40 bg-[#1a2a4a] border border-white/10 text-gray-400 hover:text-white px-3 py-2 rounded-full shadow-lg hover:shadow-xl transition-all text-xs flex items-center gap-1.5 md:bottom-6"
      >
        <span>🐛</span>
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-[#1a2a4a] rounded-t-xl sm:rounded-xl p-5 w-full sm:max-w-md border border-white/10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Report an Issue</h2>
              <button onClick={reset} className="text-gray-400 hover:text-white">✕</button>
            </div>

            {/* Type selector */}
            <div className="flex gap-2 mb-3">
              {(['bug', 'feature', 'feedback'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                    type === t
                      ? 'bg-[#f5a623] text-[#0a1628]'
                      : 'bg-[#0a1628] border border-white/20 text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'bug' ? '🐛 Bug' : t === 'feature' ? '💡 Feature' : '💬 Feedback'}
                </button>
              ))}
            </div>

            {/* Title */}
            <input
              type="text"
              placeholder="Short title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#0a1628] border border-white/20 rounded-lg px-4 py-3 mb-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623] text-sm min-h-[44px]"
              maxLength={200}
            />

            {/* Description */}
            <textarea
              placeholder="What happened? What did you expect?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0a1628] border border-white/20 rounded-lg px-4 py-3 mb-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#f5a623] resize-none text-sm"
              rows={4}
              maxLength={2000}
            />

            {/* Context chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                📍 {pathname}
              </span>
              <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded-full">
                👤 @{user.username}
              </span>
            </div>

            {/* Screenshot */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshot}
                className="hidden"
              />
              {screenshot ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshot} alt="Screenshot" className="w-full h-32 object-cover rounded-lg border border-white/10" />
                  <button
                    onClick={() => setScreenshot(null)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-white/20 rounded-lg py-3 text-xs text-gray-500 hover:text-gray-400 hover:border-white/30 transition-colors"
                >
                  📷 Attach screenshot (optional)
                </button>
              )}
            </div>

            {/* Result message */}
            {result && (
              <div className={`text-xs mb-3 px-3 py-2 rounded-lg ${result.success ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'}`}>
                {result.message}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !description.trim()}
              className="w-full bg-[#f5a623] text-[#0a1628] font-semibold py-3 rounded-lg hover:bg-[#d4941f] transition-colors disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>

            <p className="text-[10px] text-gray-600 text-center mt-2">
              1 report per 5 minutes
            </p>
          </div>
        </div>
      )}
    </>
  );
}
