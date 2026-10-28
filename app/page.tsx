import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { CurrentHero } from "@/lib/hero-current";

export const metadata: Metadata = {
  // Don't inherit the layout's generic link-preview text.
  openGraph: { images: [] },
  twitter: { images: [], card: "summary" },
};

/** iOS zooms in on focused inputs under 16px (the terminal). Apple-only
 *  maximum-scale stops that: iOS keeps pinch-zoom, desktop Safari
 *  ignores it, but Android would lose pinch-zoom. */
export async function generateViewport(): Promise<Viewport> {
  const ua = (await headers()).get("user-agent") ?? "";
  return /iPhone|iPad|iPod|Macintosh/.test(ua) ? { maximumScale: 1 } : {};
}

export default function Home() {
  return <CurrentHero />;
}
