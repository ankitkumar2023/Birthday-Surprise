import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Gift, Heart, Star } from "lucide-react";
import { CATCHABLE_KINDS } from "../config";

// How each kind of floating item looks. Add a new kind here and list it in
// CATCHABLE_KINDS (config.js) to use it.
const KINDS = {
  heart: { Icon: Heart, color: "#ff85ad" },
  star: { Icon: Star, color: "#f7d070" },
  gift: { Icon: Gift, color: "#c084fc" },
};

const ITEMS_ON_SCREEN = 5;

const rand = (min, max) => min + Math.random() * (max - min);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

let nextId = 0;

// Each item gets a random looping path: a few waypoints (in % of the play
// area) that it drifts between, back and forth, forever.
function createItem() {
  return {
    id: nextId++,
    kind: pick(CATCHABLE_KINDS),
    xs: Array.from({ length: 4 }, () => rand(0, 100)),
    ys: Array.from({ length: 4 }, () => rand(0, 100)),
    duration: rand(7, 12),
    size: rand(46, 64),
  };
}

// The catch game. It only handles the floating items — scoring, fragments
// and the win screen live in GamePhase.
//   onCatch(x, y) → called with the screen point of each catch
//   done          → true once she has won; the remaining items fade away
export default function CatchGame({ onCatch, done }) {
  const [items, setItems] = useState(() => Array.from({ length: ITEMS_ON_SCREEN }, createItem));

  // A caught item stays in the DOM briefly while it animates out; this
  // stops a fast double-tap on it from counting twice.
  const caughtIds = useRef(new Set());

  const handleCatch = (item, event) => {
    if (done || caughtIds.current.has(item.id)) return;
    caughtIds.current.add(item.id);

    const rect = event.currentTarget.getBoundingClientRect();
    onCatch(rect.left + rect.width / 2, rect.top + rect.height / 2);

    // Replace the caught item with a fresh one so the screen never empties.
    setItems((current) => [...current.filter((it) => it.id !== item.id), createItem()]);
  };

  return (
    <div className="relative mx-4 min-h-[45vh] flex-1">
      {/* Inset by the largest item size so items never drift off-screen. */}
      <div className="absolute inset-0 right-16 bottom-16">
        <AnimatePresence>
          {!done &&
            items.map((item) => {
              const { Icon, color } = KINDS[item.kind] ?? KINDS.heart;
              return (
                <motion.button
                  key={item.id}
                  type="button"
                  aria-label={`Catch the ${item.kind}`}
                  className="absolute cursor-pointer touch-none"
                  style={{ width: item.size, height: item.size }}
                  initial={{ left: `${item.xs[0]}%`, top: `${item.ys[0]}%`, scale: 0, opacity: 0 }}
                  animate={{
                    left: item.xs.map((x) => `${x}%`),
                    top: item.ys.map((y) => `${y}%`),
                    scale: 1,
                    opacity: 1,
                  }}
                  exit={{ scale: 2, opacity: 0, transition: { duration: 0.35 } }}
                  transition={{
                    left: { duration: item.duration, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
                    top: { duration: item.duration * 0.8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" },
                    scale: { type: "spring", stiffness: 260, damping: 14 },
                    opacity: { duration: 0.4 },
                  }}
                  whileHover={{ scale: 1.2 }}
                  // pointerdown feels snappier than click for a moving target.
                  onPointerDown={(e) => handleCatch(item, e)}
                >
                  <motion.span
                    className="block size-full"
                    animate={{ rotate: [-12, 12, -12] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Icon
                      className="size-full"
                      color={color}
                      fill={color}
                      fillOpacity={0.85}
                      style={{ filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 22px ${color})` }}
                    />
                  </motion.span>
                </motion.button>
              );
            })}
        </AnimatePresence>
      </div>
    </div>
  );
}
