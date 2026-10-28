import Link from "next/link";

export function tagHref(tag: string): string {
  return `/blog/tags/${encodeURIComponent(tag)}`;
}

/** A post's tags as links to their tag pages. `relative z-10` keeps
 *  them clickable on top of a card's full-size link. */
export function TagList({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <ul className="relative z-10 flex flex-wrap gap-2">
      {tags.map((t) => (
        <li key={t}>
          <Link
            href={tagHref(t)}
            className="block font-mono text-[0.7rem] text-[color:var(--color-muted)] border border-[color:var(--color-border)] rounded px-1.5 py-0.5 hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
          >
            {t}
          </Link>
        </li>
      ))}
    </ul>
  );
}
