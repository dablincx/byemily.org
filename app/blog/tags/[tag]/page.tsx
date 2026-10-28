import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { getAllPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/blog/tags/[tag]">): Promise<Metadata> {
  const tag = decodeURIComponent((await params).tag);
  return {
    title: `#${tag}`,
    description: `posts tagged ${tag}`,
    openGraph: { images: [] },
    twitter: { images: [], card: "summary" },
  };
}

export default async function TagPage({ params }: PageProps<"/blog/tags/[tag]">) {
  const tag = decodeURIComponent((await params).tag);
  const posts = (await getAllPosts()).filter((p) => p.tags?.includes(tag));
  if (posts.length === 0) notFound();

  return (
    <section className="max-w-3xl mx-auto px-6 py-12 w-full">
      <header className="mb-10">
        <p className="font-mono text-xs text-[color:var(--color-muted)]">{"//"} tag</p>
        <h1 className="text-3xl mt-2">#{tag}</h1>
        <p className="text-[color:var(--color-muted)] mt-2 font-mono text-sm">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </header>

      <ul className="list-none">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </ul>

      <footer className="mt-16 pt-6 border-t border-[color:var(--color-border)] font-mono text-xs text-[color:var(--color-muted)]">
        ← <Link href="/blog">back to blog</Link>
      </footer>
    </section>
  );
}
