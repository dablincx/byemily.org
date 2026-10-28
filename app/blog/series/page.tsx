import type { Metadata } from "next";
import Link from "next/link";
import { getAllSeries } from "@/lib/posts";

export const metadata: Metadata = {
  title: "series",
  description: "multi-post series on the blog",
  openGraph: { images: [] },
  twitter: { images: [], card: "summary" },
};

export const dynamic = "force-dynamic";

export default async function SeriesIndex() {
  const series = await getAllSeries();

  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl">series</h1>
        <p className="text-[color:var(--color-muted)] mt-2 font-mono text-sm">
          {"//"} {series.length} series
        </p>
      </header>

      {series.length === 0 ? (
        <p className="text-[color:var(--color-muted)] font-mono text-sm">
          no series yet. add a <code>series:</code> field to a post&apos;s
          frontmatter to start one.
        </p>
      ) : (
        <ul className="list-none flex flex-col gap-4">
          {series.map((s) => (
            <li key={s.name}>
              <Link
                href={`/blog/series/${encodeURIComponent(s.name)}`}
                className="block py-3 px-4 border border-[color:var(--color-border)] rounded hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface)] transition-all"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg group-hover:text-[color:var(--color-accent)] transition-colors">
                    {s.name}
                  </h3>
                  <span className="font-mono text-xs text-[color:var(--color-muted)]">
                    {s.posts.length} {s.posts.length === 1 ? "post" : "posts"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}