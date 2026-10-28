import Link from "next/link";
import type { ProjectMeta } from "@/lib/projects";
import { Badge } from "@/components/badge";
import { fmtDate } from "@/lib/format";

export function ProjectCard({ project }: { project: ProjectMeta }) {
  return (
    <li className="group">
      <Link
        href={`/projects/${project.slug}`}
        className="block py-4 px-5 border border-[color:var(--color-border)] rounded-lg hover:border-[color:var(--color-accent)] hover:bg-[color:var(--color-surface)] transition-all"
      >
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className="text-lg group-hover:text-[color:var(--color-accent)] transition-colors">
            {project.title}
            {project.pinned && <Badge>pinned</Badge>}
            {project.featured && <Badge>featured</Badge>}
          </h3>
          {project.date && (
            <time
              dateTime={project.date}
              className="font-mono text-xs text-[color:var(--color-muted)]"
            >
              {fmtDate(project.date)}
            </time>
          )}
        </div>
        <p className="text-[color:var(--color-muted)] text-sm mt-1.5 leading-relaxed">
          {project.description}
        </p>
        {project.tech.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 mt-3">
            {project.tech.map((t) => (
              <li
                key={t}
                className="font-mono text-[0.7em] text-[color:var(--color-accent-soft)] border border-[color:var(--color-border)] rounded px-1.5 py-0.5"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
      </Link>
    </li>
  );
}