import { useMemo } from "react";
import { motion } from "framer-motion";

// The colored glow behind each phase, so the mood warms up as she progresses.
const PHASE_GLOW = {
  landing: "rgba(162, 108, 240, 0.22)",
  game: "rgba(255, 133, 173, 0.2)",
  vault: "rgba(247, 208, 112, 0.16)",
  finale: "rgba(255, 168, 197, 0.32)",
};

const STAR_COUNT = 70;

export default function Background({ phase }) {
  // Generated once so the stars don't jump around on re-render.
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 2 + 1,
        delay: Math.random() * 5,
        duration: 2.5 + Math.random() * 3,
      })),
    [],
  );

  return (
    <div className="fixed inset-0 -z-10 bg-plum-950" aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        animate={{ background: `radial-gradient(circle at 50% 40%, ${PHASE_GLOW[phase]}, rgba(18, 10, 25, 0) 70%)` }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
      <div className="absolute -left-32 top-1/4 size-96 rounded-full bg-lilac-500/10 blur-3xl" />
      <div className="absolute -right-32 bottom-0 size-96 rounded-full bg-blush-400/10 blur-3xl" />

      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
