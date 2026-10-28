import "server-only";
import { promises as fs } from "node:fs";
import type { Dirent } from "node:fs";
import path from "node:path";
import { z } from "zod";

/** Shared by the post/project loaders, the fake fs, and the watcher. */

/** Frontmatter date. YAML parses a bare `2026-08-19` into a Date;
 *  normalize that (and anything else date-like) to `YYYY-MM-DD`. */
export const frontmatterDate = z.preprocess(
  (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v),
  z.string().min(1)
);

export const MARKDOWN_RE = /\.mdx?$/i;

/** Dotfiles are drafts: hidden everywhere. */
export function isVisible(name: string): boolean {
  return !name.startsWith(".");
}

/** `my-post.md` → `my-post` (the post id / project slug). */
export function stripMarkdownExt(filename: string): string {
  return filename.replace(MARKDOWN_RE, "");
}

/** Accept only a single safe filename stem from a dynamic route. */
export function isSafeContentId(id: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/i.test(id);
}

export function isMissingDirError(e: unknown): boolean {
  return (
    e instanceof Error &&
    "code" in e &&
    (e as NodeJS.ErrnoException).code === "ENOENT"
  );
}

/** Visible markdown files in `dir`; `[]` if it doesn't exist. */
export async function listMarkdownFiles(
  dir: string
): Promise<{ name: string; path: string }[]> {
  let names: Dirent[];
  try {
    names = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (isMissingDirError(e)) return [];
    throw e;
  }
  const out: { name: string; path: string }[] = [];
  for (const e of names) {
    if (!e.isFile()) continue;
    if (!isVisible(e.name)) continue;
    if (!MARKDOWN_RE.test(e.name)) continue;
    out.push({ name: e.name, path: path.join(dir, e.name) });
  }
  return out;
}
