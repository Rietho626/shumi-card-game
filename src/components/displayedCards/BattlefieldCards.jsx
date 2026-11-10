import campestral from "../../assets/campestral/cardData.js";

function BattlefieldCards({
  player,
  lane,
  setPreviewState,
  allRefs,
  idx,
  card,
  engine,
  onSelectCard
}) {
  const cardDef = campestral[card.id] || {};
  const prompt = engine.current.state.gameInfo.prompt;

  const isPromptTarget =
    prompt?.type === "target_selection" &&
    prompt.legalTargets?.some((t) => t.type === "shumi" && t.cardNr === card.cardNr);

  const canAct =
    player === "player" &&
    lane !== "crystalZone" &&
    (engine.current.getAvailableAttacks("player", card).length > 0 ||
      engine.current.checkCanActivateAbilities("player", card).length > 0 ||
      engine.current.canChangeLane("player", card).canMove);

  const currentHp = lane !== "crystalZone" ? engine.current.getCurrentHp(player, card) : null;
  const maxHp = lane !== "crystalZone" ? engine.current.getMaxHp(player, card) : null;
  const baseAttack = cardDef.baseAttacks?.[0];
  const baseDamage =
    lane !== "crystalZone" && baseAttack
      ? engine.current.calculateAttackDamage(player, card, baseAttack)
      : null;

  const hasFlight =
    lane !== "crystalZone" &&
    (cardDef.keywords?.includes("flight") ||
      card.tempKeywords?.some((tk) => tk.keyword === "flight"));

  const picSrc = cardDef.pic || `campestral/pics/${card.id}-pic.png`;

  function handleClick(e) {
    e.stopPropagation();
    if (isPromptTarget) {
      const targetObj = prompt.legalTargets.find((t) => t.type === "shumi" && t.cardNr === card.cardNr);
      engine.current.resolvePrompt(targetObj || card.cardNr);
      return;
    }
    if (lane !== "crystalZone" && onSelectCard) {
      onSelectCard(card, player);
    }
  }

  return (
    <div
      id={`${player}-${lane}-card-${idx}`}
      className={[
        "bf-card",
        lane === "crystalZone" ? "bf-crystal-card" : "bf-shumi-card",
        card.momentum ? "has-momentum" : "",
        canAct ? "can-act" : "",
        isPromptTarget ? "legal-target-pulse" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      ref={(el) => {
        if (allRefs?.[player]?.[lane + "Cards"]?.current) {
          allRefs[player][lane + "Cards"].current[`${player}-${lane}-card-${idx}`] = el;
        }
      }}
      onMouseEnter={() => {
        if (cardDef.src) setPreviewState({ src: cardDef.src, card: cardDef, instance: card });
      }}
      onMouseLeave={() => setPreviewState({})}
      onClick={handleClick}
    >
      <img src={picSrc} alt={cardDef.name || card.id} className="bf-card-art" draggable="false" />
      <div className="bf-card-vignette" />

      <div className="bf-card-top-row">
        {card.momentum && lane !== "crystalZone" && (
          <span className="bf-badge momentum-badge" title="Has Momentum (Ready to Attack)">
            ⚡
          </span>
        )}
        {hasFlight && (
          <span className="bf-badge flight-badge" title="Has Flight">
            🪽
          </span>
        )}
        {(card.storedYao || 0) > 0 && (
          <span className="bf-badge yao-stored-badge" title={`Stored Yao: ${card.storedYao}`}>
            ✦ {card.storedYao}
          </span>
        )}
      </div>

      <div className="bf-card-name-bar">{cardDef.name}</div>

      {lane !== "crystalZone" && (
        <div className="bf-card-bottom-row">
          <div
            className={`bf-stat-orb hp-orb ${
              currentHp < (cardDef.health || 1)
                ? "damaged"
                : maxHp > (cardDef.health || 1)
                ? "buffed"
                : ""
            }`}
            title={`Life: ${currentHp} / ${maxHp}`}
          >
            ♥ {currentHp}
          </div>
          {baseDamage !== null && (
            <div className="bf-stat-orb atk-orb" title={`Base Attack (${baseAttack?.name}): ${baseDamage}`}>
              ⚔ {baseDamage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BattlefieldCards;
