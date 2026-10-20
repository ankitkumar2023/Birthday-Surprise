import { handleBirthdayEmail } from "../server/sendBirthdayEmail.js";

// Vercel serverless function: POST /api/send-birthday-email
// Set GMAIL_USER, GMAIL_APP_PASSWORD, EMAIL_COPY_TO and EMAIL_TO in the Vercel project's
// Environment Variables (the local .env file is not uploaded).
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body;
  const { status, json } = await handleBirthdayEmail(body);
  res.status(status).json(json);
}
