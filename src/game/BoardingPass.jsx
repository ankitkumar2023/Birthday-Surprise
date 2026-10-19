import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Plane } from "lucide-react";

// The reward for the mini-game: a boarding pass that prints itself one
// section per win. A `flap: true` field rolls in like an airport split-flap
// board; when every section is in, an APPROVED stamp slams onto the stub.
//   pass     → BOARDING_PASS from config.js
//   unlocked → how many sections are revealed
export default function BoardingPass({ pass, unlocked }) {
  const complete = unlocked >= pass.sections.length;
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();

  return (
    <motion.div
      className="mx-auto w-full max-w-3xl px-4"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 120, damping: 16 }}
    >
      <div className="relative flex flex-col overflow-hidden rounded-3xl border border-gold-300/40 bg-linear-to-br from-plum-800/90 via-plum-900/90 to-plum-950/90 shadow-[0_0_50px_rgba(247,208,112,0.18)] sm:flex-row">
        {/* Main part */}
        <div className="flex-1 p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-gold-300/20 ring-1 ring-gold-300/50">
                <Plane className="size-4 text-gold-200" />
              </span>
              <div>
                <p className="font-script text-xl leading-none text-gold-200">{pass.airline}</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-lilac-200/60">Boarding Pass</p>
              </div>
            </div>
            <div className="text-right text-[10px] font-semibold uppercase tracking-[0.2em] text-lilac-200/60">
              <p>
                Flight <span className="text-blush-100">{pass.flight}</span>
              </p>
              <p>
                Date <span className="text-blush-100">{today}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {pass.sections.map((section, i) => (
              <Section key={i} section={section} open={i < unlocked} number={i + 1} />
            ))}
          </div>
        </div>

        {/* Perforation */}
        <div className="relative h-0 border-t-2 border-dashed border-white/15 sm:h-auto sm:w-0 sm:border-l-2 sm:border-t-0">
          <span className="absolute -left-3 -top-3 size-6 rounded-full bg-plum-950 sm:-left-3 sm:-top-3" />
          <span className="absolute -right-3 -top-3 size-6 rounded-full bg-plum-950 sm:-bottom-3 sm:-left-3 sm:right-auto sm:top-auto" />
        </div>

        {/* Stub */}
        <div className="relative flex items-center justify-between gap-4 p-4 sm:w-48 sm:flex-col sm:justify-center sm:p-5">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-lilac-200/60">Gate</p>
            <p className="font-semibold text-blush-100">{pass.gate}</p>
          </div>
          <Barcode seed={pass.flight} faded={!complete} />
          <AnimatePresence>
            {complete && (
              <motion.span
                className="absolute left-1/2 top-1/2 rounded-lg border-4 border-blush-300 px-3 py-1 text-lg font-black uppercase tracking-[0.2em] text-blush-300 shadow-[0_0_24px_rgba(255,133,173,0.5)]"
                initial={{ opacity: 0, scale: 3, rotate: -30, x: "-50%", y: "-50%" }}
                animate={{ opacity: 0.95, scale: 1, rotate: -14, x: "-50%", y: "-50%" }}
                transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 18 }}
              >
                {pass.stamp}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {complete && pass.footnote && (
          <motion.p
            className="mt-3 text-center text-sm italic text-lilac-200/80"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            {pass.footnote}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Section({ section, open, number }) {
  return (
    <div className="relative grid min-h-14 grid-cols-2 gap-3">
      {section.fields.map((field) => (
        <div key={field.label} className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-lilac-200/60">{field.label}</p>
          {open ? (
            field.flap ? (
              <FlapText text={field.value} />
            ) : (
              <motion.p
                className="text-sm font-semibold text-blush-100 sm:text-base"
                initial={{ opacity: 0, filter: "blur(6px)", y: 4 }}
                animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                transition={{ duration: 0.6 }}
              >
                {field.value}
              </motion.p>
            )
          ) : (
            <p className="mt-1 h-4 w-24 rounded bg-white/10" />
          )}
        </div>
      ))}
      {!open && (
        <span className="absolute right-0 top-1/2 flex -translate-y-1/2 items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
          <Lock className="size-3" /> {number}
        </span>
      )}
    </div>
  );
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Airport split-flap board: each letter spins through random ones, then lands.
function FlapText({ text }) {
  const [frame, setFrame] = useState(0);
  const settleAt = (i) => 6 + i * 3;
  const last = settleAt(text.length);

  useEffect(() => {
    if (frame > last) return;
    const id = setTimeout(() => setFrame((f) => f + 1), 55);
    return () => clearTimeout(id);
  }, [frame, last]);

  return (
    <p className="mt-1 flex flex-wrap gap-0.5">
      {text.split("").map((c, i) => {
        const settled = c === " " || frame >= settleAt(i);
        const shown = settled ? c : LETTERS[(frame * 7 + i * 5) % LETTERS.length];
        return c === " " ? (
          <span key={i} className="w-2" />
        ) : (
          <span
            key={i}
            className={`relative flex h-7 w-5 items-center justify-center overflow-hidden rounded bg-plum-950 font-mono text-base font-bold ring-1 ring-white/10 sm:h-8 sm:w-6 sm:text-lg ${
              settled ? "text-gold-200" : "text-blush-100/60"
            }`}
          >
            {shown}
            <span className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
          </span>
        );
      })}
    </p>
  );
}

// Decorative barcode, the same every time for a given seed.
function Barcode({ seed, faded }) {
  const bars = useMemo(() => {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return Array.from({ length: 34 }, () => {
      h = (h * 1103515245 + 12345) >>> 0;
      return 1 + (h % 3);
    });
  }, [seed]);

  return (
    <div className={`flex h-14 items-stretch gap-[2px] transition-opacity duration-700 sm:h-16 ${faded ? "opacity-25" : "opacity-90"}`}>
      {bars.map((w, i) => (
        <span key={i} className="bg-blush-100" style={{ width: w }} />
      ))}
    </div>
  );
}
