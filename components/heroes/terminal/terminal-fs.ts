/**
 * The terminal's filesystem: every node is stored under its full path
 * (`fs["~/blog"]`) so any path resolves with one lookup. Built from
 * the real content by `lib/fake-fs.ts`.
 */

export type FsEntry =
  | string
  | { type: "dir"; children: Record<string, FsEntry> };

export type Fs = Record<string, FsEntry>;

export function isDir(
  entry: FsEntry | undefined
): entry is { type: "dir"; children: Record<string, FsEntry> } {
  return !!entry && typeof entry === "object" && entry.type === "dir";
}

export function isFile(entry: FsEntry | undefined): entry is string {
  return typeof entry === "string";
}

/** What `~` stands for. Anything outside it is "permission denied". */
export const HOME = "/home/emily";

/** `~/blog` → `/home/emily/blog`, for `pwd`. */
export function toAbsolute(key: string): string {
  return key === "~" ? HOME : HOME + key.slice(1);
}

/** The fs key a typed path points to, or `null` if it leaves home. */
export function resolve(p: string, cwd: string): string | null {
  let abs: string;
  if (p === "" || p === "~") abs = HOME;
  else if (p.startsWith("~/")) abs = HOME + p.slice(1);
  else if (p.startsWith("/")) abs = p;
  else abs = toAbsolute(cwd) + "/" + p;

  const parts: string[] = [];
  for (const seg of abs.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  const normalized = "/" + parts.join("/");
  if (normalized === HOME) return "~";
  if (normalized.startsWith(HOME + "/")) return "~" + normalized.slice(HOME.length);
  return null;
}

export const UNAME_STRING =
  "Linux byemily.org 6.12.31-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64";
