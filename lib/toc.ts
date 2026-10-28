import GithubSlugger from "github-slugger";

export type TocEntry = { depth: 2 | 3; text: string; id: string };

/**
 * Table of contents for a markdown body: its `##` and `###` headings,
 * with the same ids rehype-slug gives them in the rendered page (both
 * use github-slugger, fed every heading in document order so duplicate
 * numbering matches). Headings inside fenced code blocks are skipped.
 */
export function tableOfContents(markdown: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const entries: TocEntry[] = [];
  let fence: string | null = null;
  for (const line of markdown.split("\n")) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1];
      else if (fenceMatch[1].startsWith(fence)) fence = null;
      continue;
    }
    if (fence) continue;
    const m = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = plainText(m[2]);
    const id = slugger.slug(text);
    const depth = m[1].length;
    if (depth === 2 || depth === 3) entries.push({ depth, text, id });
  }
  return entries;
}

/** Heading text as it renders: inline markdown syntax removed. */
function plainText(md: string): string {
  return md
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/(\*\*|__|\*|_|~~)(.+?)\1/g, "$2")
    .trim();
}
