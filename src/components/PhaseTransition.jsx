import { motion } from "framer-motion";

// Shared enter/exit animation for every phase: a soft blur-and-rise.
export default function PhaseTransition({ children, className = "" }) {
  return (
    <motion.section
      className={`relative min-h-dvh ${className}`}
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      // Drop the filter once settled: a lingering blur(0px) still forces the
      // browser to re-filter the whole phase every frame (videos stutter).
      animate={{ opacity: 1, y: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } }}
      exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.section>
  );
}
