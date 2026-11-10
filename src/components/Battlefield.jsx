import BattlefieldCards from "./displayedCards/BattlefieldCards.jsx";

function Battlefield({
  player,
  lane,
  setPreviewState,
  allRefs,
  engine,
  setVersion,
  onSelectCard
}) {
  const state = engine.current.state;
  const cards = state[player][lane] || [];

  const laneLabel =
    lane === "frontline"
      ? "Frontline"
      : lane === "backline"
      ? "Backline"
      : "Crystal Zone";

  return (
    <div
      id={player + lane}
      className={`bf-lane bf-${lane} ${cards.length === 0 ? "empty-lane" : ""}`}
      ref={allRefs?.[player]?.[lane]}
    >
      <div className="bf-lane-watermark">
        {laneLabel} {lane !== "crystalZone" ? `(${cards.length}/5)` : `(${cards.length})`}
      </div>
      <div className="bf-lane-cards">
        {cards.map((card, idx) => (
          <BattlefieldCards
            allRefs={allRefs}
            player={player}
            lane={lane}
            setPreviewState={setPreviewState}
            card={card}
            key={`${card.id}_${card.cardNr || idx}`}
            idx={idx}
            engine={engine}
            setVersion={setVersion}
            onSelectCard={onSelectCard}
          />
        ))}
      </div>
    </div>
  );
}

export default Battlefield;
