import { useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

const COLORS = ["#ff85ad", "#f7d070", "#c084fc", "#ffc9d9", "#fde68a"];
const PARTICLES = 16;

// A one-shot sparkle explosion at screen point (x, y). Calls onDone when finished.
export default function Burst({ x, y, onDone }) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2;
        const distance = 60 + Math.random() * 60;
        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          size: 5 + Math.random() * 7,
          color: COLORS[i % COLORS.length],
        };
      }),
    [],
  );

  // Portaled to <body> so `position: fixed` is relative to the viewport.
  return createPortal(
    <div className="pointer-events-none fixed z-[70]" style={{ left: x, top: y }} aria-hidden="true">
      <motion.span
        className="absolute -left-10 -top-10 size-20 rounded-full border-2 border-blush-200"
        initial={{ scale: 0.2, opacity: 1 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            marginLeft: -p.size / 2,
            marginTop: -p.size / 2,
            background: p.color,
            boxShadow: `0 0 10px ${p.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          onAnimationComplete={i === 0 ? onDone : undefined}
        />
      ))}
    </div>,
    document.body,
  );
}
