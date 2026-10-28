/**
 * Logs when files in /posts or /projects change. Informational only:
 * the loaders re-read the disk on every request anyway. Turn off with
 * NEXT_DISABLE_CONTENT_WATCHER=1.
 *
 * Polls instead of using inotify (chokidar), which silently drops
 * events on network/FUSE mounts like the one this site runs from.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { listMarkdownFiles } from "@/lib/content-loader";

const POLL_INTERVAL_MS = 1000;

type Entry = { mtimeMs: number; size: number };
type Snapshot = Map<string, Entry>;

async function snapshot(dir: string): Promise<Snapshot> {
  const out: Snapshot = new Map();
  for (const f of await listMarkdownFiles(dir)) {
    try {
      const st = await fs.stat(f.path);
      out.set(f.path, { mtimeMs: st.mtimeMs, size: st.size });
    } catch {
      // File was deleted between readdir and stat — ignore.
    }
  }
  return out;
}

function diff(before: Snapshot, after: Snapshot): boolean {
  if (before.size !== after.size) return true;
  for (const [k, v] of after) {
    const prev = before.get(k);
    if (!prev) return true;
    if (prev.mtimeMs !== v.mtimeMs || prev.size !== v.size) return true;
  }
  return false;
}

type State = { posts: Snapshot; projects: Snapshot };

async function tick(state: State): Promise<State> {
  const postsNext = await snapshot(path.join(process.cwd(), "posts"));
  const projectsNext = await snapshot(path.join(process.cwd(), "projects"));

  const postsChanged = diff(state.posts, postsNext);
  const projectsChanged = diff(state.projects, projectsNext);

  if (postsChanged || projectsChanged) {
    console.log(
      `[content-watcher] changed: posts=${postsChanged} projects=${projectsChanged}`
    );
  }

  return { posts: postsNext, projects: projectsNext };
}

export async function register() {
  if (process.env.NEXT_DISABLE_CONTENT_WATCHER === "1") return;

  let state: State = {
    posts: await snapshot(path.join(process.cwd(), "posts")),
    projects: await snapshot(path.join(process.cwd(), "projects")),
  };

  console.log("[content-watcher] polling /posts and /projects for changes");

  const interval = setInterval(() => {
    tick(state)
      .then((next) => {
        state = next;
      })
      .catch((err) => {
        console.error("[content-watcher] tick error:", err);
      });
  }, POLL_INTERVAL_MS);

  process.once("SIGTERM", () => clearInterval(interval));
  process.once("SIGINT", () => clearInterval(interval));
}