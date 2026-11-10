function Deck({ player, deckType, allRefs, engine }) {
  const state = engine.current.state;
  const count = state[player][deckType].length;
  const label = deckType === "actionDeck" ? "Action Deck" : "Yao Deck";

  return (
    <div
      id={player + deckType}
      ref={allRefs?.[player]?.[deckType]}
      className={`zone-slot deck-slot ${count === 0 ? "empty-deck" : ""}`}
      title={`${label} — ${count} cards remaining`}
    >
      {count > 0 ? (
        <img
          src="card-bg.png"
          alt={label}
          className="zone-card-img"
          draggable="false"
        />
      ) : (
        <span className="zone-placeholder-label">Empty</span>
      )}
      <div className="zone-badge-overlay">
        <span className="zone-badge-name">{deckType === "actionDeck" ? "Action" : "Yao"}</span>
        <span className="zone-badge-count">{count}</span>
      </div>
    </div>
  );
}

export default Deck;
