import { useCallback, useEffect, useRef, useState } from "react";
import Burst from "../components/Burst";

// Small hooks shared by the vault and its mini-games.

// Sparkle explosions on demand.
//   const [bursts, fireBurst] = useBursts();
//   fireBurst(x, y)           → explode at a screen point
//   fireBurstAt(element)      → explode at the center of an element
//   render {bursts} anywhere in the component.
export function useBursts() {
  const [list, setList] = useState([]);
  const nextId = useRef(0);

  const fireBurst = useCallback((x, y) => {
    const id = nextId.current++;
    setList((current) => [...current, { id, x, y }]);
  }, []);

  const fireBurstAt = useCallback(
    (element) => {
      if (!element) return;
      const rect = element.getBoundingClientRect();
      fireBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
    },
    [fireBurst],
  );

  const bursts = list.map((b) => (
    <Burst key={b.id} x={b.x} y={b.y} onDone={() => setList((current) => current.filter((it) => it.id !== b.id))} />
  ));

  return [bursts, fireBurst, fireBurstAt];
}

// While a modal is open: freeze the page behind it and listen for keys.
export function useModal(isOpen, onKeyDown) {
  const onKeyRef = useRef(onKeyDown);
  useEffect(() => {
    onKeyRef.current = onKeyDown;
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => onKeyRef.current?.(e);
    window.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);
}

// Runs `callback` after `ms`, and cancels it if the component goes away first.
export function useTimeout() {
  const timers = useRef([]);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);
  return useCallback((callback, ms) => {
    if (alive.current) timers.current.push(setTimeout(callback, ms));
  }, []);
}
