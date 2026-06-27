'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { aiApi } from '@/lib/api';

interface Message { role: 'user' | 'ai'; text: string }

const QUICK = [
  'How many potholes are open in Jaipur?',
  'Which ward has the most unresolved issues?',
  'How do I earn Hero points?',
  'What is the average resolution time this month?',
  'Which department resolves issues fastest?',
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: '👋 Hi! I\'m your CivicSense AI assistant. Ask me anything about civic issues in your city, how to report problems, or how the community can help.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);

    const history = [
  ...messages.map((m) => ({ role: m.role === 'ai' ? 'model' : 'user', parts: m.text })),
  { role: 'user', parts: text }
];
    try {
      const { data } = await aiApi.chat(history, 'Jaipur');
      setMessages((prev) => [...prev, { role: 'ai', text: data.reply }]);
    } catch (err: any) {
      const friendly = err?.response?.data?.error || 'Sorry, I had trouble connecting. Please try again.';
      setMessages((prev) => [...prev, { role: 'ai', text: friendly }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-civic-teal" />
        <h1 className="text-lg font-semibold">Ask AI</h1>
        <span className="text-xs bg-civic-teal-light text-civic-teal px-2 py-0.5 rounded-full">Powered by Gemini</span>
      </div>

      {/* Chat window */}
      <div className="card overflow-hidden flex flex-col" style={{ height: '480px' }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-civic-teal text-white'
                  : 'bg-gray-100 border border-gray-200 text-gray-800'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 px-3 py-2.5 rounded-xl flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick questions */}
        <div className="px-3 py-2 border-t border-gray-100 flex gap-2 overflow-x-auto">
          {QUICK.map((q) => (
            <button key={q} onClick={() => send(q)}
              className="text-xs whitespace-nowrap px-2.5 py-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-civic-teal-light hover:text-civic-teal transition-colors border border-gray-200 flex-shrink-0">
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100 flex gap-2 bg-white">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Ask about issues in your city…"
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-civic-teal focus:border-transparent"
          />
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            className="btn-primary px-3 disabled:opacity-40">
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
