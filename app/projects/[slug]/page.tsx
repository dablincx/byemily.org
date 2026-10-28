import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Prose } from "@/components/prose";
import { LinkList, MDXContent } from "@/lib/mdx";
import { getProject } from "@/lib/projects";
import { fmtDate } from "@/lib/format";
import { SITE_URL } from "@/lib/site";


export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "not found" };
  const cover = project.meta.image
    ? [new URL(project.meta.image, SITE_URL).toString()]
    : [];
  return {
    title: project.meta.title,
    description: project.meta.description,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: {
      title: project.meta.title,
      description: project.meta.description,
      type: "article",
      ...(project.meta.date ? { publishedTime: project.meta.date } : {}),
      ...(cover.length > 0 ? { images: cover } : { images: [] }),
    },
    twitter:
      cover.length > 0
        ? { card: "summary_large_image", images: cover }
        : { card: "summary", images: [] },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();

  const m = project.meta;

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-10 pb-6 border-b border-[color:var(--color-border)]">
        {m.date && (
          <time dateTime={m.date} className="font-mono text-xs text-[color:var(--color-muted)]">
            {fmtDate(m.date)}
          </time>
        )}
        <h1 className="text-3xl mt-3">{m.title}</h1>
        <p className="text-[color:var(--color-muted)] mt-3 leading-relaxed">
          {m.description}
        </p>
        {m.tech.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mt-4">
            {m.tech.map((t) => (
              <li
                key={t}
                className="font-mono text-[0.7rem] text-[color:var(--color-accent-soft)] border border-[color:var(--color-border)] rounded px-1.5 py-0.5"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
        <LinkList links={m.links} />
        {m.image && (
          // Plain <img>: cover images have arbitrary, unknown sizes.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.image}
            alt=""
            className="mt-6 w-full h-auto rounded-md border border-[color:var(--color-border)]"
          />
        )}
      </header>

      <Prose>
        <MDXContent source={project.content} />
      </Prose>

      <footer className="mt-16 pt-6 border-t border-[color:var(--color-border)] font-mono text-xs text-[color:var(--color-muted)]">
        ← <Link href="/projects">back to projects</Link>
      </footer>
    </article>
  );
}