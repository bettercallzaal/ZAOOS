'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'What audio room providers do we use?',
  'How does the Respect system work?',
  'What platforms can we broadcast to?',
  'Tell me about the music player',
  'What\'s the governance structure?',
];

export default function AssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage: Message = { role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content || data?.reply || 'Sorry, I couldn\'t generate a response.';

      // Strip <think> tags emitted by MiniMax-M2.7 reasoning traces
      const cleaned = raw.replace(/<think>[\s\S]*?<\/think>\s*/g, '').trim();

      setMessages([...newMessages, { role: 'assistant', content: cleaned }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0a1628] text-white flex flex-col">
      {/* Header */}
      <header className="px-4 py-3 border-b border-white/[0.08] bg-[#0d1b2a] flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-full bg-[#f5a623]/20 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 4-3 6-3 8H8c0-2-3-4-3-8a7 7 0 0 1 7-7z" />
            <path d="M9 17v1a3 3 0 0 0 6 0v-1" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-sm">ZAO Assistant</h2>
          <p className="text-[10px] text-gray-500">Powered by Minimax M2.7 + 197 research docs</p>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-32">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
              Hey {user?.displayName || 'there'}!
            </h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              I&apos;m the ZAO Assistant. I know everything about this project — 197 research docs,
              the codebase, governance, music, audio rooms, and more. Ask me anything.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="px-3 py-1.5 bg-[#1a2a3a] border border-white/[0.08] rounded-lg text-xs text-gray-400 hover:text-white hover:border-[#f5a623]/40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#f5a623] text-[#0a1628] rounded-br-md font-medium'
                  : 'bg-[#1a2a3a] text-gray-200 rounded-bl-md border border-white/[0.08]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#1a2a3a] rounded-2xl rounded-bl-md px-4 py-3 border border-white/[0.08]">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input bar — sits above mobile nav (bottom-14) and flush on desktop */}
      <div className="fixed bottom-14 md:bottom-0 left-0 right-0 bg-[#0d1b2a] border-t border-white/[0.08] px-4 py-3" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything about ZAO..."
            rows={1}
            className="flex-1 bg-[#0a1628] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-[#f5a623] focus:outline-none resize-none"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 bg-[#f5a623] text-[#0a1628] rounded-xl font-semibold text-sm hover:bg-[#ffd700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
