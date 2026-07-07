interface SummaryCardProps {
  label: string;
  value: string;
  caption?: string;
  emphasized?: boolean;
}

export function SummaryCard({ label, value, caption, emphasized = false }: SummaryCardProps) {
  return (
    <div
      className="rounded-[14px] border p-4"
      style={{
        background: emphasized ? 'var(--surface-raised)' : 'var(--surface-elevated)',
        borderColor: emphasized ? 'var(--border-emphasis)' : 'var(--border-subtle)',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-label)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--ink-tertiary)',
        }}
      >
        {label}
      </p>
      <p
        className="mt-1"
        style={{
          fontFamily: 'var(--font-fraunces)',
          fontSize: 'var(--text-display-sm)',
          fontWeight: 400,
          color: emphasized ? 'var(--accent-primary)' : 'var(--ink-primary)',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </p>
      {caption ? (
        <p
          className="mt-1"
          style={{
            fontFamily: 'var(--font-geist-mono)',
            fontSize: '0.625rem',
            letterSpacing: '0.04em',
            color: 'var(--ink-tertiary)',
          }}
        >
          {caption}
        </p>
      ) : null}
    </div>
  );
}
