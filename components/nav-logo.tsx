"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Greeting } from "@/components/greeting";

export function NavLogo() {
  const pathname = usePathname();
  const onHome = pathname === "/";

  return (
    <Link
      href="/"
      onClick={(e) => {
        if (onHome) {
          // On the homepage, scroll up instead of navigating, which
          // would replay the boot.
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      className="font-mono text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-accent)] transition-colors"
    >
      byemily.org
      {/* Greeting + clock only where there's room next to the links. */}
      <span className="hidden sm:inline">
        <span className="text-[color:var(--color-border)] mx-2">|</span>
        <span className="text-[color:var(--color-accent)]">$</span>{" "}
        <Greeting />
      </span>
    </Link>
  );
}