function GameInfo({
  gameInfoState,
  engine,
  setVersion,
  setGameInfoState,
  mulligan,
  onReturnToMenu,
  onToggleCombatLog,
  showCombatLog
}) {
  const state = engine.current.state;
  const prompt = state.gameInfo.prompt;

  const phases = {
    preGame: "Pre-Game",
    yaoPhase: "Yao Phase",
    drawPhase: "Draw Phase",
    actionPhase: "Action Phase",
    endPhase: "End Phase",
    gameOver: "Game Over"
  };

  function drawFrom(deck) {
    engine.current.drawCard("player", deck);
    setGameInfoState({});
    setVersion((v) => v + 1);
  }

  function drawPhaseDrawFrom(deck) {
    setGameInfoState({});
    engine.current.drawPhaseDraw(deck);
    setVersion((v) => v + 1);
  }

  function drawHandFrom(deck) {
    if (gameInfoState.drawn < gameInfoState.max) {
      engine.current.drawCard("player", deck);
      setGameInfoState((prev) => ({
        ...prev,
        drawn: prev.drawn + 1
      }));
      setVersion((v) => v + 1);
    }
    if (gameInfoState.drawn === gameInfoState.max - 1) {
      setGameInfoState({});
      engine.current.startMulligan();
    }
  }

  function confirmMulligan() {
    setGameInfoState({});
    engine.current.enactMulligan(mulligan.mulliganState.cards || []);
    mulligan.setMulliganState({});
  }

  function passPrio() {
    engine.current.handlePassPrio("player");
    setVersion((v) => v + 1);
  }

  const isPlayerPriority = state.gameInfo.priority.player === "player";
  const hasPromptOrAction = Boolean(gameInfoState.msg || prompt);

  return (
    <div id="game-info" className="game-info-bar">
      {/* Left: Menu + Log Buttons & Turn / Phase Pills */}
      <div className="gi-left-cluster">
        <button className="gi-nav-btn" onClick={onReturnToMenu} title="Return to Main Menu">
          ☰ Menu
        </button>
        <button
          className={`gi-nav-btn ${showCombatLog ? "active" : ""}`}
          onClick={onToggleCombatLog}
          title="Toggle Battle Log"
        >
          📜 Log ({state.gameInfo.combatLog?.length || 0})
        </button>

        {!hasPromptOrAction && (
          <div className="gi-status-pills">
            <span className="gi-pill cycle-pill">Cycle {state.gameInfo.turn}</span>
            <span className="gi-pill phase-pill">{phases[state.gameInfo.phase] || state.gameInfo.phase}</span>
            <span
              className={`gi-pill turn-pill ${
                state.gameInfo.activePlayer === "player" ? "your-turn" : "opp-turn"
              }`}
            >
              {state.gameInfo.activePlayer === "player" ? "Your Turn" : "AI's Turn"}
            </span>
            <span
              className={`gi-pill prio-pill ${isPlayerPriority ? "your-prio" : "opp-prio"}`}
            >
              Priority: {isPlayerPriority ? "YOU" : state.gameInfo.priority.player === "opponent" ? "AI" : "—"}
            </span>
          </div>
        )}
      </div>

      {/* Center: Prompt or Pre-Game / Draw Phase Decisions */}
      <div className="gi-center-cluster">
        {prompt && (
          <div className="gi-prompt-banner">
            <span className="gi-prompt-title">{prompt.title}:</span>
            <span className="gi-prompt-msg">{prompt.message}</span>
            <div className="gi-choice-buttons">
              {prompt.type === "target_selection" ? (
                <>
                  {(prompt.legalTargets || []).map((t, i) => (
                    <button
                      key={t.cardNr || t.player || i}
                      className="gi-action-btn target-btn"
                      onClick={() => engine.current.resolvePrompt(t)}
                    >
                      ◎ {t.label}
                    </button>
                  ))}
                  {prompt.optional && (
                    <button
                      className="gi-action-btn cancel-btn"
                      onClick={() => engine.current.resolvePrompt(null)}
                    >
                      Cancel
                    </button>
                  )}
                </>
              ) : (
                (prompt.options || []).map((opt, i) => (
                  <button
                    key={i}
                    className={`gi-action-btn ${opt.value === null ? "cancel-btn" : ""}`}
                    onClick={() => engine.current.resolvePrompt(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {!prompt && gameInfoState.msg && (
          <div className="gi-prompt-banner">
            <span className="gi-prompt-msg">
              {gameInfoState.msg}
              {gameInfoState.action === "drawHand"
                ? ` (${gameInfoState.drawn} / ${gameInfoState.max})`
                : ""}
            </span>

            {gameInfoState.action === "draw" && (
              <div className="gi-choice-buttons">
                <button className="gi-action-btn" onClick={() => drawFrom("actionDeck")}>
                  Draw Action Deck ({state.player.actionDeck.length})
                </button>
                <button className="gi-action-btn" onClick={() => drawFrom("yaoDeck")}>
                  Draw Yao Deck ({state.player.yaoDeck.length})
                </button>
              </div>
            )}

            {gameInfoState.action === "drawPhaseDraw" && (
              <div className="gi-choice-buttons">
                <button className="gi-action-btn" onClick={() => drawPhaseDrawFrom("actionDeck")}>
                  Draw Action Deck ({state.player.actionDeck.length})
                </button>
                <button className="gi-action-btn" onClick={() => drawPhaseDrawFrom("yaoDeck")}>
                  Draw Yao Deck ({state.player.yaoDeck.length})
                </button>
              </div>
            )}

            {gameInfoState.action === "drawHand" && (
              <div className="gi-choice-buttons">
                <button className="gi-action-btn" onClick={() => drawHandFrom("actionDeck")}>
                  Draw Action Deck ({state.player.actionDeck.length})
                </button>
                <button className="gi-action-btn" onClick={() => drawHandFrom("yaoDeck")}>
                  Draw Yao Deck ({state.player.yaoDeck.length})
                </button>
              </div>
            )}

            {gameInfoState.action === "mulligan" && (
              <div className="gi-choice-buttons">
                <span className="gi-mulligan-count">
                  Selected: {mulligan?.mulliganState?.cards?.length || 0} / 3
                </span>
                <button className="gi-action-btn primary" onClick={confirmMulligan}>
                  ✓ Confirm Mulligan
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Pass Priority / Phase Controls */}
      <div className="gi-right-cluster">
        {!prompt && isPlayerPriority && (
          <button className="gi-pass-btn" onClick={passPrio}>
            {state.gameInfo.theStack.length > 0
              ? "Resolve / Pass Priority →"
              : state.gameInfo.phase === "actionPhase" && state.gameInfo.activePlayer === "player"
              ? "End Action Phase →"
              : "Pass Priority →"}
          </button>
        )}
      </div>
    </div>
  );
}

export default GameInfo;
