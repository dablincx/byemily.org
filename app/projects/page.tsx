import type { Metadata } from "next";
import { ProjectCard } from "@/components/project-card";
import { EmptyState } from "@/components/empty-state";
import { getAllProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "projects",
  description: "things i've built, pinned first, then by date.",
  openGraph: { images: [] },
  twitter: { images: [], card: "summary" },
};

export const dynamic = "force-dynamic";

export default async function ProjectsIndex() {
  const projects = await getAllProjects();

  return (
    <section className="max-w-3xl mx-auto px-6 py-12 w-full">
      <header className="mb-10 w-full">
        <h1 className="text-3xl">projects</h1>
        <p className="text-[color:var(--color-muted)] mt-3 font-serif leading-relaxed min-h-[2lh] w-full">
          things i&apos;ve built or am actively breaking
        </p>
      </header>

      {projects.length === 0 ? (
        <EmptyState variant="projects" />
      ) : (
        <ul className="list-none flex flex-col gap-3">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </ul>
      )}
    </section>
  );
}