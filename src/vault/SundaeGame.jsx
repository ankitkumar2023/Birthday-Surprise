import { useState } from "react";
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
                  <span className="size-7 rounded-full ring-2 ring-white/40" style={{ background: scoopFill(f.color) }} />
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

const SCOOP = 74; // px
const scoopFill = (color) => `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.65), ${color} 45%, ${color})`;
const TOPPING_SPOTS = [
  { x: -24, y: 8, r: -15 },
  { x: 20, y: 12, r: 12 },
  { x: -2, y: 22, r: 0 },
  { x: 30, y: -6, r: 20 },
  { x: -34, y: -8, r: -25 },
];

// The drawing: a glass cup, stacked scoops, a sauce drizzle and falling toppings.
function SundaeArt({ scoops, toppings, sauce, ready }) {
  const top = 64 + Math.max(0, scoops.length - 1) * 42; // bottom offset of the top scoop
  return (
    <motion.div
      className="relative mx-auto h-56 w-48"
      animate={ready ? { scale: [1, 1.07, 1] } : { scale: 1 }}
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

      {scoops.map((s, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 rounded-full shadow-[inset_-6px_-8px_14px_rgba(0,0,0,0.18)]"
          style={{ width: SCOOP, height: SCOOP, marginLeft: -SCOOP / 2 + (i % 2 ? 6 : -6), bottom: 64 + i * 42, background: scoopFill(s.color), zIndex: 2 + i }}
          initial={{ y: -160, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15 }}
        />
      ))}

      {sauce && scoops.length > 0 && (
        <motion.span
          className="absolute left-1/2 z-20"
          style={{ bottom: top + SCOOP * 0.42, width: SCOOP * 0.92, height: SCOOP * 0.5, marginLeft: -SCOOP * 0.46, originY: 0 }}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 0.92, scaleY: 1 }}
          transition={{ duration: 0.7 }}
        >
          <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-full" style={{ background: sauce.color }} />
          {[12, 34, 58, 78].map((left, i) => (
            <span key={left} className="absolute top-1/3 w-2.5 rounded-full" style={{ left: `${left}%`, height: 10 + (i % 2) * 9, background: sauce.color }} />
          ))}
        </motion.span>
      )}

      {scoops.length > 0 &&
        toppings.map((t, i) => {
          const spot = TOPPING_SPOTS[i % TOPPING_SPOTS.length];
          return (
            <motion.span
              key={t.name}
              className="absolute left-1/2 z-30 text-2xl"
              style={{ bottom: top + SCOOP * 0.6 + spot.y, marginLeft: spot.x - 14 }}
              initial={{ y: -90, opacity: 0, rotate: 0 }}
              animate={{ y: 0, opacity: 1, rotate: spot.r }}
              transition={{ type: "spring", stiffness: 300, damping: 14 }}
            >
              {t.emoji}
            </motion.span>
          );
        })}

      {/* Glass cup */}
      <span
        className="absolute bottom-3 left-1/2 z-40 h-20 w-32 -translate-x-1/2 border-t-4 border-white/40 bg-linear-to-b from-white/30 to-white/10"
        style={{ clipPath: "polygon(0 0, 100% 0, 78% 100%, 22% 100%)" }}
      />
      <span className="absolute bottom-0 left-1/2 z-40 h-3 w-16 -translate-x-1/2 rounded-full bg-white/25" />
      {scoops.length === 0 && <span className="absolute inset-x-0 top-20 text-center text-xs text-lilac-200/60">Cup khaali hai... 👀</span>}
    </motion.div>
  );
}
