/** Builds the homepage terminal's filesystem from the real content:
 *  `~/blog`, `~/projects`, `about.md`, `contact.sh`. */

import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Fs, FsEntry } from "@/components/heroes/terminal/terminal-fs";
import { aboutAsMarkdown, currentAge } from "@/lib/content";
import { listMarkdownFiles } from "@/lib/content-loader";

type Dir = { type: "dir"; children: Record<string, FsEntry> };

const CONTACT_SH = `#!/bin/bash
# contact.sh — sends a message to emily via the contact form.
# usage: ./contact.sh --name "..." --email "..." --subject "..." --message "..."

set -e

name=""
email=""
subject=""
message=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)    name="$2";    shift 2 ;;
    --email)   email="$2";   shift 2 ;;
    --subject) subject="$2"; shift 2 ;;
    --message) message="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$name" || -z "$email" || -z "$message" ]]; then
  echo "usage: ./contact.sh --name \\"...\\" --email \\"...\\" --subject \\"...\\" --message \\"...\\"" >&2
  echo "" >&2
  echo "all four flags are required (--subject may be empty but the flag must be present)" >&2
  exit 64
fi

# Encode user input as JSON rather than interpolating it into JSON syntax.
payload="$(python3 -c 'import json,sys; print(json.dumps(dict(zip(("name", "email", "subject", "message"), sys.argv[1:]))))' \\
  "$name" "$email" "$subject" "$message")"

# POST to the same /api/contact endpoint the form on the site uses.
curl -sS -X POST -H 'content-type: application/json' \\
  --data "$payload" \\
  https://byemily.org/api/contact | grep -q '"ok":true' \\
  && echo "sent." || { echo "send failed." >&2; exit 1; }
`;

async function markdownDir(dir: string): Promise<Dir> {
  const children: Record<string, FsEntry> = {};
  for (const f of await listMarkdownFiles(dir)) {
    children[f.name] = await fs.readFile(f.path, "utf8");
  }
  return { type: "dir", children };
}

export async function buildFakeFs(): Promise<Fs> {
  const home: Dir = {
    type: "dir",
    children: {
      blog: await markdownDir(path.join(process.cwd(), "posts")),
      projects: await markdownDir(path.join(process.cwd(), "projects")),
      "about.md": aboutAsMarkdown(currentAge()),
      "contact.sh": CONTACT_SH,
    },
  };
  // Every node is also stored under its full path (see terminal-fs).
  const root: Fs = { "~": home };
  flattenInto(root, "~", home);
  return root;
}

function flattenInto(out: Fs, dirPath: string, node: Dir): void {
  for (const [name, child] of Object.entries(node.children)) {
    const childPath = `${dirPath}/${name}`;
    out[childPath] = child;
    if (typeof child !== "string") flattenInto(out, childPath, child);
  }
}
