"use client";

import Link from "next/link";
import { socials } from "@/lib/socials";
import { SocialLink } from "@/components/social-link";
import {
  isDir,
  isFile,
  resolve,
  toAbsolute,
  UNAME_STRING,
  type Fs,
} from "@/components/heroes/terminal/terminal-fs";
import { LINK_CLASS, type Line } from "@/components/heroes/terminal/terminal-render";

/**
 * Commands for the interactive shell. No I/O or React state. To add a
 * command, add it to `COMMANDS` (help and Tab completion read it) and
 * add a `case` in `runCommand`.
 */

type CommandInfo = { usage: string; summary: string; flags?: string[] };

const COMMANDS: Record<string, CommandInfo> = {
  cd: { usage: "cd [path]", summary: "change directory" },
  pwd: { usage: "pwd", summary: "print current directory" },
  ls: { usage: "ls [path...]", summary: "list files" },
  whoami: { usage: "whoami", summary: "print the current user" },
  cat: { usage: "cat <file...>", summary: "print files" },
  echo: { usage: "echo <text>", summary: "print text" },
  date: { usage: "date", summary: "print the current date/time" },
  uname: {
    usage: "uname [-a]",
    summary: "print system info",
    flags: ["  -a, --all    print all available system info"],
  },
  hostname: { usage: "hostname", summary: "print hostname" },
  open: { usage: "open <path>", summary: "go to the page for a file or folder" },
  neofetch: { usage: "neofetch", summary: "system info, but pretty" },
  history: { usage: "history", summary: "list the commands you ran" },
  clear: { usage: "clear", summary: "clear the terminal (also ctrl+l)" },
  man: { usage: "man <command>", summary: "show help for a command" },
  help: { usage: "help", summary: "show this list" },
};

export const KNOWN_COMMANDS: readonly string[] = Object.keys(COMMANDS).sort();

export function buildHelp(): string[] {
  return [
    "available commands:",
    ...Object.values(COMMANDS).map((c) => `  ${c.usage.padEnd(16)}${c.summary}`),
    "",
    "  ./contact.sh    send me a message (run it to see the flags)",
  ];
}

export function buildCommandHelp(name: string): string[] {
  if (!Object.hasOwn(COMMANDS, name)) return [`no help available for: ${name}`];
  const c = COMMANDS[name];
  return [
    `usage: ${c.usage}`,
    "",
    `  ${c.summary}.`,
    "",
    "flags:",
    ...(c.flags ?? []),
    "  -h, --help   show this help",
  ];
}

/** Shell-style word splitting: `'...'` is literal, `"..."` allows
 *  `\"` and `\\`, a bare backslash escapes the next character, and
 *  `""` is an empty word (so `--subject ""` works). */
export function tokenize(
  input: string
): { tokens: string[] } | { error: string } {
  const tokens: string[] = [];
  let cur = "";
  let inWord = false;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quote === "'") {
      if (c === "'") quote = null;
      else cur += c;
      continue;
    }
    if (quote === '"') {
      if (c === '"') quote = null;
      else if (c === "\\" && '"\\$`'.includes(input[i + 1] ?? "")) cur += input[++i];
      else cur += c;
      continue;
    }
    if (/\s/.test(c)) {
      if (inWord) tokens.push(cur);
      cur = "";
      inWord = false;
      continue;
    }
    inWord = true;
    if (c === "'" || c === '"') quote = c;
    else if (c === "\\" && i + 1 < input.length) cur += input[++i];
    else cur += c;
  }
  if (quote) return { error: `unexpected EOF while looking for matching \`${quote}'` };
  if (inWord) tokens.push(cur);
  return { tokens };
}

const CONTACT_SCRIPT = "~/contact.sh";

/** The script's arguments if the line runs contact.sh, else `null`.
 *  Like a real shell, running it directly needs a `/` in the path. */
export function contactScriptArgs(tokens: string[], cwd: string): string[] | null {
  const [first, second] = tokens;
  if (first === undefined) return null;
  if ((first === "bash" || first === "sh") && second !== undefined) {
    return resolve(second, cwd) === CONTACT_SCRIPT ? tokens.slice(2) : null;
  }
  if (first.includes("/") && resolve(first, cwd) === CONTACT_SCRIPT) {
    return tokens.slice(1);
  }
  return null;
}

export function wantsHelp(rest: string[]): boolean {
  const first = rest.find((t) => t.length > 0);
  return first === "-h" || first === "--help";
}

export const CONTACT_REQUIRED_FLAGS = [
  "name",
  "email",
  "subject",
  "message",
] as const;

export function parseContactArgs(args: string[]): {
  parsed: Partial<Record<(typeof CONTACT_REQUIRED_FLAGS)[number], string>>;
  unknownFlags: string[];
  missing: (typeof CONTACT_REQUIRED_FLAGS)[number][];
} {
  const parsed: Partial<
    Record<(typeof CONTACT_REQUIRED_FLAGS)[number], string>
  > = {};
  const unknownFlags: string[] = [];
  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    if (!flag || !flag.startsWith("--")) {
      continue;
    }
    const name = flag.slice(2) as (typeof CONTACT_REQUIRED_FLAGS)[number];
    if (value === undefined) {
      continue;
    }
    if (!(CONTACT_REQUIRED_FLAGS as readonly string[]).includes(name)) {
      unknownFlags.push(name);
      continue;
    }
    parsed[name] = value;
  }
  const missing = CONTACT_REQUIRED_FLAGS.filter((f) => !(f in parsed));
  return { parsed, unknownFlags, missing };
}

export type CmdResult = {
  lines: Line[];
  newCwd?: string;
  clear?: boolean;
  /** Site path to navigate to (`open`). */
  navigate?: string;
};

const out = (...texts: string[]): Line[] => texts.map((text) => ({ kind: "out", text }));
const err = (...texts: string[]): Line[] => texts.map((text) => ({ kind: "err", text }));

/** The site page behind an fs path, for `open`. */
export function pageFor(key: string): string | null {
  if (key === "~") return "/";
  if (key === "~/about.md") return "/about";
  if (key === CONTACT_SCRIPT) return "/contact";
  const m = key.match(/^~\/(blog|projects)(?:\/(.+)\.mdx?)?$/);
  if (!m) return null;
  return m[2] ? `/${m[1]}/${m[2]}` : `/${m[1]}`;
}

const ARCH_LOGO = [
  String.raw`      /\      `,
  String.raw`     /  \     `,
  String.raw`    /\   \    `,
  String.raw`   /      \   `,
  String.raw`  /   ,,   \  `,
  String.raw` /   |  |  -\ `,
  "/_-''    ''-_\\",
];

function neofetch(fs: Fs): Line[] {
  const count = (key: string) => {
    const dir = fs[key];
    return isDir(dir) ? Object.keys(dir.children).length : 0;
  };
  // "Boot" was page load, so uptime is time on the page.
  const mins = Math.floor(performance.now() / 60_000);
  const info: [string, string][] = [
    ["os", "Arch Linux x86_64"],
    ["kernel", "6.12.31-arch1-1"],
    ["uptime", mins === 1 ? "1 min" : `${mins} mins`],
    ["shell", "bash 5.2.37"],
    ["content", `${count("~/blog")} posts, ${count("~/projects")} projects`],
  ];
  const right: React.ReactNode[] = [
    <span key="t" className="text-[color:var(--color-accent)]">emily@byemily.org</span>,
    "-----------------",
    ...info.map(([k, v]) => (
      <span key={k}>
        <span className="text-[color:var(--color-accent)]">{k}</span>: {v}
      </span>
    )),
  ];
  return ARCH_LOGO.map((logo, i) => ({
    kind: "md",
    nodes: [
      <span key="logo" className="text-[color:#5b81bb]">{logo}</span>,
      "   ",
      <span key="info">{right[i]}</span>,
    ],
  }));
}

export function runCommand(
  rawCmd: string,
  cwd: string,
  fs: Fs,
  history: readonly string[] = []
): CmdResult {
  const parsed = tokenize(rawCmd);
  if ("error" in parsed) return { lines: err(`bash: ${parsed.error}`) };
  if (parsed.tokens.length === 0) return { lines: [] };

  const [name, ...rest] = parsed.tokens;
  const arg = rest.join(" ");
  if (Object.hasOwn(COMMANDS, name) && wantsHelp(rest)) {
    return { lines: out(...buildCommandHelp(name)) };
  }

  switch (name) {
    case "help":
      return { lines: out(...buildHelp()) };
    case "man":
      if (!rest[0]) return { lines: err("What manual page do you want?", "For example, try 'man man'.") };
      return { lines: out(...buildCommandHelp(rest[0])) };
    case "pwd":
      return { lines: out(toAbsolute(cwd)) };
    case "whoami":
      return { lines: out("emily") };
    case "hostname":
      return { lines: out("byemily.org") };
    case "uname":
      return { lines: out(arg === "-a" || arg === "--all" ? UNAME_STRING : "Linux") };
    case "date":
      return { lines: out(new Date().toString()) };
    case "echo":
      return { lines: out(arg) };
    case "clear":
      return { lines: [], clear: true };
    case "neofetch":
      return { lines: neofetch(fs) };
    case "history":
      return {
        lines: out(...[...history, rawCmd].map((c, i) => `${String(i + 1).padStart(5)}  ${c}`)),
      };
    case "sudo":
      return {
        lines: [
          ...out("[sudo] password for emily: "),
          ...err("emily is not in the sudoers file. This incident will be reported."),
        ],
      };
    case "ls": {
      const flag = rest.find((t) => t.startsWith("-"));
      if (flag) {
        return { lines: err(`ls: unrecognized option '${flag}'`, "try `ls --help` for the list of supported flags.") };
      }
      // Several arguments get `name:` headers, like real ls.
      const paths = rest.length > 0 ? rest : ["."];
      const lines: Line[] = [];
      const errors: Line[] = [];
      for (const p of paths) {
        const target = resolve(p, cwd);
        const entry = target === null ? undefined : fs[target];
        if (target === null) {
          errors.push(...err(`ls: cannot open directory '${p}': permission denied`));
        } else if (isFile(entry)) {
          lines.push({ kind: "entry", name: target.split("/").pop() ?? target, path: target, isDir: false });
        } else if (isDir(entry)) {
          if (paths.length > 1) lines.push(...out(`${p}:`));
          for (const [child, node] of Object.entries(entry.children)) {
            lines.push({ kind: "entry", name: child, path: `${target}/${child}`, isDir: isDir(node) });
          }
          if (paths.length > 1) lines.push(...out(""));
        } else {
          errors.push(...err(`ls: cannot access '${p}': no such file or directory`));
        }
      }
      const last = lines[lines.length - 1];
      if (last?.kind === "out" && last.text === "") lines.pop();
      return { lines: [...lines, ...errors] };
    }
    case "cd": {
      if (rest.length > 1) return { lines: err("cd: too many arguments") };
      const target = resolve(arg, cwd);
      if (target === null) {
        return { lines: err(`cd: ${arg}: permission denied (you're not allowed out of ~)`) };
      }
      const entry = fs[target];
      if (isDir(entry)) return { lines: [], newCwd: target };
      if (isFile(entry)) return { lines: err(`cd: ${arg}: not a directory`) };
      return { lines: err(`cd: ${arg}: no such file or directory`) };
    }
    case "cat": {
      if (rest.length === 0) return { lines: err("cat: missing file operand") };
      const lines: Line[] = [];
      for (const p of rest) {
        const target = resolve(p, cwd);
        const entry = target === null ? undefined : fs[target];
        if (target === null) lines.push(...err(`cat: ${p}: permission denied`));
        else if (isFile(entry)) lines.push(...out(...entry.split("\n")));
        else if (isDir(entry)) lines.push(...err(`cat: ${p}: is a directory`));
        else lines.push(...err(`cat: ${p}: no such file or directory`));
      }
      return { lines };
    }
    case "open":
    case "xdg-open": {
      if (rest.length !== 1) return { lines: err(`usage: ${name} <path>`) };
      const target = resolve(arg, cwd);
      if (target === null) return { lines: err(`${name}: ${arg}: permission denied`) };
      if (fs[target] === undefined) return { lines: err(`${name}: ${arg}: no such file or directory`) };
      const page = pageFor(target);
      if (!page) return { lines: err(`${name}: ${arg}: no page for this file`) };
      return { lines: out(`opening ${page} ...`), navigate: page };
    }
    default:
      return {
        lines: err(
          `command not found: ${name}`,
          "try `help` to see the list of things this shell knows about."
        ),
      };
  }
}

/** Shown when contact.sh is run with missing or unknown flags. */
export function buildContactHelp(
  missing: readonly string[],
  unknownFlags: readonly string[] = []
): Line[] {
  const flags = (names: readonly string[]) => names.map((n) => `--${n}`).join(", ");
  const out: Line[] = [{ kind: "err", text: "contact.sh: missing or invalid arguments" }];
  if (missing.length > 0) out.push({ kind: "err", text: `  missing: ${flags(missing)}` });
  if (unknownFlags.length > 0) {
    out.push({ kind: "err", text: `  unknown flag(s): ${flags(unknownFlags)}` });
  }
  out.push(
    { kind: "out", text: "" },
    { kind: "out", text: "usage:" },
    { kind: "out", text: '  ./contact.sh --name "..." --email "..." --subject "..." --message "..."' },
    { kind: "out", text: '  all four flags are required (--subject may be empty, e.g. --subject "")' },
    { kind: "out", text: "" },
    {
      kind: "md",
      nodes: [
        "alternatively, use the ",
        <Link key="contact" href="/contact" className={LINK_CLASS}>
          /contact
        </Link>,
        " form",
      ],
    },
    { kind: "out", text: "" },
    { kind: "out", text: "or reach me on:" },
  );
  for (const s of socials) {
    if (s.kind === "rss") continue;
    out.push({
      kind: "md",
      nodes: [
        `  `,
        <span key="kind" className="text-[color:var(--color-fg)]">{`${s.kind}: `}</span>,
        <SocialLink key="link" social={s} className={LINK_CLASS} />,
      ],
    });
  }
  return out;
}
