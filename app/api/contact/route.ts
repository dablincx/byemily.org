import { createHash } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactMail } from "@/lib/email";
import { clientKey, hashKey, persistLimiters, SlidingWindowLimiter } from "@/lib/rate-limit";

const Body = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(1).max(5000),
  // Honeypot: hidden in the form; bots that fill it get a fake success.
  website: z.string().optional(),
});

const MAX_BODY_BYTES = 8 * 1024;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

/*
 * Every send must pass all limits: per client 1 per 30s, 3 per hour,
 * 10 per day; 20 per hour overall (so rotating IPs can't flood the
 * inbox); identical messages once a day.
 */
const perClient = [
  new SlidingWindowLimiter(1, 30 * SECOND),
  new SlidingWindowLimiter(3, HOUR),
  new SlidingWindowLimiter(10, 24 * HOUR),
];
const global = new SlidingWindowLimiter(20, HOUR);
const duplicates = new SlidingWindowLimiter(1, 24 * HOUR);
const GLOBAL_KEY = "*";
const saveLimits = persistLimiters(path.join(process.cwd(), ".data", "contact-limits.json"), {
  burst: perClient[0],
  hourly: perClient[1],
  daily: perClient[2],
  global,
  duplicates,
});

function messageFingerprint(message: string): string {
  const normalized = message.toLowerCase().replace(/\s+/g, " ").trim();
  return createHash("sha256").update(normalized).digest("hex");
}

function formatWait(ms: number): string {
  const s = Math.ceil(ms / SECOND);
  if (s < 60) return `${s}s`;
  const m = Math.ceil(s / 60);
  if (m < 60) return `${m} min`;
  return `${Math.ceil(m / 60)}h`;
}

function tooMany(error: string, retryAfterMs: number) {
  return NextResponse.json(
    { error },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(retryAfterMs / SECOND)) },
    }
  );
}

async function readLimitedBody(req: Request): Promise<string | null> {
  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return null;
  }

  if (!req.body) return "";
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    const body = await readLimitedBody(req);
    if (body === null) {
      return NextResponse.json({ error: "request body too large" }, { status: 413 });
    }
    json = JSON.parse(body);
  } catch {
    return NextResponse.json(
      { error: "invalid json body" },
      { status: 400 }
    );
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (parsed.data.website) return NextResponse.json({ ok: true });

  // Checked after validation, so typos don't use up quota. No await
  // between check and record, so concurrent requests can't all pass.
  const now = Date.now();
  const client = hashKey(clientKey(req));
  const fingerprint = messageFingerprint(parsed.data.message);

  const clientWait = Math.max(...perClient.map((l) => l.retryAfterMs(client, now)));
  if (clientWait > 0) {
    return tooMany(`too many messages; try again in ${formatWait(clientWait)}`, clientWait);
  }
  const duplicateWait = duplicates.retryAfterMs(fingerprint, now);
  if (duplicateWait > 0) {
    return tooMany("this message was already sent", duplicateWait);
  }
  const globalWait = global.retryAfterMs(GLOBAL_KEY, now);
  if (globalWait > 0) {
    return tooMany(
      `the inbox is getting a lot of mail right now; try again in ${formatWait(globalWait)}`,
      globalWait
    );
  }

  for (const l of perClient) l.record(client, now);
  duplicates.record(fingerprint, now);
  global.record(GLOBAL_KEY, now);
  saveLimits();

  try {
    await sendContactMail({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || undefined,
      message: parsed.data.message,
    });
  } catch (err) {
    for (const l of perClient) l.refund(client, now);
    duplicates.refund(fingerprint, now);
    global.refund(GLOBAL_KEY, now);
    saveLimits();
    console.error("[contact] send failed:", err);
    return NextResponse.json(
      { error: "could not send message; please try again later" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
