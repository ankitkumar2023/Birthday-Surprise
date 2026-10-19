import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import Confetti from "react-confetti";
import PhaseTransition from "../components/PhaseTransition";
import VaultDoor from "../vault/VaultDoor";
import ProgressTracker from "../vault/ProgressTracker";
import MemoryCard from "../vault/MemoryCard";
import VideoCard from "../vault/VideoCard";
import VideoModal from "../vault/VideoModal";
import ConversationModal from "../vault/ConversationModal";
import MemoryPhotoModal from "../vault/MemoryPhotoModal";
import FloatingParticles from "../vault/FloatingParticles";
import ContinueButton from "../vault/ContinueButton";
import { stopMemoryAudio, useStopAudioOnUnmount } from "../vault/AudioPlayer";
import { playSound } from "../vault/sounds";
import useWindowSize from "../hooks/useWindowSize";
import { MEMORY_VAULT } from "../config";

// All wording, questions, shayari, photos and music are in config.js (MEMORY_VAULT).
const { cards: CARDS, videos: VIDEOS = [] } = MEMORY_VAULT;

const CONFETTI_COLORS = ["#fde68a", "#f7d070", "#ffa8c5", "#ff85ad", "#d8b4fe", "#ffffff"];
const CONFETTI_SECONDS = 7;

// Phase 3 — the Memory Vault.
//   1. A vault door opens onto a grid of locked memory cards.
//   2. Cards open one at a time, in order. Each is a little conversation.
//   3. Finishing it plays its music, types its shayari and reveals its photo;
//      then the card shows the photo and the next card unlocks.
//   4. Finished cards re-open in a cinematic viewer.
//   5. When all are done, the vault glows, confetti falls, and a big button
//      leads to the finale.
export default function MemoryVault({ onNext }) {
  const [introDone, setIntroDone] = useState(false);
  const [unlocked, setUnlocked] = useState([]); // indexes of finished cards
  const [talking, setTalking] = useState(null); // index whose conversation is open
  const [viewing, setViewing] = useState(null); // index open in the viewer
  const [watching, setWatching] = useState(null); // video index open in the video viewer
  const [videosOpened, setVideosOpened] = useState([]); // bonus videos she has unlocked
  const [videoCelebrating, setVideoCelebrating] = useState(null); // bonus video just unlocked
  const [celebrating, setCelebrating] = useState(null); // index that was just finished
  const [answers, setAnswers] = useState({}); // { [index]: [{ question, answer }] } — her replies
  const [confettiFlowing, setConfettiFlowing] = useState(true);
  const { width, height } = useWindowSize();

  useStopAudioOnUnmount(); // no music follows her into the finale

  const allUnlocked = unlocked.length === CARDS.length;
  const unlockedInOrder = [...unlocked].sort((a, b) => a - b);

  // Cards open in order: a card is ready once every card before it is done.
  const statusOf = (i) => (unlocked.includes(i) ? "done" : CARDS.slice(0, i).every((_, j) => unlocked.includes(j)) ? "open" : "locked");

  const openCard = (i) => {
    const status = statusOf(i);
    if (status === "locked") return;
    playSound("click");
    stopMemoryAudio(); // only one memory's music at a time
    if (status === "done") setViewing(i);
    else setTalking(i);
  };

  const handleComplete = useCallback((i, replies) => {
    setTalking(null);
    setAnswers((all) => ({ ...all, [i]: replies }));
    setUnlocked((list) => (list.includes(i) ? list : [...list, i]));
    setCelebrating(i);
    setTimeout(() => playSound("sparkle"), 300);
  }, []);

  const closeConversation = useCallback(() => setTalking(null), []);
  const closeViewer = useCallback(() => setViewing(null), []);
  const closeVideo = useCallback(() => setWatching(null), []);

  // Once a bonus video is open its preview loops in the grid, so heavy decoration calms down.
  const videoPlaying = videosOpened.length > 0;

  // Bonus videos: locked → "ready" (a gift she taps) → "open".
  const videoStatus = (i) =>
    MEMORY_VAULT.videosUnlockAfterAll !== false && !allUnlocked ? "locked" : videosOpened.includes(i) ? "open" : "ready";

  const openVideo = (i) => {
    const status = videoStatus(i);
    if (status === "locked") return;
    playSound("click");
    stopMemoryAudio(); // the video's own sound takes over
    if (status === "open") return setWatching(i);
    // First tap: the lock bursts open, then the video plays in the viewer.
    setVideosOpened((list) => [...list, i]);
    setVideoCelebrating(i);
    setTimeout(() => playSound("sparkle"), 300);
    setTimeout(() => setWatching(i), 1500);
  };

  const navigate = (step) => {
    const pos = unlockedInOrder.indexOf(viewing);
    setViewing(unlockedInOrder[(pos + step + unlockedInOrder.length) % unlockedInOrder.length]);
  };

  // The "just unlocked" explosion on a card lasts a few seconds.
  useEffect(() => {
    if (celebrating === null) return;
    const timer = setTimeout(() => setCelebrating(null), 3200);
    return () => clearTimeout(timer);
  }, [celebrating]);

  useEffect(() => {
    if (videoCelebrating === null) return;
    const timer = setTimeout(() => setVideoCelebrating(null), 3200);
    return () => clearTimeout(timer);
  }, [videoCelebrating]);

  // Everything unlocked: sparkle, confetti, then let the confetti settle.
  useEffect(() => {
    if (!allUnlocked) return;
    const timers = [
      setTimeout(() => playSound("sparkle"), 900),
      setTimeout(() => playSound("unlock"), 1500),
      setTimeout(() => setConfettiFlowing(false), CONFETTI_SECONDS * 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [allUnlocked]);

  // Her replies stay in this browser only. Handy while testing:
  // open the browser console and type  window.vaultAnswers
  useEffect(() => {
    window.vaultAnswers = answers;
  }, [answers]);

  const continueToFinale = () => {
    playSound("click");
    onNext();
  };

  return (
    <PhaseTransition className="px-4 pb-24 pt-8 sm:px-8 sm:pt-12">
      {/* The background warms to gold once every memory is unlocked. */}
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(247,208,112,0.22),transparent_60%),radial-gradient(circle_at_20%_80%,rgba(255,133,173,0.18),transparent_50%),radial-gradient(circle_at_85%_70%,rgba(192,132,252,0.2),transparent_50%)]"
        initial={false}
        animate={{ opacity: allUnlocked ? 1 : 0 }}
        transition={{ duration: 4, ease: "easeInOut" }}
      />
      {/* Particles and confetti pause while a video plays, so it stays smooth. */}
      <FloatingParticles count={watching !== null ? 0 : videoPlaying ? 20 : allUnlocked ? 80 : 26} />

      <AnimatePresence>{!introDone && <VaultDoor onDone={() => setIntroDone(true)} />}</AnimatePresence>

      {introDone && (
        <>
          <ProgressTracker
            total={CARDS.length}
            unlocked={unlocked}
            label={MEMORY_VAULT.progressLabel}
            doneLabel={MEMORY_VAULT.allDoneBanner}
          />

          <header className="mx-auto mb-10 max-w-2xl text-center">
            <motion.h2
              className="text-balance font-script text-4xl text-blush-100 sm:text-6xl"
              initial={{ opacity: 0, scale: 0.8, filter: "blur(8px)" }}
              animate={{
                opacity: 1,
                scale: 1,
                filter: "blur(0px)",
                textShadow: [
                  "0 0 12px rgba(255,168,197,0.6), 0 0 30px rgba(192,132,252,0.4)",
                  "0 0 20px rgba(255,168,197,0.9), 0 0 50px rgba(192,132,252,0.6)",
                  "0 0 12px rgba(255,168,197,0.6), 0 0 30px rgba(192,132,252,0.4)",
                ],
              }}
              transition={{ duration: 1, textShadow: { duration: 3.5, repeat: Infinity, ease: "easeInOut" } }}
            >
              {MEMORY_VAULT.title}
            </motion.h2>
            <motion.p
              className="mt-3 italic text-lilac-200/85 sm:text-lg"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              {MEMORY_VAULT.subtitle}
            </motion.p>
          </header>

          {/* The vault itself: glows gold when complete */}
          <motion.div
            className="relative mx-auto max-w-4xl rounded-[2rem] border p-3 sm:p-5"
            animate={{ borderColor: allUnlocked ? "rgba(247,208,112,0.45)" : "rgba(255,255,255,0.06)" }}
            transition={{ duration: 3 }}
          >
            {/* The glow is a fixed shadow that only fades in and out (cheap), and
                holds still while a video plays so playback stays smooth. */}
            {allUnlocked && (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[0_0_90px_rgba(247,208,112,0.4)]"
                initial={{ opacity: 0 }}
                animate={watching === null && !videoPlaying ? { opacity: [0.35, 1, 0.35] } : { opacity: 0.6 }}
                transition={watching === null && !videoPlaying ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.6 }}
              />
            )}
            {/* CSS columns give a masonry layout with no extra library. */}
            <div className="columns-2 gap-4 md:columns-3">
              {CARDS.map((card, i) => (
                <MemoryCard
                  key={i}
                  card={card}
                  index={i}
                  status={statusOf(i)}
                  celebrating={celebrating === i}
                  onOpen={openCard}
                  enterDelay={0.6 + i * 0.1}
                />
              ))}
              {VIDEOS.map((video, i) => (
                <VideoCard
                  key={video.src}
                  video={video}
                  index={i}
                  onOpen={openVideo}
                  paused={watching !== null}
                  number={String(i + 1).padStart(2, "0")}
                  status={videoStatus(i)}
                  celebrating={videoCelebrating === i}
                  enterDelay={0.6 + (CARDS.length + i) * 0.1}
                />
              ))}
            </div>
          </motion.div>

          <div className="mt-14 flex min-h-24 justify-center">
            {allUnlocked && <ContinueButton onClick={continueToFinale} calm={watching !== null}>{MEMORY_VAULT.continueLabel}</ContinueButton>}
          </div>
        </>
      )}

      <ConversationModal
        card={talking === null ? null : CARDS[talking]}
        index={talking}
        continueLabel={talking === CARDS.length - 1 ? MEMORY_VAULT.lastRevealContinueLabel : MEMORY_VAULT.revealContinueLabel}
        onClose={closeConversation}
        onComplete={handleComplete}
      />
      <MemoryPhotoModal
        cards={CARDS}
        index={viewing}
        position={{ current: unlockedInOrder.indexOf(viewing) + 1, total: unlockedInOrder.length }}
        onClose={closeViewer}
        onNavigate={navigate}
      />
      <VideoModal videos={VIDEOS} index={watching} onClose={closeVideo} />

      {allUnlocked &&
        watching === null &&
        createPortal(
          <Confetti
            width={width}
            height={height}
            recycle={confettiFlowing}
            numberOfPieces={300}
            gravity={0.14}
            colors={CONFETTI_COLORS}
            style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }}
          />,
          document.body,
        )}
    </PhaseTransition>
  );
}
