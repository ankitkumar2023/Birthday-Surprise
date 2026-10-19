import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Types `text` out one character at a time, pausing a little at punctuation
// and line breaks so it reads like someone writing it.
export default function Typewriter({ text, speed = 42, startDelay = 0, onDone, className = "" }) {
  // Array.from splits by character, so emoji aren't cut in half mid-typing.
  const chars = Array.from(text);
  const [count, setCount] = useState(0);
  const done = count >= chars.length;

  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (done) {
      onDoneRef.current?.();
      return;
    }
    const prev = chars[count - 1];
    const delay = count === 0 ? startDelay : /[.,!?\n]/.test(prev) ? speed * 7 : speed;
    const timer = setTimeout(() => setCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [count, done, speed, startDelay]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <p className={`whitespace-pre-line ${className}`}>
      {chars.slice(0, count).join("")}
      {!done && (
        <motion.span
          className="ml-0.5 inline-block h-[1.1em] w-0.5 translate-y-[0.2em] bg-blush-300"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      )}
    </p>
  );
}
