import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllProjects } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";


export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.all([
    getAllPosts(),
    getAllProjects(),
  ]);

  const now = new Date();
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/projects`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  const postUrls: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.id}`,
    lastModified: new Date(p.updated),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const projectUrls: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified: new Date(p.updated ?? p.date ?? now),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const tags = [...new Set(posts.flatMap((p) => p.tags ?? []))];
  const tagUrls: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${SITE_URL}/blog/tags/${encodeURIComponent(t)}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...staticUrls, ...postUrls, ...projectUrls, ...tagUrls];
}