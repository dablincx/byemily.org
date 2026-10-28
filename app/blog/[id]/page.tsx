import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Prose } from "@/components/prose";
import { TagList } from "@/components/tag-list";
import { MDXContent } from "@/lib/mdx";
import { fmtDate } from "@/lib/format";
import { getPost, getSeries, wasUpdated, type PostMeta } from "@/lib/posts";
import { tableOfContents } from "@/lib/toc";

// Rendered per request (no generateStaticParams), so new and edited
// posts show up without a rebuild.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) return { title: "not found" };
  // Posts have no cover image, so the preview is text-only.
  return {
    title: post.meta.title,
    description: post.meta.excerpt ?? undefined,
    alternates: { canonical: `/blog/${id}` },
    openGraph: {
      title: post.meta.title,
      description: post.meta.excerpt ?? undefined,
      type: "article",
      publishedTime: post.meta.date,
      modifiedTime: post.meta.updated,
      images: [],
    },
    twitter: { images: [], card: "summary" },
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const toc = tableOfContents(post.content);
  const series = post.meta.series ? await getSeries(post.meta.series) : null;
  const seriesIdx = series?.posts.findIndex((p) => p.id === id) ?? -1;

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-10 pb-6 border-b border-[color:var(--color-border)]">
        <div className="font-mono text-xs text-[color:var(--color-muted)] flex flex-wrap items-center gap-x-3 gap-y-1">
          <time dateTime={post.meta.date}>{fmtDate(post.meta.date)}</time>
          {wasUpdated(post.meta) && (
            <>
              <span>·</span>
              <span className="text-[color:var(--color-accent)]/70">
                upd {fmtDate(post.meta.updated)}
              </span>
            </>
          )}
          <span>·</span>
          <span className="text-[color:var(--color-accent)]/70">
            ≈ {post.meta.readingMinutes} min
          </span>
          {post.meta.series && (
            <>
              <span>·</span>
              <Link
                href={`/blog/series/${encodeURIComponent(post.meta.series)}`}
                className="hover:text-[color:var(--color-accent)]"
              >
                series: {post.meta.series}
              </Link>
            </>
          )}
        </div>
        <h1 className="text-3xl mt-3">{post.meta.title}</h1>
        {post.meta.tags?.length ? (
          <div className="mt-4">
            <TagList tags={post.meta.tags} />
          </div>
        ) : null}
      </header>

      {toc.length >= 3 && (
        <details className="mb-10 font-mono text-sm border border-[color:var(--color-border)] rounded px-4 py-3 bg-[color:var(--color-surface)]">
          <summary className="cursor-pointer text-[color:var(--color-muted)]">contents</summary>
          <ol className="mt-3 space-y-1">
            {toc.map((h) => (
              <li key={h.id} className={h.depth === 3 ? "pl-4" : undefined}>
                <a href={`#${h.id}`}>{h.text}</a>
              </li>
            ))}
          </ol>
        </details>
      )}

      <Prose>
        <MDXContent source={post.content} />
      </Prose>

      {series && seriesIdx !== -1 && (
        <nav
          aria-label="series"
          className="mt-16 border border-[color:var(--color-border)] rounded px-4 py-3 font-mono text-sm"
        >
          <p className="text-xs text-[color:var(--color-muted)]">
            part {seriesIdx + 1} of {series.posts.length} in{" "}
            <Link href={`/blog/series/${encodeURIComponent(series.name)}`}>{series.name}</Link>
          </p>
          <div className="mt-2 flex flex-wrap justify-between gap-x-6 gap-y-2">
            <SeriesLink post={series.posts[seriesIdx - 1]} label="← prev" />
            <SeriesLink post={series.posts[seriesIdx + 1]} label="next →" alignEnd />
          </div>
        </nav>
      )}

      <footer className="mt-16 pt-6 border-t border-[color:var(--color-border)] font-mono text-xs text-[color:var(--color-muted)]">
        ← <Link href="/blog">back to blog</Link>
      </footer>
    </article>
  );
}
function SeriesLink({
  post,
  label,
  alignEnd,
}: {
  post?: PostMeta;
  label: string;
  alignEnd?: boolean;
}) {
  if (!post) return <span />;
  return (
    <Link href={`/blog/${post.id}`} className={alignEnd ? "text-right ml-auto" : undefined}>
      <span className="text-[color:var(--color-muted)]">{label}</span> {post.title}
    </Link>
  );
}
