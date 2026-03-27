'use client';

import { useState, useCallback, useEffect } from 'react';

const DOC_TYPES: Record<string, { id: string; label: string; fields: string[] }[]> = {
  general_smb: [
    { id: 'quote', label: 'Price Quote', fields: ['Client Name', 'Items/Services', 'Pricing Notes'] },
    { id: 'proposal', label: 'Business Proposal', fields: ['Client Name', 'Project Scope', 'Timeline'] },
    { id: 'contract', label: 'Service Contract', fields: ['Client Name', 'Services', 'Terms'] },
    { id: 'report', label: 'Business Report', fields: ['Report Topic', 'Key Metrics', 'Period'] },
    { id: 'marketing_copy', label: 'Marketing Copy', fields: ['Product/Service', 'Target Audience', 'Tone'] },
  ],
  construction: [
    { id: 'bid_proposal', label: 'Bid Proposal', fields: ['Project Name', 'Scope of Work', 'Materials'] },
    { id: 'change_order', label: 'Change Order', fields: ['Project Name', 'Change Description', 'Cost Impact'] },
    { id: 'safety_plan', label: 'Safety Plan', fields: ['Site Name', 'Hazards Identified', 'Mitigation Steps'] },
    { id: 'progress_report', label: 'Progress Report', fields: ['Project Name', 'Milestones', 'Issues'] },
  ],
  property_mgmt: [
    { id: 'lease', label: 'Lease Agreement', fields: ['Tenant Name', 'Property Address', 'Lease Terms'] },
    { id: 'notice', label: 'Tenant Notice', fields: ['Tenant Name', 'Notice Type', 'Details'] },
    { id: 'inspection', label: 'Inspection Report', fields: ['Property Address', 'Inspector', 'Findings'] },
    { id: 'listing', label: 'Property Listing', fields: ['Property Address', 'Features', 'Pricing'] },
  ],
  legal: [
    { id: 'client_intake', label: 'Client Intake Form', fields: ['Client Name', 'Matter Type', 'Key Details'] },
    { id: 'engagement_letter', label: 'Engagement Letter', fields: ['Client Name', 'Scope of Representation', 'Fee Structure'] },
    { id: 'memo', label: 'Legal Memo', fields: ['Issue', 'Relevant Facts', 'Analysis Points'] },
    { id: 'demand_letter', label: 'Demand Letter', fields: ['Recipient', 'Claim Summary', 'Demanded Action'] },
  ],
};

interface DocumentDrafterProps {
  vertical: string;
  presets: { sequence: number; prompt_text: string; trigger_key: string }[];
  onInteract: (input: { input_type: string; user_input?: string; trigger_key?: string }) => Promise<Response>;
}

export function DocumentDrafter({ vertical, presets, onInteract }: DocumentDrafterProps) {
  const docTypes = DOC_TYPES[vertical] || DOC_TYPES.general_smb;
  const [selectedDocType, setSelectedDocType] = useState(docTypes[0].id);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedKeys, setUsedKeys] = useState<Set<string>>(new Set());
  const [hasFormData, setHasFormData] = useState(false);

  const selectedType = docTypes.find((d) => d.id === selectedDocType) || docTypes[0];

  // Track form dirty state
  useEffect(() => {
    const dirty =
      Object.values(fieldValues).some((v) => v.trim().length > 0) ||
      additionalInstructions.trim().length > 0;
    setHasFormData(dirty);
  }, [fieldValues, additionalInstructions]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasFormData && !generatedDoc) {
        e.preventDefault();
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasFormData, generatedDoc]);

  const handlePreset = useCallback(
    async (triggerKey: string) => {
      if (isGenerating) return;
      setIsGenerating(true);
      setUsedKeys((prev) => new Set([...prev, triggerKey]));
      setError(null);

      try {
        const res = await onInteract({ input_type: 'preset_command', trigger_key: triggerKey });
        const data = await res.json();
        setGeneratedDoc(data.response_text || null);
      } catch {
        setError('Unable to generate document.');
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, onInteract],
  );

  const handleFieldChange = useCallback((field: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleGenerate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isGenerating) return;

      const filledFields = selectedType.fields
        .map((f) => `${f}: ${fieldValues[f]?.trim() || '(not provided)'}`)
        .join('\n');

      const prompt = `Generate a professional ${selectedType.label} document with the following details:\n${filledFields}${
        additionalInstructions.trim()
          ? `\n\nAdditional instructions: ${additionalInstructions.trim()}`
          : ''
      }`;

      setIsGenerating(true);
      setError(null);
      setGeneratedDoc(null);

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
            setGeneratedDoc(text);
          }
        } else {
          const data = await res.json();
          if (!res.ok) {
            setError(data.error?.message || 'Generation failed.');
            setIsGenerating(false);
            return;
          }
          text = data.response_text || '';
          setGeneratedDoc(text);
        }
      } catch {
        setError('Network error. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating, selectedType, fieldValues, additionalInstructions, onInteract],
  );

  const handleDownload = useCallback(() => {
    if (!generatedDoc) return;
    const blob = new Blob([generatedDoc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedType.label.replace(/\s+/g, '_').toLowerCase()}_draft.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [generatedDoc, selectedType]);

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
                disabled={isGenerating || used}
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
      )}

      {!generatedDoc ? (
        <form onSubmit={handleGenerate} className="max-w-lg space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          {/* Document type selector */}
          <div>
            <label htmlFor="dd-doc-type" className="block text-sm font-medium text-foreground mb-1">
              Document Type
            </label>
            <select
              id="dd-doc-type"
              value={selectedDocType}
              onChange={(e) => {
                setSelectedDocType(e.target.value);
                setFieldValues({});
              }}
              disabled={isGenerating}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {docTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic fields */}
          {selectedType.fields.map((field) => (
            <div key={field}>
              <label htmlFor={`dd-${field}`} className="block text-sm font-medium text-foreground mb-1">
                {field}
              </label>
              <input
                id={`dd-${field}`}
                type="text"
                value={fieldValues[field] || ''}
                onChange={(e) => handleFieldChange(field, e.target.value)}
                disabled={isGenerating}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                placeholder={`Enter ${field.toLowerCase()}`}
              />
            </div>
          ))}

          {/* Additional instructions */}
          <div>
            <label htmlFor="dd-instructions" className="block text-sm font-medium text-foreground mb-1">
              Additional Instructions <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="dd-instructions"
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              disabled={isGenerating}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              placeholder="e.g., Keep it formal, include payment terms..."
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Drafting your document...
              </>
            ) : (
              'Generate Document'
            )}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">{selectedType.label} Draft</h3>
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="rounded-lg border border-primary text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/5 transition-colors"
              >
                Download
              </button>
              <button
                onClick={() => {
                  setGeneratedDoc(null);
                  setFieldValues({});
                  setAdditionalInstructions('');
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                New Document
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-border p-6 prose-custom">
            <p className="text-sm text-foreground whitespace-pre-wrap">{generatedDoc}</p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">Sample document for demonstration purposes</p>
    </div>
  );
}
