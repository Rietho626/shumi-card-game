import { useState, useRef, useEffect } from "react";

import GameBoard from "./components/GameBoard.jsx";
import GameInfo from "./components/GameInfo.jsx";
import getSetup from "./setup.js";
import PreviewModal from "./components/PreviewModal.jsx";
import campestral from "./assets/campestral/cardData.js";
import TheStack from "./components/TheStack.jsx";
import GameEngine from "./gameLogic.js";
import HowToPlayModal from "./components/HowToPlayModal.jsx";

function Game({ decksConfig, initialSavedState, onReturnToMenu, onStartNewMatch }) {
  const [, setVersion] = useState(0);
  const rerender = () => setVersion((v) => v + 1);

  const engine = useRef(null);
  if (!engine.current) {
    engine.current = new GameEngine(
      getSetup("player", decksConfig),
      getSetup("opponent", decksConfig),
      rerender,
      initialSavedState
    );
  }

  const state = engine.current.state;

  const [previewState, setPreviewState] = useState({});
  const [playCardState, setPlayCardState] = useState({});
  const [gameInfoState, setGameInfoState] = useState({});
  const [mulliganState, setMulliganState] = useState({});

  const [selectedShumi, setSelectedShumi] = useState(null); // { cardNr, owner }
  const [inspectedZone, setInspectedZone] = useState(null); // { player, zoneType, label, cards }
  const [showCombatLog, setShowCombatLog] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const cancelPlayRef = useRef(null);

  const allRefs = {
    player: {
      frontline: useRef(null),
      backline: useRef(null),
      crystalZone: useRef(null),
      actionDeck: useRef(null),
      upperRuneZone: useRef(null),
      lowerRuneZone: useRef(null),
      yaoDeck: useRef(null),
      yaoReserve: useRef(null),
      spiritedAway: useRef(null),
      restingGrounds: useRef(null),
      hand: useRef(null),
      player: useRef(null),
      handCards: useRef({}),
      restingGroundsCards: useRef({}),
      spiritedAwayCards: useRef({}),
      frontlineCards: useRef({}),
      backlineCards: useRef({}),
      crystalZoneCards: useRef({})
    },
    opponent: {
      frontline: useRef(null),
      backline: useRef(null),
      crystalZone: useRef(null),
      actionDeck: useRef(null),
      upperRuneZone: useRef(null),
      lowerRuneZone: useRef(null),
      yaoDeck: useRef(null),
      yaoReserve: useRef(null),
      spiritedAway: useRef(null),
      restingGrounds: useRef(null),
      hand: useRef(null),
      player: useRef(null),
      handCards: useRef({}),
      restingGroundsCards: useRef({}),
      spiritedAwayCards: useRef({}),
      frontlineCards: useRef({}),
      backlineCards: useRef({}),
      crystalZoneCards: useRef({})
    }
  };

  useEffect(() => {
    const triggers = [
      {
        name: "drawDecision",
        callback: () => {
          setGameInfoState({ msg: "Choose where to draw from", action: "draw" });
          engine.current.assignPriority("");
        }
      },
      {
        name: "resetGameInfo",
        callback: () => {
          setGameInfoState({});
        }
      },
      {
        name: "drawPhaseDrawDecision",
        callback: () => {
          setGameInfoState({ msg: "Draw Phase: Choose which deck to draw from", action: "drawPhaseDraw" });
          engine.current.assignPriority("");
        }
      },
      {
        name: "drawHand",
        callback: (isStartingPlayer) => {
          setGameInfoState({
            msg: "Draw Starting Hand",
            action: "drawHand",
            drawn: 0,
            max: isStartingPlayer ? 6 : 7
          });
        }
      },
      {
        name: "mulligan",
        callback: () => {
          setGameInfoState({ msg: "Mulligan: Click up to 3 cards in your hand to redraw", action: "mulligan" });
          setMulliganState({ cards: [] });
        }
      },
      {
        name: "waitForAI",
        callback: (waitingFor) => {
          setGameInfoState({
            msg: `Waiting for Opponent to ${waitingFor.waitingFor}...`,
            action: "wait"
          });
        }
      }
    ];

    engine.current.enableTriggers(triggers);

    if (!state.gameInfo.started) {
      state.gameInfo.started = true;
      engine.current.startGame();
    } else {
      // Resuming a saved session after page reload!
      if (state.gameInfo.phase === "preGame") {
        const isStarter = state.gameInfo.startingPlayer === "player";
        const targetMax = isStarter ? 6 : 7;
        if (state.player.hand.length < targetMax) {
          setGameInfoState({
            msg: "Draw Starting Hand",
            action: "drawHand",
            drawn: state.player.hand.length,
            max: targetMax
          });
        } else {
          setGameInfoState({ msg: "Mulligan: Click up to 3 cards in your hand to redraw", action: "mulligan" });
          setMulliganState({ cards: [] });
        }
      } else if (
        state.gameInfo.phase === "drawPhase" &&
        state.gameInfo.activePlayer === "player" &&
        state.gameInfo.priority.player === ""
      ) {
        setGameInfoState({ msg: "Draw Phase: Choose which deck to draw from", action: "drawPhaseDraw" });
      } else if (
        state.gameInfo.phase === "drawPhase" &&
        state.gameInfo.activePlayer === "opponent" &&
        state.gameInfo.priority.player === ""
      ) {
        engine.current.drawPhase();
      } else if (state.gameInfo.priority.player === "opponent") {
        engine.current.checkForAIResponse();
      } else if (
        state.gameInfo.priority.player === "player" &&
        state.gameInfo.phase !== "actionPhase" &&
        state.gameInfo.phase !== "preGame"
      ) {
        engine.current.passIfNoPlay("player");
      }
      rerender();
    }
  }, []);

  // ==========================================
  // HAND CARD PLAY / BURST FLOW
  // ==========================================

  async function handlePlayHandCard(card) {
    setSelectedShumi(null);
    const cardDef = campestral[card.id];
    if (!cardDef) return;

    const canPlayNormal = engine.current.checkCanPlay("player", cardDef);
    const handAbilities = engine.current.checkCanActivateAbilities("player", card);

    if (cardDef.type === "crystal" && canPlayNormal && handAbilities.length > 0) {
      const choice = await engine.current.askPlayerChoice({
        type: "crystal_play_or_burst",
        title: cardDef.name,
        message: "Would you like to play this Crystal into your Crystal Zone, or Burst it from hand?",
        options: [
          { label: "Play to Crystal Zone (+1 Yao per turn)", value: "play" },
          { label: "Burst (Destroy in hand: Target Shumi Prospers 1)", value: "burst" },
          { label: "Cancel", value: null }
        ]
      });
      if (choice === "play") {
        await engine.current.initiatePlayFromHand("player", card);
      } else if (choice === "burst") {
        await engine.current.activateAbility("player", card, handAbilities[0]);
      }
      rerender();
      return;
    }

    if (handAbilities.length > 0 && !canPlayNormal) {
      await engine.current.activateAbility("player", card, handAbilities[0]);
      rerender();
      return;
    }

    if (canPlayNormal) {
      await engine.current.initiatePlayFromHand("player", card);
      rerender();
    }
  }

  // ==========================================
  // BATTLEFIELD SHUMI TACTICAL MENU
  // ==========================================

  function handleSelectBattlefieldCard(card, owner) {
    setSelectedShumi({ cardNr: card.cardNr, owner });
  }

  const liveSelectedInfo = selectedShumi
    ? engine.current.findShumiByCardNr(selectedShumi.cardNr)
    : null;

  return (
    <div id="game" className="shumi-game-layout">
      <GameBoard
        allRefs={allRefs}
        setPreviewState={setPreviewState}
        playCardLogic={{ cancelPlayRef, playCardState }}
        player="opponent"
        engine={engine}
        setVersion={setVersion}
        mulligan={{ mulliganState, setMulliganState }}
        onSelectCard={handleSelectBattlefieldCard}
        onInspectZone={setInspectedZone}
      />

      <GameInfo
        allRefs={allRefs}
        cancelPlayRef={cancelPlayRef}
        playCardState={playCardState}
        gameInfoState={gameInfoState}
        engine={engine}
        setVersion={setVersion}
        setGameInfoState={setGameInfoState}
        mulligan={{ mulliganState, setMulliganState }}
        onReturnToMenu={onReturnToMenu}
        onToggleCombatLog={() => setShowCombatLog((v) => !v)}
        showCombatLog={showCombatLog}
        onOpenGuide={() => setShowGuide(true)}
      />

      <GameBoard
        allRefs={allRefs}
        setPreviewState={setPreviewState}
        playCardLogic={{ cancelPlayRef, playCardState }}
        player="player"
        engine={engine}
        setVersion={setVersion}
        mulligan={{ mulliganState, setMulliganState }}
        onSelectCard={handleSelectBattlefieldCard}
        onPlayHandCard={handlePlayHandCard}
        onInspectZone={setInspectedZone}
      />

      <PreviewModal previewState={previewState} />

      {showGuide && <HowToPlayModal onClose={() => setShowGuide(false)} />}

      {Boolean(state.gameInfo.theStack.length) && (
        <TheStack setPreviewState={setPreviewState} engine={engine} setVersion={setVersion} />
      )}

      {/* Selected Shumi Tactical Action Modal */}
      {liveSelectedInfo && (
        <div className="shumi-modal-backdrop" onClick={() => setSelectedShumi(null)}>
          <div className="shumi-action-modal" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const { card, player, lane } = liveSelectedInfo;
              const def = campestral[card.id] || {};
              const isFriendly = player === "player";
              const currentHp = engine.current.getCurrentHp(player, card);
              const maxHp = engine.current.getMaxHp(player, card);
              const availableAttacks = isFriendly ? engine.current.getAvailableAttacks("player", card) : [];
              const attackCheck = isFriendly ? engine.current.canAttack("player", card) : { canAttack: false };
              const activatableAbilities = isFriendly ? engine.current.checkCanActivateAbilities("player", card) : [];
              const laneMoveCheck = isFriendly ? engine.current.canChangeLane("player", card) : { canMove: false };

              const allAttacks = [
                ...(def.baseAttacks || []).map((a) => ({ ...a, cat: "Base Attack" })),
                ...(def.specialAttacks || []).map((a) => ({ ...a, cat: "Special Attack" }))
              ];

              return (
                <>
                  <div className="sam-header">
                    <img src={def.src} alt={def.name} className="sam-card-thumb" />
                    <div className="sam-title-block">
                      <h3>
                        {def.name}{" "}
                        <span className="sam-lane-pill">
                          {player === "player" ? "Friendly" : "Enemy"} • {lane === "frontline" ? "Frontline" : "Backline"}
                        </span>
                      </h3>
                      <div className="sam-stat-badges">
                        <span className="sam-badge hp">
                          ♥ {currentHp} / {maxHp} LF
                        </span>
                        <span className="sam-badge yao">✦ {card.storedYao || 0} Stored Yao</span>
                        <span className={`sam-badge ${card.momentum ? "mom-on" : "mom-off"}`}>
                          {card.momentum ? "⚡ Has Momentum" : "⏳ No Momentum"}
                        </span>
                      </div>
                      {def.text && <p className="sam-rules-summary">{def.text}</p>}
                    </div>
                    <button className="sam-close-btn" onClick={() => setSelectedShumi(null)}>
                      ✕
                    </button>
                  </div>

                  {isFriendly ? (
                    <div className="sam-sections">
                      {/* Attacks Section */}
                      <div className="sam-section">
                        <h4>⚔ Attacks</h4>
                        {!attackCheck.canAttack && (
                          <div className="sam-hint-msg">
                            {attackCheck.reason === "m_shumi_on_backline"
                              ? "Melee Shumi must be on the Frontline to attack."
                              : !card.momentum
                              ? "Requires Momentum to attack."
                              : "Can only attack during your Action Phase with an empty Stack."}
                          </div>
                        )}
                        <div className="sam-action-list">
                          {allAttacks.map((att) => {
                            const isUsable = availableAttacks.some((u) => u.id === att.id || u.name === att.name);
                            const calcDmg = engine.current.calculateAttackDamage("player", card, att);
                            return (
                              <div key={att.id || att.name} className="sam-action-item">
                                <div className="sam-action-info">
                                  <strong>
                                    [{att.cat}] {att.name}
                                  </strong>{" "}
                                  — <span className="sam-cost">Cost: {att.yaoCost || 0} Yao</span> •{" "}
                                  <span className="sam-dmg">Damage: {calcDmg}</span>
                                  {att.text && <div className="sam-subtext">{att.text}</div>}
                                </div>
                                <button
                                  className="shumi-btn primary small"
                                  disabled={!isUsable}
                                  onClick={async () => {
                                    setSelectedShumi(null);
                                    await engine.current.declareAttack("player", card.cardNr, att.id || att.name);
                                    rerender();
                                  }}
                                >
                                  Attack
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Activated Abilities Section */}
                      {(def.abilities || []).some((ab) => ab.trigger?.type === "activated") && (
                        <div className="sam-section">
                          <h4>✦ Activated Abilities</h4>
                          <div className="sam-action-list">
                            {(def.abilities || [])
                              .filter((ab) => ab.trigger?.type === "activated")
                              .map((ab) => {
                                const isUsable = activatableAbilities.some((u) => u.id === ab.id);
                                return (
                                  <div key={ab.id} className="sam-action-item">
                                    <div className="sam-action-info">
                                      <strong>{ab.name || "Ability"}</strong> (Speed: {ab.speed?.toUpperCase()})
                                      <div className="sam-subtext">{ab.text}</div>
                                    </div>
                                    <button
                                      className="shumi-btn secondary small"
                                      disabled={!isUsable}
                                      onClick={async () => {
                                        setSelectedShumi(null);
                                        await engine.current.activateAbility("player", card, ab);
                                        rerender();
                                      }}
                                    >
                                      Activate
                                    </button>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}

                      {/* Lane Movement Section */}
                      <div className="sam-section">
                        <h4>⇄ Lane Repositioning</h4>
                        <div className="sam-action-item">
                          <div className="sam-action-info">
                            <strong>
                              Move to {lane === "frontline" ? "Backline" : "Frontline"}
                            </strong>
                            <div className="sam-subtext">
                              {laneMoveCheck.canMove
                                ? laneMoveCheck.canChoosePayment
                                  ? "Choose how to pay: use your 1 Free Lane Change for this turn, or spend Momentum."
                                  : laneMoveCheck.costsMomentum
                                  ? "Costs Momentum (Free lane change already used this turn)"
                                  : "Free Move (Uses your 1 free lane change for this turn)"
                                : laneMoveCheck.reason}
                            </div>
                          </div>
                          {laneMoveCheck.canChoosePayment ? (
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button
                                className="shumi-btn secondary small"
                                onClick={() => {
                                  engine.current.changeLane("player", card.cardNr, "free");
                                  setSelectedShumi(null);
                                  rerender();
                                }}
                              >
                                Move (Free)
                              </button>
                              <button
                                className="shumi-btn secondary small"
                                onClick={() => {
                                  engine.current.changeLane("player", card.cardNr, "momentum");
                                  setSelectedShumi(null);
                                  rerender();
                                }}
                              >
                                Move (Spend ⚡)
                              </button>
                            </div>
                          ) : (
                            <button
                              className="shumi-btn secondary small"
                              disabled={!laneMoveCheck.canMove}
                              onClick={() => {
                                engine.current.changeLane("player", card.cardNr);
                                setSelectedShumi(null);
                                rerender();
                              }}
                            >
                              {laneMoveCheck.canMove
                                ? laneMoveCheck.costsMomentum
                                  ? "Move (Spend ⚡)"
                                  : "Move (Free)"
                                : "Cannot Move"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="sam-enemy-note">
                      Inspecting Opponent&apos;s Shumi. Hover or read abilities above.
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Interactive Choice / Cost Payment / Target Selection Modal */}
      {state.gameInfo.prompt && (
        <div className="shumi-modal-backdrop prompt-backdrop">
          <div className="shumi-action-modal prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sam-header">
              <div className="sam-title-block">
                <h3>✦ {state.gameInfo.prompt.title || "Decision Required"}</h3>
                <p className="sam-rules-summary" style={{ fontSize: "0.95rem", color: "#e5e7eb" }}>
                  {state.gameInfo.prompt.message}
                </p>
              </div>
            </div>
            <div className="sam-sections">
              <div className="sam-action-list">
                {state.gameInfo.prompt.type === "target_selection" ? (
                  <>
                    {(state.gameInfo.prompt.legalTargets || []).map((t, i) => (
                      <button
                        key={t.cardNr || t.player || i}
                        className="shumi-btn primary"
                        style={{ width: "100%", textAlign: "left", justifyContent: "flex-start", padding: "10px 14px" }}
                        onClick={() => {
                          engine.current.resolvePrompt(t);
                          rerender();
                        }}
                      >
                        ◎ {t.label}
                      </button>
                    ))}
                    {state.gameInfo.prompt.optional && (
                      <button
                        className="shumi-btn secondary"
                        style={{ width: "100%", marginTop: "6px" }}
                        onClick={() => {
                          engine.current.resolvePrompt(null);
                          rerender();
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </>
                ) : (
                  (state.gameInfo.prompt.options || []).map((opt, i) => (
                    <button
                      key={i}
                      className={`shumi-btn ${opt.value === null ? "secondary" : "primary"}`}
                      style={{ width: "100%", textAlign: "left", justifyContent: "flex-start", padding: "10px 14px" }}
                      onClick={() => {
                        engine.current.resolvePrompt(opt.value);
                        rerender();
                      }}
                    >
                      {opt.label}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zone Inspector Modal (Resting Grounds / Spirited Away) */}
      {inspectedZone && (
        <div className="shumi-modal-backdrop" onClick={() => setInspectedZone(null)}>
          <div className="shumi-zone-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sam-header">
              <h3>
                {inspectedZone.player === "player" ? "Your" : "Opponent's"} {inspectedZone.label} (
                {inspectedZone.cards.length})
              </h3>
              <button className="sam-close-btn" onClick={() => setInspectedZone(null)}>
                ✕
              </button>
            </div>
            <div className="zone-modal-grid">
              {inspectedZone.cards.map((c, i) => {
                const d = campestral[c.id] || {};
                return (
                  <div
                    key={`${c.cardNr}_${i}`}
                    className="zone-modal-card"
                    onMouseEnter={() => d.src && setPreviewState({ src: d.src, card: d })}
                    onMouseLeave={() => setPreviewState({})}
                  >
                    <img src={d.src} alt={d.name} />
                    <span>{d.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Battle Log Drawer */}
      {showCombatLog && (
        <div className="combat-log-drawer">
          <div className="cl-header">
            <span>📜 Battle Log</span>
            <button onClick={() => setShowCombatLog(false)}>✕</button>
          </div>
          <div className="cl-entries">
            {(state.gameInfo.combatLog || []).map((entry) => (
              <div key={entry.id} className={`cl-item cl-${entry.type || "info"}`}>
                <span className="cl-turn">[C{entry.turn}]</span> {entry.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {state.gameInfo.winner && (
        <div className="shumi-modal-backdrop gameover-backdrop">
          <div className="gameover-modal">
            <div className="gameover-badge">
              {state.gameInfo.winner === "player"
                ? "🏆 VICTORY"
                : state.gameInfo.winner === "opponent"
                ? "💀 DEFEAT"
                : "⚖ DRAW"}
            </div>
            <h2>
              {state.gameInfo.winner === "player"
                ? "You Triumphed in the Grasslands!"
                : state.gameInfo.winner === "opponent"
                ? "The Opponent Prevailed"
                : "Stalemate"}
            </h2>
            <p>{state.gameInfo.winReason}</p>
            <div className="gameover-actions">
              <button className="shumi-btn primary" onClick={onStartNewMatch}>
                ⚔ Play Again
              </button>
              <button className="shumi-btn secondary" onClick={onReturnToMenu}>
                ☰ Main Menu &amp; Deck Forge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Game;
