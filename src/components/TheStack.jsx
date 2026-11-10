import campestral from "../assets/campestral/cardData.js";

function TheStack({ setPreviewState, engine }) {
  const state = engine.current.state;
  const stack = state.gameInfo.theStack || [];
  if (!stack.length) return null;

  return (
    <div id="the-stack" className="the-stack-panel">
      <div className="the-stack-header">
        <span>⚡ The Stack ({stack.length})</span>
        <small>Top resolves first</small>
      </div>
      <div id="stack-wrapper" className="the-stack-list">
        {[...stack].reverse().map((el, revIdx) => {
          const idx = stack.length - 1 - revIdx;
          const cardDef = campestral[el.card?.id] || {};
          return (
            <div
              key={el.id || `stack_${idx}`}
              className={`stack-entry ${el.player === "player" ? "friendly-stack" : "enemy-stack"}`}
              onMouseEnter={() => {
                if (cardDef.src) setPreviewState({ src: cardDef.src, card: cardDef });
              }}
              onMouseLeave={() => setPreviewState({})}
            >
              <img src={cardDef.src} alt={cardDef.name} className="stack-entry-img" />
              <div className="stack-entry-info">
                <div className="stack-entry-badge">
                  #{idx + 1} • {el.player === "player" ? "YOU" : "AI"} • {el.kind?.toUpperCase()}
                </div>
                <div className="stack-entry-text">
                  {el.meta?.summaryText || cardDef.name}
                </div>
                {el.meta?.canceled && <div className="stack-canceled-tag">CANCELED</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TheStack;
