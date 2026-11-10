import { useState, useRef, useEffect } from "react";

import Game from "./Game.jsx";
import Disclaimer from "./Disclaimer.jsx";
import Menu from "./Menu.jsx";
import DeckBuilder from "./components/DeckBuilder.jsx";
import {
  loadSavedDecksConfig,
  loadGameSession,
  clearGameSession
} from "./setup.js";

const ACTIVE_SCREEN_KEY = "shumi_active_screen_v1";

function App() {
  const [decksConfig, setDecksConfig] = useState(() => loadSavedDecksConfig());
  const [savedSession, setSavedSession] = useState(() => loadGameSession());
  const [screen, setScreen] = useState(() => {
    const savedScr = localStorage.getItem(ACTIVE_SCREEN_KEY);
    const existingSession = loadGameSession();
    if (savedScr === "game" && existingSession) return "game";
    if (savedScr === "deckBuilder") return "deckBuilder";
    return "menu";
  });

  const [disclaimerState, setDisclaimerState] = useState(() => {
    const alreadySeen = localStorage.getItem("shumi_disclaimer_seen");
    return { show: !alreadySeen, fade: false };
  });

  const disclaimerRef = {
    heading: useRef({}),
    body: useRef({})
  };

  const bgRef = useRef(null);
  const headlineRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(ACTIVE_SCREEN_KEY, screen);
  }, [screen]);

  useEffect(() => {
    if (!disclaimerState.show) return;
    let cancelled = false;

    const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

    async function showLetters(box, glow) {
      let oldKey = null;
      const refs = disclaimerRef[box]?.current || {};
      for (const key in refs) {
        if (cancelled) return;
        await delay(25);
        const el = refs[key];
        if (!el) continue;
        el.classList.remove("black");
        el.classList.add(glow);
        if (oldKey && refs[oldKey]) refs[oldKey].classList.remove(glow);
        oldKey = key;
      }
      if (oldKey && refs[oldKey]) refs[oldKey].classList.remove(glow);
    }

    async function runDisclaimer() {
      await showLetters("heading", "red-glow");
      await showLetters("body", "white-glow");
      if (cancelled) return;
      await delay(800);
      if (cancelled) return;
      setDisclaimerState({ show: true, fade: true });
      await delay(600);
      if (cancelled) return;
      setDisclaimerState({ show: false, fade: false });
      localStorage.setItem("shumi_disclaimer_seen", "true");
    }

    runDisclaimer();
    return () => {
      cancelled = true;
    };
  }, [disclaimerState.show]);

  useEffect(() => {
    if (screen !== "menu") return;

    const bgAnimation = [
      {
        transform: "rotate(45deg) scale(1) translateY(0) translateX(0)",
        filter: "blur(5px) brightness(1.3)",
        opacity: "0.45"
      },
      {
        transform: "rotate(45deg) scale(1.12) translateY(-2%) translateX(-2%)",
        filter: "blur(1px) brightness(1)",
        opacity: "0.65"
      },
      {
        transform: "rotate(45deg) scale(1) translateY(0) translateX(0)",
        filter: "blur(5px) brightness(1.3)",
        opacity: "0.45"
      }
    ];

    const glowAnimation = [
      { textShadow: "0px 0px 25px rgba(56, 239, 125, 0.7)" },
      { textShadow: "0px 0px 70px rgba(56, 239, 125, 1), 0px 0px 25px cyan" },
      { textShadow: "0px 0px 25px rgba(56, 239, 125, 0.7)" }
    ];

    const timing = {
      duration: 5000,
      iterations: Infinity,
      easing: "ease-in-out"
    };

    const bgAnim = bgRef.current?.animate?.(bgAnimation, timing);
    const headAnim = headlineRef.current?.animate?.(glowAnimation, timing);

    return () => {
      bgAnim?.cancel?.();
      headAnim?.cancel?.();
    };
  }, [screen]);

  function skipDisclaimer() {
    setDisclaimerState({ show: false, fade: false });
    localStorage.setItem("shumi_disclaimer_seen", "true");
  }

  function handleStartNewGame() {
    clearGameSession();
    setSavedSession(null);
    setScreen("game");
  }

  function handleResumeGame() {
    const latest = loadGameSession();
    setSavedSession(latest);
    setScreen("game");
  }

  function handleReturnToMenu() {
    setSavedSession(loadGameSession());
    setScreen("menu");
  }

  return (
    <>
      {disclaimerState.show && (
        <div onClick={skipDisclaimer} style={{ cursor: "pointer" }} title="Click anywhere to skip">
          <Disclaimer disclaimerRef={disclaimerRef} disclaimerState={disclaimerState} />
        </div>
      )}

      {screen === "menu" && (
        <Menu
          decksConfig={decksConfig}
          hasSavedSession={Boolean(savedSession && savedSession.gameInfo?.started)}
          onStartNewGame={handleStartNewGame}
          onResumeGame={handleResumeGame}
          onOpenDeckBuilder={() => setScreen("deckBuilder")}
          bgRef={bgRef}
          headlineRef={headlineRef}
        />
      )}

      {screen === "deckBuilder" && (
        <DeckBuilder
          decksConfig={decksConfig}
          setDecksConfig={setDecksConfig}
          onBack={() => setScreen("menu")}
        />
      )}

      {screen === "game" && (
        <Game
          decksConfig={decksConfig}
          initialSavedState={savedSession}
          onReturnToMenu={handleReturnToMenu}
          onStartNewMatch={handleStartNewGame}
        />
      )}
    </>
  );
}

export default App;
