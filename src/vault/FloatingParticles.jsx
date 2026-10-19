import { useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

const COLORS = ["#fde68a", "#ffc9d9", "#d8b4fe", "#ffffff", "#f7d070"];

// Tiny glowing motes drifting up the screen. Raising `count` (e.g. when every
// memory is unlocked) adds more without disturbing the ones already floating.
export default function FloatingParticles({ count = 24 }) {
  // Generate generously once, then show the first `count`.
  const particles = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        color: COLORS[i % COLORS.length],
        duration: 10 + Math.random() * 14,
        delay: -Math.random() * 20, // negative = already mid-flight on first paint
        sway: 20 + Math.random() * 40,
      })),
    [],
  );

  // Portaled so `fixed` means the viewport (the phase wrapper has a filter).
  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[5] overflow-hidden" aria-hidden="true">
      {particles.slice(0, count).map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: "100%",
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
          initial={{ opacity: 0 }}
          animate={{ y: ["0vh", "-110vh"], x: [0, p.sway, -p.sway, 0], opacity: [0, 0.9, 0.9, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
        />
      ))}
    </div>,
    document.body,
  );
}
