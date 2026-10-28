import type { Metadata } from "next";
import { PostCard } from "@/components/post-card";
import { EmptyState } from "@/components/empty-state";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "blog",
  description: "writing by emily / dablincx",
  // Don't inherit the layout's generic link-preview text.
  openGraph: { images: [] },
  twitter: { images: [], card: "summary" },
};

export const dynamic = "force-dynamic";

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <section className="max-w-3xl mx-auto px-6 py-12 w-full">
      <header className="mb-10 w-full">
        <h1 className="text-3xl">blog</h1>
        <p className="text-[color:var(--color-muted)] mt-3 font-serif leading-relaxed min-h-[2lh] w-full">
          just stuff i write sometimes, mostly about programming and computers, but also about other things too
        </p>
      </header>

      {posts.length === 0 ? (
        <EmptyState variant="posts" />
      ) : (
        <ul className="list-none">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </ul>
      )}
    </section>
  );
}