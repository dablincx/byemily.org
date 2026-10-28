"use client";

import Link from "next/link";


/** One history entry. `md` holds prebuilt nodes (output with links);
 *  `entry` is a tappable `ls` result. */
export type Line =
  | { kind: "cmd"; cwd: string; text: string }
  | { kind: "out" | "err"; text: string }
  | { kind: "md"; nodes: React.ReactNode[] }
  | { kind: "entry"; name: string; path: string; isDir: boolean };

const FG = "text-[color:var(--color-fg)]";
const ACCENT = "text-[color:var(--color-accent)]";
const PATH = "text-[color:#5b81bb]";

export const LINK_CLASS =
  "text-[color:#5b81bb] underline decoration-dotted underline-offset-2 hover:text-[color:var(--color-accent)] hover:decoration-solid";

export function Prompt({ cwd }: { cwd: string }) {
  return (
    <>
      <span className={FG}>[</span>
      <span className={ACCENT}>emily@byemily.org</span>
      <span className={FG}> </span>
      <span className={PATH}>{cwd}</span>
      <span className={FG}>]$ </span>
    </>
  );
}

/** Bare site paths in output (`/contact.`) become links. */
const SLUG = String.raw`[a-z0-9]+(?:[._-][a-z0-9]+)*`;
const LINKABLE_PATH_RE = new RegExp(
  String.raw`(?<=\s)\/(?:about|contact|blog(?:\/${SLUG})?|projects(?:\/${SLUG})?)(?![a-z0-9_\/-]|\.[a-z0-9])`,
  "g"
);

export function linkify(s: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  for (const m of s.matchAll(LINKABLE_PATH_RE)) {
    if (m.index > last) out.push(s.slice(last, m.index));
    out.push(
      <Link key={m.index} href={m[0]} className={LINK_CLASS}>
        {m[0]}
      </Link>
    );
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

/** `onRun` runs a command as if typed (tapping an `ls` entry). */
export function HistoryLine({ line: l, onRun }: { line: Line; onRun: (cmd: string) => void }) {
  switch (l.kind) {
    case "entry": {
      // Colored like `ls --color`: folders blue, the script green.
      const color = l.isDir
        ? PATH
        : l.name.endsWith(".sh")
          ? "text-[color:#98c379]"
          : "text-[color:var(--color-muted)]";
      return (
        <span>
          <button
            type="button"
            onClick={() => onRun(`${l.isDir ? "cd" : "open"} ${l.path}`)}
            title={l.isDir ? `cd ${l.path}` : `open ${l.path}`}
            className={`${color} cursor-pointer hover:underline decoration-dotted underline-offset-2`}
          >
            {l.name}
          </button>
          {"\n"}
        </span>
      );
    }
    case "cmd":
      return (
        <span>
          <Prompt cwd={l.cwd} />
          <span className={FG}>{l.text}</span>
          {"\n"}
        </span>
      );
    case "err":
      return (
        <span className="text-[color:#e06c75]">
          {l.text}
          {"\n"}
        </span>
      );
    case "md":
      return (
        <span className="text-[color:var(--color-muted)]">
          {l.nodes}
          {"\n"}
        </span>
      );
    case "out":
      return (
        <span className="text-[color:var(--color-muted)]">
          {linkify(l.text)}
          {"\n"}
        </span>
      );
  }
}
