import type { Social } from "@/lib/socials";

/** External socials open in a new tab with `rel="noopener noreferrer"`. */
export function SocialLink({
  social,
  className,
  children,
}: {
  social: Social;
  className?: string;
  children?: React.ReactNode;
}) {
  const external = "external" in social && social.external;
  return (
    <a
      href={social.href}
      aria-label={social.label ?? social.handle}
      className={className}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children ?? social.handle}
    </a>
  );
}
