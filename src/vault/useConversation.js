import { useCallback, useEffect, useRef, useState } from "react";
import { useTimeout } from "./hooks";
import { playSound } from "./sounds";

// The chat logic for one memory card, with no visuals.
//
// It walks through `steps` from config.js: "types" each of your lines (with a
// typing indicator), then waits for her reply. A reply option with a
// `pushback` makes you answer back and ask again before moving on, and so
// does a text answer containing a step's `notAllowed` words.
//
//   const chat = useConversation(card.steps);
//   chat.messages  → [{ id, from: "me" | "her", text, swatch? }]
//   chat.typing    → true while "you" are typing
//   chat.prompt    → the step she's answering now (null while you're typing)
//   chat.answer(reply) → send her reply; returns true if it was the last one
//   chat.done      → every step answered
//   chat.answers   → [{ type, question, answer, pushback }] for everything she replied

const asLines = (question) => (Array.isArray(question) ? question : [question]).filter(Boolean);

// Longer lines "take longer to type", within reason.
const typingTime = (line) => Math.min(1500, Math.max(650, 380 + line.length * 16));

export default function useConversation(steps) {
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [prompt, setPrompt] = useState(null);
  const [done, setDone] = useState(false);
  const queue = useRef([]);
  const answers = useRef([]);
  const nextId = useRef(0);
  const later = useTimeout();

  const push = useCallback((from, content) => {
    const id = nextId.current++;
    setMessages((list) => [...list, { id, from, ...content }]);
  }, []);

  // "Type" your lines one bubble at a time, then run `then`.
  const say = useCallback(
    (lines, then) => {
      let t = 350;
      for (const line of lines) {
        later(() => setTyping(true), t);
        t += typingTime(line);
        later(() => {
          setTyping(false);
          push("me", { text: line });
          playSound("message");
        }, t);
        t += 280;
      }
      later(then, t);
    },
    [later, push],
  );

  // Send your line(s) for a step, then show her reply options.
  const ask = useCallback((step) => say([...(step.messages ?? []), ...asLines(step.question)], () => setPrompt(step)), [say]);

  // Start the chat.
  useEffect(() => {
    queue.current = [...steps];
    const first = queue.current.shift();
    if (first) ask(first);
    else setDone(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // reply = { text, swatch?, value, option?, followUp? }
  const answer = (reply) => {
    const step = prompt;
    if (!step) return false;
    setPrompt(null);
    push("her", { text: reply.text, swatch: reply.swatch });
    answers.current.push({
      type: step.type,
      question: asLines(step.question).join(" "),
      answer: reply.value ?? reply.text,
      pushback: Boolean(reply.option?.pushback), // she picked the playful "No"
    });

    // An answer that isn't allowed (e.g. "good friend"): tease and ask again.
    const blocked = step.notAllowed;
    const said = String(reply.value ?? reply.text).toLowerCase();
    if (blocked && blocked.words.some((word) => said.includes(word.toLowerCase()))) {
      queue.current.unshift({ ...step, messages: [blocked.reply], question: blocked.retry ?? step.question });
    }

    // A playful "No": answer back and ask again before moving on.
    if (reply.option?.pushback) {
      const { messages: lines, question, options } = reply.option.pushback;
      queue.current.unshift({ type: "choice", messages: lines, question, options });
    }

    // Games can hand back a reaction (e.g. a quiz score) that you "say" next.
    const reaction = reply.followUp ?? [];
    const next = queue.current.shift();
    if (next) later(() => ask(reaction.length ? { ...next, messages: [...reaction, ...(next.messages ?? [])] } : next), 550);
    else later(() => say(reaction, () => later(() => setDone(true), 900)), 550);
    return !next;
  };

  return { messages, typing, prompt, done, answer, answers: answers.current };
}
