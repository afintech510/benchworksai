"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export default function CommandBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [toolsCalled, setToolsCalled] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setResponse("");
    setToolsCalled([]);
    try {
      const result = await api.sendCommand(input);
      setResponse(result.response);
      setToolsCalled(result.tools_called);
    } catch (e: any) {
      setResponse(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Ask anything... (e.g. 'show me all clients')"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-500"
          />
          <button onClick={handleSubmit} disabled={loading} className="text-gray-400 hover:text-white">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {(response || loading) && (
          <div className="p-4 max-h-96 overflow-y-auto">
            {loading && <p className="text-gray-400 text-sm">Thinking...</p>}
            {response && (
              <div className="text-sm text-gray-200 whitespace-pre-wrap">{response}</div>
            )}
            {toolsCalled.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {toolsCalled.map((t) => (
                  <span key={t} className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-4 py-2 border-t border-gray-800 text-xs text-gray-500">
          Press <kbd className="bg-gray-800 px-1 rounded">Ctrl+K</kbd> to toggle
        </div>
      </div>
    </div>
  );
}
