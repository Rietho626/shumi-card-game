import campestral from "../assets/campestral/cardData.js";

function RuneZone({
  player,
  zoneType,
  setPreviewState,
  allRefs,
  engine,
  setVersion
}) {
  const state = engine.current.state;
  const runeSlotObj = state[player][zoneType] || {};
  const runeDef = campestral[runeSlotObj.id ?? "no-rune"] || { src: null };

  const isCombined =
    zoneType === "upperRuneZone" &&
    Boolean(state[player].upperRuneZone?.id) &&
    !state[player].lowerRuneZone?.id;

  const activatable =
    player === "player" && runeSlotObj.id
      ? engine.current.checkCanActivateAbilities("player", runeSlotObj)
      : [];

  async function handleRuneClick() {
    if (player === "player" && activatable.length > 0) {
      await engine.current.activateAbility("player", runeSlotObj, activatable[0]);
      setVersion((v) => v + 1);
    }
  }

  const slotLabel =
    zoneType === "upperRuneZone"
      ? isCombined
        ? "Combined Rune (↕)"
        : "Upper Rune (↑)"
      : "Lower Rune (↓)";

  return (
    <div
      id={`${player}-${zoneType}`}
      className={`zone-slot rune-slot ${runeSlotObj.id ? "has-rune" : "empty-rune"} ${
        activatable.length > 0 ? "playable-glow" : ""
      }`}
      ref={allRefs?.[player]?.[zoneType]}
      onClick={handleRuneClick}
      onMouseEnter={() => {
        if (runeDef.src) setPreviewState({ src: runeDef.src, card: runeDef });
      }}
      onMouseLeave={() => setPreviewState({})}
      title={
        activatable.length > 0
          ? `Click to activate: ${activatable[0].name || activatable[0].text}`
          : slotLabel
      }
    >
      {runeDef.src ? (
        <>
          <img src={runeDef.src} alt={runeDef.name} className="zone-card-img" draggable="false" />
          <div className="rune-mode-indicator">{isCombined ? "↕" : zoneType === "upperRuneZone" ? "↑" : "↓"}</div>
          {(runeSlotObj.storedYao || 0) > 0 && (
            <div className="rune-stored-yao-badge" title={`Stored Yao: ${runeSlotObj.storedYao}`}>
              ✦ {runeSlotObj.storedYao}
            </div>
          )}
        </>
      ) : (
        <span className="zone-placeholder-label">{slotLabel}</span>
      )}
    </div>
  );
}

export default RuneZone;
