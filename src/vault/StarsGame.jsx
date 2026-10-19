import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GlowButton } from "./GameReplies";
import { playSound } from "./sounds";
import { useTimeout } from "./hooks";

// Step type "stars": she taps the glowing star, a line draws to it, and so on
// until the shape closes. Then it lights up and gets a name.
//   stars → [[x, y], …] in a 300×220 sky
//   order → star indexes in tapping order (repeat the first to close the shape)
export default function StarsReply({ step, onAnswer }) {
  const { stars, order } = step;
  const [progress, setProgress] = useState(0); // how many of `order` she has tapped
  const [wrong, setWrong] = useState(null);
  const [named, setNamed] = useState(false);
  const later = useTimeout();
  const complete = progress === order.length;

  // Faint twinkling background stars, fixed for this game.
  const dust = useRef(
    Array.from({ length: 38 }, () => ({ x: Math.random() * 300, y: Math.random() * 220, r: 0.4 + Math.random() * 1.1, d: 1.5 + Math.random() * 3 })),
  ).current;

  const tap = (i) => {
    if (complete) return;
    if (i !== order[progress]) {
      setWrong(i);
      later(() => setWrong(null), 400);
      return;
    }
    const next = progress + 1;
    setProgress(next);
    playSound(next === order.length ? "sparkle" : "message");
    if (next === order.length) later(() => setNamed(true), 1400);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-lilac-200/80">
        {complete ? "Constellation complete ✨" : `Chamakte star ko tap karo · ${progress}/${order.length}`}
      </p>

      <svg
        viewBox="0 0 300 220"
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_40%,rgba(162,108,240,0.28),rgba(18,10,25,0.92))]"
      >
        {dust.map((s, i) => (
          <motion.circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" animate={{ opacity: [0.15, 0.8, 0.15] }} transition={{ duration: s.d, repeat: Infinity }} />
        ))}

        {/* The shape fills with gold once it's closed */}
        <motion.polygon
          points={order
            .slice(0, -1)
            .map((i) => stars[i].join(","))
            .join(" ")}
          fill="rgba(247,208,112,0.2)"
          initial={{ opacity: 0 }}
          animate={{ opacity: complete ? 1 : 0 }}
          transition={{ duration: 1 }}
        />

        {order.slice(1, progress).map((to, k) => {
          const from = order[k];
          return (
            <motion.line
              key={k}
              x1={stars[from][0]}
              y1={stars[from][1]}
              x2={stars[to][0]}
              y2={stars[to][1]}
              stroke="#fde68a"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 4px #f7d070)" }}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.35 }}
            />
          );
        })}

        {stars.map(([x, y], i) => {
          const isNext = !complete && i === order[progress];
          const lit = order.slice(0, progress).includes(i);
          return (
            <g key={i} onClick={() => tap(i)} className="cursor-pointer">
              <circle cx={x} cy={y} r="18" fill="transparent" />
              {isNext && (
                <motion.circle
                  cx={x}
                  cy={y}
                  fill="none"
                  stroke="#ffa8c5"
                  strokeWidth="1.5"
                  initial={{ r: 6, opacity: 1 }}
                  animate={{ r: 17, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
              )}
              <motion.circle
                cx={x}
                cy={y}
                r={lit ? 5 : 4}
                fill={lit ? "#fde68a" : "#ffffff"}
                style={{ filter: `drop-shadow(0 0 ${lit || isNext ? 6 : 3}px ${lit ? "#f7d070" : "#ffffff"})` }}
                animate={wrong === i ? { x: [0, -4, 4, 0] } : complete ? { scale: [1, 1.6, 1] } : {}}
                transition={complete ? { delay: i * 0.08, duration: 0.6 } : { duration: 0.3 }}
              />
            </g>
          );
        })}
      </svg>

      <AnimatePresence>
        {named && (
          <motion.div
            className="flex flex-col items-center gap-3 text-center"
            initial={{ opacity: 0, y: 14, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-lilac-200/70">Naya constellation discovered</p>
              <p className="font-script text-4xl text-gold-200 text-glow">{step.name}</p>
              {step.caption && <p className="text-sm text-blush-100/80">{step.caption}</p>}
            </div>
            <GlowButton
              onClick={() => {
                playSound("click");
                onAnswer({ text: `🌌 ${step.name}`, value: step.name, followUp: step.after });
              }}
            >
              <Sparkles className="size-4" /> {step.buttonLabel ?? "Register karo"}
            </GlowButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
