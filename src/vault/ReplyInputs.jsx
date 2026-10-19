import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronLeft, ChevronRight, SendHorizontal } from "lucide-react";
import { playSound } from "./sounds";
import { useTimeout } from "./hooks";
import { CardPickReply, fill, QuizReply, RapidFireReply, WheelReply } from "./GameReplies";
import SundaeReply from "./SundaeGame";
import StarsReply from "./StarsGame";

// The ways she can reply in a conversation, one per step `type` in config.js.
// Each calls onAnswer({ text, value, swatch?, option? }) exactly once.
export default function ReplyInput({ step, onAnswer }) {
  const Input = INPUTS[step.type] ?? TextReply;
  return <Input step={step} onAnswer={onAnswer} />;
}

const glass =
  "rounded-2xl border border-white/15 bg-white/10 text-blush-100 backdrop-blur placeholder:text-lilac-200/50 focus:border-blush-300/60 focus:outline-none focus:ring-2 focus:ring-blush-300/25";

// Shared gradient "send" button.
function SendButton({ disabled, onClick, children = "Send" }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-blush-300 via-lilac-300 to-gold-300 px-5 py-3 font-bold text-plum-900 shadow-[0_0_24px_rgba(255,133,173,0.35)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.93 }}
    >
      {children}
      <SendHorizontal className="size-4" />
    </motion.button>
  );
}

/* ── Buttons ── */
function ChoiceReply({ step, onAnswer }) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {step.options.map((option, i) => (
        <motion.button
          key={option.label}
          type="button"
          onClick={() => {
            playSound("click");
            onAnswer({ text: option.label, option });
          }}
          className="min-w-32 cursor-pointer rounded-full border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-blush-100 backdrop-blur transition-colors hover:border-blush-300/70 hover:bg-blush-300/15"
          initial={{ opacity: 0, y: 14, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 18 }}
          whileHover={{ y: -3, scale: 1.04, boxShadow: "0 0 26px rgba(255,133,173,0.4)" }}
          whileTap={{ scale: 0.92 }}
        >
          {option.label}
        </motion.button>
      ))}
    </div>
  );
}

/* ── Text box / textarea ── */
function TextReply({ step, onAnswer }) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const canSend = trimmed.length > 0 || step.optional;

  const send = () => {
    if (!canSend) return;
    playSound("click");
    onAnswer({ text: trimmed || "…", value: trimmed });
  };

  const onKeyDown = (e) => {
    // Enter sends; Shift+Enter makes a new line in the big box.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const Field = step.multiline ? "textarea" : "input";
  return (
    <div className={`flex gap-2 ${step.multiline ? "flex-col" : "items-center"}`}>
      <Field
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={step.placeholder}
        rows={step.multiline ? 4 : undefined}
        maxLength={step.multiline ? 600 : 120}
        className={`${glass} w-full px-4 py-3 text-base ${step.multiline ? "resize-none" : ""}`}
      />
      <div className={step.multiline ? "flex justify-end" : ""}>
        <SendButton disabled={!canSend} onClick={send} />
      </div>
    </div>
  );
}

/* ── Colour swatches ── */
function ColorReply({ step, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const later = useTimeout();

  const pick = (color) => {
    if (picked) return;
    setPicked(color.name);
    playSound("click");
    // A short beat so she sees her choice light up.
    later(() => onAnswer({ text: color.name, swatch: color.hex }), 450);
  };

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {step.options.map((color, i) => {
        const isPicked = picked === color.name;
        return (
          <motion.button
            key={color.name}
            type="button"
            onClick={() => pick(color)}
            className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur"
            initial={{ opacity: 0, y: 14 }}
            animate={{
              opacity: picked && !isPicked ? 0.35 : 1,
              y: 0,
              scale: isPicked ? 1.08 : 1,
              boxShadow: isPicked ? `0 0 26px ${color.hex}` : "0 0 0px rgba(0,0,0,0)",
            }}
            transition={{ delay: picked ? 0 : i * 0.04, type: "spring", stiffness: 260, damping: 20 }}
            whileHover={!picked ? { y: -4, boxShadow: `0 8px 26px ${color.hex}88` } : undefined}
            whileTap={!picked ? { scale: 0.92 } : undefined}
          >
            <span
              className="relative flex aspect-square w-full items-center justify-center rounded-xl ring-1 ring-white/20"
              style={{ background: `linear-gradient(145deg, ${color.hex}, ${color.hex}cc)` }}
            >
              {isPicked && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="rounded-full bg-white/90 p-1 text-plum-900">
                  <Check className="size-3.5" />
                </motion.span>
              )}
            </span>
            <span className="text-[11px] font-medium leading-tight text-blush-100/90 sm:text-xs">{color.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

/* ── Glassy dropdown ── */
function SelectReply({ step, onAnswer }) {
  const [open, setOpen] = useState(false);

  const choose = (option) => {
    playSound("click");
    setOpen(false);
    onAnswer({ text: option });
  };

  return (
    <div>
      <motion.button
        type="button"
        onClick={() => {
          playSound("click");
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        className={`${glass} flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-base`}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-lilac-200/70">{step.placeholder ?? "Choose one…"}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown className="size-5" />
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            role="listbox"
            className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-white/15 bg-plum-900/80 p-1.5 backdrop-blur-xl"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
          >
            {step.options.map((option, i) => (
              <motion.li key={option} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                <button
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => choose(option)}
                  className="w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm text-blush-100 transition-colors hover:bg-blush-300/15 sm:text-base"
                >
                  {option}
                </button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Glowing 0–10 slider (+ optional note) ── */
function RatingReply({ step, onAnswer }) {
  const min = step.min ?? 0;
  const max = step.max ?? 10;
  const [value, setValue] = useState(Math.round((min + max) / 2));
  const [comment, setComment] = useState("");
  const emojis = step.emojis ?? [];
  const emoji = emojis[Math.round(((value - min) / (max - min)) * (emojis.length - 1))] ?? "✨";
  const percent = ((value - min) / (max - min)) * 100;

  const send = () => {
    playSound("click");
    const note = comment.trim();
    onAnswer({ text: `${value}/${max} ${emoji}${note ? `\n${note}` : ""}`, value: { rating: value, comment: note } });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={emoji}
            className="text-6xl drop-shadow-[0_0_18px_rgba(255,168,197,0.6)]"
            initial={{ scale: 0.4, rotate: -20, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {emoji}
          </motion.span>
        </AnimatePresence>
        <motion.span key={value} className="mt-1 text-lg font-bold tabular-nums text-gold-200" initial={{ y: -4 }} animate={{ y: 0 }}>
          {value} / {max}
        </motion.span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        aria-label={step.question}
        className="h-3 w-full cursor-pointer appearance-none rounded-full shadow-[0_0_20px_rgba(255,133,173,0.35)] [&::-moz-range-thumb]:size-7 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-blush-400 [&::-webkit-slider-thumb]:size-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-blush-400 [&::-webkit-slider-thumb]:shadow-[0_0_18px_rgba(255,133,173,1)]"
        style={{
          background: `linear-gradient(90deg, #ff85ad 0%, #f7d070 ${percent}%, rgba(255,255,255,0.12) ${percent}%)`,
        }}
      />

      {step.comment && (
        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-lilac-200/90">{step.comment.label}</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={step.comment.placeholder}
            rows={3}
            maxLength={600}
            className={`${glass} resize-none px-4 py-3 text-base`}
          />
        </label>
      )}

      <div className="flex justify-end">
        <SendButton onClick={send}>Bhej do</SendButton>
      </div>
    </div>
  );
}

/* ── Glassy month calendar (no past dates) ── */
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function DateReply({ step, onAnswer }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState(null);

  const year = view.getFullYear();
  const month = view.getMonth();
  const blanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1));
  const atFirstMonth = year === today.getFullYear() && month === today.getMonth();

  const shift = (by) => {
    playSound("click");
    setView(new Date(year, month + by, 1));
  };

  const send = () => {
    if (!picked) return;
    playSound("click");
    const label = picked.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const iso = `${picked.getFullYear()}-${String(picked.getMonth() + 1).padStart(2, "0")}-${String(picked.getDate()).padStart(2, "0")}`;
    onAnswer({ text: `📅 ${label}`, value: iso, followUp: (step.reply ?? []).map((line) => fill(line, { date: label })) });
  };

  const navButton =
    "cursor-pointer rounded-full p-2 text-blush-100 transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-25";

  return (
    <div className="flex flex-col gap-3">
      <div className={`${glass} p-3`}>
        <div className="mb-2 flex items-center justify-between">
          <button type="button" aria-label="Previous month" disabled={atFirstMonth} onClick={() => shift(-1)} className={navButton}>
            <ChevronLeft className="size-5" />
          </button>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`${year}-${month}`}
              className="font-semibold text-gold-200"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
            >
              {view.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
            </motion.span>
          </AnimatePresence>
          <button type="button" aria-label="Next month" onClick={() => shift(1)} className={navButton}>
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="pb-1 text-[11px] font-semibold text-lilac-200/60">
              {d}
            </span>
          ))}
          {Array.from({ length: blanks }, (_, i) => (
            <span key={`blank-${i}`} />
          ))}
          {days.map((day) => {
            const past = day < today;
            const isPicked = picked?.getTime() === day.getTime();
            const isToday = day.getTime() === today.getTime();
            return (
              <motion.button
                key={day.getDate()}
                type="button"
                disabled={past}
                onClick={() => {
                  playSound("click");
                  setPicked(day);
                }}
                className={`aspect-square cursor-pointer rounded-xl text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
                  isPicked
                    ? "bg-linear-to-br from-blush-300 to-lilac-400 font-bold text-plum-950 shadow-[0_0_18px_rgba(255,133,173,0.6)]"
                    : `text-blush-100 hover:bg-white/15 ${isToday ? "ring-1 ring-gold-300/60" : ""}`
                }`}
                animate={{ scale: isPicked ? 1.1 : 1 }}
                whileTap={past ? undefined : { scale: 0.88 }}
              >
                {day.getDate()}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {step.skipLabel && (
          <button
            type="button"
            onClick={() => {
              playSound("click");
              onAnswer({ text: step.skipLabel, followUp: step.skipReply });
            }}
            className="cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold text-lilac-200/80 transition-colors hover:bg-white/10 hover:text-blush-100"
          >
            {step.skipLabel}
          </button>
        )}
        <SendButton disabled={!picked} onClick={send}>
          {step.sendLabel ?? "Fix karo"}
        </SendButton>
      </div>
    </div>
  );
}

const INPUTS = {
  choice: ChoiceReply,
  text: TextReply,
  colors: ColorReply,
  select: SelectReply,
  rating: RatingReply,
  date: DateReply,
  quiz: QuizReply,
  rapidfire: RapidFireReply,
  cards: CardPickReply,
  wheel: WheelReply,
  sundae: SundaeReply,
  stars: StarsReply,
};
