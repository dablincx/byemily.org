"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildContactHelp,
  contactScriptArgs,
  parseContactArgs,
  runCommand,
  tokenize,
} from "@/components/heroes/terminal/terminal-commands";
import { completeInput } from "@/components/heroes/terminal/terminal-completion";
import type { Fs } from "@/components/heroes/terminal/terminal-fs";
import {
  Prompt,
  HistoryLine,
  type Line,
} from "@/components/heroes/terminal/terminal-render";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Shell emulator over a server-built snapshot of the site. Commands,
 * completion and rendering live in `./terminal/*`.
 *
 * The input is an uncontrolled contenteditable span: React never
 * renders inside it, so re-renders can't move the caret. Read it with
 * `readInput`, replace it with `writeInput`.
 */
export function InteractiveTerminal({
  fs,
  autoCommands,
  instant = false,
  children,
}: {
  fs: Fs;
  /** Commands to type out and submit on mount, one character at a
   *  time, as if the visitor typed them. */
  autoCommands?: string[];
  /** Run `autoCommands` without the typing animation. */
  instant?: boolean;
  /** Rendered above the history (the boot transcript). */
  children?: React.ReactNode;
}) {
  const [history, setHistory] = useState<Line[]>([]);
  const [cwd, setCwd] = useState("~");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState(-1);

  const inputRef = useRef<HTMLSpanElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);
  const sendingRef = useRef(false);
  const router = useRouter();

  function readInput(): string {
    return inputRef.current?.textContent ?? "";
  }

  function writeInput(text: string) {
    if (inputRef.current) setInputText(inputRef.current, text);
  }

  function commit(cmd: string, lines: Line[]) {
    setHistory((h) => [...h, { kind: "cmd", cwd, text: cmd }, ...lines]);
    if (cmd.trim()) setCmdHistory((h) => [...h, cmd]);
    setCmdHistoryIdx(-1);
  }

  function runContact(cmd: string, args: string[]) {
    const { parsed, missing, unknownFlags } = parseContactArgs(args);
    if (missing.length > 0 || unknownFlags.length > 0) {
      return commit(cmd, buildContactHelp(missing, unknownFlags));
    }
    const { name = "", email = "", subject = "", message = "" } = parsed;
    if (!EMAIL_RE.test(email)) {
      return commit(cmd, [{ kind: "err", text: `contact.sh: --email looks invalid: ${email}` }]);
    }
    if (!name.trim() || !message.trim()) {
      return commit(cmd, [
        { kind: "err", text: "contact.sh: --name and --message must not be empty" },
      ]);
    }
    if (sendingRef.current) {
      return commit(cmd, [
        { kind: "err", text: "contact.sh: still sending the previous message, hang on" },
      ]);
    }

    sendingRef.current = true;
    commit(cmd, [{ kind: "out", text: "[contact.sh] sending..." }]);
    void postContact({ name, email, subject, message })
      .then((line) => setHistory((h) => [...h, line]))
      .finally(() => {
        sendingRef.current = false;
      });
  }

  function submit(cmd: string) {
    const parsed = tokenize(cmd);
    const contactArgs = "tokens" in parsed ? contactScriptArgs(parsed.tokens, cwd) : null;
    if (contactArgs) return runContact(cmd, contactArgs);

    const result = runCommand(cmd, cwd, fs, cmdHistory);
    if (result.clear) {
      setHistory([]);
      if (cmd.trim()) setCmdHistory((h) => [...h, cmd]);
      setCmdHistoryIdx(-1);
      return;
    }
    commit(cmd, result.lines);
    if (result.newCwd) setCwd(result.newCwd);
    if (result.navigate) router.push(result.navigate);
  }
  const submitAuto = useEffectEvent(submit);

  function recallHistory(idx: number) {
    setCmdHistoryIdx(idx);
    writeInput(idx < 0 ? "" : cmdHistory[idx]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLSpanElement>) {
    if (e.ctrlKey && !e.altKey && !e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === "l") {
        e.preventDefault();
        setHistory([]);
      } else if (key === "c" && !window.getSelection()?.toString()) {
        // Cancel the line (with a selection, ctrl+c still copies).
        e.preventDefault();
        const text = `${readInput()}^C`;
        setHistory((h) => [...h, { kind: "cmd", cwd, text }]);
        writeInput("");
        setCmdHistoryIdx(-1);
      } else if (key === "u") {
        e.preventDefault();
        writeInput("");
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = readInput();
      writeInput("");
      submit(cmd);
    } else if (e.key === "Tab") {
      e.preventDefault();
      const input = readInput();
      const result = completeInput(input, caretOffset(inputRef.current), cwd, fs);
      if (!result) return;
      if (result.complete !== input) {
        writeInput(result.complete);
      } else if (result.options.length > 0) {
        // Ambiguous: list the options under the current line, like bash.
        setHistory((h) => [
          ...h,
          { kind: "cmd", cwd, text: input },
          ...result.options.map((text): Line => ({ kind: "out", text })),
        ]);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length === 0) return;
      recallHistory(cmdHistoryIdx < 0 ? cmdHistory.length - 1 : Math.max(0, cmdHistoryIdx - 1));
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cmdHistoryIdx < 0) return;
      recallHistory(cmdHistoryIdx + 1 >= cmdHistory.length ? -1 : cmdHistoryIdx + 1);
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLSpanElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\r?\n/g, " ");
    if (text) document.execCommand("insertText", false, text);
  }

  useEffect(() => {
    if (!autoCommands?.length) return;
    let cancelled = false;
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, instant ? 0 : ms));
    void (async () => {
      for (const cmd of autoCommands) {
        for (let i = instant ? cmd.length : 1; i <= cmd.length; i++) {
          if (cancelled) return;
          if (inputRef.current) setInputText(inputRef.current, cmd.slice(0, i));
          await sleep(28);
        }
        if (cancelled) return;
        if (inputRef.current) setInputText(inputRef.current, "");
        submitAuto(cmd);
        await sleep(90);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoCommands, instant]);

  // Clicking anywhere that isn't a control focuses the input. `click`,
  // not `pointerdown`: on touch screens it only fires for taps, so
  // starting a scroll doesn't pop up the keyboard. Autofocus on load
  // only with a mouse/trackpad, for the same reason.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) inputRef.current?.focus();

    const onClick = (e: MouseEvent) => {
      const input = inputRef.current;
      const target = e.target as HTMLElement | null;
      if (!input || !target || input.contains(target)) return;
      if (target.closest("a, button, input, textarea, select, [role='button']")) return;
      // Don't steal a text selection the visitor just made.
      if (window.getSelection()?.toString()) return;
      input.focus();
      placeCaretAtEnd(input);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Stay pinned to new output unless the visitor scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  });

  return (
    <div className="flex flex-col flex-1 min-h-0 font-mono text-[0.7rem] sm:text-xs leading-tight">
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain cursor-text">
        <pre className="whitespace-pre-wrap break-words">
          {children}
          <span role="log" aria-live="polite">
            {history.map((l, i) => (
              <HistoryLine key={i} line={l} onRun={submit} />
            ))}
          </span>
          {/* The live input row is the last line of the scrollback,
              like a real terminal. The prompt is a separate
              non-editable span so the caret can never land in it. */}
          <div className="flex items-baseline">
            <span contentEditable={false} className="select-text">
              <Prompt cwd={cwd} />
            </span>
            <span
              ref={inputRef}
              contentEditable
              suppressContentEditableWarning
              onKeyDown={onKeyDown}
              onPaste={onPaste}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              role="textbox"
              aria-multiline="false"
              aria-label="shell input"
              className="flex-1 min-w-0 outline-none terminal-input-editable"
            />
          </div>
        </pre>
      </div>
    </div>
  );
}

/** Replace the input text and, if the input has focus, put the caret
 *  at its end. (Placing a selection inside a contenteditable also
 *  focuses it, which would pop up the on-screen keyboard on touch
 *  devices during the auto-typed commands.) */
function setInputText(el: HTMLElement, text: string) {
  el.textContent = text;
  if (document.activeElement === el) placeCaretAtEnd(el);
}

function placeCaretAtEnd(el: HTMLElement) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** Caret position as a character offset into `el`'s text. */
function caretOffset(el: HTMLElement | null): number {
  const sel = window.getSelection();
  if (!el || !sel || sel.rangeCount === 0) return 0;
  const range = sel.getRangeAt(0);
  const pre = document.createRange();
  pre.setStart(el, 0);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

async function postContact(fields: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<Line> {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(fields),
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (res.ok && json.ok) return { kind: "out", text: "[contact.sh] sent." };
    return { kind: "err", text: `[contact.sh] failed: ${json.error ?? res.statusText}` };
  } catch (e) {
    return { kind: "err", text: `[contact.sh] network error: ${(e as Error).message}` };
  }
}
