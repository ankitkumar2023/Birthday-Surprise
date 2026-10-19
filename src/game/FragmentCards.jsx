import { motion } from "framer-motion";
import { Lock } from "lucide-react";

// A row of locked "Memory Fragment" cards. The first `unlocked` cards flip
// over to reveal their memory.
export default function FragmentCards({ fragments, unlocked }) {
  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-3 gap-3 px-4 sm:gap-5">
      {fragments.map((fragment, i) => {
        const isOpen = i < unlocked;
        return (
          <div key={i} className="h-40 perspective-[1000px] sm:h-48">
            <motion.div
              className="relative size-full"
              style={{ transformStyle: "preserve-3d" }}
              initial={false}
              animate={{ rotateY: isOpen ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 70, damping: 13 }}
            >
              {/* Front: locked */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-plum-800/70 text-lilac-200/60"
                style={{ backfaceVisibility: "hidden" }}
              >
                <Lock className="size-6" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] sm:text-xs">Fragment {i + 1}</span>
              </div>

              {/* Back: the revealed memory */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2xl border border-gold-300/50 bg-linear-to-br from-blush-300/25 via-lilac-400/20 to-gold-300/25 p-2 text-center shadow-[0_0_30px_rgba(247,208,112,0.25)] sm:p-3"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                {/* A foil shine sweeps across once it flips, then sparkles twinkle in the corners */}
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  {isOpen && (
                    <motion.span
                      className="absolute inset-y-0 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/35 to-transparent"
                      initial={{ left: "-60%" }}
                      animate={{ left: "130%" }}
                      transition={{ delay: 0.6, duration: 1.1, ease: "easeInOut" }}
                    />
                  )}
                </span>
                {isOpen &&
                  ["left-2 top-2", "right-2 bottom-2"].map((spot, k) => (
                    <motion.span
                      key={spot}
                      className={`absolute ${spot} text-xs text-gold-200`}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, delay: k }}
                    >
                      ✦
                    </motion.span>
                  ))}
                <span className="text-[9px] font-semibold uppercase tracking-[0.25em] text-lilac-200/70 sm:text-[10px]">
                  Fragment {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-2xl sm:text-3xl">{fragment.emoji}</span>
                <span className="font-script text-lg leading-tight text-gold-200 sm:text-xl">{fragment.title}</span>
                <span className="text-[11px] leading-snug text-blush-100/85 sm:text-xs">{fragment.text}</span>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
