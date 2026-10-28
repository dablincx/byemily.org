"use client";

import { useEffect, useState } from "react";

/** Greeting + clock in the visitor's local time. The server renders
 *  a placeholder, so the hydration mismatch is expected. */

const GREETINGS: Record<string, string[]> = {
  late: ["up too late", "still going?"],
  morning: ["gm", "morning emily", "coffee?"],
  afternoon: ["hey", "afternoon", "back at it"],
  evening: ["evening", "still up?"],
};

function greetingForHour(h: number): string {
  let band: keyof typeof GREETINGS;
  if (h < 5 || h >= 22) band = "late";
  else if (h < 11) band = "morning";
  else if (h < 17) band = "afternoon";
  else band = "evening";
  const pool = GREETINGS[band];
  // Picks a new variant once a minute, not every tick.
  const seed = Math.floor(Date.now() / 60_000);
  return pool[seed % pool.length];
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatTime(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function Greeting() {
  const [now, setNow] = useState<Date | null>(null);
  const [greeting, setGreeting] = useState<string>("gm");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d);
      setGreeting(greetingForHour(d.getHours()));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span suppressHydrationWarning className="inline-flex items-center gap-2">
      <span className="text-[color:var(--color-accent)]">{greeting}</span>
      <span className="text-[color:var(--color-border)]">·</span>
      <span className="text-[color:var(--color-muted)] tabular-nums">
        {now ? formatTime(now) : "00:00:00"}
      </span>
    </span>
  );
}