import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import {
  frontmatterDate,
  isMissingDirError,
  isSafeContentId,
  listMarkdownFiles,
  stripMarkdownExt,
} from "@/lib/content-loader";

/* Posts: `posts/*.md(x)`, re-read on every request. */

const POSTS_DIR = path.join(process.cwd(), "posts");

const FrontmatterSchema = z.object({
  title: z.string().min(1),
  date: frontmatterDate,
  featured: z.boolean().default(false),
  pinned: z.boolean().default(false),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  series: z.string().optional(),
  seriesOrder: z.number().optional(),
  updated: frontmatterDate.optional(),
});

export type PostFrontmatter = z.infer<typeof FrontmatterSchema>;

export type PostMeta = PostFrontmatter & {
  id: string; // file basename minus extension
  readingMinutes: number;
  // From frontmatter, else the file's mtime (YYYY-MM-DD).
  updated: string;
};

export type Post = {
  meta: PostMeta;
  content: string; // raw markdown body (no frontmatter)
};

const READING_WPM = 220;

function computeReadingMinutes(body: string): number {
  // Raw word count, code included; close enough for an estimate.
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / READING_WPM));
}

async function readPostFile(id: string): Promise<Post | null> {
  if (!isSafeContentId(id)) return null;
  for (const ext of [".md", ".mdx"]) {
    const file = path.join(POSTS_DIR, `${id}${ext}`);
    try {
      const [raw, stat] = await Promise.all([
        fs.readFile(file, "utf8"),
        fs.stat(file),
      ]);
      const { data, content } = matter(raw);
      const fm = FrontmatterSchema.parse(data);
      const updated =
        fm.updated ??
        new Date(stat.mtimeMs).toISOString().slice(0, 10);
      const meta: PostMeta = {
        ...fm,
        id,
        readingMinutes: computeReadingMinutes(content),
        updated,
      };
      return { meta, content };
    } catch (e: unknown) {
      if (isMissingDirError(e)) continue;
      throw e;
    }
  }
  return null;
}

/** Pinned first, then newest first. */
export async function getAllPosts(): Promise<PostMeta[]> {
  const files = await listMarkdownFiles(POSTS_DIR);
  const ids = files.map((f) => stripMarkdownExt(f.name));

  const posts = (
    await Promise.all(ids.map((id) => readPostFile(id)))
  ).filter((p): p is Post => p !== null);

  return posts
    .map((p) => p.meta)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}

export async function getPost(id: string): Promise<Post | null> {
  return readPostFile(id);
}

/** Updated more than a day after publishing (worth an "upd" date). */
export function wasUpdated(post: PostMeta): boolean {
  const day = 24 * 60 * 60 * 1000;
  return new Date(post.updated).getTime() - new Date(post.date).getTime() > day;
}

/** Posts grouped by `series`, ordered by `seriesOrder`, then date. */
export type Series = {
  name: string;
  posts: PostMeta[];
};

export async function getAllSeries(): Promise<Series[]> {
  const all = await getAllPosts();
  const byName = new Map<string, PostMeta[]>();
  for (const p of all) {
    if (!p.series) continue;
    const arr = byName.get(p.series) ?? [];
    arr.push(p);
    byName.set(p.series, arr);
  }
  const series: Series[] = [];
  for (const [name, posts] of byName) {
    posts.sort((a, b) => {
      const ao = a.seriesOrder ?? Number.POSITIVE_INFINITY;
      const bo = b.seriesOrder ?? Number.POSITIVE_INFINITY;
      if (ao !== bo) return ao - bo;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    series.push({ name, posts });
  }
  series.sort((a, b) => {
    const aDate = a.posts[0]?.date ?? "";
    const bDate = b.posts[0]?.date ?? "";
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });
  return series;
}

export async function getSeries(name: string): Promise<Series | null> {
  const all = await getAllSeries();
  return all.find((s) => s.name === name) ?? null;
}