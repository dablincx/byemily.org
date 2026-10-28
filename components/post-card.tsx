import Link from "next/link";
import { Badge } from "@/components/badge";
import { TagList } from "@/components/tag-list";
import { wasUpdated, type PostMeta } from "@/lib/posts";
import { fmtDate } from "@/lib/format";

/** Whole card is clickable: the title link is stretched over it
 *  (`after:inset-0`), and the tag links sit above that. */
export function PostCard({ post }: { post: PostMeta }) {
  return (
    <li className="group relative grid grid-cols-[8rem_1fr] gap-4 py-3 border-b border-[color:var(--color-border)]/60 hover:border-[color:var(--color-accent)] transition-colors">
      <div className="font-mono text-xs text-[color:var(--color-muted)] pt-1 flex flex-col gap-0.5">
        <time dateTime={post.date}>{fmtDate(post.date)}</time>
        {wasUpdated(post) && (
          <span className="text-[color:var(--color-accent)]/70">
            upd {fmtDate(post.updated)}
          </span>
        )}
        <span className="text-[color:var(--color-accent)]/60">
          ≈ {post.readingMinutes} min
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg">
          <Link
            href={`/blog/${post.id}`}
            className="text-[color:var(--color-fg)] group-hover:text-[color:var(--color-accent)] transition-colors after:absolute after:inset-0"
          >
            {post.title}
          </Link>
          {post.pinned && <Badge>pinned</Badge>}
          {post.featured && <Badge>featured</Badge>}
        </h3>
        {post.excerpt && (
          <p className="text-[color:var(--color-muted)] text-sm leading-relaxed">
            {post.excerpt}
          </p>
        )}
        {post.tags?.length ? (
          <div className="mt-1">
            <TagList tags={post.tags} />
          </div>
        ) : null}
      </div>
    </li>
  );
}
