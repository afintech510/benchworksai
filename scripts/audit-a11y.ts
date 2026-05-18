/**
 * Accessibility audit script using axe-core via Playwright.
 * Run: npx tsx scripts/audit-a11y.ts
 *
 * Requires: npm install -D @axe-core/playwright playwright
 * Exits with code 1 if any violations are found.
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const PAGES = [
  '/',
  '/about',
  '/contact',
  '/pricing',
  '/services/ai-solutions-architect',
  '/services/ai-automation',
  '/services/ai-implementation',
  '/services/fractional-cto',
  '/services/prompt-engineering',
  '/demos',
  '/privacy',
];

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  let totalViolations = 0;

  console.log(`\nAccessibility Audit — ${PAGES.length} pages\n${'='.repeat(50)}`);

  for (const path of PAGES) {
    const page = await context.newPage();
    const url = `${BASE_URL}${path}`;

    try {
      await page.goto(url, { waitUntil: 'networkidle' });

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const violations = results.violations;

      if (violations.length === 0) {
        console.log(`  PASS  ${path}`);
      } else {
        console.log(`  FAIL  ${path} — ${violations.length} violation(s)`);
        for (const v of violations) {
          console.log(`        [${v.impact}] ${v.id}: ${v.description}`);
          console.log(`        ${v.nodes.length} element(s) affected`);
        }
        totalViolations += violations.length;
      }
    } catch (err) {
      console.log(`  ERROR ${path} — ${(err as Error).message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(`\n${'='.repeat(50)}`);
  if (totalViolations === 0) {
    console.log(`RESULT: PASS — 0 violations across ${PAGES.length} pages`);
    process.exit(0);
  } else {
    console.log(`RESULT: FAIL — ${totalViolations} violation(s) across ${PAGES.length} pages`);
    process.exit(1);
  }
}

main();
