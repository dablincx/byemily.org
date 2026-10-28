/** Shown in the nav, footer, /about and the terminal. Any `kind` works;
 *  the nav only shows kinds it has an icon for (see nav.tsx). */
export type Social = {
  kind: "github" | "email" | "rss" | "mastodon" | "bluesky" | "link" | string;
  handle: string; // shown as text
  href: string;   // URL or mailto:
  label?: string; // aria-label override
  external?: boolean;
};

export const socials: Social[] = [
  {
    kind: "github",
    handle: "dablincx",
    href: "https://github.com/dablincx",
    external: true,
  },
  {
    kind: "email",
    handle: "contact@byemily.org",
    href: "mailto:contact@byemily.org",
  },
  {
    kind: "rss",
    handle: "rss",
    href: "/blog/rss.xml",
    label: "RSS feed",
  },
];