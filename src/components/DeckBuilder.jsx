import { useState, useMemo } from "react";
import campestral from "../assets/campestral/cardData.js";
import {
  DECK_RULES,
  getBuildableCards,
  getDefaultDecksConfig,
  saveDecksConfig
} from "../setup.js";

function DeckBuilder({ decksConfig, setDecksConfig, onBack }) {
  const [editingSide, setEditingSide] = useState("player"); // "player" | "opponent"
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewCard, setPreviewCard] = useState(campestral.maum);
  const [saveBanner, setSaveBanner] = useState("");

  const { actionCards, crystalCards, runeCards } = useMemo(() => getBuildableCards(), []);

  const currentDeck = decksConfig[editingSide];

  const cardCounts = useMemo(() => {
    const counts = {};
    (currentDeck.actionDeckIds || []).forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  }, [currentDeck.actionDeckIds]);

  const filteredActionCards = useMemo(() => {
    return actionCards.filter((card) => {
      if (filterType === "shumi1" && !(card.type === "shumi" && card.stage === 1)) return false;
      if (filterType === "shumi2" && !(card.type === "shumi" && card.stage === 2)) return false;
      if (filterType === "myth" && card.type !== "myth") return false;
      if (filterType === "spells" && !["spell", "quickcast", "interception"].includes(card.type)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = card.name?.toLowerCase().includes(q);
        const matchText = card.text?.toLowerCase().includes(q);
        if (!matchName && !matchText) return false;
      }
      return true;
    });
  }, [actionCards, filterType, searchQuery]);

  function updateSideConfig(updater) {
    setDecksConfig((prev) => {
      const updatedSide = updater(prev[editingSide]);
      const next = { ...prev, [editingSide]: updatedSide };
      saveDecksConfig(next);
      return next;
    });
  }

  function addActionCard(cardId) {
    const count = cardCounts[cardId] || 0;
    if (count >= DECK_RULES.maxCopiesPerCard) return;
    if (currentDeck.actionDeckIds.length >= DECK_RULES.actionDeckSize) return;

    updateSideConfig((side) => ({
      ...side,
      actionDeckIds: [...side.actionDeckIds, cardId]
    }));
  }

  function removeActionCard(cardId) {
    const idx = currentDeck.actionDeckIds.indexOf(cardId);
    if (idx === -1) return;
    updateSideConfig((side) => {
      const copy = [...side.actionDeckIds];
      copy.splice(idx, 1);
      return { ...side, actionDeckIds: copy };
    });
  }

  function setUpperRune(runeId) {
    updateSideConfig((side) => ({
      ...side,
      upperRuneId: runeId || null,
      lowerRuneId: runeId ? side.lowerRuneId : null
    }));
  }

  function setLowerRune(runeId) {
    updateSideConfig((side) => ({
      ...side,
      lowerRuneId: side.upperRuneId ? runeId || null : null
    }));
  }

  function handleResetDefault() {
    const defaults = getDefaultDecksConfig();
    updateSideConfig(() => defaults[editingSide]);
    setSaveBanner(`Reset ${editingSide === "player" ? "Player" : "AI"} deck to default!`);
    setTimeout(() => setSaveBanner(""), 2500);
  }

  function handleClearDeck() {
    updateSideConfig((side) => ({
      ...side,
      actionDeckIds: []
    }));
  }

  function handleAutoFill() {
    updateSideConfig((side) => {
      const nextIds = [...side.actionDeckIds];
      const localCounts = {};
      nextIds.forEach((id) => {
        localCounts[id] = (localCounts[id] || 0) + 1;
      });
      for (const c of actionCards) {
        while (
          nextIds.length < DECK_RULES.actionDeckSize &&
          (localCounts[c.id] || 0) < DECK_RULES.maxCopiesPerCard
        ) {
          nextIds.push(c.id);
          localCounts[c.id] = (localCounts[c.id] || 0) + 1;
        }
      }
      return { ...side, actionDeckIds: nextIds };
    });
  }

  const isPlayerDeckValid = decksConfig.player.actionDeckIds.length === DECK_RULES.actionDeckSize;
  const isOpponentDeckValid = decksConfig.opponent.actionDeckIds.length === DECK_RULES.actionDeckSize;

  const groupedDeckList = useMemo(() => {
    const map = new Map();
    currentDeck.actionDeckIds.forEach((id) => {
      map.set(id, (map.get(id) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([id, qty]) => ({ card: campestral[id], qty }))
      .filter((item) => item.card)
      .sort((a, b) => (a.card.yaoCost || 0) - (b.card.yaoCost || 0));
  }, [currentDeck.actionDeckIds]);

  const upperRuneObj = currentDeck.upperRuneId ? campestral[currentDeck.upperRuneId] : null;
  const lowerRuneObj = currentDeck.lowerRuneId ? campestral[currentDeck.lowerRuneId] : null;

  return (
    <div className="deck-builder-screen">
      {/* Top Header */}
      <header className="db-header">
        <div className="db-header-left">
          <button className="shumi-btn secondary" onClick={onBack}>
            ← Back to Menu
          </button>
          <h1 className="db-title">Deck & Rune Forge</h1>
        </div>

        <div className="db-tabs">
          <button
            className={`db-tab ${editingSide === "player" ? "active" : ""}`}
            onClick={() => setEditingSide("player")}
          >
            Your Deck ({decksConfig.player.actionDeckIds.length}/{DECK_RULES.actionDeckSize})
            {!isPlayerDeckValid && <span className="db-warn-dot" title="Needs 30 cards">!</span>}
          </button>
          <button
            className={`db-tab ${editingSide === "opponent" ? "active" : ""}`}
            onClick={() => setEditingSide("opponent")}
          >
            AI Opponent Deck ({decksConfig.opponent.actionDeckIds.length}/{DECK_RULES.actionDeckSize})
            {!isOpponentDeckValid && <span className="db-warn-dot" title="Needs 30 cards">!</span>}
          </button>
        </div>

        <div className="db-header-actions">
          {saveBanner && <span className="db-save-toast">{saveBanner}</span>}
          <button className="shumi-btn secondary small" onClick={handleAutoFill}>
            Auto-Complete (30)
          </button>
          <button className="shumi-btn secondary small" onClick={handleClearDeck}>
            Clear
          </button>
          <button className="shumi-btn secondary small" onClick={handleResetDefault}>
            Reset Default
          </button>
        </div>
      </header>

      <div className="db-body">
        {/* Left: Card Preview + Rune & Yao Deck Configuration */}
        <aside className="db-sidebar-left">
          <div className="db-preview-panel">
            {previewCard ? (
              <>
                <div className="db-preview-img-wrap">
                  <img src={previewCard.src} alt={previewCard.name} className="db-preview-img" />
                </div>
                <div className="db-preview-meta">
                  <h3>{previewCard.name}</h3>
                  <div className="db-preview-tags">
                    <span className="tag-badge">{previewCard.type?.toUpperCase()}</span>
                    {previewCard.stage && <span className="tag-badge">Stage {previewCard.stage}</span>}
                    {previewCard.yaoCost !== null && previewCard.yaoCost !== undefined && (
                      <span className="tag-badge yao">YC: {previewCard.yaoCost}</span>
                    )}
                    {previewCard.health && <span className="tag-badge hp">LF: {previewCard.health}</span>}
                    {previewCard.speed && (
                      <span className="tag-badge speed">Speed: {previewCard.speed.toUpperCase()}</span>
                    )}
                  </div>
                  <p className="db-preview-text">{previewCard.text}</p>
                </div>
              </>
            ) : (
              <div className="db-preview-placeholder">Hover a card to inspect</div>
            )}
          </div>

          {/* Power Runes Configuration */}
          <div className="db-rune-config">
            <h4>Power Runes ({editingSide === "player" ? "Player" : "AI"})</h4>
            <p className="db-rune-hint">
              Equip <strong>only Upper Rune</strong> for its <strong>Combined (↕)</strong> ability, or equip{" "}
              <strong>both slots</strong> for <strong>Upper (↑) + Lower (↓)</strong> abilities.
            </p>

            <div className="db-rune-selectors">
              <div className="db-rune-slot">
                <label>Upper Rune Slot (↑ / ↕)</label>
                <select
                  value={currentDeck.upperRuneId || ""}
                  onChange={(e) => setUpperRune(e.target.value)}
                >
                  <option value="">— No Rune —</option>
                  {runeCards.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {upperRuneObj && (
                  <button
                    className="db-inspect-link"
                    onClick={() => setPreviewCard(upperRuneObj)}
                  >
                    Inspect {upperRuneObj.name}
                  </button>
                )}
              </div>

              <div className="db-rune-slot">
                <label>Lower Rune Slot (↓ Optional)</label>
                <select
                  value={currentDeck.lowerRuneId || ""}
                  disabled={!currentDeck.upperRuneId}
                  onChange={(e) => setLowerRune(e.target.value)}
                >
                  <option value="">— Empty (Use Combined ↕ Ability) —</option>
                  {runeCards.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                {lowerRuneObj && (
                  <button
                    className="db-inspect-link"
                    onClick={() => setPreviewCard(lowerRuneObj)}
                  >
                    Inspect {lowerRuneObj.name}
                  </button>
                )}
              </div>
            </div>

            <div className="db-active-rune-summary">
              {upperRuneObj && !lowerRuneObj && (
                <div className="rune-mode-pill combined">
                  <strong>↕ Combined Mode Active:</strong> {upperRuneObj.combinedAbility?.[0]?.text}
                </div>
              )}
              {upperRuneObj && lowerRuneObj && (
                <div className="rune-mode-pill split">
                  <div>
                    <strong>↑ Upper:</strong> {upperRuneObj.upperAbility?.[0]?.text}
                  </div>
                  <div>
                    <strong>↓ Lower:</strong> {lowerRuneObj.lowerAbility?.[0]?.text}
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center: Card Collection Catalog */}
        <main className="db-catalog">
          <div className="db-catalog-Controls">
            <div className="db-filter-pills">
              {[
                { key: "all", label: "All Action Cards" },
                { key: "shumi1", label: "Stage 1 Shumi" },
                { key: "shumi2", label: "Mature (Stage 2)" },
                { key: "myth", label: "Myths" },
                { key: "spells", label: "Spells / Quick / Interceptions" }
              ].map((f) => (
                <button
                  key={f.key}
                  className={`db-filter-btn ${filterType === f.key ? "active" : ""}`}
                  onClick={() => setFilterType(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="db-search-input"
              placeholder="Search cards by name or effect..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="db-card-grid">
            {filteredActionCards.map((card) => {
              const count = cardCounts[card.id] || 0;
              const isMaxed = count >= DECK_RULES.maxCopiesPerCard;
              const isDeckFull = currentDeck.actionDeckIds.length >= DECK_RULES.actionDeckSize;

              return (
                <div
                  key={card.id}
                  className={`db-card-tile ${count > 0 ? "in-deck" : ""} ${isMaxed ? "maxed" : ""}`}
                  onMouseEnter={() => setPreviewCard(card)}
                >
                  <div className="db-card-img-box" onClick={() => addActionCard(card.id)}>
                    <img src={card.src} alt={card.name} loading="lazy" />
                    <div className="db-card-count-badge">
                      {count} / {DECK_RULES.maxCopiesPerCard}
                    </div>
                  </div>
                  <div className="db-card-tile-footer">
                    <span className="db-card-name" title={card.name}>
                      {card.name}
                    </span>
                    <div className="db-card-stepper">
                      <button
                        disabled={count === 0}
                        onClick={() => removeActionCard(card.id)}
                        title="Remove 1 copy"
                      >
                        −
                      </button>
                      <button
                        disabled={isMaxed || isDeckFull}
                        onClick={() => addActionCard(card.id)}
                        title="Add 1 copy"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Right: Active Deck List */}
        <aside className="db-decklist-panel">
          <div className="db-decklist-section">
            <div className="db-decklist-header">
              <h4>Action Deck</h4>
              <span
                className={`db-count-pill ${
                  currentDeck.actionDeckIds.length === DECK_RULES.actionDeckSize ? "valid" : "invalid"
                }`}
              >
                {currentDeck.actionDeckIds.length} / {DECK_RULES.actionDeckSize}
              </span>
            </div>
            <p className="db-limit-note">Max {DECK_RULES.maxCopiesPerCard} copies per card</p>

            <div className="db-deck-items">
              {groupedDeckList.length === 0 && (
                <div className="db-empty-deck">No cards in Action Deck. Click cards in the catalog to add them!</div>
              )}
              {groupedDeckList.map(({ card, qty }) => (
                <div
                  key={card.id}
                  className="db-deck-row"
                  onMouseEnter={() => setPreviewCard(card)}
                >
                  <span className="db-row-cost">{card.yaoCost ?? 0}</span>
                  <span className="db-row-name">{card.name}</span>
                  <span className="db-row-qty">×{qty}</span>
                  <div className="db-row-btns">
                    <button onClick={() => removeActionCard(card.id)}>−</button>
                    <button
                      disabled={qty >= DECK_RULES.maxCopiesPerCard || currentDeck.actionDeckIds.length >= DECK_RULES.actionDeckSize}
                      onClick={() => addActionCard(card.id)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="db-decklist-section yao-section">
            <div className="db-decklist-header">
              <h4>Yao Deck</h4>
              <span className="db-count-pill valid">
                {currentDeck.yaoDeckIds.length} / {DECK_RULES.yaoDeckSize}
              </span>
            </div>
            {crystalCards.map((crystal) => (
              <div
                key={crystal.id}
                className="db-deck-row crystal"
                onMouseEnter={() => setPreviewCard(crystal)}
              >
                <span className="db-row-cost">✦</span>
                <span className="db-row-name">{crystal.name}</span>
                <span className="db-row-qty">×{currentDeck.yaoDeckIds.length}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default DeckBuilder;
