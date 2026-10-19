import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Lock, LockOpen } from "lucide-react";
import { playSound } from "./sounds";

const DOOR_MS = 2900; // total length of the opening sequence

// The cinematic entrance: a vault door with a glowing dial. The dial spins,
// the lock clicks open, the two doors slide apart. Tap to skip.
export default function VaultDoor({ onDone }) {
  const [unlocked, setUnlocked] = useState(false);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    playSound("vault");
    const timers = [
      setTimeout(() => {
        setUnlocked(true);
        playSound("unlock");
      }, 1200),
      setTimeout(() => onDoneRef.current(), DOOR_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const doorTransition = { delay: 1.7, duration: 1.1, ease: [0.65, 0, 0.35, 1] };
  const door =
    "absolute inset-y-0 w-1/2 bg-linear-to-b from-plum-800 via-plum-900 to-plum-950 shadow-[inset_0_0_80px_rgba(0,0,0,0.6)]";

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] cursor-pointer overflow-hidden"
      onClick={() => onDoneRef.current()}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      aria-label="Opening the memory vault. Tap to skip."
    >
      {/* Doors */}
      <motion.div className={`${door} left-0 border-r border-gold-300/30`} animate={{ x: "-100%" }} transition={doorTransition}>
        <div className="absolute inset-6 rounded-l-3xl border border-white/5" />
      </motion.div>
      <motion.div className={`${door} right-0 border-l border-gold-300/30`} animate={{ x: "100%" }} transition={doorTransition}>
        <div className="absolute inset-6 rounded-r-3xl border border-white/5" />
      </motion.div>

      {/* Dial in the middle */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <motion.div
          className="relative flex size-40 items-center justify-center rounded-full border-4 border-gold-300/60 bg-plum-900 sm:size-48"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{
            scale: [0.6, 1, 1, 1.15, 0],
            opacity: [0, 1, 1, 1, 0],
            boxShadow: ["0 0 0px rgba(247,208,112,0)", "0 0 40px rgba(247,208,112,0.4)", "0 0 40px rgba(247,208,112,0.4)", "0 0 120px rgba(247,208,112,0.9)", "0 0 0px rgba(247,208,112,0)"],
          }}
          transition={{ duration: 2.1, times: [0, 0.2, 0.55, 0.7, 1] }}
        >
          {/* Notches that spin like a safe dial */}
          <motion.div
            className="absolute inset-2 rounded-full"
            animate={{ rotate: [0, 200, 120, 300] }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} className="absolute inset-0" style={{ rotate: `${i * 30}deg` }}>
                <span className="absolute left-1/2 top-0 h-3 w-0.5 -translate-x-1/2 bg-gold-300/70" />
              </span>
            ))}
          </motion.div>
          <motion.span key={unlocked ? "open" : "closed"} initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
            {unlocked ? <LockOpen className="size-14 text-gold-200" /> : <Lock className="size-14 text-gold-200" />}
          </motion.span>
        </motion.div>

        <motion.p
          className="font-script text-3xl text-blush-100 text-glow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 1, 1, 0], y: 0 }}
          transition={{ duration: 2, times: [0, 0.2, 0.75, 1] }}
        >
          {unlocked ? "The vault is open…" : "Opening the vault…"}
        </motion.p>
      </div>
    </motion.div>,
    document.body,
  );
}
