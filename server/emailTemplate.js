import { BIRTHDAY_MESSAGE, BOARDING_PASS, HER_NAME, LETTER_SIGNATURE, MEMORY_VAULT, YOUR_NAME } from "../src/config.js";

// The birthday "trip recap" email: a keepsake of her whole trip through the
// surprise. A boarding-pass header, one numbered stop per memory card
// (built from what she actually answered) and the letter at the end.
//
// Email clients ignore most modern CSS, so this is table layout with inline
// styles only. Everything she typed is escaped before it goes in.

const C = {
  night: "#120a19",
  plum: "#1b0f24",
  plumLight: "#2a1838",
  gold: "#f7d070",
  goldSoft: "#fde68a",
  blush: "#ffa8c5",
  blushSoft: "#ffe4ec",
  lilac: "#d8b4fe",
  lilacSoft: "#e9d5ff",
  muted: "#b9a3c9",
};
const SCRIPT = "'Dancing Script','Brush Script MT','Segoe Script',Georgia,cursive";
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "'Quicksand','Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'Courier New',Courier,monospace";

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const lines = (value) => esc(value).replace(/\n/g, "<br>");

const formatDate = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
};

/* ── Small building blocks ── */

const label = (text, color = C.gold) =>
  `<div style="font-family:${SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${color};font-weight:700;">${text}</div>`;

const passField = (name, value) => `
  <td valign="top" style="padding:10px 12px;">
    ${label(name, C.muted)}
    <div style="font-family:${SANS};font-size:15px;font-weight:700;color:${C.blushSoft};padding-top:4px;">${value}</div>
  </td>`;

// One trip stop: a dashed, numbered box for one memory card.
const stamp = (number, icon, title, body) => `
  <tr><td style="padding:0 0 18px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed ${C.gold};border-radius:18px;background:${C.plum};">
      <tr><td style="padding:18px 20px 6px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="52" valign="middle" style="font-size:30px;line-height:1;">${icon}</td>
          <td valign="middle">
            ${label(`Stop ${String(number).padStart(2, "0")}`, C.blush)}
            <div style="font-family:${SERIF};font-size:19px;font-style:italic;color:${C.goldSoft};padding-top:3px;">${esc(title)}</div>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:8px 20px 20px;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.blushSoft};">${body}</td></tr>
    </table>
  </td></tr>`;

const big = (text, color = C.goldSoft) =>
  `<div style="font-family:${SERIF};font-size:26px;font-weight:700;color:${color};padding:4px 0;">${text}</div>`;
const note = (text) => `<div style="font-size:13px;font-style:italic;color:${C.muted};padding-top:6px;">${text}</div>`;
const quote = (text) =>
  `<div style="border-left:3px solid ${C.blush};padding:4px 0 4px 12px;margin:6px 0;color:${C.blushSoft};">${lines(text)}</div>`;

/* ── What each kind of answer looks like inside a stamp ── */

function renderAnswer(a, step, all) {
  const value = a.answer;
  switch (a.type) {
    case "choice": {
      // Not her raw button label: the final pick becomes an official verdict,
      // and an earlier playful "No" gets a dry, court-style note.
      const choices = all.filter((x) => x.type === "choice");
      if (a !== choices.at(-1)) return "";
      const saidNo = choices.some((x) => x.pushback);
      return `${label(esc(step?.emailLabel ?? "Verdict"), C.muted)}${big("Approved ✓", C.blush)}${note(
        saidNo ? "Ek “No” file hua tha. Objection overruled." : "Pehli hi baar mein approve. Smart decision.",
      )}`;
    }
    case "date":
      return `${label("Scheduled for", C.muted)}${big(esc(formatDate(String(value))))}${note("Ab ye plan “kabhi” nahi raha — ek date hai.")}`;
    case "quiz": {
      const total = step?.rounds?.length ?? 0;
      const score = Number(value) || 0;
      const stars = total ? "★".repeat(score) + "☆".repeat(Math.max(0, total - score)) : "";
      return `${label("Bollywood IQ", C.muted)}${big(`${score}/${total} <span style="color:${C.gold};letter-spacing:4px;">${stars}</span>`)}${note(
        score === total
          ? "Perfect score. Ye knowledge nahi, research hai."
          : score >= total / 2
            ? "Strong performance. Thoda revision aur, phir unbeatable."
            : "Score low, screen presence high. Main character energy bhi count hoti hai.",
      )}`;
    }
    case "sundae": {
      const v = value && typeof value === "object" ? value : {};
      const row = (k, val) =>
        `<tr><td style="font-family:${MONO};font-size:13px;color:${C.muted};padding:3px 0;" width="90">${k}</td><td style="font-family:${MONO};font-size:13px;color:${C.blushSoft};padding:3px 0;">${esc(val)}</td></tr>`;
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.plumLight};border-radius:12px;">
          <tr><td style="padding:14px 16px;">
            <div style="font-family:${MONO};font-size:12px;letter-spacing:2px;color:${C.gold};text-align:center;">— THE ${esc(HER_NAME.toUpperCase())} SPECIAL —</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
              ${row("Scoops", v.flavors)}${row("Toppings", v.toppings)}${row("Drizzle", v.sauce)}
            </table>
            <div style="font-family:${MONO};font-size:12px;color:${C.muted};text-align:center;border-top:1px dashed ${C.muted};margin-top:10px;padding-top:8px;">Total: ₹0 · Paid by birthday privilege 👑</div>
          </td></tr>
        </table>`;
    }
    case "stars":
      return `${label("Officially named", C.muted)}${big(`✦ ${esc(value)} ✦`, C.lilacSoft)}${note(esc(step?.caption ?? "Aasmaan mein ek constellation ab tumhare naam ka bhi hai."))}`;
    case "wheel": {
      const prize = step?.prizes?.find((p) => p.label === value);
      return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px dashed ${C.blush};border-radius:12px;background:${C.plumLight};">
          <tr><td align="center" style="padding:16px;">
            ${label("🎟️ Birthday Coupon", C.gold)}
            <div style="font-size:30px;padding-top:6px;">${prize?.emoji ?? "🎁"}</div>
            <div style="font-family:${SERIF};font-size:18px;font-weight:700;color:${C.blushSoft};padding-top:4px;">${esc(value)}</div>
            <div style="font-size:12px;color:${C.muted};padding-top:6px;">Validity: hamesha · Non-transferable · Redeem with ${esc(YOUR_NAME)}</div>
          </td></tr>
        </table>`;
    }
    case "rating": {
      const v = value && typeof value === "object" ? value : { rating: value };
      return `${note(esc(a.question))}${big(`${esc(v.rating)}/${esc(step?.max ?? 10)}`)}${v.comment ? quote(v.comment) : ""}`;
    }
    default: {
      // text, select, colors, cards, rapidfire… and anything added later.
      const text = typeof value === "object" ? Object.values(value ?? {}).join(" · ") : value;
      return text ? `${note(esc(a.question))}${quote(text)}` : "";
    }
  }
}

function stampsHtml(vault) {
  return MEMORY_VAULT.cards
    .map((card, i) => {
      const answers = Array.isArray(vault?.[i]) ? vault[i] : [];
      if (!answers.length) return "";
      const stepOf = (type) => card.steps.find((s) => s.type === type);
      const body = answers.map((a) => renderAnswer(a, stepOf(a.type), answers)).filter(Boolean).join(`<div style="height:10px;"></div>`);
      return body ? stamp(i + 1, card.icon, card.title, body) : "";
    })
    .filter(Boolean)
    .join("");
}

/* ── The whole email ── */

export function buildBirthdayEmail({ game, vault, finishedAt }) {
  const when = new Date(finishedAt ?? Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const seconds = Number(game?.seconds);
  const gameLine =
    game?.mode === "trivia"
      ? `${esc(game?.wins ?? 3)} sawaalon ke sahi jawab diye`
      : `${esc(game?.wins ?? 3)} glowing cheezein pakdi${Number.isFinite(seconds) && seconds > 0 ? ` ${Math.round(seconds)} seconds mein` : ""}`;

  const subject = `Happy Birthday, ${HER_NAME} 🎂 | Flight BDAY-01 trip recap`;

  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Quicksand:wght@500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${C.night};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Game, quiz, sundae aur coupon — poore trip ka chhota sa recap.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.night}" style="background:${C.night};background-image:radial-gradient(circle at 20% 0%,#3b1d4f 0%,${C.night} 55%);">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">

  <!-- Sky + heading -->
  <tr><td align="center" style="padding:10px 0 4px;font-size:14px;letter-spacing:10px;color:${C.goldSoft};">✦ · ✧ · ✦</td></tr>
  <tr><td align="center" style="padding:4px 0;">${label(`${esc(BOARDING_PASS.airline)} · Flight ${esc(BOARDING_PASS.flight)}`)}</td></tr>
  <tr><td align="center" style="padding:10px 10px 0;font-family:${SCRIPT};font-size:46px;line-height:1.15;color:${C.blush};">Happy Birthday,<br>${esc(HER_NAME)}! 🎂</td></tr>
  <tr><td align="center" style="padding:12px 24px 26px;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.lilacSoft};">
    Flight BDAY-01 safely land ho gayi. Ye raha trip ka quick recap — scores, orders aur ek coupon jo abhi bhi valid hai. ✨
  </td></tr>

  <!-- Boarding pass -->
  <tr><td style="padding:0 0 26px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.blushSoft};border-radius:18px;">
      <tr><td style="padding:14px 18px;background:${C.gold};border-radius:18px 18px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-family:${SANS};font-size:13px;font-weight:700;letter-spacing:3px;color:${C.plum};">✈ BOARDING PASS</td>
          <td align="right" style="font-family:${SANS};font-size:12px;font-weight:700;letter-spacing:2px;color:${C.plum};">${esc(when.toUpperCase())}</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:8px 6px;background:${C.plum};">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>${passField("Passenger", esc(HER_NAME.toUpperCase()))}${passField("Seat", "1A · Window")}</tr>
          <tr>${passField("Gate", esc(BOARDING_PASS.gate))}${passField("Status", `<span style="color:${C.gold};">LANDED ✓</span>`)}</tr>
        </table>
      </td></tr>
      <tr><td style="padding:12px 18px;background:${C.plumLight};border-top:2px dashed ${C.muted};border-radius:0 0 18px 18px;font-family:${SANS};font-size:13px;color:${C.lilacSoft};">
        🎮 Check-in: ${gameLine}. Boarding approved 👑
      </td></tr>
    </table>
  </td></tr>

  <!-- Stamps -->
  <tr><td align="center" style="padding:0 0 14px;">${label("Trip highlights", C.blush)}
    <div style="font-family:${SERIF};font-size:22px;font-style:italic;color:${C.goldSoft};padding-top:6px;">${esc(MEMORY_VAULT.title)}</div>
  </td></tr>
  <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stampsHtml(vault)}</table></td></tr>

  <!-- Letter -->
  <tr><td style="padding:10px 0 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.blushSoft};border-radius:18px;">
      <tr><td style="padding:28px 26px;">
        <div style="font-family:${SCRIPT};font-size:28px;color:#8a2c55;padding-bottom:10px;">Ek chhota sa letter…</div>
        <div style="font-family:${SERIF};font-size:16px;line-height:1.75;color:#3a1f33;">${lines(BIRTHDAY_MESSAGE)}</div>
        <div style="font-family:${SCRIPT};font-size:26px;color:#8a2c55;text-align:right;padding-top:16px;">${esc(LETTER_SIGNATURE)}</div>
      </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding:26px 20px 8px;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.muted};">
    ${esc(BOARDING_PASS.airline)} · ${esc(BOARDING_PASS.flight)} · Landed safely<br>Next destination: ab tak ka best saal.
  </td></tr>
  <tr><td align="center" style="padding:6px 0 0;font-size:14px;letter-spacing:10px;color:${C.goldSoft};">✦ · ✧ · ✦</td></tr>

</table>
</td></tr></table>
</body></html>`;

  const text = [
    `Happy Birthday, ${HER_NAME}! 🎂`,
    "",
    `Check-in: ${gameLine.replace(/<[^>]+>/g, "")}.`,
    "",
    ...MEMORY_VAULT.cards.flatMap((card, i) =>
      (Array.isArray(vault?.[i]) ? vault[i] : []).length
        ? [`${card.icon} ${card.title}`, ...vault[i].map((a) => `  - ${a.question}: ${typeof a.answer === "object" ? Object.values(a.answer ?? {}).join(", ") : a.answer}`), ""]
        : [],
    ),
    BIRTHDAY_MESSAGE,
    "",
    LETTER_SIGNATURE,
  ].join("\n");

  return { subject, html, text };
}
