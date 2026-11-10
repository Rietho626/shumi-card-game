import Battlefield from "./Battlefield.jsx";
import Deck from "./Deck.jsx";
import AwayZone from "./AwayZone.jsx";
import YaoReserve from "./YaoReserve.jsx";
import RuneZone from "./RuneZone.jsx";
import Hand from "./Hand.jsx";
import Player from "./Player.jsx";

function GameBoard({
  allRefs,
  player,
  setPreviewState,
  playCardLogic,
  engine,
  setVersion,
  mulligan,
  onSelectCard,
  onPlayHandCard,
  onInspectZone
}) {
  const state = engine.current.state;
  const isPriorityOwner = state.gameInfo.priority.player === player;

  function checkTargetable(type = false) {
    if (type === "handCard" && mulligan?.mulliganState?.cards) {
      return false;
    }
    return state.gameInfo.priority.player !== player || Boolean(playCardLogic?.playCardState?.card);
  }

  return (
    <div
      id={`${player}-gameboard`}
      className={`gameboard-half ${player}-half ${isPriorityOwner ? "active-priority-half" : "inactive-priority-half"}`}
    >
      {/* Left Side: Decks + Away Zones */}
      <div className="board-side-column left-zones">
        <div id={`${player}-away-zones-wrapper`} className="dual-zone-col">
          <AwayZone
            allRefs={allRefs}
            player={player}
            zoneType={player === "player" ? "restingGrounds" : "spiritedAway"}
            setPreviewState={setPreviewState}
            playCardLogic={playCardLogic}
            engine={engine}
            setVersion={setVersion}
            checkTargetable={checkTargetable}
            onInspectZone={onInspectZone}
          />
          <AwayZone
            allRefs={allRefs}
            player={player}
            zoneType={player === "player" ? "spiritedAway" : "restingGrounds"}
            setPreviewState={setPreviewState}
            playCardLogic={playCardLogic}
            engine={engine}
            setVersion={setVersion}
            checkTargetable={checkTargetable}
            onInspectZone={onInspectZone}
          />
        </div>

        <div id={`${player}-decks-wrapper`} className="dual-zone-col">
          <Deck
            allRefs={allRefs}
            player={player}
            deckType={player === "player" ? "yaoDeck" : "actionDeck"}
            playCardLogic={playCardLogic}
            engine={engine}
            setVersion={setVersion}
            checkTargetable={checkTargetable}
          />
          <Deck
            allRefs={allRefs}
            player={player}
            deckType={player === "player" ? "actionDeck" : "yaoDeck"}
            playCardLogic={playCardLogic}
            engine={engine}
            setVersion={setVersion}
            checkTargetable={checkTargetable}
          />
        </div>
      </div>

      {/* Center: 3 Lanes (Frontline, Backline, Crystal Zone) */}
      <div id={`${player}-battlefields-wrapper`} className="board-center-lanes">
        <Battlefield
          allRefs={allRefs}
          player={player}
          lane={player === "player" ? "frontline" : "crystalZone"}
          setPreviewState={setPreviewState}
          playCardLogic={playCardLogic}
          engine={engine}
          setVersion={setVersion}
          onSelectCard={onSelectCard}
        />
        <Battlefield
          allRefs={allRefs}
          player={player}
          lane="backline"
          setPreviewState={setPreviewState}
          playCardLogic={playCardLogic}
          engine={engine}
          setVersion={setVersion}
          onSelectCard={onSelectCard}
        />
        <Battlefield
          allRefs={allRefs}
          player={player}
          lane={player === "player" ? "crystalZone" : "frontline"}
          setPreviewState={setPreviewState}
          playCardLogic={playCardLogic}
          engine={engine}
          setVersion={setVersion}
          onSelectCard={onSelectCard}
        />
      </div>

      {/* Right Side: Yao Reserve + Runes + Player Life Orb */}
      <div className="board-side-column right-zones">
        <div id={`${player}-yao-reserve-wrapper`} className="single-zone-col">
          <YaoReserve
            allRefs={allRefs}
            player={player}
            playCardLogic={playCardLogic}
            engine={engine}
            setVersion={setVersion}
            checkTargetable={checkTargetable}
          />
        </div>

        <div id={`${player}-rune-zones-wrapper`} className="dual-zone-col">
          <RuneZone
            allRefs={allRefs}
            player={player}
            zoneType={player === "player" ? "upperRuneZone" : "lowerRuneZone"}
            setPreviewState={setPreviewState}
            playCardLogic={playCardLogic}
            engine={engine}
            setVersion={setVersion}
            checkTargetable={checkTargetable}
          />
          <RuneZone
            allRefs={allRefs}
            player={player}
            zoneType={player === "player" ? "lowerRuneZone" : "upperRuneZone"}
            setPreviewState={setPreviewState}
            playCardLogic={playCardLogic}
            engine={engine}
            setVersion={setVersion}
            checkTargetable={checkTargetable}
          />
        </div>

        <div id={`${player}-player-token-wrapper`} className="single-zone-col">
          <Player
            allRefs={allRefs}
            player={player}
            playCardLogic={playCardLogic}
            engine={engine}
            setVersion={setVersion}
            checkTargetable={checkTargetable}
          />
        </div>
      </div>

      <Hand
        allRefs={allRefs}
        player={player}
        setPreviewState={setPreviewState}
        playCardLogic={playCardLogic}
        engine={engine}
        setVersion={setVersion}
        checkTargetable={checkTargetable}
        mulligan={mulligan}
        onPlayHandCard={onPlayHandCard}
      />
    </div>
  );
}

export default GameBoard;
