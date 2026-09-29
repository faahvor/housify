import { env } from "../config/env.js";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Outgoing email. Pick the driver with MAIL_DRIVER in backend/.env:
 *  - "console" (default): prints the email to the backend terminal — for local testing
 *  - "resend": sends through Resend (needs RESEND_API_KEY and MAIL_FROM)
 *  - "memory": keeps emails in `outbox` — used by the automated tests
 */
export interface Mailer {
  readonly name: "console" | "resend" | "memory";
  send(msg: MailMessage): Promise<void>;
}

/** Emails captured by the "memory" driver (tests only). */
export const outbox: MailMessage[] = [];

class ConsoleMailer implements Mailer {
  readonly name = "console" as const;
  async send(msg: MailMessage) {
    const bar = "─".repeat(64);
    console.log(`\n${bar}\n📧 EMAIL (not sent — MAIL_DRIVER=console)\nTo: ${msg.to}\nSubject: ${msg.subject}\n\n${msg.text}\n${bar}\n`);
  }
}

class MemoryMailer implements Mailer {
  readonly name = "memory" as const;
  async send(msg: MailMessage) {
    outbox.push(msg);
  }
}

class ResendMailer implements Mailer {
  readonly name = "resend" as const;
  constructor(
    private readonly apiKey: string,
    private readonly from: string
  ) {}

  async send(msg: MailMessage) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [msg.to], subject: msg.subject, html: msg.html, text: msg.text }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Resend rejected the email (HTTP ${res.status}): ${detail.slice(0, 300)}`);
    }
  }
}

export const mailer: Mailer =
  env.mail.driver === "resend"
    ? new ResendMailer(env.mail.resendApiKey, env.mail.from)
    : env.mail.driver === "memory"
      ? new MemoryMailer()
      : new ConsoleMailer();

/** Fire-and-forget send: a mail outage must never break the request, and callers
 * must not take measurably longer when an email is sent (no account probing). */
export function sendInBackground(msg: MailMessage, log: (err: unknown) => void) {
  setImmediate(() => {
    mailer.send(msg).catch(log);
  });
}
