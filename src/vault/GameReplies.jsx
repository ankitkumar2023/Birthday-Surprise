import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Ticket, Zap } from "lucide-react";
import { playSound } from "./sounds";
import { useTimeout } from "./hooks";

// The mini-game replies for a conversation (step types "quiz", "rapidfire",
// "cards", "wheel" in config.js). Like the other replies, each calls
// onAnswer({ text, value, followUp? }) once; `followUp` lines are what "you"
// say back (a score, a result…).

// "Hi {name}" + { name: "Khushi" } → "Hi Khushi"
export const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");

export const pill =
  "cursor-pointer rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-blush-100 backdrop-blur transition-colors sm:text-base";

export function GlowButton({ onClick, children }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="mx-auto flex cursor-pointer items-center gap-2 rounded-2xl bg-linear-to-r from-blush-300 via-lilac-300 to-gold-300 px-6 py-3 font-bold text-plum-900 shadow-[0_0_24px_rgba(255,133,173,0.35)]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.93 }}
    >
      {children}
    </motion.button>
  );
}

/* ── Emoji movie quiz: guess the film, see right/wrong, get a score ── */
export function QuizReply({ step, onAnswer }) {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const later = useTimeout();
  const r = step.rounds[round];
  const total = step.rounds.length;

  const pick = (i) => {
    if (picked !== null) return;
    const right = i === r.answer;
    const newScore = score + (right ? 1 : 0);
    setPicked(i);
    setScore(newScore);
    playSound(right ? "sparkle" : "click");
    later(() => {
      if (round + 1 < total) {
        setRound(round + 1);
        setPicked(null);
        return;
      }
      const result = step.results.find((x) => newScore >= x.min) ?? step.results.at(-1);
      onAnswer({
        text: `🎬 Score: ${newScore}/${total}`,
        value: newScore,
        followUp: result.lines.map((line) => fill(line, { score: newScore, total })),
      });
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-lilac-200/80">
        <span>
          Round {round + 1}/{total}
        </span>
        <span className="rounded-full bg-gold-300/15 px-3 py-1 text-gold-200">⭐ {score}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          className="flex flex-col gap-3"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: "spring", stiffness: 260, damping: 24 }}
        >
          <div className="rounded-2xl border border-gold-300/25 bg-white/5 px-4 py-5 text-center">
            <p className="text-4xl tracking-widest sm:text-5xl">{r.clue}</p>
            {r.hint && <p className="mt-2 text-sm italic text-lilac-200/75">Hint: {r.hint}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {r.options.map((option, i) => {
              const isAnswer = picked !== null && i === r.answer;
              const isWrongPick = picked === i && i !== r.answer;
              return (
                <motion.button
                  key={option}
                  type="button"
                  onClick={() => pick(i)}
                  className={`${pill} ${
                    isAnswer ? "border-emerald-300/80 bg-emerald-400/25" : isWrongPick ? "border-rose-300/80 bg-rose-400/25" : "hover:bg-blush-300/15"
                  }`}
                  animate={isWrongPick ? { x: [0, -6, 6, -4, 0] } : isAnswer ? { scale: [1, 1.06, 1] } : {}}
                  whileTap={picked === null ? { scale: 0.94 } : undefined}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>

          <p className="min-h-6 text-center text-sm font-semibold">
            {picked !== null &&
              (picked === r.answer ? (
                <span className="text-emerald-200">Sahi jawab! 🎉</span>
              ) : (
                <span className="text-rose-200">Arre! Ye tha: {r.options[r.answer]} 😄</span>
              ))}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Rapid fire "this or that" against a timer, ending in a personality report ── */
export function RapidFireReply({ step, onAnswer }) {
  const seconds = step.seconds ?? 5;
  const total = step.pairs.length;
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [chosen, setChosen] = useState(null); // index picked, -1 = time ran out
  const picks = useRef([]);
  const later = useTimeout();

  const choose = (i) => {
    if (chosen !== null) return;
    setChosen(i);
    picks.current.push(i === -1 ? null : step.pairs[round][i]);
    playSound(i === -1 ? "message" : "click");
    later(() => {
      if (round + 1 < total) {
        setRound(round + 1);
        setChosen(null);
        return;
      }
      const picked = picks.current.filter(Boolean);
      const skipped = total - picked.length;
      const traits = picked.map((p) => p.trait);
      const traitText = traits.length > 1 ? `${traits.slice(0, -1).join(", ")} aur ${traits.at(-1)}` : (traits[0] ?? "ek mystery");
      const lines = step.result.map((line) => fill(line, { traits: traitText }));
      if (skipped && step.skippedLine) lines.splice(lines.length - 1, 0, fill(step.skippedLine, { n: skipped }));
      onAnswer({ text: picked.map((p) => p.label).join(" · ") || "Sab skip 😄", value: picks.current, followUp: lines });
    }, 650);
  };

  // Time runs out → counts as a skip.
  useEffect(() => {
    if (!started || chosen !== null) return;
    const timer = setTimeout(() => choose(-1), seconds * 1000);
    return () => clearTimeout(timer);
  }, [started, round, chosen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!started) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-lilac-200/80">
          {total} sawaal · har ek ke liye sirf {seconds} second ⏱️
        </p>
        <GlowButton
          onClick={() => {
            playSound("click");
            setStarted(true);
          }}
        >
          <Zap className="size-4" /> Start
        </GlowButton>
      </div>
    );
  }

  const pair = step.pairs[round];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-lilac-200/80">
        <span>
          ⚡ {round + 1}/{total}
        </span>
        {chosen === -1 && <span className="text-rose-200">Time up! ⏰</span>}
      </div>

      {/* The shrinking timer bar */}
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          key={round}
          className="h-full rounded-full bg-linear-to-r from-gold-300 via-blush-300 to-blush-400"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: seconds, ease: "linear" }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          className="relative grid grid-cols-2 gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
        >
          {pair.map((option, i) => (
            <motion.button
              key={option.label}
              type="button"
              onClick={() => choose(i)}
              className="flex min-h-24 cursor-pointer items-center justify-center rounded-2xl border border-white/20 bg-white/10 p-3 text-center text-lg font-bold text-blush-100 backdrop-blur transition-colors hover:border-blush-300/70 hover:bg-blush-300/15"
              animate={chosen === null ? {} : chosen === i ? { scale: 1.06, boxShadow: "0 0 30px rgba(255,133,173,0.6)" } : { opacity: 0.3, scale: 0.95 }}
              whileTap={chosen === null ? { scale: 0.92 } : undefined}
            >
              {option.label}
            </motion.button>
          ))}
          <span className="pointer-events-none absolute left-1/2 top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-plum-900 text-xs font-black text-gold-200 ring-2 ring-gold-300/50">
            VS
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── Pick one of three face-down fortune cards… then all three flip ── */
export function CardPickReply({ step, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const [allFlipped, setAllFlipped] = useState(false);
  const later = useTimeout();

  const pick = (i) => {
    if (picked !== null) return;
    setPicked(i);
    playSound("sparkle");
    later(() => {
      setAllFlipped(true);
      playSound("message");
    }, 2600);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {step.cards.map((fortune, i) => {
          const flipped = picked === i || allFlipped;
          return (
            <motion.button
              key={i}
              type="button"
              onClick={() => pick(i)}
              aria-label={flipped ? fortune : `Card ${i + 1}`}
              className={`relative aspect-[2/3] ${picked === null ? "cursor-pointer" : "cursor-default"}`}
              style={{ perspective: 800 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: picked === null ? [0, -6, 0] : 0 }}
              transition={{ opacity: { delay: i * 0.1 }, y: picked === null ? { duration: 2.4, repeat: Infinity, delay: i * 0.3 } : { duration: 0.3 } }}
              whileHover={picked === null ? { scale: 1.05 } : undefined}
              whileTap={picked === null ? { scale: 0.95 } : undefined}
            >
              <motion.div
                className="absolute inset-0"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Back */}
                <span
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl border border-gold-300/40 bg-linear-to-br from-lilac-500/60 via-plum-800 to-blush-400/40 shadow-[0_0_24px_rgba(162,108,240,0.35)]"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <span className="text-3xl">🔮</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-200/80">Card {i + 1}</span>
                </span>
                {/* Front: the fortune */}
                <span
                  className={`absolute inset-0 flex items-center justify-center rounded-2xl border p-2 text-center text-[11px] leading-snug text-blush-100 sm:p-3 sm:text-sm ${
                    picked === i ? "border-gold-300 bg-gold-300/15 shadow-[0_0_30px_rgba(247,208,112,0.5)]" : "border-white/20 bg-white/10"
                  }`}
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  {fortune}
                </span>
              </motion.div>
            </motion.button>
          );
        })}
      </div>

      {allFlipped && (
        <GlowButton
          onClick={() => {
            playSound("click");
            onAnswer({ text: `🔮 Card ${picked + 1}`, value: step.cards[picked], followUp: step.after });
          }}
        >
          <Sparkles className="size-4" /> {step.buttonLabel ?? "Fortune pakka!"}
        </GlowButton>
      )}
    </div>
  );
}

const WHEEL_COLORS = ["#ff85ad", "#c084fc", "#f7d070", "#ffa8c5", "#a26cf0", "#fde68a"];
const SPIN_SECONDS = 4.5;

/* ── Spin the wheel to win a birthday coupon ── */
export function WheelReply({ step, onAnswer }) {
  const prizes = step.prizes;
  const slice = 360 / prizes.length;
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState(null);
  const later = useTimeout();

  const spin = () => {
    if (spinning || won !== null) return;
    const target = Math.floor(Math.random() * prizes.length);
    const center = target * slice + slice / 2;
    const jitter = (Math.random() - 0.5) * slice * 0.6;
    // Turning the wheel by (360 - center) brings that slice under the pointer at the top.
    setRotation(360 * 6 + (360 - center) + jitter);
    setSpinning(true);
    playSound("click");
    later(() => {
      setSpinning(false);
      setWon(target);
      playSound("sparkle");
    }, SPIN_SECONDS * 1000 + 100);
  };

  const gradient = `conic-gradient(${prizes.map((_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * slice}deg ${(i + 1) * slice}deg`).join(", ")})`;
  const prize = won === null ? null : prizes[won];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative size-64 sm:size-72">
        {/* Pointer */}
        <span className="absolute left-1/2 top-[-6px] z-10 -translate-x-1/2 border-x-[12px] border-t-[22px] border-x-transparent border-t-gold-200 drop-shadow-[0_0_8px_rgba(247,208,112,0.9)]" />
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-white/30 shadow-[0_0_40px_rgba(255,133,173,0.45)]"
          style={{ background: gradient }}
          animate={{ rotate: rotation }}
          transition={{ duration: SPIN_SECONDS, ease: [0.15, 0.6, 0.1, 1] }}
        >
          {prizes.map((p, i) => (
            <span key={i} className="absolute inset-0" style={{ transform: `rotate(${i * slice + slice / 2}deg)` }}>
              <span className="absolute left-1/2 top-4 -translate-x-1/2 text-2xl sm:text-3xl">{p.emoji}</span>
            </span>
          ))}
        </motion.div>
        <motion.button
          type="button"
          onClick={spin}
          disabled={spinning || won !== null}
          className="absolute left-1/2 top-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-plum-900 text-sm font-black tracking-widest text-gold-200 ring-4 ring-gold-300/60 disabled:cursor-default"
          animate={won === null && !spinning ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 1.4, repeat: won === null && !spinning ? Infinity : 0 }}
          whileTap={!spinning && won === null ? { scale: 0.9 } : undefined}
        >
          {spinning ? "🎡" : won === null ? "SPIN" : "✨"}
        </motion.button>
      </div>

      <AnimatePresence>
        {prize && (
          <motion.div
            className="flex w-full flex-col items-center gap-4"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
          >
            <div className="w-full rounded-2xl border-2 border-dashed border-gold-300/60 bg-gold-300/10 px-4 py-4 text-center">
              <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-200">
                <Ticket className="size-4" /> Birthday Coupon
              </p>
              <p className="mt-2 text-3xl">{prize.emoji}</p>
              <p className="mt-1 text-lg font-bold text-blush-100">{prize.label}</p>
              <p className="mt-2 text-xs text-lilac-200/70">Validity: hamesha · Non-transferable 😄</p>
            </div>
            <GlowButton
              onClick={() => {
                playSound("click");
                onAnswer({
                  text: `🎟️ ${prize.emoji} ${prize.label}`,
                  value: prize.label,
                  followUp: (step.after ?? []).map((line) => fill(line, { prize: prize.label })),
                });
              }}
            >
              <Ticket className="size-4" /> {step.buttonLabel ?? "Claim karo"}
            </GlowButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
