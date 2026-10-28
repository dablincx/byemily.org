"use client";

import { useState } from "react";
import { InteractiveTerminal } from "@/components/heroes/interactive-terminal";
import {
  BootSequence,
  renderTranscript,
  type BootLine,
  type Flushed,
} from "@/components/heroes/boot-sequence";
import type { Fs } from "@/components/heroes/terminal/terminal-fs";
import { RecordLastLogin } from "@/components/record-last-login";

/** Plays the boot, then swaps in the live terminal with the finished
 *  transcript kept above it, so it reads as one session. */
export function BootHeroClient({
  bootLines,
  fs,
  lastLoginText,
}: {
  bootLines: BootLine[];
  fs: Fs;
  lastLoginText: string;
}) {
  const [boot, setBoot] = useState<{ transcript: Flushed[]; skipped: boolean } | null>(null);

  return (
    <section className="flex flex-col flex-1 min-h-0 p-6 max-w-3xl mx-auto w-full cursor-text">
      {boot ? (
        <InteractiveTerminal fs={fs} autoCommands={AUTO_COMMANDS} instant={boot.skipped}>
          {renderTranscript(boot.transcript)}
        </InteractiveTerminal>
      ) : (
        // Same shape as InteractiveTerminal, so nothing jumps on the swap.
        <div className="flex flex-col flex-1 min-h-0 font-mono text-[0.7rem] sm:text-xs leading-tight">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-words">
              <BootSequence
                bootLines={bootLines}
                lastLoginText={lastLoginText}
                onDone={(transcript, skipped) => setBoot({ transcript, skipped })}
              />
            </pre>
          </div>
        </div>
      )}
      <RecordLastLogin />
    </section>
  );
}

// Module-level: a stable array, so the commands only run once.
const AUTO_COMMANDS = ["whoami", "ls"];
