import type {
  InjectComponent,
  ReportSection,
  TableData,
  TocEntry,
} from './types';

// Lightweight, dependency-free Markdown → HTML for report bodies. Handles the
// subset the reports use: H3 headings, paragraphs, ordered/unordered lists,
// GitHub-style tables, blockquotes, and inline bold/italic/code/links.
// Tables are wrapped in a scroll container up-front (never string-spliced after
// component injection), which sidesteps the "wrap </table> globally" DOM bug.

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&amp;/g, '')
    .replace(/&/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Inline: `code`, **bold**, *italic*, [text](href). Escape first, then apply.
function inline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>'
  );
  return out;
}

interface HeadingChip {
  chip: string;
  text: string;
}

// A heading matching ^(\d+)\. gets a zero-padded number chip; ^([A-Z])\. gets
// the letter; otherwise no chip.
export function chipFor(heading: string): HeadingChip {
  const num = heading.match(/^(\d+)\.\s+(.*)$/);
  if (num) {
    return { chip: num[1].padStart(2, '0'), text: num[2] };
  }
  const letter = heading.match(/^([A-Z])\.\s+(.*)$/);
  if (letter) {
    return { chip: letter[1], text: letter[2] };
  }
  return { chip: '', text: heading };
}

function parseTableBlock(lines: string[]): TableData | null {
  const rows = lines
    .filter((l) => l.trim().startsWith('|'))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim())
    );
  if (rows.length < 2) return null;
  const isDivider = (cells: string[]) =>
    cells.every((c) => /^:?-{2,}:?$/.test(c.replace(/\s/g, '')));
  const headers = rows[0];
  const body = rows.slice(1).filter((r) => !isDivider(r));
  return { headers, rows: body };
}

function tableToHtml(t: TableData): string {
  const head = t.headers
    .map((h) => `<th scope="col">${inline(h)}</th>`)
    .join('');
  const body = t.rows
    .map(
      (r) =>
        `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`
    )
    .join('');
  // .report-table is upgraded to a sortable DataTable client-side (ReportShell).
  return `<div class="table-wrap"><table class="report-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

// Render the inner markdown of a single section (everything after its H2).
// Returns the HTML plus the first parsed table (for RiskRegister etc.).
function renderBlocks(body: string): { html: string; firstTable?: TableData } {
  const lines = body.split('\n');
  const out: string[] = [];
  let firstTable: TableData | undefined;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // H3
    if (trimmed.startsWith('### ')) {
      const text = trimmed.slice(4);
      out.push(`<h3 id="${slugify(text)}">${inline(text)}</h3>`);
      i++;
      continue;
    }

    // Table block (consecutive lines starting with |)
    if (trimmed.startsWith('|')) {
      const block: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        block.push(lines[i]);
        i++;
      }
      const table = parseTableBlock(block);
      if (table) {
        if (!firstTable) firstTable = table;
        out.push(tableToHtml(table));
      }
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quote.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      out.push(
        `<ol>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ol>`
      );
      continue;
    }

    // Unordered list
    if (/^[-*]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s/, ''));
        i++;
      }
      out.push(
        `<ul>${items.map((it) => `<li>${inline(it)}</li>`).join('')}</ul>`
      );
      continue;
    }

    // Paragraph (gather until blank line)
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].trim().startsWith('> ') &&
      !lines[i].trim().startsWith('### ') &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !/^[-*]\s/.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
  }

  return { html: out.join('\n'), firstTable };
}

/**
 * Parse a full report body (H2-delimited) into sections. TOC is derived from
 * the H2 headings — never hand-maintained. `inject` maps a section slug to a
 * component; for injected sections whose data comes from the markdown table
 * (RiskRegister), the raw table is dropped from the HTML.
 */
export function parseReportBody(
  body: string,
  inject: Partial<Record<string, InjectComponent>> = {}
): { sections: ReportSection[]; toc: TocEntry[] } {
  // Split on H2 boundaries, keeping heading text.
  const parts = body.split(/^##\s+/m).slice(1);
  const sections: ReportSection[] = [];
  const toc: TocEntry[] = [];

  for (const part of parts) {
    const nl = part.indexOf('\n');
    const rawHeading = (nl === -1 ? part : part.slice(0, nl)).trim();
    const rest = nl === -1 ? '' : part.slice(nl + 1);
    const { chip, text } = chipFor(rawHeading);
    // Slug from the chip-stripped text so a "6. Foo" heading maps to `foo`
    // (matching the inject keys and the intended TOC), not `6-foo`.
    const id = slugify(text);
    const injected = inject[id];

    const { html, firstTable } = renderBlocks(rest);

    // RiskRegister renders from parsed table data — strip the raw table so it
    // is not rendered twice. ComparisonMatrix/PhasePlan use report.json data;
    // their sections carry no primary markdown table.
    const stripRawTable = injected === 'RiskRegister';
    const sectionHtml = stripRawTable
      ? html.replace(/<div class="table-wrap">[\s\S]*?<\/div>/, '')
      : html;

    sections.push({
      id,
      heading: text,
      chip,
      html: sectionHtml,
      inject: injected,
      tableData: firstTable,
    });
    toc.push({ id, chip, label: text });
  }

  return { sections, toc };
}
