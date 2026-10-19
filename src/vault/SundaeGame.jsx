import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { fill, GlowButton, pill } from "./GameReplies";
import { playSound } from "./sounds";
import { useTimeout } from "./hooks";

// Step type "sundae": she builds her birthday sundae — scoops, then toppings,
// then a sauce — and watches it stack up in the glass. Items marked
// `special` (her favourites) trigger `specialLine`; `reaction` pops a toast.
export default function SundaeReply({ step, onAnswer }) {
  const maxScoops = step.scoops ?? 2;
  const maxToppings = step.maxToppings ?? 3;
  const [stage, setStage] = useState("flavors"); // flavors → toppings → sauce → ready
  const [scoops, setScoops] = useState([]);
  const [toppings, setToppings] = useState([]);
  const [sauce, setSauce] = useState(null);
  const [toast, setToast] = useState(null);
  const later = useTimeout();

  const react = (item) => {
    if (!item.reaction) return;
    setToast(item.reaction);
    later(() => setToast(null), 1800);
  };

  const addScoop = (flavor) => {
    if (scoops.length >= maxScoops) return;
    playSound("click");
    react(flavor);
    const next = [...scoops, flavor];
    setScoops(next);
    if (next.length === maxScoops) later(() => setStage("toppings"), 700);
  };

  const toggleTopping = (topping) => {
    playSound("click");
    if (toppings.includes(topping)) return setToppings(toppings.filter((t) => t !== topping));
    if (toppings.length >= maxToppings) return;
    react(topping);
    setToppings([...toppings, topping]);
  };

  const pickSauce = (s) => {
    playSound("sparkle");
    react(s);
    setSauce(s);
    later(() => setStage("ready"), 900);
  };

  const order = () => {
    playSound("click");
    const list = (items) => (items.length > 1 ? `${items.slice(0, -1).join(", ")} aur ${items.at(-1)}` : (items[0] ?? "kuch nahi"));
    const vars = { flavors: list(scoops.map((s) => s.name)), toppings: list(toppings.map((t) => t.name)), sauce: sauce.name };
    const lines = step.result.map((line) => fill(line, vars));
    const special = [...scoops, ...toppings, sauce].some((item) => item.special);
    const extra = special ? step.specialLine : step.noSpecialLine;
    if (extra) lines.splice(lines.length - 1, 0, extra);
    onAnswer({
      text: `🍨 ${scoops.map((s) => s.name).join(" + ")} · ${toppings.map((t) => t.emoji).join("")} · ${sauce.name}`,
      value: vars,
      followUp: lines,
    });
  };

  const stageTitle = {
    flavors: `Scoops chuno (${scoops.length}/${maxScoops}) 🍦`,
    toppings: `Toppings daalo (max ${maxToppings}) ✨`,
    sauce: "Ab sauce ki drizzle 🍯",
    ready: step.readyTitle ?? "Tumhara sundae ready hai! 🎉",
  }[stage];

  return (
    <div className="flex flex-col gap-4">
      <SundaeArt scoops={scoops} toppings={toppings} sauce={sauce} ready={stage === "ready"} />

      <div className="relative text-center">
        <p className="text-sm font-semibold text-gold-200">{stageTitle}</p>
        <AnimatePresence>
          {toast && (
            <motion.span
              key={toast}
              className="absolute inset-x-0 -top-9 mx-auto w-fit rounded-full bg-blush-300 px-3 py-1 text-xs font-bold text-plum-950 shadow-[0_0_20px_rgba(255,133,173,0.6)]"
              initial={{ opacity: 0, y: 8, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
            >
              {toast}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {stage === "flavors" && (
            <div className="grid grid-cols-3 gap-2">
              {step.flavors.map((f) => (
                <motion.button
                  key={f.name}
                  type="button"
                  onClick={() => addScoop(f)}
                  className={`${pill} flex flex-col items-center gap-1.5 px-2 py-2.5 text-xs sm:text-sm`}
                  whileTap={{ scale: 0.92 }}
                >
                  <MiniScoop color={f.color} />
                  {f.name}
                </motion.button>
              ))}
            </div>
          )}

          {stage === "toppings" && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                {step.toppings.map((t) => {
                  const on = toppings.includes(t);
                  return (
                    <motion.button
                      key={t.name}
                      type="button"
                      onClick={() => toggleTopping(t)}
                      className={`${pill} flex flex-col items-center gap-1 px-2 py-2.5 text-xs sm:text-sm ${on ? "border-gold-300/80 bg-gold-300/20" : ""}`}
                      animate={{ scale: on ? 1.05 : 1 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <span className="text-2xl">{t.emoji}</span>
                      {t.name}
                    </motion.button>
                  );
                })}
              </div>
              {toppings.length > 0 && (
                <GlowButton
                  onClick={() => {
                    playSound("click");
                    setStage("sauce");
                  }}
                >
                  Next ➜
                </GlowButton>
              )}
            </div>
          )}

          {stage === "sauce" && (
            <div className="grid grid-cols-2 gap-2">
              {step.sauces.map((s) => (
                <motion.button
                  key={s.name}
                  type="button"
                  onClick={() => !sauce && pickSauce(s)}
                  className={`${pill} flex items-center justify-center gap-2 ${sauce === s ? "border-gold-300/80 bg-gold-300/20" : ""}`}
                  whileTap={{ scale: 0.92 }}
                >
                  <span className="size-4 rounded-full ring-2 ring-white/40" style={{ background: s.color }} />
                  {s.name}
                </motion.button>
              ))}
            </div>
          )}

          {stage === "ready" && (
            <GlowButton onClick={order}>
              <Sparkles className="size-4" /> {step.buttonLabel ?? "Order karo"}
            </GlowButton>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── The drawing ──────────────────────────────────────────────────────────
   One SVG (200 × 240 units): a stemmed tulip glass, real-looking scoops with a
   scalloped lip, a glossy sauce that pours over the top scoop, and toppings
   drawn as the real thing (slivers, chunks, sprinkles…) rather than emoji. */

// Where each scoop sits: the first one rests in the bowl, the rest stack on top.
const SCOOP_SPOTS = [
  { cx: 100, cy: 121, r: 47 },
  { cx: 103, cy: 78, r: 39 },
  { cx: 98, cy: 44, r: 31 },
];

// Deterministic "random" so the toppings don't jump around on every render.
const rand = (seed) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Mix a #rrggbb colour toward white (amount > 0) or black (amount < 0).
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const target = amount < 0 ? 0 : 255;
  const mix = (c) => Math.round(c + (target - c) * Math.abs(amount));
  return `rgb(${mix(n >> 16)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

// A scoop: a dome on top and the wavy lip an ice-cream scoop leaves underneath.
function scoopPath({ cx, cy, r }) {
  const base = cy + r * 0.12;
  const bumps = 7;
  let d = `M ${cx - r} ${base} A ${r} ${r * 1.02} 0 0 1 ${cx + r} ${base}`;
  for (let i = 0; i < bumps; i++) {
    const x0 = cx + r - (2 * r * i) / bumps;
    const x1 = cx + r - (2 * r * (i + 1)) / bumps;
    d += ` Q ${(x0 + x1) / 2} ${base + r * (0.26 + (i % 2) * 0.09)} ${x1} ${base}`;
  }
  return `${d} Z`;
}

// The sauce: a cap with drips, later clipped to the scoop so it hugs the dome.
function saucePath({ cx, cy, r }) {
  const top = cy - r * 1.2;
  const base = cy - r * 0.18;
  const w = r * 0.085;
  const drips = [[0.82, 0.2], [0.55, 0.4], [0.22, 0.3], [-0.12, 0.44], [-0.45, 0.28], [-0.76, 0.36]]; // [x, length] × r
  let d = `M ${cx - r * 1.1} ${top} L ${cx + r * 1.1} ${top} L ${cx + r * 1.1} ${base}`;
  let prev = cx + r * 1.1;
  for (const [fx, len] of drips) {
    const x = cx + fx * r;
    const y = base + len * r;
    d += ` Q ${(prev + x + w) / 2} ${base - r * 0.07} ${x + w} ${base} L ${x + w} ${y} A ${w} ${w} 0 0 1 ${x - w} ${y} L ${x - w} ${base}`;
    prev = x - w;
  }
  return `${d} Q ${(prev + cx - r * 1.1) / 2} ${base - r * 0.07} ${cx - r * 1.1} ${base} Z`;
}

// A point on the visible top of a scoop, for scattering toppings.
function spotOn({ cx, cy, r }, seed) {
  const fx = (rand(seed) * 2 - 1) * 0.72;
  const top = cy - Math.sqrt(1 - fx * fx) * r * 0.88;
  return { x: cx + fx * r, y: top + rand(seed + 7) * (cy - r * 0.1 - top), rot: rand(seed + 13) * 360 };
}

// Toppings spread evenly across the scoop, each in its own band (1st topping
// near the top, 2nd in the middle, 3rd lower down) so they don't pile up.
function spotInBand({ cx, cy, r }, band, i, count) {
  const fx = -0.62 + (1.24 * (i + 0.5)) / count + (rand(band * 17 + i) - 0.5) * 0.18;
  const top = cy - Math.sqrt(1 - fx * fx) * r * 0.74;
  const bottom = cy + r * 0.02;
  // band 0 = anywhere (sprinkles scatter over everything)
  const from = band === 0 ? rand(i * 31) * 0.75 : ((band - 1) % 3) / 3;
  return { x: cx + fx * r, y: top + (from + rand(band * 29 + i) * 0.25) * (bottom - top), rot: rand(band * 7 + i * 13) * 360 };
}

const SPRINKLE_COLORS = ["#ff6b9a", "#ffd166", "#6ee7b7", "#7cc4ff", "#c084fc", "#ffffff"];
const TOPPING_KIND = { "🥜": "nuts", "🍫": "chocolate", "🍒": "cherry", "🌈": "sprinkles", "🍪": "cookie", "🍓": "strawberry" };

function ToppingShapes({ topping, scoop, seed, ids }) {
  const kind = TOPPING_KIND[topping.emoji];
  const spots = (count) => Array.from({ length: count }, (_, i) => spotInBand(scoop, seed, i, count));

  if (kind === "cherry") {
    // Sized to the scoop so it reads as a proper cherry, not a sprinkle.
    const c = scoop.r * 0.34;
    const x = scoop.cx + scoop.r * 0.05;
    const y = scoop.cy - scoop.r * 0.98 - c * 0.35;
    return (
      <g>
        <ellipse cx={x + 1} cy={y + c * 0.85} rx={c * 0.95} ry={c * 0.3} fill="rgba(0,0,0,0.3)" filter={`url(#${ids}-soft)`} />
        <path
          d={`M ${x + c * 0.1} ${y - c * 0.75} C ${x + c * 0.2} ${y - c * 1.8}, ${x + c * 0.9} ${y - c * 2.4}, ${x + c * 1.5} ${y - c * 2.6}`}
          stroke="#4f6b24"
          strokeWidth={c * 0.2}
          fill="none"
          strokeLinecap="round"
        />
        <circle cx={x} cy={y} r={c} fill={`url(#${ids}-cherry)`} />
        {/* the little dimple where the stem joins, and a glossy highlight */}
        <path d={`M ${x - c * 0.25} ${y - c * 0.8} Q ${x + c * 0.1} ${y - c * 0.6} ${x + c * 0.35} ${y - c * 0.8}`} stroke="rgba(80,0,10,0.6)" strokeWidth={c * 0.1} fill="none" strokeLinecap="round" />
        <ellipse cx={x - c * 0.38} cy={y - c * 0.38} rx={c * 0.3} ry={c * 0.18} fill="rgba(255,255,255,0.8)" transform={`rotate(-35 ${x - c * 0.38} ${y - c * 0.38})`} />
        <circle cx={x + c * 0.35} cy={y + c * 0.4} r={c * 0.08} fill="rgba(255,255,255,0.45)" />
      </g>
    );
  }
  // Everything below is sized from the scoop (u ≈ 2 on the top scoop), so the
  // pieces look like real toppings on real ice cream rather than specks.
  const u = scoop.r / 20;
  const shadow = (p, rx, ry) => <ellipse cx={p.x + u * 0.6} cy={p.y + u * 1.2} rx={rx} ry={ry} fill="rgba(0,0,0,0.28)" filter={`url(#${ids}-soft)`} />;

  if (kind === "nuts")
    return spots(5).map((p, i) => (
      <g key={i}>
        {shadow(p, u * 4.2, u * 1.6)}
        <g transform={`rotate(${p.rot} ${p.x} ${p.y})`}>
          <path
            d={`M ${p.x - u * 4.6} ${p.y} C ${p.x - u * 3} ${p.y - u * 2.6}, ${p.x + u * 3} ${p.y - u * 2.6}, ${p.x + u * 4.6} ${p.y} C ${p.x + u * 3} ${p.y + u * 2.4}, ${p.x - u * 3} ${p.y + u * 2.4}, ${p.x - u * 4.6} ${p.y} Z`}
            fill={`url(#${ids}-nut)`}
            stroke="#8a5a2b"
            strokeWidth={u * 0.3}
          />
          <path d={`M ${p.x - u * 3} ${p.y - u * 0.5} Q ${p.x} ${p.y - u * 1.5} ${p.x + u * 3} ${p.y - u * 0.5}`} stroke="#f6e2bb" strokeWidth={u * 0.45} fill="none" strokeLinecap="round" opacity={0.8} />
        </g>
      </g>
    ));
  if (kind === "chocolate")
    return spots(4).map((p, i) => (
      <g key={i}>
        {shadow(p, u * 3.8, u * 1.6)}
        <g transform={`rotate(${(p.rot % 50) - 25} ${p.x} ${p.y})`}>
          {/* a chunk with a darker side face, so it reads as a solid block */}
          <rect x={p.x - u * 3.4} y={p.y - u * 1.6} width={u * 6.8} height={u * 4.2} rx={u * 0.8} fill="#24120a" />
          <rect x={p.x - u * 3.4} y={p.y - u * 3} width={u * 6.8} height={u * 4.2} rx={u * 0.8} fill="#4a2a17" />
          <rect x={p.x - u * 2.8} y={p.y - u * 2.6} width={u * 3.2} height={u * 1.1} rx={u * 0.5} fill="#8a5a3a" opacity={0.8} />
        </g>
      </g>
    ));
  if (kind === "sprinkles")
    return Array.from({ length: 16 }, (_, i) => spotInBand(scoop, 0, i, 16)).map((p, i) => {
      const a = (p.rot * Math.PI) / 180;
      const len = u * 2.6;
      return (
        <g key={i}>
          <line x1={p.x - Math.cos(a) * len + u * 0.4} y1={p.y - Math.sin(a) * len + u * 0.8} x2={p.x + Math.cos(a) * len + u * 0.4} y2={p.y + Math.sin(a) * len + u * 0.8} stroke="rgba(0,0,0,0.25)" strokeWidth={u * 1.3} strokeLinecap="round" />
          <line x1={p.x - Math.cos(a) * len} y1={p.y - Math.sin(a) * len} x2={p.x + Math.cos(a) * len} y2={p.y + Math.sin(a) * len} stroke={SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]} strokeWidth={u * 1.3} strokeLinecap="round" />
          <line x1={p.x - Math.cos(a) * len * 0.6} y1={p.y - Math.sin(a) * len * 0.6 - u * 0.3} x2={p.x + Math.cos(a) * len * 0.2} y2={p.y + Math.sin(a) * len * 0.2 - u * 0.3} stroke="rgba(255,255,255,0.55)" strokeWidth={u * 0.4} strokeLinecap="round" />
        </g>
      );
    });
  if (kind === "cookie")
    return spots(4).map((p, i) => {
      const pts = Array.from({ length: 7 }, (_, k) => {
        const a = (k / 7) * Math.PI * 2;
        const rr = u * (2.6 + rand(seed + i * 5 + k) * 1.6);
        return `${p.x + Math.cos(a) * rr},${p.y + Math.sin(a) * rr * 0.8}`;
      }).join(" ");
      return (
        <g key={i}>
          {shadow(p, u * 3.6, u * 1.6)}
          <polygon points={pts} fill="#c4884a" stroke="#8a5426" strokeWidth={u * 0.35} />
          <circle cx={p.x + u * 0.9} cy={p.y - u * 0.5} r={u * 0.9} fill="#3d2213" />
          <circle cx={p.x - u * 1.2} cy={p.y + u * 0.8} r={u * 0.6} fill="#3d2213" />
          <circle cx={p.x - u * 0.8} cy={p.y - u * 1.2} r={u * 0.4} fill="#e8b57a" />
        </g>
      );
    });
  if (kind === "strawberry")
    return spots(2).map((p, i) => (
      <g key={i}>
        {shadow(p, u * 4.2, u * 1.8)}
        <g transform={`rotate(${(p.rot % 60) - 30} ${p.x} ${p.y})`}>
          <path
            d={`M ${p.x} ${p.y + u * 5} C ${p.x - u * 6} ${p.y + u * 1}, ${p.x - u * 5} ${p.y - u * 5}, ${p.x} ${p.y - u * 3.6} C ${p.x + u * 5} ${p.y - u * 5}, ${p.x + u * 6} ${p.y + u * 1}, ${p.x} ${p.y + u * 5} Z`}
            fill="#e0344d"
          />
          <ellipse cx={p.x} cy={p.y} rx={u * 2.2} ry={u * 3} fill="#ff9aa8" opacity={0.8} />
          <ellipse cx={p.x} cy={p.y + u * 0.2} rx={u * 0.8} ry={u * 1.8} fill="#fff1f2" opacity={0.6} />
          {[[-3, 0.5], [3, 0.5], [-2, 2.8], [2, 2.8], [0, 3.8]].map(([dx, dy]) => (
            <ellipse key={`${dx},${dy}`} cx={p.x + dx * u} cy={p.y + dy * u} rx={u * 0.35} ry={u * 0.55} fill="#ffe08a" />
          ))}
        </g>
      </g>
    ));
  // Anything new in config.js falls back to its emoji.
  const p = spotOn(scoop, seed * 31);
  return (
    <text x={p.x} y={p.y} fontSize={u * 9} textAnchor="middle" dominantBaseline="central">
      {topping.emoji}
    </text>
  );
}

function Scoop({ flavor, spot, index, ids }) {
  const id = `${ids}-scoop${index}`;
  return (
    <motion.g initial={{ y: -150, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 240, damping: 16 }}>
      <defs>
        <radialGradient id={id} cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor={shade(flavor.color, 0.55)} />
          <stop offset="45%" stopColor={flavor.color} />
          <stop offset="100%" stopColor={shade(flavor.color, -0.32)} />
        </radialGradient>
      </defs>
      {/* contact shadow on whatever is underneath */}
      <ellipse cx={spot.cx} cy={spot.cy + spot.r * 0.36} rx={spot.r * 0.95} ry={spot.r * 0.16} fill="rgba(0,0,0,0.22)" filter={`url(#${ids}-soft)`} />
      <path d={scoopPath(spot)} fill={`url(#${id})`} />
      {/* ice-cream texture: little pits and flecks */}
      {Array.from({ length: 9 }, (_, k) => {
        const p = spotOn(spot, index * 97 + k * 4.1);
        return <circle key={k} cx={p.x} cy={p.y} r={0.7 + rand(index + k) * 0.9} fill={shade(flavor.color, -0.28)} opacity={0.45} />;
      })}
      {/* soft highlight on the dome */}
      <ellipse cx={spot.cx - spot.r * 0.36} cy={spot.cy - spot.r * 0.52} rx={spot.r * 0.3} ry={spot.r * 0.16} fill="rgba(255,255,255,0.45)" filter={`url(#${ids}-soft)`} transform={`rotate(-28 ${spot.cx - spot.r * 0.36} ${spot.cy - spot.r * 0.52})`} />
    </motion.g>
  );
}

// Glass geometry (the rim is an ellipse; the bowl curves down to the stem).
const RIM = { cx: 100, cy: 130, rx: 72, ry: 12 };
const BOWL = `M 28 130 C 28 178 66 192 100 192 C 134 192 172 178 172 130`;

function SundaeArt({ scoops, toppings, sauce, ready }) {
  const ids = `sd${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const spots = scoops.map((_, i) => SCOOP_SPOTS[Math.min(i, SCOOP_SPOTS.length - 1)]);
  const topSpot = spots.at(-1);
  // Layering like a real sundae: chunky toppings first, sprinkles over them,
  // and the cherry last, right at the top.
  const layer = (t) => ({ sprinkles: 1, cherry: 2 })[TOPPING_KIND[t.emoji]] ?? 0;
  const ordered = [...toppings].sort((a, b) => layer(a) - layer(b));

  return (
    <motion.div
      className="relative mx-auto h-64 w-56"
      animate={ready ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.9 }}
    >
      {ready && (
        <motion.span
          className="absolute inset-0 rounded-full bg-gold-300/25 blur-2xl"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        />
      )}

      <svg viewBox="0 0 200 240" className="relative size-full overflow-visible" role="img" aria-label="Your sundae">
        <defs>
          <filter id={`${ids}-soft`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
          <linearGradient id={`${ids}-glass`} x1="0" x2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.4" />
            <stop offset="16%" stopColor="#fff" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#fff" stopOpacity="0.04" />
            <stop offset="84%" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.32" />
          </linearGradient>
          <linearGradient id={`${ids}-stem`} x1="0" x2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.14" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.12" />
          </linearGradient>
          <radialGradient id={`${ids}-cherry`} cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#ff6b7d" />
            <stop offset="55%" stopColor="#c0001d" />
            <stop offset="100%" stopColor="#6e0010" />
          </radialGradient>
          <linearGradient id={`${ids}-nut`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8bd84" />
            <stop offset="100%" stopColor="#a8743f" />
          </linearGradient>
          <clipPath id={`${ids}-bowl`}>
            <path d={`${BOWL} Z`} />
          </clipPath>
          {topSpot && (
            <clipPath id={`${ids}-top`}>
              <path d={scoopPath(topSpot)} />
            </clipPath>
          )}
          {/* The sauce "pours": a mask that grows from the top down. */}
          <mask id={`${ids}-pour`}>
            <motion.rect x="0" y="0" width="200" fill="#fff" initial={{ height: 0 }} animate={{ height: 240 }} transition={{ duration: 1.1, ease: "easeOut" }} />
          </mask>
        </defs>

        {/* Table shadow, foot and stem */}
        <ellipse cx="100" cy="233" rx="48" ry="5" fill="rgba(0,0,0,0.45)" filter={`url(#${ids}-soft)`} />
        <ellipse cx="100" cy="226" rx="40" ry="8" fill={`url(#${ids}-stem)`} stroke="rgba(255,255,255,0.45)" strokeWidth="1" />
        <path d="M 93 190 C 96 200 96 212 92 224 L 108 224 C 104 212 104 200 107 190 Z" fill={`url(#${ids}-stem)`} />
        <ellipse cx="100" cy="205" rx="8.5" ry="3.5" fill="rgba(255,255,255,0.35)" />

        {/* Back of the glass: the inside wall and the far half of the rim */}
        <path d={`${BOWL} Z`} fill="rgba(255,255,255,0.05)" />
        <path d={`M 28 130 A 72 12 0 0 1 172 130`} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

        {/* The first flavour fills the bowl, seen through the glass */}
        {scoops.length > 0 && (
          <g clipPath={`url(#${ids}-bowl)`}>
            <defs>
              <linearGradient id={`${ids}-fill`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={shade(scoops[0].color, 0.15)} />
                <stop offset="100%" stopColor={shade(scoops[0].color, -0.3)} />
              </linearGradient>
            </defs>
            <rect x="20" y="128" width="160" height="70" fill={`url(#${ids}-fill)`} />
            {Array.from({ length: 14 }, (_, k) => (
              <circle key={k} cx={45 + rand(k + 200) * 110} cy={140 + rand(k + 300) * 45} r={0.8 + rand(k) * 1.1} fill={shade(scoops[0].color, -0.3)} opacity={0.4} />
            ))}
          </g>
        )}
        {/* …and its top surface follows the oval of the rim */}
        {scoops.length > 0 && <ellipse cx="100" cy="131" rx="70" ry="10.5" fill={shade(scoops[0].color, 0.12)} />}

        {/* The wafer stick tucks in behind the top scoop once it's ready */}
        {ready && topSpot && (
          <motion.g initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 160, damping: 14 }}>
            <g transform={`rotate(24 ${topSpot.cx + topSpot.r * 0.45} ${topSpot.cy - topSpot.r * 0.3})`}>
              <rect x={topSpot.cx + topSpot.r * 0.45 - 5} y={topSpot.cy - topSpot.r * 1.9} width="10" height={topSpot.r * 1.6} rx="4" fill="#e9c37a" stroke="#b9873f" strokeWidth="0.8" />
              {Array.from({ length: 6 }, (_, k) => (
                <line key={k} x1={topSpot.cx + topSpot.r * 0.45 - 5} y1={topSpot.cy - topSpot.r * 1.8 + k * 7} x2={topSpot.cx + topSpot.r * 0.45 + 5} y2={topSpot.cy - topSpot.r * 1.8 + k * 7 + 4} stroke="#b9873f" strokeWidth="0.8" />
              ))}
            </g>
          </motion.g>
        )}

        {/* First scoop sits in the bowl, so the front glass is drawn over it */}
        {scoops[0] && <Scoop flavor={scoops[0]} spot={spots[0]} index={0} ids={ids} />}

        {/* Front of the glass: tinted wall, reflections and the near rim */}
        <path d={`${BOWL} A ${RIM.rx} ${RIM.ry} 0 0 1 28 130 Z`} fill={`url(#${ids}-glass)`} stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
        <path d="M 38 142 C 41 164 55 180 72 186" stroke="rgba(255,255,255,0.6)" strokeWidth="3" fill="none" strokeLinecap="round" filter={`url(#${ids}-soft)`} />
        <path d="M 164 146 C 162 160 154 172 144 179" stroke="rgba(255,255,255,0.35)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d={`M 28 130 A 72 12 0 0 0 172 130`} fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />

        {scoops.slice(1).map((flavor, i) => (
          <Scoop key={i + 1} flavor={flavor} spot={spots[i + 1]} index={i + 1} ids={ids} />
        ))}

        {/* Sauce, clipped to the top scoop so it follows the dome */}
        {sauce && topSpot && (
          <g clipPath={`url(#${ids}-top)`} mask={`url(#${ids}-pour)`}>
            <path d={saucePath(topSpot)} fill={sauce.color} />
            <path d={saucePath(topSpot)} fill="none" stroke={shade(sauce.color, -0.35)} strokeWidth="0.8" opacity="0.6" />
            <path
              d={`M ${topSpot.cx - topSpot.r * 0.62} ${topSpot.cy - topSpot.r * 0.55} Q ${topSpot.cx - topSpot.r * 0.35} ${topSpot.cy - topSpot.r * 0.95} ${topSpot.cx + topSpot.r * 0.1} ${topSpot.cy - topSpot.r * 0.93}`}
              stroke="rgba(255,255,255,0.45)"
              strokeWidth={topSpot.r * 0.07}
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        {/* Toppings drop onto the top scoop */}
        {topSpot &&
          ordered.map((t) => (
            <motion.g
              key={t.name}
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 15 }}
            >
              <ToppingShapes topping={t} scoop={topSpot} seed={toppings.indexOf(t) + 1} ids={ids} />
            </motion.g>
          ))}
      </svg>

      {scoops.length === 0 && <span className="absolute inset-x-0 top-24 text-center text-xs text-lilac-200/60">Glass khaali hai... 👀</span>}
    </motion.div>
  );
}

// A tiny scoop for the flavour buttons, shaded like the big ones.
function MiniScoop({ color }) {
  const id = `ms${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const spot = { cx: 16, cy: 15, r: 12 };
  return (
    <svg viewBox="0 0 32 26" className="h-7 w-9" aria-hidden>
      <defs>
        <radialGradient id={id} cx="34%" cy="26%" r="78%">
          <stop offset="0%" stopColor={shade(color, 0.55)} />
          <stop offset="45%" stopColor={color} />
          <stop offset="100%" stopColor={shade(color, -0.32)} />
        </radialGradient>
      </defs>
      <path d={scoopPath(spot)} fill={`url(#${id})`} />
    </svg>
  );
}
