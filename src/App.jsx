import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import Background from "./components/Background";
import Landing from "./phases/Landing";
import GamePhase from "./phases/GamePhase";
import MemoryVault from "./phases/MemoryVault";
import Finale from "./phases/Finale";

// The four phases, in order. App only decides which one is on screen;
// each phase calls its `on…` prop when it's time to move on.
const PHASES = {
  LANDING: "landing",
  GAME: "game",
  VAULT: "vault",
  FINALE: "finale",
};

export default function App() {
  const [currentPhase, setCurrentPhase] = useState(PHASES.LANDING);
  // Everything she gives along the way, for the trip-recap email at the end.
  const [player, setPlayer] = useState({ email: "", game: null, vault: {} });

  // Each phase starts at the top of the page.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentPhase]);

  return (
    // reducedMotion="user" tones animations down for people who ask their OS for less motion.
    <MotionConfig reducedMotion="user">
      <main className="relative isolate min-h-dvh overflow-x-clip">
        <Background phase={currentPhase} />

        {/* mode="wait" lets the old phase finish its exit before the next one enters. */}
        <AnimatePresence mode="wait">
          {currentPhase === PHASES.LANDING && (
            <Landing
              key={PHASES.LANDING}
              initialEmail={player.email}
              onStart={(email) => {
                setPlayer({ email, game: null, vault: {} });
                setCurrentPhase(PHASES.GAME);
              }}
            />
          )}
          {currentPhase === PHASES.GAME && (
            <GamePhase
              key={PHASES.GAME}
              onWin={(game) => {
                setPlayer((p) => ({ ...p, game }));
                setCurrentPhase(PHASES.VAULT);
              }}
            />
          )}
          {currentPhase === PHASES.VAULT && (
            <MemoryVault
              key={PHASES.VAULT}
              onNext={(vault) => {
                setPlayer((p) => ({ ...p, vault }));
                setCurrentPhase(PHASES.FINALE);
              }}
            />
          )}
          {currentPhase === PHASES.FINALE && (
            <Finale key={PHASES.FINALE} player={player} onRestart={() => setCurrentPhase(PHASES.LANDING)} />
          )}
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
