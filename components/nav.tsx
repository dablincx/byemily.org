import Link from "next/link";
import { socials } from "@/lib/socials";
import { NavLogo } from "@/components/nav-logo";
import { SocialLink } from "@/components/social-link";

export function Nav() {
  const links = [
    { href: "/blog", label: "blog" },
    { href: "/projects", label: "projects" },
    { href: "/about", label: "about" },
    { href: "/contact", label: "contact" },
  ];

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-sm bg-[color:var(--color-bg)]/80 border-b border-[color:var(--color-border)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3 sm:gap-6">
        <NavLogo />
        <ul className="flex items-center gap-3 sm:gap-5 font-mono text-sm">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="inline-block min-w-[5ch] text-center text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="hidden sm:flex items-center gap-3 pl-5 ml-1 border-l border-[color:var(--color-border)]">
            {socials
              .filter((s) => s.kind === "github" || s.kind === "email" || s.kind === "rss")
              .slice(0, 3)
              .map((s) => (
                <SocialLink
                  key={s.href}
                  social={s}
                  className="text-[color:var(--color-muted)] hover:text-[color:var(--color-accent)] transition-colors"
                >
                  {iconFor(s.kind)}
                </SocialLink>
              ))}
          </li>
        </ul>
      </div>
    </nav>
  );
}

function iconFor(kind: string) {
  // suppressHydrationWarning: extensions like Dark Reader rewrite SVG
  // attributes before hydration.
  switch (kind) {
    case "github":
      return (
        <svg suppressHydrationWarning width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.55v-2.04c-3.2.7-3.88-1.36-3.88-1.36-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.95.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.9 10.9 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.36.78 1.06.78 2.13v3.16c0 .31.21.66.79.55A11.5 11.5 0 0 0 12 .5Z" />
        </svg>
      );
    case "email":
      return (
        <svg suppressHydrationWarning width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    case "rss":
      return (
        <svg suppressHydrationWarning width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 11a9 9 0 0 1 9 9" />
          <path d="M4 4a16 16 0 0 1 16 16" />
          <circle cx="5" cy="19" r="1" />
        </svg>
      );
    default:
      return null;
  }
}