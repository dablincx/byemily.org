"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error.tsx]", error);
  }, [error]);

  return (
    <section className="max-w-2xl mx-auto px-6 py-16 font-mono text-sm">
      <pre className="text-red-400 leading-tight whitespace-pre-wrap">
{`╭─ something broke ─────────────────────────╮
│                                          │
│  the server returned an error.           │
│  it's logged. you can try again.         │
│                                          │
╰──────────────────────────────────────────╯`}
      </pre>
      <p className="mt-6 text-[color:var(--color-muted)]">
        {"//"} digest: <span className="text-[color:var(--color-fg)]">{error.digest ?? "n/a"}</span>
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 px-4 py-2 border border-[color:var(--color-accent)] text-[color:var(--color-accent)] rounded hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-bg)] transition-colors"
      >
        try again →
      </button>
    </section>
  );
}