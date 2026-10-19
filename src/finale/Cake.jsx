import { AnimatePresence, motion } from "framer-motion";

// Sprinkle positions as [left %, top %, color], fixed so they don't move on re-render.
const SPRINKLES = [
  [12, 55, "#fde68a"], [26, 70, "#ffffff"], [40, 50, "#c084fc"], [55, 72, "#fde68a"],
  [68, 52, "#ffffff"], [82, 66, "#c084fc"], [20, 40, "#ff85ad"], [76, 38, "#ff85ad"],
];

// Frosting drips hanging off the top edge of a tier, as [left %, height px].
function Drips({ drips, color }) {
  return (
    <div className="absolute inset-x-0 top-0">
      <div className="h-3 rounded-t-[inherit]" style={{ background: color }} />
      {drips.map(([left, height], i) => (
        <span
          key={i}
          className="absolute top-2 w-4 rounded-b-full"
          style={{ left: `${left}%`, height, background: color }}
        />
      ))}
    </div>
  );
}

function Flame() {
  return (
    <motion.div
      className="absolute bottom-0 left-1/2 -translate-x-1/2"
      style={{ transformOrigin: "50% 100%" }}
      exit={{ opacity: 0, scaleY: 0.2, scaleX: 0.4, y: -6, transition: { duration: 0.35 } }}
    >
      {/* Warm halo */}
      <motion.div
        className="absolute bottom-0 left-1/2 size-28 -translate-x-1/2 translate-y-8 rounded-full bg-gold-300/35 blur-2xl"
        animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.15, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* The flame itself, flickering */}
      <motion.div
        className="relative h-11 w-6"
        style={{
          borderRadius: "50% 50% 50% 50% / 65% 65% 35% 35%",
          background: "radial-gradient(circle at 50% 78%, #fffbea 0%, #fde68a 28%, #f59e0b 62%, #f97316 100%)",
          boxShadow: "0 0 18px #fbbf24, 0 0 44px rgba(245, 158, 11, 0.7)",
          transformOrigin: "50% 100%",
        }}
        animate={{
          scaleY: [1, 1.12, 0.94, 1.08, 1],
          scaleX: [1, 0.9, 1.06, 0.95, 1],
          rotate: [-2, 3, -1, 2, -2],
        }}
        transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

function Smoke() {
  return [0, 1, 2].map((i) => (
    <motion.span
      key={i}
      className="absolute bottom-0 left-1/2 size-4 rounded-full bg-white/50 blur-[3px]"
      initial={{ opacity: 0.8, x: "-50%", y: 0, scale: 0.4 }}
      animate={{ opacity: 0, x: `${-50 + (i - 1) * 80}%`, y: -70 - i * 20, scale: 2.4 }}
      transition={{ duration: 2, delay: 0.15 + i * 0.2, ease: "easeOut" }}
    />
  ));
}

// A layered pastel cake with one candle. The candle is the button.
export default function Cake({ blown, onBlow }) {
  return (
    <div className="relative flex flex-col items-center">
      <button
        type="button"
        onClick={onBlow}
        disabled={blown}
        aria-label={blown ? "Candle blown out" : "Blow out the candle"}
        className="relative z-10 -mb-px flex cursor-pointer flex-col items-center px-6 pt-4 disabled:cursor-default"
      >
        {/* Flame area */}
        <div className="relative h-14 w-8">
          <AnimatePresence>{!blown && <Flame key="flame" />}</AnimatePresence>
          {blown && <Smoke />}
        </div>
        {/* Wick */}
        <div className="h-2.5 w-0.5 rounded-full bg-stone-700" />
        {/* Candle */}
        <div
          className="h-20 w-5 rounded-t-md shadow-[inset_-3px_0_4px_rgba(0,0,0,0.15)]"
          style={{ background: "repeating-linear-gradient(-45deg, #fff 0 6px, #ffa8c5 6px 12px)" }}
        />
      </button>

      {/* Top tier */}
      <div className="relative h-20 w-44 rounded-t-2xl bg-linear-to-b from-blush-200 to-blush-300 shadow-[inset_0_-8px_16px_rgba(0,0,0,0.08)]">
        <Drips color="#fff7fb" drips={[[8, 16], [24, 26], [44, 14], [62, 24], [80, 18]]} />
      </div>

      {/* Bottom tier */}
      <div className="relative h-28 w-72 rounded-t-3xl bg-linear-to-b from-lilac-300 to-lilac-400 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.1)]">
        <Drips color="#ffe4ec" drips={[[5, 20], [17, 32], [31, 18], [46, 28], [60, 16], [73, 30], [87, 20]]} />
        {SPRINKLES.map(([left, top, color], i) => (
          <span
            key={i}
            className="absolute h-1.5 w-3 rounded-full"
            style={{ left: `${left}%`, top: `${top}%`, background: color, rotate: `${i * 47}deg` }}
          />
        ))}
      </div>

      {/* Plate */}
      <div className="h-4 w-80 rounded-full bg-linear-to-b from-gold-200 to-gold-400 shadow-[0_12px_40px_rgba(247,208,112,0.35)]" />
    </div>
  );
}
