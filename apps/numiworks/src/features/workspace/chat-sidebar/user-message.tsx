export function UserMessage({ text }: { text: string }) {
  return (
    <div
      className="ml-auto max-w-[88%] rounded-xl border px-3 py-2"
      style={{
        background: 'var(--accent-primary-soft)',
        borderColor: 'var(--accent-primary-soft)',
        color: 'var(--ink-primary)',
        fontFamily: 'var(--font-inter)',
        fontSize: 'var(--text-body-sm)',
        lineHeight: 1.45,
      }}
    >
      {text}
    </div>
  );
}
