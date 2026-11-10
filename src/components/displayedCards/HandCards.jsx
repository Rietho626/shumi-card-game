import campestral from "../../assets/campestral/cardData.js";

function HandCard({
  player,
  setPreviewState,
  dragLogic,
  card,
  idx,
  allRefs,
  engine,
  mulligan,
  onPlayHandCard
}) {
  const cardDef = campestral[card.id] || {};
  const isMulliganActive = Boolean(mulligan?.mulliganState?.cards && player === "player");
  const isSelectedForMulligan =
    isMulliganActive && mulligan.mulliganState.cards.some((el) => el.cardNr === card.cardNr);

  const canPlayCard =
    player === "player" && !isMulliganActive && engine.current.checkCanPlay("player", cardDef);
  const handAbilities =
    player === "player" && !isMulliganActive
      ? engine.current.checkCanActivateAbilities("player", card)
      : [];
  const isActionable = canPlayCard || handAbilities.length > 0;

  function chooseForMulligan() {
    if (!mulligan?.mulliganState?.cards) return;
    if (isSelectedForMulligan) {
      mulligan.setMulliganState((prev) => ({
        cards: prev.cards.filter((el) => el.cardNr !== card.cardNr)
      }));
    } else if (mulligan.mulliganState.cards.length < 3) {
      mulligan.setMulliganState((prev) => ({
        cards: [...prev.cards, { ...card }]
      }));
    }
  }

  function handleCardClick(e) {
    e.stopPropagation();
    if (player !== "player") return;
    if (isMulliganActive) {
      chooseForMulligan();
      return;
    }
    if (isActionable && onPlayHandCard) {
      setPreviewState({});
      onPlayHandCard(card);
    }
  }

  const dragInlineStyle =
    idx === "dragged"
      ? {
          position: "fixed",
          left: dragLogic?.dragState?.x ?? 0,
          top: dragLogic?.dragState?.y ?? 0,
          pointerEvents: "none",
          zIndex: 100
        }
      : undefined;

  const imgSrc = player === "opponent" ? "card-bg.png" : cardDef.src;

  return (
    <div
      id={`${player}-hand-card-${idx}`}
      className={[
        "hand-card",
        player === "opponent" ? "opponent-hand-card" : "player-hand-card",
        isActionable ? "playable-glow" : "",
        isSelectedForMulligan ? "mulligan-selected" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      style={dragInlineStyle}
      ref={(el) => {
        if (allRefs?.[player]?.handCards?.current) {
          allRefs[player].handCards.current[`${player}-hand-card-${idx}`] = el;
        }
      }}
      onMouseEnter={() => {
        if (player === "player" && cardDef.src) {
          setPreviewState({ src: cardDef.src, card: cardDef });
        }
      }}
      onMouseLeave={() => setPreviewState({})}
      onClick={handleCardClick}
      onMouseDown={(e) => {
        if (
          player === "player" &&
          !isMulliganActive &&
          isActionable &&
          dragLogic?.handleStartDrag &&
          e.button === 0
        ) {
          setPreviewState({});
          dragLogic.handleStartDrag(
            card,
            allRefs[player]?.handCards?.current?.[`${player}-hand-card-${idx}`],
            e
          );
        }
      }}
    >
      <img src={imgSrc} alt={player === "player" ? cardDef.name : "Card Back"} draggable="false" />
      {isSelectedForMulligan && <div className="mulligan-tag">REDRAW</div>}
      {player === "player" && handAbilities.length > 0 && !canPlayCard && (
        <div className="burst-ready-tag">BURST</div>
      )}
    </div>
  );
}

export default HandCard;
