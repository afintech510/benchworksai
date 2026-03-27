'use client';

import { useState, useCallback, useRef } from 'react';

// PLACEHOLDER — replace with vertical_content in Phase 06
const SAMPLE_DOCS: Record<string, { title: string; text: string }> = {
  general_smb: {
    title: 'Sample Invoice',
    text: `INVOICE #2024-0847
Date: March 15, 2024
Bill To: Coastal Café LLC, 142 Ocean Drive, Suite B, Newport RI 02840

Item: Monthly Marketing Package - $2,500.00
Item: Social Media Management - $800.00
Item: SEO Audit Report - $1,200.00
Subtotal: $4,500.00
Tax (7%): $315.00
Total Due: $4,815.00

Payment Terms: Net 30
Due Date: April 14, 2024`,
  },
};

interface ExtractionField {
  label: string;
  value: string;
}

interface DocumentProcessorProps {
  vertical: string;
  presets: { sequence: number; prompt_text: string; trigger_key: string }[];
  onInteract: (input: { input_type: string; user_input?: string; trigger_key?: string }) => Promise<Response>;
}

export function DocumentProcessor({ vertical, presets, onInteract }: DocumentProcessorProps) {
  const [inputText, setInputText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractions, setExtractions] = useState<ExtractionField[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());
  const [rawResponse, setRawResponse] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePreset = useCallback(async (triggerKey: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setUsedKeys((prev) => new Set([...prev, triggerKey]));

    try {
      const res = await onInteract({ input_type: 'preset_command', trigger_key: triggerKey });
      const data = await res.json();
      setRawResponse(data.response_text || '');
      // Try to parse as field extractions
      parseExtractions(data.response_text || '');
    } catch {
      setRawResponse('Unable to process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, onInteract]);

  const parseExtractions = (text: string) => {
    // Try to find "label: value" patterns
    const lines = text.split('\n').filter((l) => l.includes(':'));
    const fields: ExtractionField[] = lines.slice(0, 15).map((line) => {
      const idx = line.indexOf(':');
      return {
        label: line.slice(0, idx).replace(/^[-*•]\s*/, '').trim(),
        value: line.slice(idx + 1).trim(),
      };
    }).filter((f) => f.label && f.value);

    if (fields.length > 0) {
      setExtractions(fields);
    }
  };

  const handleProcess = useCallback(async () => {
    if (isProcessing || !inputText.trim()) return;
    setIsProcessing(true);
    setExtractions([]);
    setRawResponse('');

    const prompt = `Extract all key data fields from this document. Format as "Field Name: Value" on each line.\n\nDocument:\n${inputText}`;

    try {
      const res = await onInteract({ input_type: 'text', user_input: prompt });
      const contentType = res.headers.get('content-type') || '';

      let text = '';
      if (contentType.includes('text/plain') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          text += decoder.decode(value, { stream: true });
          setRawResponse(text);
        }
      } else {
        const data = await res.json();
        text = data.response_text || data.error?.message || '';
        setRawResponse(text);
      }

      parseExtractions(text);
    } catch {
      setRawResponse('Unable to process document.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, inputText, onInteract]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setRawResponse('File too large. Maximum 5MB.');
      return;
    }

    setFileName(file.name);

    if (file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setInputText((ev.target?.result as string) || '');
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      setInputText(`[Uploaded image: ${file.name}]\nWe'll extract text from this image using AI document processing.`);
    } else {
      setInputText(`[Uploaded file: ${file.name}]\nDocument ready for AI extraction.`);
    }
  }, []);

  const loadSample = useCallback(() => {
    const sample = SAMPLE_DOCS[vertical] || SAMPLE_DOCS.general_smb;
    setInputText(sample.text);
    setFileName(sample.title);
  }, [vertical]);

  return (
    <div className="space-y-6">
      {/* Presets */}
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const used = usedKeys.has(p.trigger_key);
            return (
              <button
                key={p.trigger_key}
                onClick={() => handlePreset(p.trigger_key)}
                disabled={isProcessing || used}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  used ? 'border-border bg-muted text-muted-foreground' : 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                } disabled:opacity-50`}
              >
                {used && <span className="mr-1">&#10003;</span>}
                {p.prompt_text}
              </button>
            );
          })}
        </div>
      )}

      {/* Input area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-foreground">Document Input</h3>
            <div className="flex gap-2">
              <button
                onClick={loadSample}
                className="text-xs text-primary hover:text-primary-hover font-medium"
              >
                Try a sample
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-primary hover:text-primary-hover font-medium"
              >
                Upload file
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx,image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          {fileName && (
            <p className="text-xs text-muted-foreground mb-1">File: {fileName}</p>
          )}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your document text here, or upload a file..."
            rows={10}
            disabled={isProcessing}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 font-mono"
            aria-label="Document text input"
          />
          <button
            onClick={handleProcess}
            disabled={isProcessing || !inputText.trim()}
            className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Extracting document data...' : 'Extract Data'}
          </button>
        </div>

        {/* Results */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Extracted Fields</h3>
          {extractions.length > 0 ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-foreground">Field</th>
                    <th className="px-3 py-2 text-left font-medium text-foreground">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {extractions.map((field, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-2 text-muted-foreground">{field.label}</td>
                      <td className="px-3 py-2 text-foreground font-medium">{field.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : rawResponse ? (
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-foreground whitespace-pre-wrap">{rawResponse}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Paste a document or upload a file, then click &quot;Extract Data&quot; to see AI extraction.
              </p>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">Sample data for demonstration purposes</p>
    </div>
  );
}
