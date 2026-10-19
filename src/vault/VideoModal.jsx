import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Placeholder } from "../components/SafeMedia";
import { useState } from "react";
import { useModal } from "./hooks";
import { playSound } from "./sounds";

// Opening an unlocked video card: dark backdrop, letterbox bars, and the
// video plays at the center with controls. Esc or a tap outside closes.
// (No backdrop blur or layout animation here — both make playback stutter.)
//   index → video being watched, or null when closed
export default function VideoModal({ videos, index, onClose }) {
  const video = index === null ? null : videos[index];
  return createPortal(
    <AnimatePresence>{video && <Viewer key="video-viewer" video={video} index={index} onClose={onClose} />}</AnimatePresence>,
    document.body,
  );
}

function Viewer({ video, index, onClose }) {
  const [failed, setFailed] = useState(false);
  const close = () => {
    playSound("click");
    onClose();
  };

  useModal(true, (e) => {
    if (e.key === "Escape") close();
  });

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className="fixed inset-0 z-50 flex justify-center overflow-y-auto bg-black/92 px-4 py-[8vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      onClick={close}
    >
      {/* Letterbox bars */}
      {[
        { className: "top-0", from: "-100%" },
        { className: "bottom-0", from: "100%" },
      ].map((bar) => (
        <motion.div
          key={bar.className}
          className={`pointer-events-none fixed inset-x-0 z-10 h-[5vh] bg-black ${bar.className}`}
          initial={{ y: bar.from }}
          animate={{ y: 0 }}
          exit={{ y: bar.from }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}

      <motion.button
        type="button"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        className="fixed right-4 top-[calc(5vh+1rem)] z-20 cursor-pointer rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/25 sm:p-3"
        whileHover={{ rotate: 90, scale: 1.1 }}
        whileTap={{ scale: 0.85 }}
      >
        <X className="size-5" />
      </motion.button>

      <motion.figure
        onClick={(e) => e.stopPropagation()}
        className="relative my-auto flex w-full max-w-2xl flex-col items-center px-8 sm:px-14"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -12 }}
        transition={{ type: "spring", stiffness: 170, damping: 22 }}
      >
        <div className="relative overflow-hidden rounded-2xl border border-gold-300/30 shadow-[0_0_90px_rgba(255,133,173,0.3)]">
          {failed ? (
            <Placeholder src={video.src} kind="video" className="aspect-9/16 w-[70vw] max-w-sm" />
          ) : (
            <video
              src={video.src}
              autoPlay
              loop
              controls
              playsInline
              preload="auto"
              muted={video.muted}
              onError={() => setFailed(true)}
              className="block max-h-[70vh] max-w-full object-contain"
            />
          )}
        </div>

        <motion.figcaption
          className="mt-5 text-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-300">
            {video.icon} Video {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-2 font-script text-3xl text-blush-100 text-glow sm:text-4xl">{video.title}</h3>
        </motion.figcaption>
      </motion.figure>
    </motion.div>
  );
}
