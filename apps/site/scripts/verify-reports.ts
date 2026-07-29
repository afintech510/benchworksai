/**
 * Guardrails for the confidential /reports platform. Pure fs/string checks — no
 * server, no build. Run with: npm run verify:reports  (tsx scripts/verify-reports.ts)
 *
 * Asserts that the gated reports never leak into public surfaces:
 *   1. app/sitemap.ts lists NO '/reports' path.
 *   2. No href/Link to '/reports/' anywhere under app/ EXCEPT app/reports/ itself.
 *   3. The literal passcode 'sharks8u' appears nowhere in the tree.
 *   4. app/robots.ts disallows '/reports/'.
 * Prints PASS/FAIL per check; exits non-zero if any check fails.
 */
import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd(); // apps/site when run via npm script
const APP_DIR = path.join(ROOT, 'app');
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'coverage']);

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

async function walk(dir: string, exclude: (p: string) => boolean = () => false): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORE_DIRS.has(e.name)) continue;
      if (exclude(full)) continue;
      out.push(...(await walk(full, exclude)));
    } else if (e.isFile()) {
      if (exclude(full)) continue;
      out.push(full);
    }
  }
  return out;
}

async function read(file: string): Promise<string> {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return '';
  }
}

// ---- Check 1: sitemap has no /reports path. ----
async function checkSitemap(): Promise<CheckResult> {
  const src = await read(path.join(APP_DIR, 'sitemap.ts'));
  const leaks = /['"`]\/reports\b/.test(src);
  return {
    name: 'sitemap.ts contains no /reports path',
    passed: !!src && !leaks,
    detail: !src ? 'app/sitemap.ts not found' : leaks ? 'found a /reports path in sitemap' : 'ok',
  };
}

// ---- Check 2: no href/Link to /reports/ outside app/reports/ itself. ----
async function checkLinkAudit(): Promise<CheckResult> {
  const reportsDir = path.join(APP_DIR, 'reports') + path.sep;
  const files = await walk(APP_DIR, (p) => p.startsWith(reportsDir));
  const offenders: string[] = [];
  const codeExt = /\.(tsx?|jsx?|mdx?)$/;
  for (const file of files) {
    if (!codeExt.test(file)) continue;
    // sitemap/robots reference /reports/ legitimately (metadata, not links).
    const base = path.basename(file);
    if (base === 'sitemap.ts' || base === 'robots.ts') continue;
    const content = await read(file);
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('/reports/') && (/href\s*=/.test(line) || /<Link\b/.test(line) || /\bto\s*=/.test(line))) {
        offenders.push(`${path.relative(ROOT, file)}:${i + 1}`);
      }
    });
  }
  return {
    name: 'no href/Link to /reports/ outside app/reports/',
    passed: offenders.length === 0,
    detail: offenders.length ? offenders.join(', ') : 'ok',
  };
}

// ---- Check 3: literal passcode 'sharks8u' appears nowhere. ----
async function checkPasscodeLeak(): Promise<CheckResult> {
  const files = await walk(ROOT);
  const offenders: string[] = [];
  for (const file of files) {
    // Skip this guard script itself (it names the literal on purpose).
    if (path.resolve(file) === path.resolve(__filename)) continue;
    const content = await read(file);
    if (content.includes('sharks8u')) offenders.push(path.relative(ROOT, file));
  }
  return {
    name: "literal passcode 'sharks8u' is absent from the tree",
    passed: offenders.length === 0,
    detail: offenders.length ? offenders.join(', ') : 'ok',
  };
}

// ---- Check 4: robots.ts disallows /reports/. ----
async function checkRobots(): Promise<CheckResult> {
  const src = await read(path.join(APP_DIR, 'robots.ts'));
  const disallows = /disallow[\s\S]*?\/reports\//i.test(src);
  return {
    name: "robots.ts disallows '/reports/'",
    passed: disallows,
    detail: !src ? 'app/robots.ts not found' : disallows ? 'ok' : "no '/reports/' in disallow",
  };
}

async function main() {
  const results = await Promise.all([
    checkSitemap(),
    checkLinkAudit(),
    checkPasscodeLeak(),
    checkRobots(),
  ]);

  let failed = 0;
  for (const r of results) {
    const tag = r.passed ? 'PASS' : 'FAIL';
    if (!r.passed) failed++;
    console.log(`[${tag}] ${r.name}${r.passed ? '' : ` — ${r.detail}`}`);
  }

  console.log(`\n${results.length - failed}/${results.length} checks passed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('verify-reports failed to run:', err);
  process.exit(1);
});
