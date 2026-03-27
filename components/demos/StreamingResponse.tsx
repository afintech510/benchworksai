'use client';

import { useState, useEffect, useRef } from 'react';

interface StreamingResponseProps {
  stream: ReadableStream<Uint8Array> | null;
  onComplete?: (fullText: string) => void;
}

export function StreamingResponse({ stream, onComplete }: StreamingResponseProps) {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!stream) return;

    let cancelled = false;
    setIsStreaming(true);
    setText('');

    async function consume() {
      const reader = stream!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setText(accumulated);
        }
      } finally {
        reader.releaseLock();
        if (!cancelled) {
          setIsStreaming(false);
          onCompleteRef.current?.(accumulated);
        }
      }
    }

    consume();

    return () => {
      cancelled = true;
    };
  }, [stream]);

  if (!text && !isStreaming) return null;

  return (
    <div className="prose-custom whitespace-pre-wrap">
      {text}
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />
      )}
    </div>
  );
}
