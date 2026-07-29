import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import { parseReportBody } from './markdown';
import type { LoadedReport, ReportMeta } from './types';

const REPORTS_DIR = path.join(process.cwd(), 'content', 'reports');

/** List all report slugs (directory names) available on disk. */
export async function listReportSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(REPORTS_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

/** Load a report's metadata only (report.json). Returns null if absent. */
export async function loadReportMeta(slug: string): Promise<ReportMeta | null> {
  // Guard against path traversal — slug is a single path segment.
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  try {
    const raw = await fs.readFile(
      path.join(REPORTS_DIR, slug, 'report.json'),
      'utf8'
    );
    return JSON.parse(raw) as ReportMeta;
  } catch {
    return null;
  }
}

/** Load and parse a full report (meta + body sections + derived TOC). */
export async function loadReport(slug: string): Promise<LoadedReport | null> {
  const meta = await loadReportMeta(slug);
  if (!meta) return null;
  let body = '';
  try {
    body = await fs.readFile(
      path.join(REPORTS_DIR, slug, 'body.md'),
      'utf8'
    );
  } catch {
    return null;
  }
  const { sections, toc } = parseReportBody(body, meta.inject ?? {});
  return { meta, sections, toc };
}

/** True if the report has an expiry that has already passed. */
export function isExpired(meta: ReportMeta): boolean {
  if (!meta.expiresAt) return false;
  const expiry = new Date(meta.expiresAt).getTime();
  return Number.isFinite(expiry) && Date.now() > expiry;
}
