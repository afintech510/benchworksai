// Shared contracts for the client-report platform (/reports/[slug]).
// The report.json shape ships with each report under content/reports/<slug>/.

export type WinLose = 'win' | 'lose' | 'tie';

export interface ReportMetric {
  /** Headline value, e.g. "4.9" or "Aug 2022". */
  v: string;
  /** Label under the value. */
  l: string;
  /** Sub-text detail. */
  s: string;
}

export interface HeadToHead {
  title: string;
  note: string;
  /** Two competitor column headers. */
  cols: string[];
  /**
   * Each row: [label, colA value, colB value, colA state, colB state].
   * States are win/lose/tie and drive cell colour-coding.
   */
  rows: Array<[string, string, string, WinLose, WinLose]>;
}

export interface ReportPhase {
  id: string;
  label: string;
  name: string;
  window: string;
  thesis: string;
  tasks: string[];
}

/** Which component to inject into a section, keyed by the section's slug id. */
export type InjectComponent = 'ComparisonMatrix' | 'PhasePlan' | 'RiskRegister';

export interface ReportMeta {
  slug: string;
  docNumber: string;
  revision: number;
  issueDate: string;
  expiresAt?: string;
  client: string;
  contact: string;
  preparedBy: string;
  title: string;
  kicker: string;
  subtitle: string;
  confidential?: boolean;
  noindex?: boolean;
  gated?: boolean;
  /** Env var name holding this report's passcode. Never the passcode itself. */
  passcodeEnv?: string;
  /** Opt-in engagement telemetry. Off unless explicitly true. */
  telemetry?: boolean;
  inject?: Partial<Record<string, InjectComponent>>;
  metrics: ReportMetric[];
  headToHead: HeadToHead;
  phases: ReportPhase[];
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

/** A parsed H2 section of the report body. */
export interface ReportSection {
  /** Slugified id, used for the anchor and TOC. */
  id: string;
  /** Rendered heading text (chip stripped). */
  heading: string;
  /** Mono chip content: zero-padded number, letter, or ''. */
  chip: string;
  /** Rendered inner HTML for the section body (generic tables already wrapped). */
  html: string;
  /** Component to inject after the section HTML, if any. */
  inject?: InjectComponent;
  /**
   * First markdown table parsed from the section, in structured form. Consumed
   * by RiskRegister (data-sev derived from cell content). When present and the
   * section injects a component, the raw table is stripped from `html` so it is
   * not rendered twice.
   */
  tableData?: TableData;
}

export interface TocEntry {
  id: string;
  chip: string;
  label: string;
}

export interface LoadedReport {
  meta: ReportMeta;
  sections: ReportSection[];
  toc: TocEntry[];
}
