/** Small uppercase marker after a card title ("· pinned"). */
export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-2 font-mono text-[0.65em] uppercase tracking-wider text-[color:var(--color-accent)] align-middle">
      · {children}
    </span>
  );
}
