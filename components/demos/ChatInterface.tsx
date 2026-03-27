'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  fromCache?: boolean;
}

interface ChatInterfaceProps {
  presets: { sequence: number; prompt_text: string; trigger_key: string }[];
  onInteract: (input: { input_type: string; user_input?: string; trigger_key?: string }) => Promise<Response>;
}

export function ChatInterface({ presets, onInteract }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string, fromCache?: boolean): string => {
    const id = String(++idCounter.current);
    setMessages((prev) => [...prev, { id, role, content, fromCache }]);
    return id;
  }, []);

  const updateLastAssistant = useCallback((content: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].role === 'assistant') {
          updated[i] = { ...updated[i], content };
          break;
        }
      }
      return updated;
    });
  }, []);

  const handlePreset = useCallback(async (triggerKey: string) => {
    if (isStreaming) return;
    const preset = presets.find((p) => p.trigger_key === triggerKey);
    if (!preset) return;

    addMessage('user', preset.prompt_text);
    setUsedKeys((prev) => new Set([...prev, triggerKey]));
    setIsStreaming(true);

    try {
      const res = await onInteract({ input_type: 'preset_command', trigger_key: triggerKey });
      const data = await res.json();
      addMessage('assistant', data.response_text || 'No response.', data.from_cache);
    } catch {
      addMessage('assistant', 'Sorry, something went wrong. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, presets, addMessage, onInteract]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isStreaming || !input.trim()) return;

    const userText = input.trim();
    setInput('');
    addMessage('user', userText);
    addMessage('assistant', '');
    setIsStreaming(true);

    try {
      const res = await onInteract({ input_type: 'text', user_input: userText });
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/plain') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          updateLastAssistant(accumulated);
        }
      } else {
        const data = await res.json();
        if (data.error?.code === 'RATE_LIMITED') {
          updateLastAssistant('You\'ve reached the demo limit. Try a preset example or book a discovery call for full access.');
        } else {
          updateLastAssistant(data.response_text || data.error?.message || 'No response.');
        }
      }
    } catch {
      updateLastAssistant('Sorry, something went wrong. Please try again.');
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, input, addMessage, updateLastAssistant, onInteract]);

  return (
    <div className="flex flex-col h-[500px]">
      {/* Preset bar */}
      {presets.length > 0 && (
        <div className="mb-3 pb-3 border-b border-border">
          <p className="text-xs text-muted-foreground mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => {
              const used = usedKeys.has(p.trigger_key);
              return (
                <button
                  key={p.trigger_key}
                  onClick={() => handlePreset(p.trigger_key)}
                  disabled={isStreaming || used}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    used
                      ? 'border-border bg-muted text-muted-foreground'
                      : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                  } disabled:opacity-50`}
                >
                  {used && <span className="mr-1">&#10003;</span>}
                  {p.prompt_text}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto space-y-3 pr-2"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Start a conversation or try a preset example above.
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-foreground'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.fromCache && msg.role === 'assistant' && (
                <span className="block mt-1 text-[10px] opacity-60">preset</span>
              )}
            </div>
          </div>
        ))}
        {isStreaming && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2.5 text-sm text-muted-foreground">
              Thinking about your question...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2 pt-3 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isStreaming}
          maxLength={2000}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
          aria-label="Send message"
        >
          Send
        </button>
      </form>
    </div>
  );
}
