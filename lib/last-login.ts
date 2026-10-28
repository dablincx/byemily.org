import "server-only";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/*
 * Site-wide "last login" for the boot log: the newest visit time, kept
 * in `.data/last-login.json`. Only ever moves forward.
 */

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "last-login.json");

type Shape = { lastLoginAt: number };

function read(): Shape {
  try {
    if (!existsSync(DATA_FILE)) return { lastLoginAt: 0 };
    const raw = readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Shape>;
    if (typeof parsed.lastLoginAt !== "number" || !Number.isFinite(parsed.lastLoginAt)) {
      return { lastLoginAt: 0 };
    }
    return { lastLoginAt: parsed.lastLoginAt };
  } catch {
    return { lastLoginAt: 0 };
  }
}

function write(value: number): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  // tmp + rename, so readers never see a half-written file.
  const tmp = DATA_FILE + ".tmp";
  writeFileSync(tmp, JSON.stringify({ lastLoginAt: value }), "utf8");
  renameSync(tmp, DATA_FILE);
}

export function getLastLogin(): number {
  return read().lastLoginAt;
}

/** Store `candidate` if it's newer; returns the stored value. */
export function tryBumpLastLogin(candidate: number): number {
  if (!Number.isFinite(candidate) || candidate < 0) {
    return read().lastLoginAt;
  }
  const current = read().lastLoginAt;
  if (candidate <= current) {
    return current;
  }
  write(candidate);
  return candidate;
}

/** Like `last` prints it: `Tue Aug 19 03:14:07 2026`. */
export function formatLastLogin(ts: number): string {
  if (!ts || !Number.isFinite(ts)) return "(never)";
  const d = new Date(ts);
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const mon = d.toLocaleDateString("en-US", { month: "short" });
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${day} ${mon} ${dd} ${hh}:${mm}:${ss} ${yyyy}`;
}
