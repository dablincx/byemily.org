import "server-only";
import nodemailer from "nodemailer";
import { escapeHtml } from "@/lib/html";

/* Contact-form mail. Reply-To is the sender, so replying just works. */

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (cachedTransport) return cachedTransport;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "465");
  const secure = process.env.SMTP_SECURE !== "false"; // default true
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.CONTACT_TO;

  if (!host || !user || !pass || !to) {
    throw new Error(
      "SMTP env vars are not fully configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, CONTACT_TO (see .env.example)."
    );
  }

  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return cachedTransport;
}

export type ContactPayload = {
  name: string;
  email: string;
  subject?: string;
  message: string;
};

export async function sendContactMail(payload: ContactPayload): Promise<void> {
  const transport = getTransport();
  const to = process.env.CONTACT_TO!;
  const from = process.env.SMTP_USER!;

  const subjectLine = payload.subject?.trim()
    ? payload.subject.trim()
    : "(no subject)";

  const text = [
    `## Message from ${payload.name}: ${subjectLine}`,
    "",
    payload.message,
  ].join("\n");

  const html = `
    <h3 style="margin:1em 0 0.5em 0;font-size:1.3em;font-weight:600">
      Message from ${escapeHtml(payload.name)}: ${escapeHtml(subjectLine)}
    </h3>
    <hr/>
    <p>${escapeHtml(payload.message).replace(/\n/g, "<br/>")}</p>
  `;

  await transport.sendMail({
    from,
    to,
    replyTo: payload.email,
    subject: subjectLine,
    text,
    html,
  });
}