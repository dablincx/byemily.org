import { NextResponse } from "next/server";
import { getLastLogin, tryBumpLastLogin } from "@/lib/last-login";

export const dynamic = "force-dynamic";

const BOT_UA = /bot|crawl|spider|slurp|preview|fetch|headless|lighthouse|python|curl|wget|httpclient|go-http/i;

export async function GET() {
  return NextResponse.json({ lastLoginAt: getLastLogin() });
}

/** Records a visit. Only counts real browsers on this site: the
 *  request must come from our own pages (browsers send
 *  Sec-Fetch-Site; scripts don't) and not from a known bot or
 *  headless browser. */
export async function POST(req: Request) {
  const sameOrigin = req.headers.get("sec-fetch-site") === "same-origin";
  const isBot = BOT_UA.test(req.headers.get("user-agent") ?? "");
  const lastLoginAt = sameOrigin && !isBot ? tryBumpLastLogin(Date.now()) : getLastLogin();
  return NextResponse.json({ lastLoginAt });
}
