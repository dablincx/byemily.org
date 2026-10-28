import "server-only";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/*
 * Rate limiting for the API routes.
 *
 * Clients are identified by `X-Real-IP`, which nginx sets to the real
 * peer address. Not `X-Forwarded-For`: nginx appends to whatever the
 * client sent, so its first entry is spoofable.
 */

/** IPv6 clients are grouped by /64, since one connection usually gets
 *  a whole /64 to pick addresses from. */
export function clientKey(req: Request): string {
  const ip = req.headers.get("x-real-ip")?.trim();
  if (!ip) return "unknown";
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return mapped[1];
  if (!ip.includes(":")) return ip;
  return ipv6Prefix64(ip) ?? ip;
}

function ipv6Prefix64(ip: string): string | null {
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves[1] ? halves[1].split(":") : [];
  const groups =
    halves.length === 2
      ? [...head, ...Array(Math.max(0, 8 - head.length - tail.length)).fill("0"), ...tail]
      : head;
  const prefix = groups.slice(0, 4).map((g) => parseInt(g, 16));
  if (prefix.length < 4 || prefix.some((n) => Number.isNaN(n))) return null;
  return `${prefix.map((n) => n.toString(16)).join(":")}::/64`;
}

/** At most `limit` hits per key in any `windowMs` window. Past
 *  `maxKeys` keys, new keys share one overflow bucket, which bounds
 *  memory and throttles floods of fresh keys together. */
export class SlidingWindowLimiter {
  private hits = new Map<string, number[]>();
  private callsSincePrune = 0;

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  retryAfterMs(key: string, now: number): number {
    const recent = this.recent(this.bucket(key), now);
    if (recent.length < this.limit) return 0;
    return recent[recent.length - this.limit] + this.windowMs - now;
  }

  record(key: string, now: number): void {
    const bucket = this.bucket(key);
    this.hits.set(bucket, [...this.recent(bucket, now), now]);
    if (++this.callsSincePrune >= 256) this.prune(now);
  }

  refund(key: string, at: number): void {
    const bucket = this.bucket(key);
    const timestamps = this.hits.get(bucket);
    const i = timestamps?.lastIndexOf(at) ?? -1;
    if (timestamps && i !== -1) timestamps.splice(i, 1);
  }

  snapshot(): Record<string, number[]> {
    return Object.fromEntries(this.hits);
  }

  restore(data: Record<string, number[]>): void {
    for (const [key, timestamps] of Object.entries(data)) {
      if (Array.isArray(timestamps)) this.hits.set(key, timestamps.filter(Number.isFinite));
    }
  }

  private bucket(key: string): string {
    return this.hits.has(key) || this.hits.size < this.maxKeys ? key : "__overflow__";
  }

  private recent(bucket: string, now: number): number[] {
    const cutoff = now - this.windowMs;
    return (this.hits.get(bucket) ?? []).filter((t) => t > cutoff);
  }

  private prune(now: number): void {
    this.callsSincePrune = 0;
    for (const key of this.hits.keys()) {
      const recent = this.recent(key, now);
      if (recent.length === 0) this.hits.delete(key);
      else this.hits.set(key, recent);
    }
  }
}

/** Stored keys are hashed, so the state file holds no IPs. */
export function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex").slice(0, 32);
}

/** Loads the limiters' state from `file`; the returned function saves
 *  it, so limits survive restarts. */
export function persistLimiters(
  file: string,
  limiters: Record<string, SlidingWindowLimiter>
): () => void {
  try {
    const data = JSON.parse(readFileSync(file, "utf8")) as Record<string, Record<string, number[]>>;
    for (const [name, limiter] of Object.entries(limiters)) {
      if (data[name]) limiter.restore(data[name]);
    }
  } catch {}
  return () => {
    try {
      mkdirSync(dirname(file), { recursive: true });
      const snapshot = Object.fromEntries(
        Object.entries(limiters).map(([name, l]) => [name, l.snapshot()])
      );
      writeFileSync(file + ".tmp", JSON.stringify(snapshot));
      renameSync(file + ".tmp", file);
    } catch (e) {
      console.error("[rate-limit] could not save state:", e);
    }
  };
}
