'use client';

export function ShimmerPlaceholder() {
  return (
    <div className="grid h-full grid-cols-2 grid-rows-[1.4fr_0.7fr_0.6fr] gap-3 px-6 py-6">
      <Cell className="col-span-2 rounded-[22px]" />
      <Cell className="rounded-[18px]" />
      <Cell className="rounded-[18px]" />
      <Cell className="col-span-2 rounded-[14px]" />
    </div>
  );
}

function Cell({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden border ${className ?? ''}`}
      style={{
        background: 'var(--surface-elevated)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--accent-primary-soft) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: 'stayscout-shimmer 1.6s linear infinite',
        }}
      />
      <style>{`
        @keyframes stayscout-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
