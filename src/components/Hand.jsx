import { useState } from "react";
import HandCard from "./displayedCards/HandCards.jsx";

function Hand({
  player,
  setPreviewState,
  playCardLogic,
  allRefs,
  engine,
  checkTargetable,
  mulligan,
  onPlayHandCard
}) {
  const state = engine.current.state;
  const [expansion, setExpansion] = useState(false);
  const handCards = state[player].hand || [];
  const isMulligan = Boolean(mulligan?.mulliganState?.cards && player === "player");

  return (
    <div
      id={`${player}-hand`}
      ref={allRefs?.[player]?.hand}
      className={[
        "hand-drawer",
        player === "player" ? "player-hand-drawer" : "opponent-hand-drawer",
        expansion || isMulligan ? `${player}-expanded` : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseEnter={() => setExpansion(true)}
      onMouseLeave={() => setExpansion(false)}
    >
      <div className="hand-drawer-tab">
        {player === "player"
          ? `Your Hand (${handCards.length}) — Click a Card to Play`
          : `Opponent Hand (${handCards.length})`}
      </div>
      <div className="hand-cards-row">
        {handCards.map((card, idx) => (
          <HandCard
            allRefs={allRefs}
            player={player}
            setPreviewState={setPreviewState}
            playCardLogic={playCardLogic}
            card={card}
            idx={idx}
            key={`${card.id}_${card.cardNr || idx}`}
            engine={engine}
            checkTargetable={checkTargetable}
            mulligan={mulligan}
            onPlayHandCard={onPlayHandCard}
          />
        ))}
      </div>
    </div>
  );
}

export default Hand;
