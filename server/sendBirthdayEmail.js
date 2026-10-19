import nodemailer from "nodemailer";
import { YOUR_NAME } from "../src/config.js";
import { buildBirthdayEmail } from "./emailTemplate.js";

// Sends the trip-recap email through Gmail. Runs on the server only
// (the Vite dev/preview server locally, or /api on Vercel) so the app
// password never reaches the browser.
//
// Needs in .env (or the host's environment variables):
//   GMAIL_USER, GMAIL_APP_PASSWORD, and optionally EMAIL_COPY_TO (BCC).

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

// The endpoint is public, so keep it from being used to spam anyone:
// a few sends per recipient, and a small ceiling overall.
const sent = new Map(); // recipient → timestamps
const WINDOW_MS = 60 * 60 * 1000;
const PER_RECIPIENT = 3;
const GLOBAL_LIMIT = 20;

function allowed(to) {
  const now = Date.now();
  const recent = (list) => list.filter((t) => now - t < WINDOW_MS);
  const total = [...sent.values()].reduce((n, list) => n + recent(list).length, 0);
  const mine = recent(sent.get(to) ?? []);
  if (mine.length >= PER_RECIPIENT || total >= GLOBAL_LIMIT) return false;
  sent.set(to, [...mine, now]);
  return true;
}

let transport;
const getTransport = (env) =>
  (transport ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user: env.GMAIL_USER, pass: String(env.GMAIL_APP_PASSWORD).replace(/\s+/g, "") },
  }));

// body = { email, game, vault, finishedAt } → { status, json }
export async function handleBirthdayEmail(body, env = process.env) {
  const to = String(body?.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(to)) return { status: 400, json: { ok: false, error: "invalid-email" } };
  if (!env.GMAIL_USER || !env.GMAIL_APP_PASSWORD) return { status: 500, json: { ok: false, error: "email-not-configured" } };
  if (JSON.stringify(body).length > 20_000) return { status: 413, json: { ok: false, error: "too-large" } };
  if (!allowed(to)) return { status: 429, json: { ok: false, error: "rate-limited" } };

  const { subject, html, text } = buildBirthdayEmail(body);
  try {
    await getTransport(env).sendMail({
      from: { name: `${YOUR_NAME} · Birthday Airways`, address: env.GMAIL_USER },
      to,
      bcc: env.EMAIL_COPY_TO || undefined,
      subject,
      html,
      text,
    });
    return { status: 200, json: { ok: true } };
  } catch (err) {
    console.error("[birthday-email] send failed:", err.message);
    return { status: 502, json: { ok: false, error: "send-failed" } };
  }
}
