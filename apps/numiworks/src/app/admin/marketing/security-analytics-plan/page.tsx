import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { requireAdmin } from '@lib/admin/require-admin';
import { requirePasswordAdmin } from '@lib/admin/require-password-admin';
import { AdminShell } from '@/features/admin/admin-shell';
import { SECURITY_ANALYTICS_PLAN_MD, PLAN_LAST_UPDATED } from './plan-content';

export const metadata: Metadata = {
  title: 'Security & Analytics plan (Part B) · Admin · numiworks',
  robots: { index: false, follow: false },
};

/**
 * /admin/marketing/security-analytics-plan
 *
 * Renders the Part B Security, Analytics & AI-Governance plan from an
 * in-repo, version-controlled source (docs/security-analytics-plan.md,
 * embedded via ./plan-content). This replaces the dependency on a private
 * claude.ai artifact URL — the operator no longer needs a Claude login to
 * read the plan, and it can't rot out from under the admin surface.
 *
 * Auth: the same two-layer gate as /admin/marketing (password gate +
 * requireAdmin). noindex via metadata + admin gate.
 */
export default async function SecurityAnalyticsPlanPage() {
  await requirePasswordAdmin({ returnTo: '/admin/marketing/security-analytics-plan' });
  await requireAdmin();

  return (
    <AdminShell
      section="marketing"
      title="Security & Analytics plan"
      subtitle={`Part B · phased program · last updated ${PLAN_LAST_UPDATED}`}
    >
      <div style={{ marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
        <span style={pill('var(--accent-primary)')}>Internal · version-controlled</span>
        <span style={pill('#b45309')}>Phases 1–4 planning only — not implemented</span>
      </div>

      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: '0.8rem',
          color: 'var(--ink-secondary)',
          lineHeight: 1.5,
          margin: '0 0 1.75rem',
          padding: '0.75rem 1rem',
          borderRadius: '0.6rem',
          border: '1px solid var(--border-subtle)',
          background: 'var(--surface-elevated)',
        }}
      >
        Source of truth: <code style={codeStyle}>docs/security-analytics-plan.md</code> in the
        <code style={codeStyle}>adored-moments-platform</code> repo. This page renders that file;
        edit the doc and redeploy to update it. A read-only external copy also exists as a private
        Claude artifact (link on the Marketing page), but this internal page — not that URL — is
        the canonical reference.
      </p>

      <article style={articleStyle}>{renderMarkdown(SECURITY_ANALYTICS_PLAN_MD)}</article>
    </AdminShell>
  );
}

/* ---------- minimal, purpose-built markdown renderer ----------------------
 * Handles exactly the constructs the plan uses: #/##/### headings, --- rules,
 * unordered (-) and ordered (1.) lists, GFM pipe tables, and inline
 * **bold** / *italic* / `code`. Server-only; returns JSX. Kept deliberately
 * small — the input is a doc we author, not arbitrary user markdown.
 * ------------------------------------------------------------------------- */

function renderMarkdown(md: string): ReactNode[] {
  const lines = md.split('\n');
  const at = (n: number): string => lines[n] ?? '';
  const out: ReactNode[] = [];
  let key = 0;
  let i = 0;

  const isBlockStart = (line: string): boolean =>
    line.trim() === '' ||
    line.trim() === '---' ||
    /^#{1,3}\s/.test(line) ||
    /^\s*-\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    line.trim().startsWith('|');

  while (i < lines.length) {
    const line = at(i);

    if (line.trim() === '') {
      i += 1;
      continue;
    }

    if (line.trim() === '---') {
      out.push(<hr key={key++} style={hrStyle} />);
      i += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      out.push(
        <h3 key={key++} style={h3Style}>
          {renderInline(line.slice(4))}
        </h3>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith('## ')) {
      out.push(
        <h2 key={key++} style={h2Style}>
          {renderInline(line.slice(3))}
        </h2>,
      );
      i += 1;
      continue;
    }
    if (line.startsWith('# ')) {
      out.push(
        <h1 key={key++} style={h1Style}>
          {renderInline(line.slice(2))}
        </h1>,
      );
      i += 1;
      continue;
    }

    // Pipe table: gather contiguous | ... | rows.
    if (line.trim().startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && at(i).trim().startsWith('|')) {
        rows.push(at(i));
        i += 1;
      }
      out.push(renderTable(rows, key++));
      continue;
    }

    // Unordered list.
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(at(i))) {
        items.push(at(i).replace(/^\s*-\s+/, ''));
        i += 1;
      }
      out.push(
        <ul key={key++} style={ulStyle}>
          {items.map((it, idx) => (
            <li key={idx} style={liStyle}>
              {renderInline(it)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Ordered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(at(i))) {
        items.push(at(i).replace(/^\s*\d+\.\s+/, ''));
        i += 1;
      }
      out.push(
        <ol key={key++} style={olStyle}>
          {items.map((it, idx) => (
            <li key={idx} style={liStyle}>
              {renderInline(it)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Paragraph: gather until a blank line or the next block start.
    const para: string[] = [line];
    i += 1;
    while (i < lines.length && !isBlockStart(at(i))) {
      para.push(at(i));
      i += 1;
    }
    out.push(
      <p key={key++} style={pStyle}>
        {renderInline(para.join(' '))}
      </p>,
    );
  }

  return out;
}

function renderTable(rows: string[], key: number): ReactNode {
  const parse = (r: string): string[] =>
    r
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

  const header = parse(rows[0] ?? '');
  // rows[1] is the |---|---| separator; body is everything after it.
  const body = rows.slice(2).map(parse);

  return (
    <div key={key} style={{ overflowX: 'auto', margin: '1.25rem 0' }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {header.map((h, idx) => (
              <th key={idx} style={thStyle}>
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((r, rIdx) => (
            <tr key={rIdx}>
              {r.map((c, cIdx) => (
                <td key={cIdx} style={tdStyle}>
                  {renderInline(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // Order matters: **bold** before *italic*; `code` is independent.
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0] ?? '';
    if (tok.startsWith('**')) {
      nodes.push(
        <strong key={key++} style={{ color: 'var(--ink-primary)', fontWeight: 700 }}>
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith('`')) {
      nodes.push(
        <code key={key++} style={codeStyle}>
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(
        <em key={key++} style={{ fontStyle: 'italic' }}>
          {tok.slice(1, -1)}
        </em>,
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/* ---------- styles (CSS vars so it tracks the admin theme) --------------- */

const articleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  color: 'var(--ink-secondary)',
  maxWidth: '52rem',
  lineHeight: 1.6,
};
const h1Style: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1.6rem',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: 'var(--ink-primary)',
  margin: '2.25rem 0 1rem',
  lineHeight: 1.2,
};
const h2Style: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1.25rem',
  fontWeight: 700,
  color: 'var(--ink-primary)',
  margin: '2rem 0 0.85rem',
  paddingBottom: '0.4rem',
  borderBottom: '1px solid var(--border-subtle)',
};
const h3Style: React.CSSProperties = {
  fontFamily: 'var(--font-inter)',
  fontSize: '1rem',
  fontWeight: 700,
  color: 'var(--ink-primary)',
  margin: '1.5rem 0 0.6rem',
};
const pStyle: React.CSSProperties = { margin: '0.75rem 0' };
const ulStyle: React.CSSProperties = { margin: '0.75rem 0', paddingLeft: '1.25rem' };
const olStyle: React.CSSProperties = { margin: '0.75rem 0', paddingLeft: '1.25rem' };
const liStyle: React.CSSProperties = { margin: '0.3rem 0' };
const hrStyle: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid var(--border-subtle)',
  margin: '2rem 0',
};
const codeStyle: React.CSSProperties = {
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  fontSize: '0.82em',
  background: 'var(--surface-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '0.3rem',
  padding: '0.1rem 0.35rem',
  color: 'var(--ink-primary)',
};
const tableStyle: React.CSSProperties = {
  borderCollapse: 'collapse',
  width: '100%',
  fontSize: '0.85rem',
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.55rem 0.7rem',
  borderBottom: '2px solid var(--border-subtle)',
  color: 'var(--ink-primary)',
  fontWeight: 700,
  whiteSpace: 'nowrap',
};
const tdStyle: React.CSSProperties = {
  padding: '0.5rem 0.7rem',
  borderBottom: '1px solid var(--border-subtle)',
  verticalAlign: 'top',
};

function pill(color: string): React.CSSProperties {
  return {
    fontFamily: 'var(--font-inter)',
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color,
    border: `1px solid ${color}`,
    borderRadius: '999px',
    padding: '0.3rem 0.7rem',
  };
}
