function Player({ player, allRefs, engine }) {
  const state = engine.current.state;
  const hp = state[player].hp;
  const pct = Math.max(0, Math.min(100, (hp / 30) * 100));

  const prompt = state.gameInfo.prompt;
  const isPromptTarget =
    prompt?.type === "target_selection" &&
    prompt.legalTargets?.some((t) => t.type === "player" && t.player === player);

  function handleClick() {
    if (isPromptTarget) {
      const targetObj = prompt.legalTargets.find((t) => t.type === "player" && t.player === player);
      engine.current.resolvePrompt(targetObj);
    }
  }

  return (
    <div
      id={`${player}-player-token`}
      className={`player-life-orb ${hp > 15 ? "healthy" : hp > 7 ? "warn" : "danger"} ${
        isPromptTarget ? "legal-target-pulse" : ""
      }`}
      onClick={handleClick}
      ref={allRefs?.[player]?.player}
      title={`${player === "player" ? "Your" : "Opponent's"} Life: ${hp} / 30`}
    >
      <div
        className="player-life-fill"
        style={{
          height: `${pct}%`,
          [player === "player" ? "bottom" : "top"]: 0
        }}
      />
      <div className="player-life-content">
        <span className="player-life-label">{player === "player" ? "YOU" : "AI"}</span>
        <span className="player-life-value">{hp}</span>
        <span className="player-life-sub">LF</span>
      </div>
    </div>
  );
}

export default Player;
