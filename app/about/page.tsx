import type { Metadata } from "next";
import Link from "next/link";
import { socials } from "@/lib/socials";
import { connection } from "next/server";
import { about, currentAge } from "@/lib/content";
import { SocialLink } from "@/components/social-link";

export const metadata: Metadata = {
  title: "about",
  description: "emily / dablincx / emilythegaycat: backend, fullstack, selfhosting, sysadmin.",
  // Don't inherit the layout's generic link-preview text.
  openGraph: { images: [] },
  twitter: { images: [], card: "summary" },
};

export default async function AboutPage() {
  // Per request, so the age in the bio rolls over without a rebuild.
  await connection();
  const c = about();
  const age = currentAge();
  return (
    <section className="max-w-3xl mx-auto px-6 py-12 w-full">
      <header className="mb-10 w-full">
        <h1 className="text-3xl">about</h1>
        <p className="text-[color:var(--color-muted)] mt-2 leading-relaxed w-full">
          {"//"} {c.intro}
        </p>
      </header>

      <div className="space-y-6 leading-relaxed text-[color:var(--color-fg)]">
        {c.bio.map((para, i) => (
          <p key={i}>
            {renderBio(para, age)}
          </p>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="text-xl mb-3">
          <span className="text-[color:var(--color-accent)] font-mono text-sm">
            ${" "}
          </span>
          stack
        </h2>
        <div className="space-y-4 font-mono text-sm">
          {c.stack.map((g) => (
            <div key={g.title}>
              <p className="text-[color:var(--color-muted)] text-xs uppercase tracking-widest mb-1.5">
                {g.title}
              </p>
              <p className="text-[color:var(--color-fg)]">
                {g.items.map((it, i) => (
                  <span key={it}>
                    {it}
                    {i < g.items.length - 1 ? (
                      <span className="text-[color:var(--color-border)]">
                        {" · "}
                      </span>
                    ) : null}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl mb-3">
          <span className="text-[color:var(--color-accent)] font-mono text-sm">
            ${" "}
          </span>
          socials
        </h2>
        <ul className="font-mono text-sm space-y-1.5">
          {socials.map((s) => (
            <li key={s.href}>
              <span className="text-[color:var(--color-accent)]">→</span>{" "}
              <SocialLink social={s}>
                {`${s.kind}: ${s.handle}`}
              </SocialLink>
            </li>
          ))}
        </ul>
        <p className="font-mono text-xs text-[color:var(--color-muted)] mt-3">
          {"//"} {renderSocialsNote(c.socialsNote)}
        </p>
      </section>
    </section>
  );
}

/** Fills in `{age}` and links `/blog`. */
function renderBio(para: string, age: number): React.ReactNode {
  const tokens = /(\{age\}|\/blog)/;
  const parts = para.split(tokens);
  return parts.map((part, i) => {
    if (part === "{age}") return <span key={i}>{age}</span>;
    if (part === "/blog") return (
      <Link key={i} href="/blog" className="hover:text-[color:var(--color-accent)]">
        /blog
      </Link>
    );
    return <span key={i}>{part}</span>;
  });
}

function renderSocialsNote(s: string): React.ReactNode {
  const parts = s.split(/(\/contact)/);
  return parts.map((part, i) => {
    if (part === "/contact") return (
      <Link key={i} href="/contact" className="hover:text-[color:var(--color-accent)]">
        /contact
      </Link>
    );
    return <span key={i}>{part}</span>;
  });
}
