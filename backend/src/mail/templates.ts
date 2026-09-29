import type { MailMessage } from "./index.js";

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Simple, email-client-safe layout: tables and inline styles only. */
function layout(title: string, bodyHtml: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head>
<body style="margin:0;padding:0;background:#f1f2f6;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0b0d12">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f2f6;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#4f46e5;padding:22px 28px;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px">Housify</td></tr>
<tr><td style="padding:28px">${bodyHtml}</td></tr>
<tr><td style="padding:18px 28px;border-top:1px solid #e6e7ee;color:#5b6072;font-size:12px;line-height:1.5">
You're receiving this because of activity on your Housify account. If this wasn't you, you can ignore this email — your account is safe.
</td></tr>
</table></td></tr></table></body></html>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="border-radius:12px;background:#4f46e5">
<a href="${escape(href)}" style="display:inline-block;padding:14px 26px;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none">${escape(label)}</a>
</td></tr></table>`;
}

export function passwordResetEmail(opts: { to: string; name: string; link: string; minutes: number }): MailMessage {
  const first = opts.name.trim().split(/\s+/)[0] || "there";
  return {
    to: opts.to,
    subject: "Reset your Housify password",
    text: `Hi ${first},

Someone asked to reset the password for your Housify account. If it was you, open this link to choose a new password:

${opts.link}

The link works once and expires in ${opts.minutes} minutes.

If you didn't ask for this, ignore this email — your password won't change.

— Housify`,
    html: layout(
      "Reset your Housify password",
      `<h1 style="margin:0 0 12px;font-size:22px">Reset your password</h1>
<p style="margin:0 0 8px;font-size:15px;line-height:1.6">Hi ${escape(first)}, someone asked to reset the password for your Housify account. If it was you, choose a new one below.</p>
${button(opts.link, "Choose a new password")}
<p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#5b6072">This link works once and expires in <strong>${opts.minutes} minutes</strong>. If you didn't ask for this, ignore this email — your password won't change.</p>
<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#5b6072;word-break:break-all">Button not working? Paste this into your browser:<br>${escape(opts.link)}</p>`
    ),
  };
}

export function passwordChangedEmail(opts: { to: string; name: string; signInUrl: string }): MailMessage {
  const first = opts.name.trim().split(/\s+/)[0] || "there";
  return {
    to: opts.to,
    subject: "Your Housify password was changed",
    text: `Hi ${first},

The password for your Housify account was just changed, and you've been signed out on your other devices.

If this was you, there's nothing else to do. If it wasn't, reset your password straight away at ${opts.signInUrl} and contact the Housify team.

— Housify`,
    html: layout(
      "Your Housify password was changed",
      `<h1 style="margin:0 0 12px;font-size:22px">Your password was changed</h1>
<p style="margin:0 0 8px;font-size:15px;line-height:1.6">Hi ${escape(first)}, the password for your Housify account was just changed, and you've been signed out on your other devices.</p>
<p style="margin:0;font-size:15px;line-height:1.6">If this was you, there's nothing else to do. <strong>If it wasn't</strong>, reset your password straight away and contact the Housify team.</p>
${button(opts.signInUrl, "Go to Housify")}`
    ),
  };
}
