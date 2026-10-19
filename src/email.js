// Asks the server to send her the trip-recap email.
// The server (server/sendBirthdayEmail.js) holds the Gmail password and builds
// the template; this only hands over her email address and her answers.
export async function sendBirthdayEmail(player) {
  const res = await fetch("/api/send-birthday-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...player, finishedAt: new Date().toISOString() }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
}

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
