import { getAllPosts } from "@/lib/posts";
import { getAllProjects } from "@/lib/projects";
import { SITE_URL } from "@/lib/site";


/** Site index for LLMs (llmstxt.org). */

export const dynamic = "force-dynamic";

export async function GET() {
  const [posts, projects] = await Promise.all([
    getAllPosts(),
    getAllProjects(),
  ]);

  const lines: string[] = [
    "# emily / dablincx",
    "",
    "> personal site of emily: backend, fullstack, selfhosting, sysadmin.",
    "",
    "## sections",
    "",
    `- [home](${SITE_URL}/)`,
    `- [blog](${SITE_URL}/blog), writing`,
    `- [projects](${SITE_URL}/projects), things i've built`,
    `- [about](${SITE_URL}/about)`,
    `- [contact](${SITE_URL}/contact)`,
    "",
    "## feeds",
    "",
    `- [rss](${SITE_URL}/blog/rss.xml)`,
    `- [atom](${SITE_URL}/blog/atom.xml)`,
    `- [json feed](${SITE_URL}/blog/feed.json)`,
    "",
  ];

  if (posts.length > 0) {
    lines.push("## recent posts", "");
    for (const p of posts.slice(0, 20)) {
      lines.push(
        `- [${p.title}](${SITE_URL}/blog/${p.id})${p.excerpt ? `: ${p.excerpt}` : ""
        }`
      );
    }
    lines.push("");
  }

  if (projects.length > 0) {
    lines.push("## projects", "");
    for (const p of projects) {
      lines.push(
        `- [${p.title}](${SITE_URL}/projects/${p.slug}): ${p.description}`
      );
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}