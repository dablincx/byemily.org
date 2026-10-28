import "server-only";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

/* MDX for posts and projects: GFM, highlighted code, linkable headings,
 * and the <TechBadge>, <LinkList> and <Callout> components. */

const components = {
  TechBadge,
  LinkList,
  Callout,
};

export function MDXContent({ source }: { source: string }) {
  return (
    <MDXRemote
      source={source}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            // Same slugs as lib/toc.ts (github-slugger).
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              {
                behavior: "append",
                properties: { className: ["heading-anchor"], ariaLabel: "link to this section" },
                content: { type: "text", value: "#" },
              },
            ],
            [rehypePrettyCode, { theme: "gruvbox-dark-medium", keepBackground: false }],
          ],
        },
      }}
    />
  );
}

function TechBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block font-mono text-[0.75em] text-[color:var(--color-accent-soft)] border border-[color:var(--color-border)] rounded px-1.5 py-0.5 mx-0.5 align-middle">
      {children}
    </span>
  );
}

export function LinkList({ links }: { links?: Record<string, string> }) {
  if (!links) return null;
  const entries = Object.entries(links);
  if (entries.length === 0) return null;
  return (
    <ul className="not-prose my-6 flex flex-wrap gap-3 font-mono text-sm">
      {entries.map(([kind, href]) => (
        <li key={kind}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-[color:var(--color-border)] rounded hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] transition-colors"
          >
            <span className="text-[color:var(--color-accent)]">→</span> {kind}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Callout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <aside className="not-prose my-6 px-4 py-3 border-l-2 border-[color:var(--color-accent)] bg-[color:var(--color-surface)] rounded-r">
      {title && (
        <p className="font-mono text-xs uppercase tracking-wider text-[color:var(--color-accent)] mb-1">
          {title}
        </p>
      )}
      <div className="text-[color:var(--color-fg)] text-sm leading-relaxed">
        {children}
      </div>
    </aside>
  );
}