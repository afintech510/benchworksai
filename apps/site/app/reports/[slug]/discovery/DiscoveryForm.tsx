'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  DiscoveryField,
  DiscoverySchema,
  DiscoverySection,
} from '@/lib/reports/discovery';
import { Field, type FieldValue } from './fields/Field';

type Payload = Record<string, FieldValue>;

interface Props {
  schema: DiscoverySchema;
  slug: string;
}

// ---- value helpers ----------------------------------------------------------

function isAnswered(v: FieldValue): boolean {
  if (v == null) return false;
  if (typeof v === 'string') return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.keys(v).length > 0;
  return false;
}

function parseNum(v: FieldValue): number | null {
  if (typeof v !== 'string') return null;
  const n = parseFloat(v.replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

// ---- grouping ---------------------------------------------------------------

type Block =
  | { kind: 'single'; field: DiscoveryField }
  | {
      kind: 'group';
      gid: string;
      groupLabel?: string;
      fields: DiscoveryField[];
      sumTo100: boolean;
    };

function buildBlocks(fields: DiscoveryField[]): Block[] {
  const blocks: Block[] = [];
  let i = 0;
  while (i < fields.length) {
    const f = fields[i];
    if (f.group) {
      const gid = f.group;
      const groupFields: DiscoveryField[] = [];
      let groupLabel: string | undefined;
      let sumTo100 = false;
      while (i < fields.length && fields[i].group === gid) {
        if (fields[i].groupLabel) groupLabel = fields[i].groupLabel;
        if (fields[i].groupValidate === 'sumTo100') sumTo100 = true;
        groupFields.push(fields[i]);
        i++;
      }
      blocks.push({ kind: 'group', gid, groupLabel, fields: groupFields, sumTo100 });
    } else {
      blocks.push({ kind: 'single', field: f });
      i++;
    }
  }
  return blocks;
}

// ---- component --------------------------------------------------------------

export function DiscoveryForm({ schema, slug }: Props) {
  const { behaviour, sections, submission } = schema;
  const autosaveKey = behaviour.autosaveKey;
  const honeypotName = submission.honeypot ?? 'company_website';
  const requiredSections = useMemo(
    () => new Set(behaviour.requiredSections ?? []),
    [behaviour.requiredSections]
  );

  const [payload, setPayload] = useState<Payload>({});
  const [company_website, setHoneypot] = useState('');
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [wasPartial, setWasPartial] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage once.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(autosaveKey);
      if (raw) {
        const saved = JSON.parse(raw) as Payload;
        if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
          setPayload(saved);
          setShowResume(true);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [autosaveKey]);

  // Autosave on every change (after hydration so we never clobber saved data).
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(autosaveKey, JSON.stringify(payload));
    } catch {
      /* storage full / unavailable — non-fatal */
    }
  }, [payload, hydrated, autosaveKey]);

  const setValue = useCallback((id: string, value: FieldValue) => {
    setPayload((p) => ({ ...p, [id]: value }));
    setErrors((e) => {
      if (!e.has(id)) return e;
      const next = new Set(e);
      next.delete(id);
      return next;
    });
  }, []);

  const discardSaved = useCallback(() => {
    try {
      window.localStorage.removeItem(autosaveKey);
    } catch {
      /* ignore */
    }
    setPayload({});
    setShowResume(false);
    setErrors(new Set());
    setStep(0);
  }, [autosaveKey]);

  // showIf evaluation against current payload.
  const isVisible = useCallback(
    (field: DiscoveryField): boolean => {
      if (!field.showIf) return true;
      const other = payload[field.showIf.field];
      const otherStr = typeof other === 'string' ? other : '';
      if (field.showIf.equals !== undefined) return otherStr === field.showIf.equals;
      if (field.showIf.notEquals !== undefined)
        return otherStr !== field.showIf.notEquals;
      return true;
    },
    [payload]
  );

  const isRequired = useCallback(
    (field: DiscoveryField, section: DiscoverySection): boolean => {
      if (field.optional) return false;
      if (field.required) return true;
      return requiredSections.has(section.id);
    },
    [requiredSections]
  );

  // Collect required-but-empty visible fields across all sections.
  const findMissing = useCallback((): { ids: Set<string>; firstStep: number } => {
    const ids = new Set<string>();
    let firstStep = -1;
    sections.forEach((section, sIdx) => {
      section.fields.forEach((field) => {
        if (!isVisible(field)) return;
        if (!isRequired(field, section)) return;
        if (!isAnswered(payload[field.id])) {
          ids.add(field.id);
          if (firstStep === -1) firstStep = sIdx;
        }
      });
    });
    return { ids, firstStep };
  }, [sections, payload, isVisible, isRequired]);

  const scrollTop = useCallback(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const goto = useCallback(
    (idx: number) => {
      setStep(Math.max(0, Math.min(sections.length - 1, idx)));
      scrollTop();
    },
    [sections.length, scrollTop]
  );

  const submit = useCallback(
    async (partial: boolean) => {
      if (!partial) {
        const { ids, firstStep } = findMissing();
        if (ids.size > 0) {
          setErrors(ids);
          if (firstStep >= 0) goto(firstStep);
          return;
        }
      }
      setStatus('sending');
      try {
        const res = await fetch(submission.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            slug,
            formId: schema.formId,
            payload,
            partial,
            [honeypotName]: company_website,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setWasPartial(partial);
        setStatus('done');
        try {
          window.localStorage.removeItem(autosaveKey);
        } catch {
          /* ignore */
        }
        scrollTop();
      } catch {
        setStatus('error');
      }
    },
    [
      findMissing,
      goto,
      submission.endpoint,
      slug,
      schema.formId,
      payload,
      honeypotName,
      company_website,
      autosaveKey,
      scrollTop,
    ]
  );

  const totalSteps = sections.length;
  const current = sections[step];
  const progressPct = Math.round(((step + 1) / totalSteps) * 100);

  // ---- success screen ----
  if (status === 'done') {
    return (
      <main className="discovery">
        <div className="df-wrap">
          <div className="df-success" role="status">
            <p className="df-success-kicker">
              {wasPartial ? 'Partial — saved' : 'Submitted'}
            </p>
            <h1 className="df-success-title">{submission.successMessage}</h1>
            {wasPartial && (
              <p className="df-success-note">
                You sent what you had so far. You can keep going and send the
                rest whenever you like.
              </p>
            )}
            {wasPartial && (
              <button
                type="button"
                className="df-btn df-btn-primary"
                onClick={() => setStatus('idle')}
              >
                Keep filling it out
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="discovery">
      <div className="df-progress-track" aria-hidden="true">
        <div className="df-progress-bar" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="df-wrap" ref={topRef}>
        <header className="df-head">
          {schema.docNumber && <p className="df-doc">{schema.docNumber}</p>}
          <h1 className="df-title">{schema.title}</h1>
          {schema.intro && <p className="df-intro">{schema.intro}</p>}
          {typeof schema.estimatedMinutes === 'number' && (
            <p className="df-est">About {schema.estimatedMinutes} minutes.</p>
          )}
        </header>

        {showResume && (
          <div className="df-resume" role="status">
            <span>Picking up where you left off.</span>
            <button type="button" className="df-link" onClick={discardSaved}>
              Start over
            </button>
          </div>
        )}

        {/* Step navigation — jump to any section. */}
        <nav className="df-steps" aria-label="Sections">
          {sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="df-step"
              aria-current={i === step ? 'step' : undefined}
              data-done={i < step ? 'true' : undefined}
              onClick={() => goto(i)}
            >
              <span className="df-step-letter">{s.id}</span>
              <span className="df-step-title">{s.title}</span>
            </button>
          ))}
        </nav>

        <section className="df-section" aria-labelledby="df-section-title">
          <div className="df-section-head">
            <span className="df-section-chip">{current.id}</span>
            <div>
              <h2 className="df-section-title" id="df-section-title">
                {current.title}
              </h2>
              {current.subtitle && (
                <p className="df-section-subtitle">{current.subtitle}</p>
              )}
            </div>
          </div>
          {current.note && <p className="df-section-note">{current.note}</p>}
          {requiredSections.has(current.id) && (
            <p className="df-section-required-flag">
              Everything here is needed to move forward.
            </p>
          )}

          <div className="df-fields">
            {buildBlocks(current.fields.filter(isVisible)).map((block) => {
              if (block.kind === 'single') {
                return (
                  <Field
                    key={block.field.id}
                    field={block.field}
                    value={payload[block.field.id]}
                    onChange={(v) => setValue(block.field.id, v)}
                    invalid={errors.has(block.field.id)}
                  />
                );
              }
              // group
              let warn: string | null = null;
              if (block.sumTo100) {
                const nums = block.fields
                  .map((f) => parseNum(payload[f.id]))
                  .filter((n): n is number => n != null);
                if (nums.length > 0) {
                  const sum = nums.reduce((a, b) => a + b, 0);
                  if (Math.round(sum) !== 100) {
                    warn = `These add up to ${sum}% — they should total 100%. Not a blocker; just double-check.`;
                  }
                }
              }
              return (
                <div key={block.gid} className="df-group">
                  {block.groupLabel && (
                    <p className="df-group-label">{block.groupLabel}</p>
                  )}
                  <div className="df-group-fields">
                    {block.fields.map((f) => (
                      <Field
                        key={f.id}
                        field={f}
                        value={payload[f.id]}
                        onChange={(v) => setValue(f.id, v)}
                        invalid={errors.has(f.id)}
                      />
                    ))}
                  </div>
                  {warn && (
                    <p className="df-group-warn" role="status">
                      {warn}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {errors.size > 0 && (
          <p className="df-form-error" role="alert">
            A few required answers are still missing — they&apos;re marked above.
          </p>
        )}
        {status === 'error' && (
          <p className="df-form-error" role="alert">
            That didn&apos;t send. Your answers are safe — check your connection
            and try again.
          </p>
        )}

        {/* Honeypot — visually hidden, off-screen, not tab-reachable. */}
        <div className="df-hp" aria-hidden="true">
          <label htmlFor="company_website">Company website</label>
          <input
            id="company_website"
            name={honeypotName}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={company_website}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="df-nav">
          <button
            type="button"
            className="df-btn df-btn-ghost"
            onClick={() => goto(step - 1)}
            disabled={step === 0}
          >
            Back
          </button>

          <div className="df-nav-right">
            <button
              type="button"
              className="df-btn df-btn-partial"
              onClick={() => submit(true)}
              disabled={status === 'sending'}
            >
              {behaviour.partialSubmitLabel ?? 'Send what I have so far'}
            </button>

            {step < totalSteps - 1 ? (
              <button
                type="button"
                className="df-btn df-btn-primary"
                onClick={() => goto(step + 1)}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="df-btn df-btn-primary"
                onClick={() => submit(false)}
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending…' : 'Submit everything'}
              </button>
            )}
          </div>
        </div>

        <p className="df-footer-note">
          Step {step + 1} of {totalSteps}. Saved automatically on this device —
          you can close and come back.
        </p>
      </div>
    </main>
  );
}
