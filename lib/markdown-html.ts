import "server-only";
import type { Root } from "hast";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { SITE_URL } from "@/lib/site";

/**
 * A post body as plain HTML, for feeds. Posts are rendered as MDX on
 * the site; here they go through plain markdown, so MDX components
 * come out as unknown tags, which feed readers ignore.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(absoluteUrls)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);
  return String(file);
}

/** Feed readers have no base URL: make `/foo` links and images
 *  absolute. */
function absoluteUrls() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      for (const attr of ["href", "src"]) {
        const value = node.properties[attr];
        if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
          node.properties[attr] = SITE_URL + value;
        }
      }
    });
  };
}
