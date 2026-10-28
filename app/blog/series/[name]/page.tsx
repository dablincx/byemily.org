import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSeries } from "@/lib/posts";
import { PostCard } from "@/components/post-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>;
}): Promise<Metadata> {
  const { name } = await params;
  return {
    title: `series: ${decodeURIComponent(name)}`,
    openGraph: { images: [] },
    twitter: { images: [], card: "summary" },
  };
}

export const dynamic = "force-dynamic";

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name: raw } = await params;
  const name = decodeURIComponent(raw);
  const series = await getSeries(name);
  if (!series) notFound();

  return (
    <section className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-10">
        <p className="font-mono text-xs text-[color:var(--color-muted)]">
          {"//"} series
        </p>
        <h1 className="text-3xl mt-2">{series.name}</h1>
        <p className="text-[color:var(--color-muted)] mt-2 font-mono text-sm">
          {series.posts.length} {series.posts.length === 1 ? "post" : "posts"}
        </p>
      </header>

      <ul className="list-none">
        {series.posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </ul>

      <footer className="mt-16 pt-6 border-t border-[color:var(--color-border)] font-mono text-xs text-[color:var(--color-muted)]">
        ← <Link href="/blog">back to blog</Link>
      </footer>
    </section>
  );
}