import type { ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  /** Optional inline width hint; useful for fixed-width id columns. */
  width?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  /** Row key extractor - defaults to index, but most callers should
   *  pass a stable id so React keys are intentional. */
  rowKey?: (row: T, idx: number) => string;
  /** Empty-state message shown when rows.length === 0. */
  emptyText?: string;
}

/**
 * Lightweight table for admin lists. No deps, no virtualization -
 * lists are bounded (default limit 50–100) so a plain table is fine.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyText = 'Nothing to show.',
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p
        className="py-6"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'var(--text-body-sm)',
          fontStyle: 'italic',
          color: 'var(--ink-tertiary)',
        }}
      >
        {emptyText}
      </p>
    );
  }
  return (
    <div
      className="overflow-x-auto rounded-[14px] border"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'var(--surface-elevated)',
      }}
    >
      <table className="w-full text-left">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2.5"
                style={{
                  width: col.width,
                  fontFamily: 'var(--font-inter)',
                  fontSize: 'var(--text-label)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-tertiary)',
                  fontWeight: 500,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={rowKey ? rowKey(row, idx) : String(idx)}
              className="border-b transition-colors hover:bg-[color:var(--surface-overlay)]"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-3 py-2.5"
                  style={{
                    fontFamily: 'var(--font-inter)',
                    fontSize: 'var(--text-body-sm)',
                    color: 'var(--ink-secondary)',
                    verticalAlign: 'top',
                  }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
