import Link from "next/link";
import { socials } from "@/lib/socials";
import { Year } from "@/components/year";
import { SocialLink } from "@/components/social-link";

export function Footer() {
  const feeds = [
    { href: "/blog/rss.xml", label: "rss" },
    { href: "/blog/atom.xml", label: "atom" },
    { href: "/blog/feed.json", label: "json" },
  ];

  return (
    <footer className="border-t border-[color:var(--color-border)]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-10 flex flex-col gap-2 sm:gap-6 sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm font-mono text-[color:var(--color-muted)]">
        <div className="flex flex-col gap-1">
          <p>
            <span className="text-[color:var(--color-accent)]">©</span>{" "}
            <Year /> byemily.org
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-[color:var(--color-accent)]">{"//"} blog feed</span>
          {feeds.map((f) => (
            <Link key={f.href} href={f.href}>
              {f.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="text-[color:var(--color-accent)]">{"//"} socials</span>
          {socials
            .filter((s) => s.kind !== "rss")
            .map((s) => (
              <SocialLink key={s.href} social={s}>
                {s.kind === "github" ? `github/${s.handle}` : s.handle}
              </SocialLink>
            ))}
        </div>
      </div>
    </footer>
  );
}