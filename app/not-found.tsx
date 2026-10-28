import Link from "next/link";

/** Terminal-styled 404 with links back to the main sections. */
export default function NotFound() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-16 font-mono text-sm">
      <pre className="text-[color:var(--color-accent)] leading-tight whitespace-pre-wrap">
{`╭─ command not found ───────────────────────╮
│                                          │
│  the path you requested doesn't exist.   │
│                                          │
╰──────────────────────────────────────────╯`}
      </pre>
      <p className="mt-6 text-[color:var(--color-muted)]">
        {"//"} tried to go somewhere that isn&apos;t here. classic.
      </p>
      <ul className="mt-6 flex flex-wrap gap-4">
        <li>
          <Link href="/">/</Link>
        </li>
        <li>
          <Link href="/blog">/blog</Link>
        </li>
        <li>
          <Link href="/projects">/projects</Link>
        </li>
        <li>
          <Link href="/about">/about</Link>
        </li>
        <li>
          <Link href="/contact">/contact</Link>
        </li>
      </ul>
    </section>
  );
}