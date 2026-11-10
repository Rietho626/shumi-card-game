function PreviewModal({ previewState }) {
  if (!previewState || !previewState.src) return null;
  const card = previewState.card;
  const instance = previewState.instance;

  return (
    <div id="card-preview" className="card-preview-floating">
      <img src={previewState.src} alt={card?.name || "Card Preview"} className="card-preview-img" />
      {card && (
        <div className="card-preview-details">
          <div className="cp-title">{card.name}</div>
          {instance && (
            <div className="cp-live-stats">
              <span>♥ {instance.currentHp ?? card.health} / {instance.maxHp ?? card.health} LF</span>
              <span>✦ {instance.storedYao || 0} Stored Yao</span>
              <span>{instance.momentum ? "⚡ Momentum" : "⏳ Exhausted"}</span>
            </div>
          )}
          {card.text && <div className="cp-rules">{card.text}</div>}
        </div>
      )}
    </div>
  );
}

export default PreviewModal;
