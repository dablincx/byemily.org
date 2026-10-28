import Link from "next/link";

type EmptyStateVariant = "posts" | "projects";

type Props = {
  variant: EmptyStateVariant;
};

export function EmptyState({ variant }: Props) {
  const isPosts = variant === "posts";

  return (
    <div className="border border-dashed border-[color:var(--color-border)] rounded-md p-8 bg-[color:var(--color-surface)] text-center">
      <h2 className="mt-3 text-2xl">
        {isPosts ? "nothing here to read yet" : "nothing on display yet"}
      </h2>
      <p className="mt-3 text-[color:var(--color-muted)] font-serif leading-relaxed max-w-md mx-auto">
        {isPosts
          ? "no posts have been published yet, check back later!"
          : "no projects are listed yet, check back later!"}
      </p>

      <div className="mt-7">
        <Link
          href="/contact"
          className="inline-block py-2 px-5 border border-[color:var(--color-border)] rounded hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)] transition-colors font-mono text-sm"
        >
          ./contact
        </Link>
      </div>
    </div>
  );
}