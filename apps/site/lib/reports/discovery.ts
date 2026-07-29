import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { z, type ZodTypeAny } from 'zod';

// Schema-driven discovery form. The renderer under app/reports/[slug]/discovery
// is GENERIC — every field, section, label, and behaviour is read from the JSON
// below. A different client ships a different schema against the same renderer.

const REPORTS_DIR = path.join(process.cwd(), 'content', 'reports');

/** The 14 supported field types. */
export type DiscoveryFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'percent'
  | 'currency'
  | 'tel'
  | 'email'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkgrid'
  | 'repeater'
  | 'rangegrid';

/** Conditional-display rule: show this field only when another field matches. */
export interface ShowIf {
  field: string;
  equals?: string;
  notEquals?: string;
}

/** A checkgrid group — a labelled cluster of checkbox options. */
export interface CheckGroup {
  label: string;
  options: string[];
}

/** A rangegrid row — one line with low/high columns. */
export interface RangeRow {
  id: string;
  label: string;
  unit?: string;
}

/** A repeater subfield — itself a (non-nested) field definition. */
export interface SubField {
  id: string;
  label: string;
  type: DiscoveryFieldType;
  options?: string[];
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  help?: string;
}

export interface DiscoveryField {
  id: string;
  /** checkgrid/repeater/rangegrid may omit a per-field label in favour of groups. */
  label?: string;
  type: DiscoveryFieldType;

  // Common modifiers
  help?: string;
  placeholder?: string;
  optional?: boolean;
  required?: boolean;
  showIf?: ShowIf;

  // Grouping (visually joined fields under one heading + optional validation)
  group?: string;
  groupLabel?: string;
  groupValidate?: 'sumTo100';

  // Options (select / multiselect / radio)
  options?: string[];

  // textarea sizing (number of rows) — distinct from rangegrid rows below.
  rows?: number | RangeRow[];

  // checkgrid
  groups?: CheckGroup[];

  // repeater
  subfields?: SubField[];
  addLabel?: string;
  max?: number;

  // rangegrid
  columns?: string[];
}

export interface DiscoverySection {
  id: string;
  title: string;
  subtitle?: string;
  note?: string;
  fields: DiscoveryField[];
}

export interface DiscoveryBehaviour {
  multiStep?: boolean;
  oneSectionPerStep?: boolean;
  autosave?: string;
  autosaveKey: string;
  resumeBanner?: boolean;
  progressBar?: boolean;
  requiredSections?: string[];
  allowPartialSubmit?: boolean;
  partialSubmitLabel?: string;
}

export interface DiscoverySubmission {
  endpoint: string;
  method?: string;
  csrf?: boolean;
  honeypot?: string;
  successMessage: string;
  [key: string]: unknown;
}

export interface DiscoverySchema {
  formId: string;
  slug: string;
  docNumber?: string;
  revision?: number;
  title: string;
  client?: string;
  contact?: string;
  intro?: string;
  estimatedMinutes?: number;
  behaviour: DiscoveryBehaviour;
  sections: DiscoverySection[];
  submission: DiscoverySubmission;
}

/**
 * Load a slug's discovery-form.schema.json from disk. Returns null if absent.
 * Mirrors loadReportMeta: slug is a single path segment guarded against
 * traversal.
 */
export async function loadDiscoverySchema(
  slug: string
): Promise<DiscoverySchema | null> {
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  try {
    const raw = await fs.readFile(
      path.join(REPORTS_DIR, slug, 'discovery-form.schema.json'),
      'utf8'
    );
    return JSON.parse(raw) as DiscoverySchema;
  } catch {
    return null;
  }
}

/** The submission.email block (shape used by the API route). */
export interface DiscoveryEmailConfig {
  provider?: string;
  to: string;
  replyTo?: string;
  subject?: string;
  confirmationSubject?: string;
  alsoSendConfirmationToRespondent?: boolean;
}

// =============================================================================
// Server-side validation — a permissive-but-typed zod schema generated FROM the
// discovery schema. Required is only enforced on a COMPLETE submit.
// =============================================================================

// Empty string / null mean "not provided": stops optional fields from failing
// and stops Number('') coercing to 0.
const emptyToUndef = (v: unknown) => (v === '' || v === null ? undefined : v);

function baseForType(type: DiscoveryFieldType): ZodTypeAny {
  switch (type) {
    case 'number':
    case 'percent':
    case 'currency':
      return z.preprocess(emptyToUndef, z.coerce.number());
    case 'email':
      return z.preprocess(emptyToUndef, z.string().email());
    case 'multiselect':
    case 'checkgrid':
      return z.array(z.string());
    case 'repeater':
      return z.array(z.record(z.string(), z.unknown()));
    case 'rangegrid':
      return z.record(
        z.string(),
        z
          .object({
            low: z.preprocess(emptyToUndef, z.coerce.number()).optional(),
            high: z.preprocess(emptyToUndef, z.coerce.number()).optional(),
          })
          .partial()
      );
    // text / textarea / tel / date / select / radio -> string
    default:
      return z.string();
  }
}

/**
 * Required on a COMPLETE submit when: the field is section-A (the gate) and not
 * explicitly optional, OR it carries required:true anywhere. Partial submits
 * require nothing.
 */
function fieldIsRequired(
  sectionId: string,
  field: DiscoveryField,
  requiredSections: string[]
): boolean {
  if (field.required === true) return true;
  if (requiredSections.includes(sectionId) && field.optional !== true) return true;
  return false;
}

/**
 * Build a zod object validating the flat payload. Unknown keys (the honeypot,
 * anything the UI adds) are tolerated via catchall. When enforceRequired is
 * false, every field is optional.
 */
export function buildPayloadSchema(schema: DiscoverySchema, enforceRequired: boolean) {
  const requiredSections = schema.behaviour?.requiredSections ?? [];
  const shape: Record<string, ZodTypeAny> = {};

  for (const section of schema.sections) {
    for (const field of section.fields ?? []) {
      const required =
        enforceRequired && fieldIsRequired(section.id, field, requiredSections);
      let s = baseForType(field.type);

      if (required) {
        if (field.type === 'multiselect' || field.type === 'checkgrid') {
          s = z.array(z.string()).min(1, 'Required');
        } else if (
          field.type === 'text' ||
          field.type === 'textarea' ||
          field.type === 'tel' ||
          field.type === 'date' ||
          field.type === 'select' ||
          field.type === 'radio'
        ) {
          s = z.string().trim().min(1, 'Required');
        }
        // number/percent/currency/email/repeater/rangegrid: base already
        // rejects undefined when not marked .optional().
      } else {
        s = s.optional();
      }

      shape[field.id] = s;
    }
  }

  return z.object(shape).catchall(z.unknown());
}

/** Flatten a ZodError into { fieldId: [messages] }. */
export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const issues: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (issues[key] ??= []).push(issue.message);
  }
  return issues;
}

// =============================================================================
// Email rendering — summary block first, then answered fields grouped by
// section. Unanswered fields are omitted entirely.
// =============================================================================

type Payload = Record<string, unknown>;

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isBlank(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

function renderAnswer(field: DiscoveryField, value: unknown): string {
  if ((field.type === 'multiselect' || field.type === 'checkgrid') && Array.isArray(value)) {
    const arr = value.filter((x) => !isBlank(x));
    if (arr.length === 0) return '';
    return `<ul style="margin:4px 0 0;padding-left:18px">${arr
      .map((x) => `<li>${esc(x)}</li>`)
      .join('')}</ul>`;
  }
  if (field.type === 'repeater' && Array.isArray(value)) {
    const rows = (value as Payload[]).filter((r) => r && !isBlank(r));
    if (rows.length === 0) return '';
    const subfields = field.subfields ?? [];
    return rows
      .map((row, i) => {
        const known = subfields
          .map((sf) =>
            isBlank(row[sf.id])
              ? ''
              : `<div><span style="color:#666">${esc(sf.label)}:</span> ${esc(row[sf.id])}</div>`
          )
          .filter(Boolean)
          .join('');
        const extras = Object.keys(row)
          .filter((k) => !subfields.some((sf) => sf.id === k) && !isBlank(row[k]))
          .map((k) => `<div><span style="color:#666">${esc(k)}:</span> ${esc(row[k])}</div>`)
          .join('');
        if (!known && !extras) return '';
        return `<div style="margin:6px 0;padding:8px;border:1px solid #eee;border-radius:6px"><strong>#${
          i + 1
        }</strong>${known}${extras}</div>`;
      })
      .filter(Boolean)
      .join('');
  }
  if (field.type === 'rangegrid' && value && typeof value === 'object') {
    const rowsMeta: RangeRow[] = Array.isArray(field.rows) ? (field.rows as RangeRow[]) : [];
    const entries = Object.entries(
      value as Record<string, { low?: unknown; high?: unknown }>
    ).filter(([, rng]) => rng && (!isBlank(rng.low) || !isBlank(rng.high)));
    if (entries.length === 0) return '';
    return `<table style="border-collapse:collapse;margin-top:4px">${entries
      .map(([rowId, rng]) => {
        const meta = rowsMeta.find((r) => r.id === rowId);
        const label = meta ? `${meta.label}${meta.unit ? ` (${meta.unit})` : ''}` : rowId;
        const low = isBlank(rng.low) ? '—' : esc(rng.low);
        const high = isBlank(rng.high) ? '—' : esc(rng.high);
        return `<tr><td style="padding:2px 10px 2px 0;color:#666">${esc(
          label
        )}</td><td style="padding:2px 0">${low} – ${high}</td></tr>`;
      })
      .join('')}</table>`;
  }
  return `<div style="white-space:pre-wrap">${esc(value)}</div>`;
}

function scalar(payload: Payload, id: string): string {
  const v = payload[id];
  return isBlank(v) ? '' : String(v);
}

function summaryBlock(payload: Payload): string {
  const rows: string[] = [];

  const split = [
    ['Asphalt', 'A1_asphalt_pct'],
    ['Pavers & hardscape', 'A1_pavers_pct'],
    ['Masonry & repair', 'A1_masonry_pct'],
    ['Other', 'A1_other_pct'],
  ]
    .map(([label, id]) => {
      const v = scalar(payload, id);
      return v ? `${esc(label)} ${esc(v)}%` : '';
    })
    .filter(Boolean)
    .join(' · ');
  if (split)
    rows.push(
      `<tr><td style="padding:4px 12px 4px 0;font-weight:bold">Revenue split</td><td style="padding:4px 0">${split}</td></tr>`
    );

  const tickets = [
    ['Asphalt', 'A2_ticket_asphalt'],
    ['Pavers', 'A2_ticket_pavers'],
    ['Masonry', 'A2_ticket_masonry'],
  ]
    .map(([label, id]) => {
      const v = scalar(payload, id);
      return v ? `${esc(label)} $${esc(v)}` : '';
    })
    .filter(Boolean)
    .join(' · ');
  if (tickets)
    rows.push(
      `<tr><td style="padding:4px 12px 4px 0;font-weight:bold">Avg tickets</td><td style="padding:4px 0">${tickets}</td></tr>`
    );

  const towns = scalar(payload, 'C2_top_towns');
  if (towns)
    rows.push(
      `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;vertical-align:top">Top towns</td><td style="padding:4px 0;white-space:pre-wrap">${esc(
        towns
      )}</td></tr>`
    );

  const lic = scalar(payload, 'D1_suffolk_lic');
  const licExp = scalar(payload, 'D1_suffolk_exp');
  if (lic || licExp) {
    const val = [lic ? `Suffolk HIC ${esc(lic)}` : '', licExp ? `exp ${esc(licExp)}` : '']
      .filter(Boolean)
      .join(' · ');
    rows.push(
      `<tr><td style="padding:4px 12px 4px 0;font-weight:bold">Licence</td><td style="padding:4px 0">${val}</td></tr>`
    );
  }

  const resp = scalar(payload, 'G2_response_time');
  if (resp)
    rows.push(
      `<tr><td style="padding:4px 12px 4px 0;font-weight:bold">Response time</td><td style="padding:4px 0">${esc(
        resp
      )}</td></tr>`
    );

  if (rows.length === 0) return '';
  return `
    <div style="background:#f6f8fa;border:1px solid #e1e4e8;border-radius:8px;padding:16px;margin:0 0 24px">
      <h3 style="margin:0 0 8px;font-size:15px;text-transform:uppercase;letter-spacing:.04em;color:#444">Summary</h3>
      <table style="border-collapse:collapse;font-size:14px">${rows.join('')}</table>
    </div>`;
}

/** Admin notification HTML: summary first, then answered fields by section. */
export function buildAdminEmailHtml(
  schema: DiscoverySchema,
  payload: Payload,
  client: string,
  partial: boolean
): string {
  const sectionsHtml = schema.sections
    .map((section) => {
      const answered = (section.fields ?? [])
        .map((field) => {
          const value = payload[field.id];
          if (isBlank(value)) return '';
          const answer = renderAnswer(field, value);
          if (!answer) return '';
          return `
            <div style="margin:0 0 14px">
              <div style="font-weight:600;color:#111">${esc(field.label ?? field.id)}</div>
              ${answer}
            </div>`;
        })
        .filter(Boolean)
        .join('');
      if (!answered) return '';
      return `
        <section style="margin:0 0 24px">
          <h2 style="font-size:16px;border-bottom:2px solid #111;padding-bottom:4px;margin:0 0 12px">
            ${esc(section.id)}. ${esc(section.title)}
          </h2>
          ${answered}
        </section>`;
    })
    .filter(Boolean)
    .join('');

  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#222;max-width:680px">
      <p style="margin:0 0 4px;color:#666;font-size:13px">${esc(client)} — ${
    partial ? 'PARTIAL submission' : 'complete submission'
  }</p>
      ${summaryBlock(payload)}
      ${sectionsHtml || '<p>No answers were provided.</p>'}
    </div>`;
}

/** Short confirmation email for the respondent. */
export function buildConfirmationHtml(client: string, contactName: string): string {
  const hello = contactName ? `Hi ${esc(contactName)},` : 'Hi,';
  return `
    <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#222;max-width:560px">
      <p>${hello}</p>
      <p>Thanks — we've received your discovery answers for ${esc(
        client
      )}. Adam will review them and follow up within one business day.</p>
      <p>If you left anything for later, you can reopen the form and finish whenever it suits you.</p>
      <p style="margin-top:24px;color:#666;font-size:14px">— BenchworksAI<br/><a href="https://benchworksai.com">benchworksai.com</a></p>
    </div>`;
}

/** YYYY-MM-DD from an ISO timestamp string (falls back to today). */
export function dateStamp(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  const safe = Number.isFinite(d.getTime()) ? d : new Date();
  return safe.toISOString().slice(0, 10);
}
