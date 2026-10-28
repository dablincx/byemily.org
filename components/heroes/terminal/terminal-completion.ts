import {
  isDir,
  resolve,
  type Fs,
} from "@/components/heroes/terminal/terminal-fs";
import { KNOWN_COMMANDS } from "@/components/heroes/terminal/terminal-commands";

/**
 * Tab completion. The first word completes against command names
 * (unless it's a path, like `./con` → `./contact.sh`); arguments
 * complete against the fs for commands that take paths, and Tab is a
 * no-op for free-text arguments like `echo`'s.
 */

const PATH_TAKING_COMMANDS: ReadonlySet<string> = new Set([
  "bash",
  "cat",
  "cd",
  "ls",
  "open",
  "sh",
  "xdg-open",
]);

/** `complete` is the new input line. When it's unchanged and there
 *  are several matches, `options` lists them (like bash on a double
 *  Tab). */
export type CompletionResult = {
  complete: string;
  options: string[];
};

function longestCommonPrefix(strs: string[]): string {
  let prefix = strs[0] ?? "";
  for (const s of strs) {
    while (!s.startsWith(prefix)) prefix = prefix.slice(0, -1);
  }
  return prefix;
}

export function completeInput(
  inputLine: string,
  cursorIdx: number,
  cwd: string,
  fs: Fs
): CompletionResult | null {
  // The word under the cursor (completion works mid-line too).
  let start = cursorIdx;
  while (start > 0 && !/\s/.test(inputLine[start - 1])) start--;
  let end = cursorIdx;
  while (end < inputLine.length && !/\s/.test(inputLine[end])) end++;
  const token = inputLine.slice(start, end);
  const before = inputLine.slice(0, start);
  const after = inputLine.slice(end);

  const cmd = inputLine.match(/^\s*(\S+)/)?.[1] ?? "";
  const isFirstToken = start === (inputLine.match(/^\s*/)?.[0].length ?? 0);
  const isPath = token.includes("/");

  // `parent` is the part of the token up to the last `/`, kept as
  // typed; candidates complete the rest.
  let parent = "";
  let candidates: string[];
  let isDirCandidate: (name: string) => boolean = () => false;

  if (isFirstToken && !isPath) {
    candidates = KNOWN_COMMANDS.filter((c) => c.startsWith(token));
  } else if (PATH_TAKING_COMMANDS.has(cmd) || isPath) {
    const slash = token.lastIndexOf("/");
    parent = token.slice(0, slash + 1);
    const prefix = token.slice(slash + 1);
    const dirKey = resolve(parent || ".", cwd);
    const dir = dirKey === null ? undefined : fs[dirKey];
    if (!isDir(dir)) return null;
    candidates = Object.keys(dir.children)
      .filter((name) => name.startsWith(prefix))
      .sort();
    isDirCandidate = (name) => isDir(dir.children[name]);
  } else {
    return null;
  }

  if (candidates.length === 0) return null;
  if (candidates.length === 1) {
    const [only] = candidates;
    // A unique folder gets a trailing `/` so Tab can continue into it.
    const completed = parent + only + (isDirCandidate(only) ? "/" : "");
    return { complete: before + completed + after, options: [] };
  }
  return {
    complete: before + parent + longestCommonPrefix(candidates) + after,
    options: candidates,
  };
}
