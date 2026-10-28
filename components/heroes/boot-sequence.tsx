"use client";

import { useEffect, useEffectEvent, useState } from "react";
import type { ReactNode } from "react";

/**
 * The boot animation: BIOS, GRUB, kernel log and login, drawn in
 * quick bursts with the username and password typed out. Takes at
 * most ~1.8s; past that, or on any key/tap, the rest is drawn at once.
 * Not animated after the first boot of a browser session, or for
 * visitors who prefer reduced motion.
 */

export type BootLine = { kind: "kernel" | "service"; text: string };

type Step =
  | { kind: "group"; lines: { text: string; cls: string }[] }
  | { kind: "type"; text: string; cls?: string }
  | { kind: "instant"; text: string; cls?: string; mode?: "newline" | "inline" }
  | { kind: "hold"; ms: number }
  // Kernel/userspace boundary, for the "Startup finished" timings.
  | { kind: "mark" }
  | { kind: "elapsed" };

/** One transcript row. Segments let a row mix colors (the "login: "
 *  prompt, then the typed username); `inline` rows are continued by
 *  the next entry instead of ending with a newline. */
export type Flushed = {
  segs: { text: string; cls: string }[];
  mode: "newline" | "inline";
};

type Props = {
  bootLines: BootLine[];
  /** Formatted on the server (`Tue Aug 19 13:34:13 2026`). */
  lastLoginText: string;
  /** Called with the finished transcript; `skipped` if it wasn't
   *  (fully) animated. */
  onDone: (transcript: Flushed[], skipped: boolean) => void;
};

const FG = "text-[color:var(--color-fg)]";
const MUTED = "text-[color:var(--color-muted)]";
const ACCENT = "text-[color:var(--color-accent)]";
const GRUB_CLS = "text-[color:var(--color-accent-soft)]";

function buildScript(bootLines: BootLine[], lastLoginText: string): Step[] {
  const steps: Step[] = [];

  steps.push({
    kind: "group",
    lines: [
      { text: "VIA Technologies, Inc. VT8237 BIOS v1.40", cls: MUTED },
      { text: "Copyright (C) 2003-2009 VIA Technologies, Inc.", cls: MUTED },
      { text: "", cls: FG },
      { text: "VIA C7 Esther 1.50GHz                    CPU ID: 6A9", cls: FG },
      { text: "Memory Testing : 2048M", cls: FG },
      { text: "Press DEL to enter SETUP", cls: ACCENT },
      { text: "Detecting IDE drives ...", cls: MUTED },
      { text: "", cls: FG },
    ],
  });
  steps.push({ kind: "hold", ms: 100 });

  steps.push({
    kind: "group",
    lines: [
      { text: "GNU GRUB  version 2.06", cls: GRUB_CLS },
      { text: " +--------------------------------------------------------------------------+", cls: MUTED },
      { text: " | > Arch Linux, with Linux linux                                           |", cls: FG },
      { text: " | Arch Linux, with Linux linux (recovery mode)                             |", cls: MUTED },
      { text: " +--------------------------------------------------------------------------+", cls: MUTED },
      { text: "      Use the ^ and v keys to select which entry is highlighted.", cls: GRUB_CLS },
      { text: "      Press enter to boot the selected OS, 'e' to edit the commands", cls: GRUB_CLS },
      { text: "      before booting or 'c' for a command line.", cls: GRUB_CLS },
      { text: "", cls: FG },
    ],
  });
  steps.push({ kind: "hold", ms: 90 });

  // Kernel log, then systemd units, three lines per burst.
  const pushInChunks = (lines: BootLine[]) => {
    for (let i = 0; i < lines.length; i += 3) {
      steps.push({
        kind: "group",
        lines: lines.slice(i, i + 3).map((l) => ({ text: l.text, cls: l.kind === "kernel" ? MUTED : FG })),
      });
      steps.push({ kind: "hold", ms: 50 });
    }
  };
  pushInChunks(bootLines.filter((l) => l.kind === "kernel"));
  steps.push({ kind: "mark" });
  pushInChunks(bootLines.filter((l) => l.kind === "service"));
  steps.push({ kind: "elapsed" });

  steps.push({ kind: "instant", text: "Arch Linux 6.12.31-arch1-1 (tty1)", cls: FG });
  steps.push({ kind: "instant", text: "", cls: FG });
  steps.push({ kind: "hold", ms: 80 });
  steps.push({ kind: "instant", text: "byemily.org login: ", cls: ACCENT, mode: "inline" });
  steps.push({ kind: "type", text: "emily", cls: FG });
  steps.push({ kind: "hold", ms: 80 });
  steps.push({ kind: "instant", text: "Password: ", cls: ACCENT, mode: "inline" });
  steps.push({ kind: "type", text: "********", cls: FG });
  steps.push({ kind: "hold", ms: 80 });
  steps.push({ kind: "instant", text: `Last login: ${lastLoginText} from 127.0.0.1`, cls: MUTED });
  steps.push({ kind: "instant", text: "", cls: FG });
  steps.push({ kind: "instant", text: '// run "help" for a list of available commands', cls: MUTED });
  steps.push({ kind: "instant", text: "", cls: FG });
  steps.push({ kind: "hold", ms: 40 });
  return steps;
}

const DMESG_TIME_RE = /^\[\s*(\d+)\.(\d{6})\]/;

/** Fresh numbers on every boot. Timestamps keep the original spacing
 *  (±40%, zeros stay zero); benchmark figures get a small jitter. */
function withFreshNumbers(lines: BootLine[]): BootLine[] {
  let prevOrig = 0;
  let t = 0;
  return lines.map((l) => {
    let text = l.text
      .replace(/(\d+) MiB\/s/, (_, n) => `${Math.round(Number(n) * (0.9 + Math.random() * 0.2))} MiB/s`)
      .replace(/\((\d+\.\d+) BogoMIPS\)/, (_, n) =>
        `(${(Number(n) * (0.997 + Math.random() * 0.006)).toFixed(2)} BogoMIPS)`);
    const m = text.match(DMESG_TIME_RE);
    if (m) {
      const orig = Number(`${m[1]}.${m[2]}`);
      if (orig > 0) t += (orig - prevOrig) * (0.6 + Math.random()) + Math.random() * 0.002;
      prevOrig = orig;
      const secs = String(Math.floor(t)).padStart(5);
      const micros = String(Math.floor((t % 1) * 1e6)).padStart(6, "0");
      text = `[${secs}.${micros}]` + text.slice(m[0].length);
    }
    return { ...l, text };
  });
}

/** Also used by the hero to keep the transcript above the terminal. */
export function renderTranscript(lines: Flushed[]): ReactNode[] {
  return lines.map((line, i) => {
    const trail = line.mode === "inline" ? "" : "\n";
    if (line.segs.every((s) => s.text === "")) {
      return trail ? <span key={i}>{trail}</span> : null;
    }
    return (
      <span key={i}>
        {line.segs.map((seg, j) => (
          <span key={j} className={seg.cls}>
            {seg.text}
          </span>
        ))}
        {trail}
      </span>
    );
  });
}

const TOTAL_BUDGET_MS = 1800;
const TYPE_INTERVAL_MS = 22;
const BOOTED_KEY = "byemily:booted";

// sessionStorage can throw (blocked storage); then the boot just plays.
function hasBootedThisSession(): boolean {
  try {
    return sessionStorage.getItem(BOOTED_KEY) === "1";
  } catch {
    return false;
  }
}

function markBootedThisSession(): void {
  try {
    sessionStorage.setItem(BOOTED_KEY, "1");
  } catch {}
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function BootSequence({ bootLines, lastLoginText, onDone }: Props) {
  const [lines, setLines] = useState<Flushed[]>([]);
  const [typed, setTyped] = useState<{ text: string; cls: string } | null>(null);

  const finish = useEffectEvent(onDone);

  useEffect(() => {
    let cancelled = false;
    const script = buildScript(withFreshNumbers(bootLines), lastLoginText);
    const startedAt = performance.now();
    const instant = hasBootedThisSession() || prefersReducedMotion();
    let skipped = instant;
    let wake: (() => void) | null = null;
    const skip = () => {
      skipped = true;
      wake?.();
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    const fastForward = () => skipped || performance.now() - startedAt >= TOTAL_BUDGET_MS;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        if (fastForward()) return resolve();
        const remaining = TOTAL_BUDGET_MS - (performance.now() - startedAt);
        const timer = setTimeout(resolve, Math.min(ms, remaining));
        wake = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    let kernelEndAt: number | null = null;
    // Mirrors `lines` without waiting for a render.
    const local: Flushed[] = [];

    const pushFlushed = (entry: Flushed) => {
      const last = local[local.length - 1];
      if (last && last.mode === "inline") {
        local[local.length - 1] = { segs: [...last.segs, ...entry.segs], mode: entry.mode };
      } else {
        local.push(entry);
      }
    };

    const run = async () => {
      for (const step of script) {
        if (cancelled) return;

        if (step.kind === "group") {
          for (const line of step.lines) {
            local.push({ segs: [{ text: line.text, cls: line.cls }], mode: "newline" });
          }
        } else if (step.kind === "instant") {
          pushFlushed({ segs: [{ text: step.text, cls: step.cls ?? FG }], mode: step.mode ?? "newline" });
        } else if (step.kind === "type") {
          const cls = step.cls ?? FG;
          for (let i = 1; i <= step.text.length && !fastForward(); i++) {
            setTyped({ text: step.text.slice(0, i), cls });
            await wait(TYPE_INTERVAL_MS);
            if (cancelled) return;
          }
          setTyped(null);
          pushFlushed({ segs: [{ text: step.text, cls }], mode: "newline" });
        } else if (step.kind === "hold") {
          await wait(step.ms);
        } else if (step.kind === "mark") {
          kernelEndAt = performance.now();
        } else if (step.kind === "elapsed") {
          const now = performance.now();
          const endAt = kernelEndAt ?? startedAt;
          const fmt = (ms: number) => (Math.max(0, ms) / 1000).toFixed(3);
          pushFlushed({
            segs: [{
              text: `systemd[1]: Startup finished in ${fmt(endAt - startedAt)}s (kernel) + ${fmt(now - endAt)}s (userspace) = ${fmt(now - startedAt)}s.`,
              cls: FG,
            }],
            mode: "newline",
          });
        }
        if (!fastForward()) setLines([...local]);
      }
      if (cancelled) return;
      markBootedThisSession();
      finish(local, skipped);
    };

    void run();
    return () => {
      cancelled = true;
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [bootLines, lastLoginText]);

  const rendered = renderTranscript(lines);
  if (typed) {
    rendered.push(
      <span key="typing" className={typed.cls}>
        {typed.text}
      </span>,
    );
  }

  return <>{rendered}</>;
}