function YaoReserve({ player, allRefs, engine }) {
  const state = engine.current.state;
  const yaoCount = Math.min(21, Math.max(0, state[player].yaoReserve || 0));
  const rawYao = state[player].yaoReserve || 0;

  return (
    <div
      id={`${player}-yao-reserve`}
      className={`yao-reserve-card ${player === "opponent" ? "opponent-yao" : ""}`}
      ref={allRefs?.[player]?.yaoReserve}
      title={`${player === "player" ? "Your" : "Opponent's"} Yao Reserve: ${rawYao} Yao`}
    >
      <img
        src={`${yaoCount}yao.png`}
        alt={`${rawYao} Yao`}
        className="yao-reserve-img"
        draggable="false"
      />
      <div className="yao-reserve-counter">
        <span>✦ {rawYao}</span>
        <small>Yao Reserve</small>
      </div>
    </div>
  );
}

export default YaoReserve;
