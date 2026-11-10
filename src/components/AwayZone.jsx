import campestral from "../assets/campestral/cardData.js";

function AwayZone({
  player,
  zoneType,
  setPreviewState,
  allRefs,
  engine,
  onInspectZone
}) {
  const state = engine.current.state;
  const cards = state[player][zoneType] || [];
  const topCard = cards[0] ? campestral[cards[0].id] : null;
  const label = zoneType === "restingGrounds" ? "Resting Grounds" : "Spirited Away";

  return (
    <div
      id={`${player}-${zoneType}`}
      ref={allRefs?.[player]?.[zoneType]}
      className={`zone-slot away-slot ${cards.length > 0 ? "has-cards" : ""}`}
      title={`${label} (${cards.length}) — Click to view all cards`}
      onClick={() => {
        if (cards.length > 0 && onInspectZone) {
          onInspectZone({ player, zoneType, label, cards });
        }
      }}
      onMouseEnter={() => {
        if (topCard?.src) setPreviewState({ src: topCard.src, card: topCard });
      }}
      onMouseLeave={() => setPreviewState({})}
    >
      {topCard?.src ? (
        <img src={topCard.src} alt={topCard.name} className="zone-card-img" draggable="false" />
      ) : (
        <span className="zone-placeholder-label">{zoneType === "restingGrounds" ? "Resting" : "Spirited"}</span>
      )}
      <div className="zone-badge-overlay">
        <span className="zone-badge-name">{zoneType === "restingGrounds" ? "Resting" : "Spirited"}</span>
        <span className="zone-badge-count">{cards.length}</span>
      </div>
    </div>
  );
}

export default AwayZone;
