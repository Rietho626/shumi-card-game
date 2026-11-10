import campestral from "./assets/campestral/cardData.js";

const DECK_STORAGE_KEY = "shumi_saved_decks_v1";
const SESSION_STORAGE_KEY = "shumi_game_session_v1";

export const DECK_RULES = {
  actionDeckSize: 30,
  yaoDeckSize: 20,
  maxCopiesPerCard: 2
};

export const DEFAULT_PLAYER_ACTION_DECK = [
  "maum", "maum",
  "gramaum", "gramaum",
  "faele", "faele",
  "farloss",
  "muspem", "muspem",
  "musclyp",
  "supel", "supel",
  "leppun",
  "caquil", "caquil",
  "horucan",
  "inagnu", "inagnu",
  "inazovis",
  "sendris", "sendris",
  "equuna",
  "schnuut",
  "campest",
  "prosper", "prosper",
  "cycle-summon",
  "razorgrass-shield",
  "hasten",
  "ritual-of-the-vast"
]; // 30 cards, max 2 copies each

export const DEFAULT_OPPONENT_ACTION_DECK = [
  "maum", "maum",
  "gramaum",
  "faele", "faele",
  "farloss", "farloss",
  "supel", "supel",
  "leppun", "leppun",
  "caquil", "caquil",
  "horucan",
  "inagnu", "inagnu",
  "inazovis", "inazovis",
  "sendris", "sendris",
  "equuna", "equuna",
  "kalfil", "kalfil",
  "kalflux", "kalflux",
  "prosper", "prosper",
  "hasten",
  "razorgrass-shield"
]; // 30 cards, max 2 copies each

export const DEFAULT_YAO_DECK = Array(20).fill("campestral-yao-crystal");

export function getDefaultDecksConfig() {
  return {
    player: {
      actionDeckIds: [...DEFAULT_PLAYER_ACTION_DECK],
      yaoDeckIds: [...DEFAULT_YAO_DECK],
      upperRuneId: "rune-of-the-fertile-field",
      lowerRuneId: null
    },
    opponent: {
      actionDeckIds: [...DEFAULT_OPPONENT_ACTION_DECK],
      yaoDeckIds: [...DEFAULT_YAO_DECK],
      upperRuneId: "rune-of-the-razorgrass",
      lowerRuneId: "rune-of-the-fertile-field"
    }
  };
}

export function loadSavedDecksConfig() {
  try {
    const raw = localStorage.getItem(DECK_STORAGE_KEY);
    if (!raw) return getDefaultDecksConfig();
    const parsed = JSON.parse(raw);
    const defaults = getDefaultDecksConfig();
    return {
      player: { ...defaults.player, ...(parsed.player || {}) },
      opponent: { ...defaults.opponent, ...(parsed.opponent || {}) }
    };
  } catch (e) {
    console.warn("Failed to load saved decks from localStorage:", e);
    return getDefaultDecksConfig();
  }
}

export function saveDecksConfig(config) {
  try {
    localStorage.setItem(DECK_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn("Failed to save decks to localStorage:", e);
  }
}

export function saveGameSession(gameState) {
  try {
    if (!gameState) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(gameState));
  } catch (e) {
    console.warn("Failed to save game session:", e);
  }
}

export function loadGameSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to load game session:", e);
    return null;
  }
}

export function clearGameSession() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to clear game session:", e);
  }
}

export function getBuildableCards() {
  const actionCards = [];
  const crystalCards = [];
  const runeCards = [];
  const seen = new Set();

  Object.values(campestral).forEach((card) => {
    if (!card || !card.id || card.id === "no-rune" || card.isToken) return;
    if (seen.has(card.id)) return;
    seen.add(card.id);

    if (card.type === "crystal") {
      crystalCards.push(card);
    } else if (card.type === "power-rune") {
      runeCards.push(card);
    } else if (["shumi", "myth", "spell", "quickcast", "interception"].includes(card.type)) {
      actionCards.push(card);
    }
  });

  return { actionCards, crystalCards, runeCards };
}

export default function getSetup(player, customConfig = null) {
  const fullConfig = customConfig || loadSavedDecksConfig();
  const cfg = fullConfig[player] || getDefaultDecksConfig()[player];

  const prefix = player === "player" ? 1000 : 2000;
  const actionDeck = cfg.actionDeckIds.map((id, idx) => ({
    id,
    cardNr: prefix + idx,
    owner: player,
    where: "deck"
  }));

  const yaoDeck = cfg.yaoDeckIds.map((id, idx) => ({
    id,
    cardNr: prefix + 500 + idx,
    owner: player,
    where: "deck"
  }));

  const upperRuneZone = cfg.upperRuneId
    ? { id: cfg.upperRuneId, storedYao: 0, usedThisTurn: false, owner: player, where: "runeZone", slot: "upperRuneZone" }
    : {};

  const lowerRuneZone = cfg.upperRuneId && cfg.lowerRuneId
    ? { id: cfg.lowerRuneId, storedYao: 0, usedThisTurn: false, owner: player, where: "runeZone", slot: "lowerRuneZone" }
    : {};

  return {
    actionDeck,
    yaoDeck,
    upperRuneZone,
    lowerRuneZone
  };
}
