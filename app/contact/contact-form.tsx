"use client";

import { useState } from "react";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus({
          kind: "error",
          message:
            (body as { error?: string }).error ??
            `server returned ${res.status}`,
        });
        return;
      }
      setStatus({ kind: "ok" });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch {
      setStatus({
        kind: "error",
        message: "could not reach the server; please try again later",
      });
    }
  }

  if (status.kind === "ok") {
    return (
      <div className="border border-[color:var(--color-border)] rounded-lg p-6 bg-[color:var(--color-surface)]">
        <p className="text-[color:var(--color-accent)] font-mono text-sm">
          ✓ sent. i&apos;ll get back to you as soon as possible!
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-4 font-mono text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          ← send another
        </button>
      </div>
    );
  }

  const submitting = status.kind === "submitting";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 font-mono text-sm">
      <Field label="name" htmlFor="name">
        <input
          id="name"
          name="name"
          type="text"
          required
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          disabled={submitting}
        />
      </Field>

      <Field label="email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          required
          maxLength={200}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          disabled={submitting}
        />
      </Field>

      <Field label="subject" htmlFor="subject">
        <input
          id="subject"
          name="subject"
          type="text"
          maxLength={200}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
          disabled={submitting}
        />
      </Field>

      <Field label="message" htmlFor="message">
        <textarea
          id="message"
          name="message"
          required
          rows={8}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} resize-y min-h-32`}
          disabled={submitting}
        />
      </Field>

      {/* Honeypot: invisible to people and screen readers, but
          naive bots fill it in. The API fakes success for those. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="absolute -left-[9999px] h-px w-px opacity-0"
      />

      {status.kind === "error" && (
        <p className="text-red-400 text-xs">
          ✗ {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="self-start px-5 py-2.5 border border-[color:var(--color-accent)] text-[color:var(--color-accent)] rounded hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-bg)] transition-colors disabled:opacity-50"
      >
        {submitting ? "sending…" : "send →"}
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-xs text-[color:var(--color-muted)]">
        {"//"} {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "bg-[color:var(--color-surface)] border border-[color:var(--color-border)] rounded px-3 py-2 text-[color:var(--color-fg)] focus:border-[color:var(--color-accent)] focus:outline-none transition-colors font-serif text-base sm:text-sm disabled:opacity-50";