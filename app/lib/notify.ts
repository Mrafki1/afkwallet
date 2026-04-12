/**
 * Generic alerting — posts to a Slack/Discord/generic webhook if configured.
 * Also emails admin via Resend if RESEND_API_KEY + ADMIN_EMAIL are set.
 *
 * Env vars (all optional — unset = no-op):
 *   ALERT_WEBHOOK_URL — Slack-compatible JSON webhook (Discord works too with ?wait=true)
 *   ADMIN_EMAIL       — email to send alerts to
 *   RESEND_API_KEY    — Resend API key
 *   EMAIL_FROM        — verified sender
 */

import { Resend } from "resend";

export type AlertPayload = {
  title:   string;
  summary: string;
  lines?:  string[];            // bullet points
  link?:   { label: string; url: string };
  level?:  "info" | "warn" | "error";
};

export async function sendAlert(payload: AlertPayload): Promise<void> {
  const { title, summary, lines = [], link, level = "warn" } = payload;

  await Promise.allSettled([
    postWebhook(title, summary, lines, link, level),
    sendEmail(title, summary, lines, link),
  ]);
}

async function postWebhook(
  title: string, summary: string, lines: string[],
  link: AlertPayload["link"], level: "info" | "warn" | "error"
): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;

  const emoji = level === "error" ? "🚨" : level === "warn" ? "⚠️" : "ℹ️";
  const body = {
    text: `${emoji} *${title}*\n${summary}${lines.length ? "\n• " + lines.slice(0, 20).join("\n• ") : ""}${link ? `\n<${link.url}|${link.label}>` : ""}`,
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    console.warn("[notify] webhook failed:", err instanceof Error ? err.message : err);
  }
}

async function sendEmail(
  title: string, summary: string, lines: string[], link: AlertPayload["link"]
): Promise<void> {
  const to      = process.env.ADMIN_EMAIL;
  const key     = process.env.RESEND_API_KEY;
  const from    = process.env.EMAIL_FROM;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (!to || !key || !from) return;

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,sans-serif;background:#f9fafb;padding:40px 16px;">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:24px 32px;">
      <p style="margin:0 0 4px;color:#dc2626;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">PointsBinder alert</p>
      <h1 style="margin:0 0 12px;font-size:18px;color:#0f172a;">${escapeHtml(title)}</h1>
      <p style="margin:0 0 16px;color:#374151;font-size:14px;">${escapeHtml(summary)}</p>
      ${lines.length ? `<ul style="margin:0 0 20px;padding-left:20px;color:#374151;font-size:13px;">${lines.map(l => `<li style="padding:2px 0;">${escapeHtml(l)}</li>`).join("")}</ul>` : ""}
      ${link ? `<p style="margin:0;"><a href="${link.url.startsWith("http") ? link.url : siteUrl + link.url}" style="color:#2563eb;font-weight:600;text-decoration:none;">${escapeHtml(link.label)} →</a></p>` : ""}
    </div>
  </body></html>`;

  try {
    const resend = new Resend(key);
    await resend.emails.send({ from, to, subject: `[PointsBinder] ${title}`, html });
  } catch (err) {
    console.warn("[notify] email failed:", err instanceof Error ? err.message : err);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch]!));
}
