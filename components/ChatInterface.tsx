'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  uploadedDocuments: string[];
}

export default function ChatInterface({ uploadedDocuments }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage,
          history,
          uploadedDocuments,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error.message || 'Something went wrong'}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/50 rounded-b-2xl">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 p-6">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-4 animate-message">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/5 shadow-inner">
              <svg className="w-10 h-10 text-cyan-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <p className="text-xl font-medium text-slate-300 mb-2">Ready to Assist</p>
              <p className="text-sm font-light max-w-xs mx-auto">Upload a document on the left and ask me anything about it.</p>
            </div>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-message`}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            {message.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-lg shadow-cyan-500/20">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white rounded-br-sm'
                  : 'bg-slate-800 text-slate-200 border border-white/5 rounded-bl-sm'
              }`}
            >
              <div className="whitespace-pre-wrap leading-relaxed text-[15px] prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-message">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shrink-0 mr-3 mt-1 shadow-lg shadow-cyan-500/20">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="bg-slate-800 border border-white/5 rounded-2xl rounded-bl-sm p-4 w-24 flex items-center justify-center">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900/80 backdrop-blur-md border-t border-white/10 rounded-b-2xl">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your document..."
            className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-full pl-6 pr-32 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-500 shadow-inner"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2.5 rounded-full hover:shadow-lg hover:shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
          >
            <span>Send</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

