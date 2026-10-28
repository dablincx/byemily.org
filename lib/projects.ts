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

/* Projects: `projects/*.mdx`, re-read on every request. */

const PROJECTS_DIR = path.join(process.cwd(), "projects");

const FrontmatterSchema = z.object({
  title: z.string().min(1),
  date: frontmatterDate.optional(),
  featured: z.boolean().default(false),
  pinned: z.boolean().default(false),
  description: z.string().min(1),
  tech: z.array(z.string()).default([]),
  links: z
    .object({
      demo: z.string().url().optional(),
      repo: z.string().url().optional(),
    })
    .and(z.record(z.string(), z.string().url()))
    .default({}),
  image: z.string().optional(),
});

export type ProjectFrontmatter = z.infer<typeof FrontmatterSchema>;

export type ProjectMeta = ProjectFrontmatter & {
  slug: string;
  updated?: string;
};

export type Project = {
  meta: ProjectMeta;
  content: string;
};

async function readProjectFile(slug: string): Promise<Project | null> {
  if (!isSafeContentId(slug)) return null;
  for (const ext of [".mdx", ".md"]) {
    const file = path.join(PROJECTS_DIR, `${slug}${ext}`);
    try {
      const [raw, stat] = await Promise.all([
        fs.readFile(file, "utf8"),
        fs.stat(file),
      ]);
      const { data, content } = matter(raw);
      const fm = FrontmatterSchema.parse(data);
      const meta: ProjectMeta = {
        ...fm,
        slug,
        updated: new Date(stat.mtimeMs).toISOString().slice(0, 10),
      };
      return { meta, content };
    } catch (e: unknown) {
      if (isMissingDirError(e)) continue;
      throw e;
    }
  }
  return null;
}

export async function getAllProjects(): Promise<ProjectMeta[]> {
  const files = await listMarkdownFiles(PROJECTS_DIR);
  const slugs = files.map((f) => stripMarkdownExt(f.name));

  const projects = (
    await Promise.all(slugs.map((slug) => readProjectFile(slug)))
  ).filter((p): p is Project => p !== null);

  return projects
    .map((p) => p.meta)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const ad = a.date ? new Date(a.date).getTime() : 0;
      const bd = b.date ? new Date(b.date).getTime() : 0;
      return bd - ad;
    });
}

export async function getProject(slug: string): Promise<Project | null> {
  return readProjectFile(slug);
}