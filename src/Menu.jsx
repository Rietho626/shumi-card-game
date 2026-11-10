import { useState } from "react";
import campestral from "./assets/campestral/cardData.js";
import { DECK_RULES } from "./setup.js";
import HowToPlayModal from "./components/HowToPlayModal.jsx";

function Menu({
  decksConfig,
  hasSavedSession,
  onStartNewGame,
  onResumeGame,
  onOpenDeckBuilder,
  headlineRef
}) {
  const [showGuide, setShowGuide] = useState(false);
  const playerValid = decksConfig.player.actionDeckIds.length === DECK_RULES.actionDeckSize;
  const aiValid = decksConfig.opponent.actionDeckIds.length === DECK_RULES.actionDeckSize;
  const canStart = playerValid && aiValid;

  const pUpper = decksConfig.player.upperRuneId ? campestral[decksConfig.player.upperRuneId]?.name : "None";
  const pLower = decksConfig.player.lowerRuneId ? campestral[decksConfig.player.lowerRuneId]?.name : "Combined (↕)";
  const aiUpper = decksConfig.opponent.upperRuneId ? campestral[decksConfig.opponent.upperRuneId]?.name : "None";
  const aiLower = decksConfig.opponent.lowerRuneId ? campestral[decksConfig.opponent.lowerRuneId]?.name : "Combined (↕)";

  return (
    <div id="menu" className="shumi-menu-screen">
      <div className="menu-content-card">
        <div className="menu-badge">CAMPESTRAL ARCHETYPE EDITION</div>
        <h1 id="menu-headline" ref={headlineRef} className="menu-title">
          SHUMI
        </h1>
        <p className="menu-subtitle">Tactical Yao &amp; Lane Card Battles</p>

        <div className="menu-deck-status-row">
          <div className={`menu-deck-pill ${playerValid ? "ok" : "warn"}`}>
            <div className="pill-header">Your Loadout</div>
            <div className="pill-main">
              Action: <strong>{decksConfig.player.actionDeckIds.length}/{DECK_RULES.actionDeckSize}</strong> • Yao:{" "}
              <strong>{decksConfig.player.yaoDeckIds.length}</strong>
            </div>
            <div className="pill-sub">
              Runes: {pUpper} {decksConfig.player.upperRuneId ? `/ ${pLower}` : ""}
            </div>
          </div>

          <div className={`menu-deck-pill ${aiValid ? "ok" : "warn"}`}>
            <div className="pill-header">AI Loadout</div>
            <div className="pill-main">
              Action: <strong>{decksConfig.opponent.actionDeckIds.length}/{DECK_RULES.actionDeckSize}</strong> • Yao:{" "}
              <strong>{decksConfig.opponent.yaoDeckIds.length}</strong>
            </div>
            <div className="pill-sub">
              Runes: {aiUpper} {decksConfig.opponent.upperRuneId ? `/ ${aiLower}` : ""}
            </div>
          </div>
        </div>

        {!canStart && (
          <div className="menu-validation-alert">
            Both Player and AI Action Decks must contain exactly {DECK_RULES.actionDeckSize} cards before starting a new match.
          </div>
        )}

        <div className="menu-actions">
          {hasSavedSession && (
            <button className="shumi-btn primary resume-btn" onClick={onResumeGame}>
              ▶ Resume Active Match
            </button>
          )}
          <button
            className="shumi-btn primary start-btn"
            disabled={!canStart}
            onClick={onStartNewGame}
          >
            ⚔ {hasSavedSession ? "Start New Match" : "Enter the Battlefield"}
          </button>
          <button className="shumi-btn secondary builder-btn" onClick={onOpenDeckBuilder}>
            ✦ Deck &amp; Rune Forge (Player &amp; AI)
          </button>
          <button className="shumi-btn secondary guide-btn" onClick={() => setShowGuide(true)}>
            📖 How to Play Guide
          </button>
        </div>
      </div>

      {showGuide && <HowToPlayModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}

export default Menu;
