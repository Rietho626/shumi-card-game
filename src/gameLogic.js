import { getCardData } from "./assets/campestral/cardData.js";
import AIinstance from "./versusAi.js";
import { saveGameSession } from "./setup.js";

let nextUid = 10000;
function uid(prefix = "id") {
  nextUid += 1;
  return `${prefix}_${Date.now()}_${nextUid}`;
}

export default class GameEngine {
  constructor(playerSetup, opponentSetup, rerender, savedState = null) {
    this.rerender = rerender;
    this.cardData = getCardData();
    this.ai = AIinstance(this);
    this.triggers = {};
    this.aiBusy = false;

    if (savedState && savedState.gameInfo && savedState.player && savedState.opponent) {
      this.gameState = savedState;
    } else {
      this.gameState = this.createInitialState(playerSetup, opponentSetup);
    }
  }

  createInitialState(playerSetup, opponentSetup) {
    const createPlayerState = (setup, key) => ({
      actionDeck: this.shuffleDeck(setup.actionDeck.map((c) => ({ ...c, owner: key, where: "deck" }))),
      yaoDeck: this.shuffleDeck(setup.yaoDeck.map((c) => ({ ...c, owner: key, where: "deck" }))),
      hand: [],
      restingGrounds: [],
      spiritedAway: [],
      frontline: [],
      backline: [],
      crystalZone: [],
      yaoReserve: 0,
      upperRuneZone: setup.upperRuneZone?.id
        ? { ...setup.upperRuneZone, storedYao: setup.upperRuneZone.storedYao || 0, usedThisTurn: false, owner: key, where: "runeZone", slot: "upperRuneZone" }
        : {},
      lowerRuneZone: setup.lowerRuneZone?.id
        ? { ...setup.lowerRuneZone, storedYao: setup.lowerRuneZone.storedYao || 0, usedThisTurn: false, owner: key, where: "runeZone", slot: "lowerRuneZone" }
        : {},
      hp: 30,
      hasPlayedCrystal: false,
      hasUsedFreeLaneChange: false,
      costReductions: [],
      pendingDraws: 0,
      pendingDrawReason: ""
    });

    return {
      player: createPlayerState(playerSetup, "player"),
      opponent: createPlayerState(opponentSetup, "opponent"),
      gameInfo: {
        started: false,
        winner: null,
        winReason: "",
        turn: 0,
        playingCard: null,
        theStack: [],
        activePlayer: null,
        startingPlayer: null,
        priority: {
          player: "",
          passed: { player: false, opponent: false },
          passedPhase: { player: false, opponent: false },
          passedTurn: { player: false, opponent: false }
        },
        phase: "preGame",
        playable: { player: [], opponent: [] },
        damageAmplifiers: [],
        damagePreventions: [],
        prompt: null,
        combatLog: [
          { id: uid("log"), turn: 0, text: "Welcome to Shumi! Prepare for battle.", type: "system" }
        ]
      }
    };
  }

  // ==========================================
  // CORE STATE & LOGGING HELPERS
  // ==========================================

  update() {
    saveGameSession(this.gameState);
    if (this.rerender) this.rerender();
  }

  get state() {
    return this.gameState;
  }

  get plAc() {
    return this.gameState.gameInfo.activePlayer === "player";
  }

  otherPlayer(player) {
    return player === "player" ? "opponent" : "player";
  }

  log(text, type = "info") {
    this.gameState.gameInfo.combatLog = [
      { id: uid("log"), turn: this.gameState.gameInfo.turn, text, type },
      ...(this.gameState.gameInfo.combatLog || []).slice(0, 79)
    ];
  }

  enableTriggers(triggers) {
    triggers.forEach((trigger) => {
      this.triggers[trigger.name] = [trigger.callback];
    });
  }

  triggerTrigger(trigger, payload) {
    this.triggers[trigger]?.forEach((callback) => {
      callback(payload);
    });
  }

  delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  shuffleDeck(passedDeck) {
    const deck = [...passedDeck];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  // ==========================================
  // RUNE & CONTINUOUS ABILITY HELPERS
  // ==========================================

  getActiveRuneAbilities(player) {
    const pState = this.gameState[player];
    const upperId = pState.upperRuneZone?.id;
    const lowerId = pState.lowerRuneZone?.id;
    const list = [];

    if (upperId && this.cardData[upperId]) {
      const uCard = this.cardData[upperId];
      if (!lowerId) {
        // Combined ability active when only Upper Rune is equipped
        (uCard.combinedAbility || []).forEach((ab) => {
          list.push({ ...ab, runeZone: "upperRuneZone", runeCard: pState.upperRuneZone, cardDef: uCard, mode: "combined" });
        });
      } else {
        (uCard.upperAbility || []).forEach((ab) => {
          list.push({ ...ab, runeZone: "upperRuneZone", runeCard: pState.upperRuneZone, cardDef: uCard, mode: "upper" });
        });
      }
    }

    if (upperId && lowerId && this.cardData[lowerId]) {
      const lCard = this.cardData[lowerId];
      (lCard.lowerAbility || []).forEach((ab) => {
        list.push({ ...ab, runeZone: "lowerRuneZone", runeCard: pState.lowerRuneZone, cardDef: lCard, mode: "lower" });
      });
    }

    return list;
  }

  hasRuneEffect(player, effectId) {
    return this.getActiveRuneAbilities(player).some((ab) => ab.id === effectId);
  }

  getAllBattlefieldShumi(player) {
    return [...this.gameState[player].frontline, ...this.gameState[player].backline];
  }

  findShumiByCardNr(cardNr) {
    for (const p of ["player", "opponent"]) {
      for (const lane of ["frontline", "backline"]) {
        const found = this.gameState[p][lane].find((c) => c.cardNr === cardNr);
        if (found) return { card: found, player: p, lane };
      }
    }
    return null;
  }

  getMaxHp(player, shumiCard) {
    const def = this.cardData[shumiCard.id];
    if (!def) return 1;
    let maxHp = (def.health || 1) + (shumiCard.bonusMaxHp || 0);
    // Faele and Farloss continuous ability: +1 LF per Stored Yao on this Shumi
    if (shumiCard.id === "faele" || shumiCard.id === "farloss") {
      maxHp += shumiCard.storedYao || 0;
    }
    return maxHp;
  }

  getCurrentHp(player, shumiCard) {
    return Math.max(0, this.getMaxHp(player, shumiCard) - (shumiCard.damageMarked || 0));
  }

  syncShumiHp(player) {
    ["frontline", "backline"].forEach((lane) => {
      this.gameState[player][lane].forEach((c) => {
        c.maxHp = this.getMaxHp(player, c);
        c.currentHp = this.getCurrentHp(player, c);
      });
    });
  }

  syncAllStats() {
    this.syncShumiHp("player");
    this.syncShumiHp("opponent");
  }

  hasKeyword(player, shumiCard, keyword, attackId = null) {
    const def = this.cardData[shumiCard.id];
    if (def?.keywords?.includes(keyword)) return true;
    if (shumiCard.tempKeywords?.some((tk) => tk.keyword === keyword && (!tk.attackOnly || tk.attackOnly === attackId))) {
      return true;
    }
    return false;
  }

  isShumiImmuneToAttackTarget(owner, shumiCard) {
    // Kalflux continuous: Friendly Kalfil cannot be chosen as targets for attacks
    if (shumiCard.id === "kalfil") {
      const hasKalflux = this.getAllBattlefieldShumi(owner).some((s) => s.id === "kalflux");
      if (hasKalflux) return true;
    }
    return false;
  }

  // ==========================================
  // RESOURCE & YAO MANAGEMENT
  // ==========================================

  addYao(player, amount) {
    const num = Number(amount);
    if (num === 0) return;
    this.gameState[player].yaoReserve = Math.max(0, this.gameState[player].yaoReserve + num);
    if (num > 0) {
      // Check Rune of the Fertile Field Combined Ability: Whenever Yao is added to your Reserve, put 1 Yao on this card
      if (this.hasRuneEffect(player, "fertile_combined_passive")) {
        this.gameState[player].upperRuneZone.storedYao = (this.gameState[player].upperRuneZone.storedYao || 0) + 1;
        this.log(`${player === "player" ? "Your" : "Opponent's"} Rune of the Fertile Field gained 1 Yao.`);
      }
    }
    this.update();
  }

  async addStoredYaoToShumi(player, shumiCard, amount, allowRedirect = true) {
    const num = Number(amount);
    if (num <= 0 || !shumiCard) return;

    const found = this.findShumiByCardNr(shumiCard.cardNr);
    if (!found) return;
    let targetShumi = found.card;
    const owner = found.player;

    // Check Rune of the Fertile Field Lower Ability:
    // "If you have 3 or more Shumi on your Frontline, if Yao would be put on any of them, you may choose to put them on another one of your Frontline Shumi instead."
    if (
      allowRedirect &&
      found.lane === "frontline" &&
      this.gameState[owner].frontline.length >= 3 &&
      this.hasRuneEffect(owner, "fertile_lower")
    ) {
      const otherFrontline = this.gameState[owner].frontline.filter((s) => s.cardNr !== targetShumi.cardNr);
      if (otherFrontline.length > 0) {
        if (owner === "player") {
          const redirectTargetNr = await this.askPlayerChoice({
            type: "redirect_frontline_yao",
            title: "Rune of the Fertile Field (Lower)",
            message: `Redirect ${num} Yao from ${this.cardData[targetShumi.id].name} to another Frontline Shumi?`,
            options: [
              { label: `Keep on ${this.cardData[targetShumi.id].name}`, value: targetShumi.cardNr },
              ...otherFrontline.map((s) => ({
                label: `Redirect to ${this.cardData[s.id].name} (${s.storedYao || 0} Yao)`,
                value: s.cardNr
              }))
            ]
          });
          const redirected = this.findShumiByCardNr(redirectTargetNr);
          if (redirected) targetShumi = redirected.card;
        } else if (this.ai?.chooseFertileFieldRedirect) {
          const aiRedirectNr = this.ai.chooseFertileFieldRedirect(this.gameState, targetShumi, otherFrontline);
          const redirected = this.findShumiByCardNr(aiRedirectNr);
          if (redirected) targetShumi = redirected.card;
        }
      }
    }

    const hadZeroYao = (targetShumi.storedYao || 0) === 0;
    targetShumi.storedYao = (targetShumi.storedYao || 0) + num;
    this.syncAllStats();
    this.log(`${this.cardData[targetShumi.id].name} gained ${num} Stored Yao (now ${targetShumi.storedYao}).`);

    // Check Rune of the Razorgrass Combined Ability:
    // "Whenever Yao are put on a Shumi you control, if it had none on it, draw a card."
    if (hadZeroYao && this.hasRuneEffect(owner, "razorgrass_combined")) {
      this.log(`Rune of the Razorgrass triggers: Draw 1 card!`);
      await this.queueCardDraw(owner, 1, "Rune of the Razorgrass");
    }

    // Check Inazovis Trigger:
    // "Whenever Yao is put onto Inazovis, it deals 1 damage to target Shumi."
    if (targetShumi.id === "inazovis") {
      await this.triggerInazovisDamage(owner, targetShumi);
    }

    this.update();
  }

  async triggerInazovisDamage(owner, inazovisCard) {
    const allShumi = [
      ...this.getAllBattlefieldShumi("player"),
      ...this.getAllBattlefieldShumi("opponent")
    ];
    if (allShumi.length === 0) return;

    let chosenTargetNr = null;
    if (owner === "player") {
      chosenTargetNr = await this.askPlayerTarget({
        title: "Inazovis — Static Discharge",
        message: "Choose target Shumi to deal 1 damage to:",
        legalTargets: allShumi.map((s) => ({
          type: "shumi",
          cardNr: s.cardNr,
          player: s.owner,
          label: `${s.owner === "player" ? "Friendly" : "Enemy"} ${this.cardData[s.id].name} (${this.getCurrentHp(s.owner, s)} LF)`
        })),
        optional: false
      });
    } else {
      chosenTargetNr = this.ai.chooseInazovisTarget(this.gameState, allShumi);
    }

    if (chosenTargetNr) {
      const targetNrVal = typeof chosenTargetNr === "object" ? chosenTargetNr.cardNr : chosenTargetNr;
      const targetInfo = this.findShumiByCardNr(targetNrVal);
      if (targetInfo) {
        this.putTriggerOnStack(owner, inazovisCard, {
          name: `Inazovis: 1 Damage → ${this.cardData[targetInfo.card.id].name}`,
          effectType: "inazovis_damage",
          targetCardNr: targetNrVal
        });
      }
    }
  }

  // ==========================================
  // DRAWING & DECK INTERACTION
  // ==========================================

  drawCard(player, deckType) {
    if (this.gameState[player][deckType].length > 0) {
      const firstCard = { ...this.gameState[player][deckType][0], where: "hand", owner: player };
      this.gameState[player][deckType] = this.gameState[player][deckType].slice(1);
      this.gameState[player].hand = [...this.gameState[player].hand, firstCard];
      this.log(`${player === "player" ? "Player" : "Opponent"} drew a card from ${deckType === "actionDeck" ? "Action Deck" : "Yao Deck"}.`);
      this.update();
      return firstCard;
    } else {
      this.log(`${player === "player" ? "Player" : "Opponent"} tried to draw from an empty ${deckType === "actionDeck" ? "Action Deck" : "Yao Deck"}!`, "warning");
      return null;
    }
  }

  async queueCardDraw(player, count = 1, reason = "Card Effect") {
    for (let i = 0; i < count; i++) {
      if (this.gameState[player].actionDeck.length === 0 && this.gameState[player].yaoDeck.length === 0) {
        break;
      }
      if (player === "player") {
        const deckChoice = await this.askPlayerChoice({
          type: "draw_choice",
          title: `Draw a Card (${reason})`,
          message: count > 1 ? `Choose a deck to draw from (${i + 1} of ${count}):` : "Choose which deck to draw from:",
          options: [
            ...(this.gameState.player.actionDeck.length > 0
              ? [{ label: `Action Deck (${this.gameState.player.actionDeck.length})`, value: "actionDeck" }]
              : []),
            ...(this.gameState.player.yaoDeck.length > 0
              ? [{ label: `Yao Deck (${this.gameState.player.yaoDeck.length})`, value: "yaoDeck" }]
              : [])
          ]
        });
        if (deckChoice) {
          this.drawCard("player", deckChoice);
        }
      } else {
        const aiDeck = this.ai.chooseDeckToDraw(this.gameState);
        await this.delay(450);
        this.drawCard("opponent", aiDeck);
      }
    }
  }

  matchesFilter(cardObj, filter) {
    if (!cardObj || !filter) return false;
    if (filter.id && cardObj.id !== filter.id) return false;
    if (filter.name && cardObj.id !== filter.name.toLowerCase() && cardObj.name.toLowerCase() !== filter.name.toLowerCase()) return false;
    if (filter.habitat && cardObj.habitat !== filter.habitat) return false;
    if (filter.type && cardObj.type !== filter.type) return false;
    if (filter.maturesFrom && cardObj.maturesFrom !== filter.maturesFrom) return false;
    if (filter.yaoCost) {
      if (Array.isArray(filter.yaoCost)) {
        if (!filter.yaoCost.includes(cardObj.yaoCost)) return false;
      } else if (cardObj.yaoCost !== filter.yaoCost) {
        return false;
      }
    }
    if (filter.not) {
      if (filter.not.id && cardObj.id === filter.not.id) return false;
      if (filter.not.name && (cardObj.id === filter.not.name.toLowerCase() || cardObj.name.toLowerCase() === filter.not.name.toLowerCase())) return false;
    }
    return true;
  }

  // ==========================================
  // INTERACTIVE PROMPTS (100% SERIALIZABLE)
  // ==========================================

  askPlayerChoice(promptConfig) {
    return new Promise((resolve) => {
      this._promptResolver = resolve;
      this.gameState.gameInfo.prompt = {
        ...promptConfig,
        id: uid("prompt")
      };
      this.update();
    });
  }

  askPlayerTarget(promptConfig) {
    return new Promise((resolve) => {
      this._promptResolver = resolve;
      this.gameState.gameInfo.prompt = {
        ...promptConfig,
        type: "target_selection",
        id: uid("prompt")
      };
      this.update();
    });
  }

  resolvePrompt(value) {
    const resolver = this._promptResolver;
    this._promptResolver = null;
    this.gameState.gameInfo.prompt = null;
    this.update();
    if (resolver) {
      resolver(value);
    } else {
      // Handle session-restored prompts that had no in-memory Promise callback
      this.handleRestoredPromptResolution(value);
    }
  }

  async handleRestoredPromptResolution(value) {
    // If page was reloaded during pre-game drawHand, mulligan, or drawPhaseDraw:
    if (this.gameState.gameInfo.phase === "drawPhase" && this.plAc) {
      if (value === "actionDeck" || value === "yaoDeck") {
        this.drawPhaseDraw(value);
      }
    }
  }

  // ==========================================
  // DAMAGE, DEFEAT & WIN CONDITION
  // ==========================================

  changeLife(player, amount) {
    this.gameState[player].hp += Number(amount);
    this.checkWinCondition();
    this.update();
  }

  checkWinCondition() {
    if (this.gameState.gameInfo.winner) return true;
    if (this.gameState.player.hp <= 0 && this.gameState.opponent.hp <= 0) {
      this.gameState.gameInfo.winner = "draw";
      this.gameState.gameInfo.winReason = "Both players reached 0 Life simultaneously!";
      this.gameState.gameInfo.phase = "gameOver";
      this.log("Game Over: Draw!", "system");
      return true;
    }
    if (this.gameState.opponent.hp <= 0) {
      this.gameState.gameInfo.winner = "player";
      this.gameState.gameInfo.winReason = "Opponent's Life dropped to 0!";
      this.gameState.gameInfo.phase = "gameOver";
      this.log("Victory! You defeated your opponent!", "system");
      return true;
    }
    if (this.gameState.player.hp <= 0) {
      this.gameState.gameInfo.winner = "opponent";
      this.gameState.gameInfo.winReason = "Your Life dropped to 0!";
      this.gameState.gameInfo.phase = "gameOver";
      this.log("Defeat! Your Life dropped to 0.", "system");
      return true;
    }
    return false;
  }

  dealDamage(sourceCard, target, rawAmount) {
    let amount = Number(rawAmount) || 0;
    if (amount <= 0) return 0;

    // Check Damage Amplifiers (Maum / Gramaum)
    if (sourceCard) {
      const remainingAmps = [];
      for (const amp of this.gameState.gameInfo.damageAmplifiers || []) {
        const matchesSource = amp.sourceId === sourceCard.cardNr;
        const matchesRecipient =
          (target.type === "shumi" && amp.recipientId === target.cardNr) ||
          (target.type === "player" && amp.recipientId === `player_${target.player}`);
        if (matchesSource && matchesRecipient) {
          amount += amp.amount;
          this.log(`Amplified damage by +${amp.amount}!`);
        } else {
          remainingAmps.push(amp);
        }
      }
      this.gameState.gameInfo.damageAmplifiers = remainingAmps;
    }

    if (target.type === "shumi") {
      const found = this.findShumiByCardNr(target.cardNr);
      if (!found) return 0;
      const targetShumi = found.card;

      // Check Damage Preventions (Horucan)
      const remainingPrevs = [];
      for (const prev of this.gameState.gameInfo.damagePreventions || []) {
        if (prev.targetCardNr === targetShumi.cardNr && amount > 0) {
          const prevented = Math.min(amount, prev.amount);
          amount -= prevented;
          this.log(`Prevented ${prevented} damage on ${this.cardData[targetShumi.id].name}!`);
        } else {
          remainingPrevs.push(prev);
        }
      }
      this.gameState.gameInfo.damagePreventions = remainingPrevs;

      if (amount > 0) {
        targetShumi.damageMarked = (targetShumi.damageMarked || 0) + amount;
        if (sourceCard) {
          const srcFound = this.findShumiByCardNr(sourceCard.cardNr);
          if (srcFound) srcFound.card.dealtDamageThisCycle = true;
        }
        this.syncAllStats();
        this.log(`${sourceCard ? this.cardData[sourceCard.id]?.name : "Effect"} dealt ${amount} damage to ${this.cardData[targetShumi.id].name}.`, "combat");

        if (this.getCurrentHp(found.player, targetShumi) <= 0) {
          this.defeatShumi(found.player, targetShumi, sourceCard);
        }
      }
      this.update();
      return amount;
    } else if (target.type === "player") {
      const targetPlayer = target.player;
      if (amount > 0) {
        this.gameState[targetPlayer].hp -= amount;
        if (sourceCard) {
          const srcFound = this.findShumiByCardNr(sourceCard.cardNr);
          if (srcFound) srcFound.card.dealtDamageThisCycle = true;
        }
        this.log(
          `${sourceCard ? this.cardData[sourceCard.id]?.name : "Effect"} dealt ${amount} damage to ${targetPlayer === "player" ? "You" : "Opponent"}!`,
          "combat"
        );
        this.checkWinCondition();
      }
      this.update();
      return amount;
    }
    return 0;
  }

  defeatShumi(owner, shumiCard, killerCard = null) {
    const found = this.findShumiByCardNr(shumiCard.cardNr);
    if (!found) return;

    const storedOnDefeated = found.card.storedYao || 0;
    const def = this.cardData[found.card.id];

    this.gameState[owner][found.lane] = this.gameState[owner][found.lane].filter((c) => c.cardNr !== shumiCard.cardNr);
    this.log(`${def.name} was defeated!`, "combat");

    if (!def.isToken) {
      this.gameState[owner].restingGrounds = [
        { id: found.card.id, cardNr: found.card.cardNr, owner, where: "restingGrounds" },
        ...this.gameState[owner].restingGrounds
      ];
    }

    // Rune of the Fertile Field (Upper Ability):
    // "Whenever a Shumi you control is defeated, if it had any Yao on it, put it on this card."
    if (storedOnDefeated > 0 && this.hasRuneEffect(owner, "fertile_upper_passive")) {
      this.gameState[owner].upperRuneZone.storedYao = (this.gameState[owner].upperRuneZone.storedYao || 0) + storedOnDefeated;
      this.log(`Rune of the Fertile Field recovered ${storedOnDefeated} Yao from ${def.name}!`);
    }

    // Sendris Trigger: "Whenever Sendris defeats another Shumi, it Prospers 1."
    if (killerCard && killerCard.id === "sendris" && killerCard.cardNr !== shumiCard.cardNr) {
      const killerFound = this.findShumiByCardNr(killerCard.cardNr);
      if (killerFound) {
        this.log(`Sendris defeated ${def.name} and Prospers 1!`);
        this.addStoredYaoToShumi(killerFound.player, killerFound.card, 1);
      }
    }

    this.syncAllStats();
    this.update();
  }

  returnShumiToHand(cardNr) {
    const found = this.findShumiByCardNr(cardNr);
    if (!found) return null;
    const { card, player, lane } = found;
    const def = this.cardData[card.id];

    this.gameState[player][lane] = this.gameState[player][lane].filter((c) => c.cardNr !== cardNr);

    if (!def.isToken) {
      const handCard = { id: card.id, cardNr: card.cardNr, owner: player, where: "hand" };
      this.gameState[player].hand.push(handCard);
      this.log(`${def.name} was returned to ${player === "player" ? "your" : "opponent's"} hand.`);
    } else {
      this.log(`Token ${def.name} left the battlefield and vanished.`);
    }

    this.syncAllStats();
    this.update();
    return card;
  }

  // ==========================================
  // LANE MOVEMENT (Rule 2.3)
  // ==========================================

  canChangeLane(player, card) {
    if (
      this.gameState.gameInfo.phase !== "actionPhase" ||
      this.gameState.gameInfo.activePlayer !== player ||
      this.gameState.gameInfo.priority.player !== player ||
      this.gameState.gameInfo.theStack.length > 0
    ) {
      return { canMove: false, reason: "Can only change lanes during your Action Phase with an empty Stack." };
    }

    const found = this.findShumiByCardNr(card.cardNr);
    if (!found || found.player !== player) return { canMove: false, reason: "Not on your battlefield." };

    const targetLane = found.lane === "frontline" ? "backline" : "frontline";
    const def = this.cardData[card.id];
    if (targetLane === "frontline" && def.keywords?.includes("cannot_frontline")) {
      return { canMove: false, reason: `${def.name} cannot be placed on the Frontline.` };
    }
    if (this.gameState[player][targetLane].length >= 5) {
      return { canMove: false, reason: `Your ${targetLane === "frontline" ? "Frontline" : "Backline"} is full (max 5).` };
    }

    const isFree = !this.gameState[player].hasUsedFreeLaneChange;
    if (!isFree && !found.card.momentum) {
      return { canMove: false, reason: "Free lane change already used this turn; requires Momentum to move." };
    }

    return {
      canMove: true,
      targetLane,
      costsMomentum: !isFree,
      canChoosePayment: isFree && Boolean(found.card.momentum)
    };
  }

  changeLane(player, cardNr, paymentMode = null) {
    const found = this.findShumiByCardNr(cardNr);
    if (!found) return false;
    const check = this.canChangeLane(player, found.card);
    if (!check.canMove) return false;

    let spendMomentum = check.costsMomentum;
    if (paymentMode === "momentum" && found.card.momentum) {
      spendMomentum = true;
    } else if (paymentMode === "free" && !this.gameState[player].hasUsedFreeLaneChange) {
      spendMomentum = false;
    }

    this.gameState[player][found.lane] = this.gameState[player][found.lane].filter((c) => c.cardNr !== cardNr);
    found.card.where = check.targetLane;
    if (spendMomentum) {
      found.card.momentum = false;
    } else {
      this.gameState[player].hasUsedFreeLaneChange = true;
    }
    this.gameState[player][check.targetLane].push(found.card);
    this.log(
      `${this.cardData[found.card.id].name} moved to ${check.targetLane === "frontline" ? "Frontline" : "Backline"}${
        spendMomentum ? " (spent Momentum)" : " (free move)"
      }.`
    );
    this.syncAllStats();
    this.update();
    return true;
  }

  // ==========================================
  // PLAYABILITY & COST CHECKS
  // ==========================================

  getEffectiveSummonCost(player, cardDef, maturingTarget = null) {
    let baseCost = cardDef.yaoCost || 0;
    if (maturingTarget) {
      const youngDef = this.cardData[maturingTarget.id];
      baseCost = Math.max(0, baseCost - (youngDef?.yaoCost || 0));
    }
    let reduction = 0;
    (this.gameState[player].costReductions || []).forEach((r) => {
      if (r.type === "shumi" && (!r.habitat || r.habitat === cardDef.habitat)) {
        reduction += r.amount;
      }
    });
    return Math.max(0, baseCost - reduction);
  }

  getMaturingTargets(player, cardDef) {
    if (!cardDef || cardDef.stage !== 2 || !cardDef.maturesFrom) return [];
    return this.getAllBattlefieldShumi(player).filter((s) => {
      if (s.id !== cardDef.maturesFrom) return false;
      const costDiff = this.getEffectiveSummonCost(player, cardDef, s);
      const availableYao = (s.storedYao || 0) + this.gameState[player].yaoReserve;
      return availableYao >= costDiff;
    });
  }

  canSummonNormally(player, cardDef) {
    if (cardDef.id === "campest") {
      // Campest summoning condition: remove 10 Stored Yao from among friendly Shumi
      const totalStoredOnShumi = this.getAllBattlefieldShumi(player).reduce((acc, s) => acc + (s.storedYao || 0), 0);
      const hasLaneSpace = this.gameState[player].frontline.length < 5 || this.gameState[player].backline.length < 5;
      return totalStoredOnShumi >= 10 && hasLaneSpace;
    }

    const cost = this.getEffectiveSummonCost(player, cardDef, null);
    if (this.gameState[player].yaoReserve < cost) return false;

    const canFront = !cardDef.keywords?.includes("cannot_frontline") && this.gameState[player].frontline.length < 5;
    const canBack = this.gameState[player].backline.length < 5;
    return canFront || canBack;
  }

  checkCanPlay(player, cardObj) {
    if (!cardObj) return false;
    const cardDef = cardObj.type ? cardObj : this.cardData[cardObj.id];
    if (!cardDef) return false;

    if (this.gameState.gameInfo.priority.player !== player) return false;
    if (!this.gameState.gameInfo.playable[player].includes(cardDef.speed)) return false;

    if (cardDef.type === "crystal") {
      return !this.gameState[player].hasPlayedCrystal;
    }

    if (cardDef.type === "shumi" || cardDef.type === "myth") {
      const normalOk = this.canSummonNormally(player, cardDef);
      const matureOk = this.getMaturingTargets(player, cardDef).length > 0;
      return normalOk || matureOk;
    }

    // Spells, Quickcasts, Interceptions
    if (cardDef.payOnlyWithStoredYao) {
      // The Grand Harvest: costs 6 Stored Yao from friendly Shumi
      const totalStored = this.getAllBattlefieldShumi(player).reduce((sum, s) => sum + (s.storedYao || 0), 0);
      if (totalStored < cardDef.yaoCost) return false;
      return true;
    }

    if (cardDef.yaoCost === "x") {
      const minX = cardDef.minX || 1;
      if (this.gameState[player].yaoReserve < minX) return false;
      if (cardDef.id === "unleash-the-wild-one") {
        const maxAffordableYc = this.gameState[player].yaoReserve + 1;
        const hasValidShumiInHand = this.gameState[player].hand.some((c) => {
          const d = this.cardData[c.id];
          return d && d.type === "shumi" && d.yaoCost <= maxAffordableYc;
        });
        const hasSpace = this.gameState[player].frontline.length < 5 || this.gameState[player].backline.length < 5;
        return hasValidShumiInHand && hasSpace;
      }
      return true;
    }

    if (this.gameState[player].yaoReserve < (cardDef.yaoCost || 0)) return false;

    return this.areSpellPlayConditionsMet(player, cardDef);
  }

  areSpellPlayConditionsMet(player, cardDef) {
    const allShumi = [...this.getAllBattlefieldShumi("player"), ...this.getAllBattlefieldShumi("opponent")];
    switch (cardDef.id) {
      case "hasten":
      case "prosper":
        return allShumi.length > 0;
      case "ritual-of-the-vast":
        return this.gameState[player].frontline.length < 5 || this.gameState[player].backline.length < 5;
      case "cycle-summon":
        return this.getAllBattlefieldShumi(player).length > 0;
      case "razorgrass-shield": {
        // Must have an attack on top of stack targeting a friendly frontline Shumi, and backline not full
        if (this.gameState[player].backline.length >= 5) return false;
        const stack = this.gameState.gameInfo.theStack;
        const attackItem = [...stack].reverse().find((item) => item.kind === "attack" && !item.meta?.canceled);
        if (!attackItem || !attackItem.target || attackItem.target.type !== "shumi") return false;
        const found = this.findShumiByCardNr(attackItem.target.cardNr);
        return Boolean(found && found.player === player && found.lane === "frontline");
      }
      default:
        return true;
    }
  }

  // ==========================================
  // ACTIVATED ABILITIES (SHUMI, RUNES, BURST)
  // ==========================================

  checkCanActivateAbilities(player, card) {
    if (!card || !card.id) return [];
    if (this.gameState.gameInfo.priority.player !== player) return [];
    const cardDef = this.cardData[card.id];
    if (!cardDef) return [];

    let candidateAbilities = [];
    if (cardDef.type === "power-rune") {
      const runeAbilities = this.getActiveRuneAbilities(player).filter(
        (ab) => ab.runeCard?.slot === card.slot && ab.trigger?.type === "activated"
      );
      candidateAbilities = runeAbilities;
    } else {
      candidateAbilities = (cardDef.abilities || []).filter((ab) => ab.trigger?.type === "activated");
    }

    const canPlay = [];
    for (const ab of candidateAbilities) {
      if (!this.gameState.gameInfo.playable[player].includes(ab.speed)) continue;
      if (ab.where) {
        if (ab.where === "battlefield") {
          if (card.where !== "frontline" && card.where !== "backline" && card.where !== "battlefield") continue;
        } else if (card.where !== ab.where) {
          continue;
        }
      }
      if (ab.oncePerTurn && (card.usedThisTurn || card.usedAbilitiesThisTurn?.includes(ab.id))) continue;
      if (ab.oncePerYaoCycle && card.usedAbilitiesThisCycle?.includes(ab.id)) continue;

      if (!this.areAbilityConditionsMet(player, card, ab)) continue;
      if (!this.areAbilityCostsPayable(player, card, ab.cost || [])) continue;

      canPlay.push(ab);
    }
    return canPlay;
  }

  areAbilityConditionsMet(player, card, ab) {
    const conds = ab.conditions || ab.trigger?.conditions || [];
    for (const c of conds) {
      if (c.condition === "has_momentum" && !card.momentum) return false;
      if (c.condition === "has_stored" && !(card.storedYao > 0)) return false;
      if (c.condition === "has_shumi") {
        if (c.object === "friendly_battlefield" && this.getAllBattlefieldShumi(player).length === 0) return false;
        if (
          c.object === "battlefield" &&
          this.getAllBattlefieldShumi("player").length === 0 &&
          this.getAllBattlefieldShumi("opponent").length === 0
        ) {
          return false;
        }
      }
      if (c.condition === "has_muspem") {
        const hasMuspemInHand = this.gameState[player].hand.some((h) => h.id === "muspem");
        const hasSpace = this.gameState[player].frontline.length < 5 || this.gameState[player].backline.length < 5;
        if (!hasMuspemInHand || !hasSpace) return false;
      }
    }
    return true;
  }

  areAbilityCostsPayable(player, card, costs) {
    if (!costs || costs.length === 0) return true;
    for (const cost of costs) {
      if (cost.yao !== undefined) {
        // Rule 3.1.1: Stored Yao on this card can be used to pay for abilities originating from this card
        const available = this.gameState[player].yaoReserve + (card.storedYao || 0);
        const minNeeded = cost.yao === "x" ? cost.minX || 1 : cost.yao;
        if (available < minNeeded) return false;
      }
      if (cost.storedYao !== undefined) {
        const stored = card.storedYao || 0;
        const minNeeded = cost.storedYao === "x" ? cost.minX || 1 : cost.storedYao;
        if (stored < minNeeded) return false;
      }
    }
    return true;
  }

  async promptAndPayYaoFromCardOrReserve(player, card, totalCost, actionTitle = "Pay Cost", onlyStored = false) {
    const needed = Number(totalCost) || 0;
    if (needed <= 0) return true;

    const cardName = this.cardData[card.id]?.name || "Shumi";
    const storedAvail = card.storedYao || 0;
    const reserveAvail = this.gameState[player].yaoReserve || 0;

    if (onlyStored) {
      if (storedAvail < needed) return false;
      if (player === "player") {
        const chosen = await this.askPlayerChoice({
          type: "pay_yao_cost",
          title: `${actionTitle} — Cost: ${needed} Stored Yao`,
          message: `Pay ${needed} Stored Yao from ${cardName} (${storedAvail} available):`,
          options: [
            { label: `Pay ${needed} Stored Yao from ${cardName}`, value: needed },
            { label: "Cancel", value: null }
          ]
        });
        if (chosen === null || chosen === undefined) return false;
      }
      card.storedYao = Math.max(0, storedAvail - needed);
      this.syncAllStats();
      return true;
    }

    if (storedAvail + reserveAvail < needed) return false;

    const minStored = Math.max(0, needed - reserveAvail);
    const maxStored = Math.min(storedAvail, needed);

    let spendFromStored = minStored;

    if (player === "player") {
      // Prompt player whenever Stored Yao is involved OR multiple payment splits exist
      if (storedAvail > 0) {
        const paymentOpts = [];
        for (let s = minStored; s <= maxStored; s++) {
          const r = needed - s;
          let label = "";
          if (s === 0) {
            label = `Pay ${r} from Yao Reserve (Keep ${storedAvail} Stored Yao on ${cardName})`;
          } else if (r === 0) {
            label = `Pay ${s} Stored Yao from ${cardName} (Keep ${reserveAvail} Yao Reserve)`;
          } else {
            label = `Pay ${r} from Yao Reserve + ${s} Stored Yao from ${cardName} (Keep ${storedAvail - s} on ${cardName})`;
          }
          paymentOpts.push({ label, value: s });
        }
        paymentOpts.push({ label: "Cancel", value: null });

        const chosen = await this.askPlayerChoice({
          type: "pay_yao_cost",
          title: `${actionTitle} — Pay ${needed} Yao`,
          message: `Choose where to pay ${needed} Yao from (Yao Reserve: ${reserveAvail} available • ${cardName} Stored Yao: ${storedAvail} available):`,
          options: paymentOpts
        });
        if (chosen === null || chosen === undefined) return false;
        spendFromStored = chosen;
      }
    } else {
      // For AI: preserve Stored Yao on Shumi that scale with Stored Yao by spending Yao Reserve first
      const scalesWithStoredYao = ["maum", "farloss", "faele", "sendris", "gramaum", "inazovis", "horucan", "campest"].includes(card.id);
      spendFromStored = scalesWithStoredYao ? minStored : maxStored;
    }

    const spendFromReserve = needed - spendFromStored;
    card.storedYao = Math.max(0, storedAvail - spendFromStored);
    this.gameState[player].yaoReserve = Math.max(0, reserveAvail - spendFromReserve);
    this.syncAllStats();
    return true;
  }

  async promptRemoveStoredYaoFromShumi(player, totalNeeded, actionTitle = "Remove Stored Yao") {
    const friendlyWithYao = this.getAllBattlefieldShumi(player).filter((s) => (s.storedYao || 0) > 0);
    const totalStored = friendlyWithYao.reduce((sum, s) => sum + (s.storedYao || 0), 0);
    if (totalStored < totalNeeded) return null;

    const removedMap = {};
    let remaining = totalNeeded;

    if (player === "player") {
      while (remaining > 0) {
        const candidates = friendlyWithYao.filter((s) => (s.storedYao || 0) - (removedMap[s.cardNr] || 0) > 0);
        if (candidates.length === 0) return null;

        const opts = [];
        for (const s of candidates) {
          const sName = this.cardData[s.id]?.name || "Shumi";
          const laneLabel = s.where === "frontline" ? "Frontline" : "Backline";
          const alreadyChosen = removedMap[s.cardNr] || 0;
          const availLeft = (s.storedYao || 0) - alreadyChosen;

          opts.push({
            label: `${sName} [${laneLabel}] — Pay 1 Stored Yao (${availLeft} left${alreadyChosen > 0 ? `, ${alreadyChosen} selected` : ""})`,
            value: { cardNr: s.cardNr, amount: 1 }
          });

          const maxFromThis = Math.min(availLeft, remaining);
          if (maxFromThis > 1) {
            opts.push({
              label: `${sName} [${laneLabel}] — Pay ${maxFromThis} Stored Yao from ${sName}`,
              value: { cardNr: s.cardNr, amount: maxFromThis }
            });
          }
        }
        opts.push({ label: "Cancel", value: null });

        const picked = await this.askPlayerChoice({
          type: "pay_multi_stored_yao",
          title: `${actionTitle} (${totalNeeded - remaining} / ${totalNeeded} Yao Paid)`,
          message: `Choose which friendly Shumi to pay Stored Yao from (${remaining} more Yao needed):`,
          options: opts
        });

        if (!picked) return null;
        removedMap[picked.cardNr] = (removedMap[picked.cardNr] || 0) + picked.amount;
        remaining -= picked.amount;
      }
    } else {
      for (const s of friendlyWithYao) {
        if (remaining <= 0) break;
        const take = Math.min(s.storedYao || 0, remaining);
        if (take > 0) {
          removedMap[s.cardNr] = take;
          remaining -= take;
        }
      }
    }

    // Apply Stored Yao deductions now that the full payment has been confirmed
    for (const s of friendlyWithYao) {
      const amt = removedMap[s.cardNr] || 0;
      if (amt > 0) {
        s.storedYao = Math.max(0, (s.storedYao || 0) - amt);
      }
    }
    this.syncAllStats();
    return removedMap;
  }

  // ==========================================
  // ATTACKING & COMBAT SYSTEM (Rule 2.1 & 2.2)
  // ==========================================

  canAttack(player, card) {
    if (
      this.gameState.gameInfo.phase !== "actionPhase" ||
      this.gameState.gameInfo.activePlayer !== player ||
      !this.gameState.gameInfo.playable[player].includes("s") ||
      this.gameState.gameInfo.priority.player !== player ||
      this.gameState.gameInfo.theStack.length > 0
    ) {
      return { canAttack: false, reason: "basic_condition_not_fulfilled" };
    }
    if (!card.momentum) {
      return { canAttack: false, reason: "no_momentum" };
    }
    const cardDef = this.cardData[card.id];
    if (!cardDef) return { canAttack: false, reason: "unknown_card" };

    // Rule 2.1.1 & 2.1.3: Melee can only attack from Frontline (Flight does NOT allow attacking from Backline)
    if (cardDef.range === "m" && card.where !== "frontline") {
      return { canAttack: false, reason: "m_shumi_on_backline" };
    }

    return { canAttack: true };
  }

  getAvailableAttacks(player, card) {
    if (!this.canAttack(player, card).canAttack) return [];
    const cardDef = this.cardData[card.id];
    const allAttacks = [
      ...(cardDef.baseAttacks || []).map((a) => ({ ...a, attackCategory: "base" })),
      ...(cardDef.specialAttacks || []).map((a) => ({ ...a, attackCategory: "special" }))
    ];

    const availableYao = this.gameState[player].yaoReserve + (card.storedYao || 0);
    return allAttacks.filter((att) => {
      if ((att.yaoCost || 0) > availableYao) return false;
      const targets = this.getLegalTargetsForAttack(player, card, att);
      if (att.target && (!targets || targets.length === 0)) return false;
      return true;
    });
  }

  getLegalTargetsForAttack(player, card, attack) {
    if (!attack.target || attack.target.length === 0) return null; // No target needed
    const targetType = attack.target[0];
    const enemyPlayer = this.otherPlayer(player);

    if (targetType === "all_other_shumi" || targetType === "all_shumi") {
      return null; // AoE attack needs no single target selection
    }

    if (targetType === "friendly_kalfil") {
      return this.getAllBattlefieldShumi(player)
        .filter((s) => s.id === "kalfil")
        .map((s) => ({
          type: "shumi",
          cardNr: s.cardNr,
          player,
          label: `${this.cardData[s.id].name} (${this.getCurrentHp(player, s)} LF)`
        }));
    }

    if (targetType === "enemy") {
      const enemyFrontline = this.gameState[enemyPlayer].frontline.filter(
        (s) => !this.isShumiImmuneToAttackTarget(enemyPlayer, s)
      );
      const enemyBackline = this.gameState[enemyPlayer].backline.filter(
        (s) => !this.isShumiImmuneToAttackTarget(enemyPlayer, s)
      );

      const hasFlight = this.hasKeyword(player, card, "flight", attack.id);
      const isRanged = this.cardData[card.id]?.range === "r";

      const targets = [];
      enemyFrontline.forEach((s) => {
        targets.push({
          type: "shumi",
          cardNr: s.cardNr,
          player: enemyPlayer,
          lane: "frontline",
          label: `${this.cardData[s.id].name} [Frontline] (${this.getCurrentHp(enemyPlayer, s)} LF)`
        });
      });

      // Rule 2.1.2: Normally only frontline Shumi; if there are none OR attacker has Flight (or Ranged), may target Backline Shumi or Opponent Player
      if (enemyFrontline.length === 0 || hasFlight || isRanged) {
        enemyBackline.forEach((s) => {
          targets.push({
            type: "shumi",
            cardNr: s.cardNr,
            player: enemyPlayer,
            lane: "backline",
            label: `${this.cardData[s.id].name} [Backline] (${this.getCurrentHp(enemyPlayer, s)} LF)`
          });
        });
        targets.push({
          type: "player",
          player: enemyPlayer,
          label: `${enemyPlayer === "opponent" ? "Opponent Player" : "You"} (${this.gameState[enemyPlayer].hp} LF)`
        });
      }
      return targets;
    }

    return [];
  }

  calculateAttackDamage(player, attackerCard, attack, extraDamage = 0) {
    let dmg = (attack.damage || 0) + (extraDamage || 0);
    const cardDef = this.cardData[attackerCard.id];

    // Attack Modifiers
    if (attack.modifier) {
      const mod = attack.modifier;
      if (mod.resource === "storedYao") {
        if (mod.source?.includes("this")) {
          dmg += (attackerCard.storedYao || 0) * (mod.amount || 1);
        } else if (mod.source?.includes("all_friendly_shumi")) {
          const totalStored = this.getAllBattlefieldShumi(player).reduce((sum, s) => sum + (s.storedYao || 0), 0);
          dmg += totalStored * (mod.amount || 1);
        }
      } else if (mod.resource === "friendly_shumi_count") {
        const count = this.getAllBattlefieldShumi(player).filter((s) => this.matchesFilter(this.cardData[s.id], mod.filter)).length;
        dmg += count * (mod.amount || 1);
      }
    }

    // Farloss continuous: +1 attack damage per Stored Yao on Farloss
    if (attackerCard.id === "farloss") {
      dmg += attackerCard.storedYao || 0;
    }

    // Sendris continuous: If you have 3+ Frontline Shumi, friendly Frontline Shumi deal +1 Base Attack damage
    const isBaseAttack = (cardDef?.baseAttacks || []).some((ba) => ba.id === attack.id || ba.name === attack.name);
    const isSpecialAttack = (cardDef?.specialAttacks || []).some((sa) => sa.id === attack.id || sa.name === attack.name);

    if (isBaseAttack && attackerCard.where === "frontline" && this.gameState[player].frontline.length >= 3) {
      const sendrisCount = this.getAllBattlefieldShumi(player).filter((s) => s.id === "sendris").length;
      dmg += sendrisCount;
    }

    // Rune of the Razorgrass Lower Ability:
    // "Each Shumi under your control with at least 1 Stored Yao deals 1 additional damage with their Special Attacks."
    if (isSpecialAttack && (attackerCard.storedYao || 0) >= 1 && this.hasRuneEffect(player, "razorgrass_lower")) {
      dmg += 1;
    }

    return Math.max(0, dmg);
  }

  async declareAttack(player, cardNr, attackId, chosenTarget = null) {
    const found = this.findShumiByCardNr(cardNr);
    if (!found) return;
    const attacker = found.card;
    const availableAttacks = this.getAvailableAttacks(player, attacker);
    const attack = availableAttacks.find((a) => a.id === attackId || a.name === attackId);
    if (!attack) return;

    let target = chosenTarget;
    const legalTargets = this.getLegalTargetsForAttack(player, attacker, attack);
    if (legalTargets && legalTargets.length > 0 && !target) {
      if (player === "player") {
        target = await this.askPlayerTarget({
          title: `${this.cardData[attacker.id].name} — ${attack.name}`,
          message: `Select target for ${attack.name}:`,
          legalTargets,
          optional: true
        });
        if (!target) return; // Canceled
      } else {
        target = legalTargets[0];
      }
    }

    // Pay attack Yao cost (Rule 3.1.1: can use Stored Yao on attacker + Reserve) and consume Momentum (Rule 2.2.3)
    const paidAttackCost = await this.promptAndPayYaoFromCardOrReserve(
      player,
      attacker,
      attack.yaoCost || 0,
      `${this.cardData[attacker.id].name} — ${attack.name}`,
      false
    );
    if (!paidAttackCost) return false;
    attacker.momentum = false;

    let extraDamage = 0;

    // Equuna Tag Team trigger:
    // "When Equuna uses its Tag Team attack, you may return another Shumi you control that has Momentum to hand: Tag Team deals additional damage equal to the damage of its Base Attack."
    if (attacker.id === "equuna" && attack.id === "tag_team") {
      const otherWithMomentum = this.getAllBattlefieldShumi(player).filter(
        (s) => s.cardNr !== attacker.cardNr && s.momentum
      );
      if (otherWithMomentum.length > 0) {
        let bounceCardNr = null;
        if (player === "player") {
          bounceCardNr = await this.askPlayerChoice({
            type: "equuna_tag_team",
            title: "Equuna — Tag Team",
            message: "Return another friendly Shumi with Momentum to hand to add its Base Attack damage?",
            options: [
              { label: "Do not return a Shumi (+0 dmg)", value: null },
              ...otherWithMomentum.map((s) => {
                const baDmg = this.cardData[s.id]?.baseAttacks?.[0]?.damage || 0;
                return {
                  label: `Return ${this.cardData[s.id].name} (+${baDmg} damage)`,
                  value: s.cardNr
                };
              })
            ]
          });
        } else {
          bounceCardNr = this.ai.chooseEquunaBounceTarget(this.gameState, attacker, target, otherWithMomentum);
        }
        if (bounceCardNr) {
          const bounced = this.returnShumiToHand(bounceCardNr);
          if (bounced) {
            extraDamage += this.cardData[bounced.id]?.baseAttacks?.[0]?.damage || 0;
            this.log(`Equuna's Tag Team boosted by +${extraDamage} damage!`);
          }
        }
      }
    }

    const stackItem = {
      id: uid("stack_atk"),
      kind: "attack",
      player,
      card: { ...attacker },
      attack,
      target,
      meta: {
        attackerCardNr: attacker.cardNr,
        extraDamage,
        canceled: false,
        summaryText: `${this.cardData[attacker.id].name} uses ${attack.name}${target ? ` → ${target.label}` : ""}`
      }
    };

    this.gameState.gameInfo.theStack = [...this.gameState.gameInfo.theStack, stackItem];
    this.log(`${player === "player" ? "Your" : "Opponent's"} ${stackItem.meta.summaryText}`, "combat");

    // Check Kalfil on_targeted_by_attack trigger:
    // "When targeted by an attack, you may reveal a Mature Kalfil from your hand to cancel the attack."
    if (target && target.type === "shumi") {
      const targetInfo = this.findShumiByCardNr(target.cardNr);
      if (targetInfo && targetInfo.card.id === "kalfil") {
        const defPlayer = targetInfo.player;
        const hasMatureKalfil = this.gameState[defPlayer].hand.some(
          (h) => this.cardData[h.id]?.maturesFrom === "kalfil"
        );
        if (hasMatureKalfil) {
          let shouldCancel = false;
          if (defPlayer === "player") {
            shouldCancel = await this.askPlayerChoice({
              type: "kalfil_cancel",
              title: "Kalfil — Fierce Guardian",
              message: "Reveal Kalflux from your hand to cancel the incoming attack on Kalfil?",
              options: [
                { label: "Reveal Kalflux & Cancel Attack", value: true },
                { label: "Do Not Reveal", value: false }
              ]
            });
          } else {
            shouldCancel = true;
          }
          if (shouldCancel) {
            stackItem.meta.canceled = true;
            this.log(`${defPlayer === "player" ? "You" : "Opponent"} revealed Kalflux from hand to cancel the attack on Kalfil!`, "combat");
          }
        }
      }
    }

    this.resetPassedFlags();
    this.update();
    await this.handleGivePrio(player);
  }

  // ==========================================
  // PLAYING CARDS & ACTIVATING ABILITIES ON STACK
  // ==========================================

  async initiatePlayFromHand(player, handCard, options = {}) {
    const cardDef = this.cardData[handCard.id];
    if (!cardDef || !this.checkCanPlay(player, cardDef)) return false;

    // 1. Crystal Play (does not use stack, once per turn)
    if (cardDef.type === "crystal") {
      this.playCrystal(player, handCard);
      this.update();
      return true;
    }

    // 2. Shumi or Myth Play
    if (cardDef.type === "shumi" || cardDef.type === "myth") {
      return await this.playShumiOrMyth(player, handCard, options);
    }

    // 3. Spells, Quickcasts, Interceptions
    return await this.playSpellCard(player, handCard, options);
  }

  async playShumiOrMyth(player, handCard, options = {}) {
    const cardDef = this.cardData[handCard.id];

    // Special Case: Campest Myth summoning condition (remove 10 Stored Yao from friendly Shumi)
    if (cardDef.id === "campest") {
      const shumiWithYao = this.getAllBattlefieldShumi(player).filter((s) => (s.storedYao || 0) > 0);
      const totalStored = shumiWithYao.reduce((sum, s) => sum + (s.storedYao || 0), 0);
      if (totalStored < 10) return false;

      let chosenLane = options.lane;
      if (!chosenLane) {
        if (player === "player") {
          const laneOpts = [];
          if (this.gameState.player.frontline.length < 5) laneOpts.push({ label: "Frontline", value: "friendly_frontline" });
          if (this.gameState.player.backline.length < 5) laneOpts.push({ label: "Backline", value: "friendly_backline" });
          chosenLane = await this.askPlayerChoice({
            type: "lane_choice",
            title: "Summon Campest, Spirit of the Vast",
            message: "Remove 10 Stored Yao from among your Shumi and choose a lane for Campest:",
            options: [...laneOpts, { label: "Cancel", value: null }]
          });
          if (!chosenLane) return false;
        } else {
          chosenLane = this.gameState.opponent.frontline.length < 5 ? "enemy_frontline" : "enemy_backline";
        }
      }

      // Prompt player which friendly Shumi to remove 10 Stored Yao from
      const removedMap = await this.promptRemoveStoredYaoFromShumi(
        player,
        10,
        "Summon Campest — Pay 10 Stored Yao"
      );
      if (!removedMap) return false;

      this.gameState[player].hand = this.gameState[player].hand.filter((c) => c.cardNr !== handCard.cardNr);
      this.consumeCostReduction(player, cardDef);
      this.syncAllStats();

      this.gameState.gameInfo.theStack.push({
        id: uid("stack_shumi"),
        kind: "card",
        player,
        card: { ...handCard },
        target: chosenLane,
        meta: {
          enteredBy: "normal",
          summaryText: `Summon ${cardDef.name} (${chosenLane.includes("frontline") ? "Frontline" : "Backline"})`
        }
      });
      this.log(`${player === "player" ? "You" : "Opponent"} summoned Campest by removing 10 Stored Yao!`);
      this.resetPassedFlags();
      this.update();
      await this.handleGivePrio(player);
      return true;
    }

    // Check if Stage 2 Shumi can Mature vs Normal Summon
    const matureTargets = this.getMaturingTargets(player, cardDef);
    const canNormal = this.canSummonNormally(player, cardDef);

    const rawMode = options.mode || options.summonMode || null;
    let mode = rawMode === "maturing" ? "mature" : rawMode; // "normal" | "mature"
    let maturingTargetNr = options.maturingTargetNr || options.maturingTargetCardNr || null;

    if (!mode) {
      if (matureTargets.length > 0 && canNormal && player === "player") {
        const normalCost = this.getEffectiveSummonCost(player, cardDef, null);
        const choice = await this.askPlayerChoice({
          type: "summon_or_mature",
          title: `Play ${cardDef.name}`,
          message: `How would you like to summon ${cardDef.name}?`,
          options: [
            { label: `Summon Normally (${normalCost} Yao)`, value: { mode: "normal" } },
            ...matureTargets.map((mt) => {
              const diff = this.getEffectiveSummonCost(player, cardDef, mt);
              return {
                label: `Mature ${this.cardData[mt.id].name} in ${mt.where === "frontline" ? "Frontline" : "Backline"} (${diff} Yao, has ${mt.storedYao || 0} Stored Yao)`,
                value: { mode: "mature", targetNr: mt.cardNr }
              };
            }),
            { label: "Cancel", value: null }
          ]
        });
        if (!choice) return false;
        mode = choice.mode;
        maturingTargetNr = choice.targetNr;
      } else if (matureTargets.length > 0 && !canNormal) {
        mode = "mature";
        if (matureTargets.length === 1 || player === "opponent") {
          maturingTargetNr = matureTargets[0].cardNr;
        } else {
          const picked = await this.askPlayerChoice({
            type: "choose_mature_target",
            title: `Mature into ${cardDef.name}`,
            message: `Select which ${this.cardData[cardDef.maturesFrom].name} to Mature:`,
            options: [
              ...matureTargets.map((mt) => ({
                label: `${this.cardData[mt.id].name} (${mt.where}, ${mt.storedYao || 0} Stored Yao)`,
                value: mt.cardNr
              })),
              { label: "Cancel", value: null }
            ]
          });
          if (!picked) return false;
          maturingTargetNr = picked;
        }
      } else {
        mode = "normal";
      }
    }

    if (mode === "mature") {
      if (!maturingTargetNr && matureTargets.length > 0) {
        if (matureTargets.length === 1 || player === "opponent") {
          maturingTargetNr = matureTargets[0].cardNr;
        } else {
          const picked = await this.askPlayerChoice({
            type: "choose_mature_target",
            title: `Mature into ${cardDef.name}`,
            message: `Select which ${this.cardData[cardDef.maturesFrom].name} to Mature:`,
            options: [
              ...matureTargets.map((mt) => ({
                label: `${this.cardData[mt.id].name} (${mt.where}, ${mt.storedYao || 0} Stored Yao)`,
                value: mt.cardNr
              })),
              { label: "Cancel", value: null }
            ]
          });
          if (!picked) return false;
          maturingTargetNr = picked;
        }
      }

      const targetInfo = this.findShumiByCardNr(maturingTargetNr);
      if (!targetInfo) return false;
      const youngShumi = targetInfo.card;
      const diffCost = this.getEffectiveSummonCost(player, cardDef, youngShumi);

      const paidMature = await this.promptAndPayYaoFromCardOrReserve(
        player,
        youngShumi,
        diffCost,
        `Mature ${this.cardData[youngShumi.id].name} → ${cardDef.name}`,
        false
      );
      if (!paidMature) return false;

      this.consumeCostReduction(player, cardDef);

      this.gameState[player].hand = this.gameState[player].hand.filter((c) => c.cardNr !== handCard.cardNr);
      const targetLaneKey = targetInfo.lane === "frontline" ? "friendly_frontline" : "friendly_backline";

      this.gameState.gameInfo.theStack.push({
        id: uid("stack_mature"),
        kind: "card",
        player,
        card: { ...handCard },
        target: targetLaneKey,
        meta: {
          enteredBy: "maturing",
          maturingTargetCardNr: youngShumi.cardNr,
          summaryText: `Mature ${this.cardData[youngShumi.id].name} → ${cardDef.name}`
        }
      });

      this.log(`${player === "player" ? "You" : "Opponent"} began Maturing ${this.cardData[youngShumi.id].name} into ${cardDef.name}.`);
      this.syncAllStats();
      this.resetPassedFlags();
      this.update();
      await this.handleGivePrio(player);
      return true;
    }

    // Normal Summon
    let chosenLane = options.lane || options.targetLane || null;
    const canFront = !cardDef.keywords?.includes("cannot_frontline") && this.gameState[player].frontline.length < 5;
    const canBack = this.gameState[player].backline.length < 5;

    if (!chosenLane) {
      if (canFront && !canBack) {
        chosenLane = player === "player" ? "friendly_frontline" : "enemy_frontline";
      } else if (!canFront && canBack) {
        chosenLane = player === "player" ? "friendly_backline" : "enemy_backline";
      } else if (player === "player") {
        chosenLane = await this.askPlayerChoice({
          type: "lane_choice",
          title: `Summon ${cardDef.name}`,
          message: `Choose a lane for ${cardDef.name}:`,
          options: [
            { label: "Frontline", value: "friendly_frontline" },
            { label: "Backline", value: "friendly_backline" },
            { label: "Cancel", value: null }
          ]
        });
        if (!chosenLane) return false;
      } else {
        chosenLane = this.ai.getTargetForShumi(this.gameState, handCard);
      }
    }

    const cost = this.getEffectiveSummonCost(player, cardDef, null);
    this.gameState[player].yaoReserve -= cost;
    this.consumeCostReduction(player, cardDef);
    this.gameState[player].hand = this.gameState[player].hand.filter((c) => c.cardNr !== handCard.cardNr);

    this.gameState.gameInfo.theStack.push({
      id: uid("stack_shumi"),
      kind: "card",
      player,
      card: { ...handCard },
      target: chosenLane,
      meta: {
        enteredBy: "normal",
        summaryText: `Summon ${cardDef.name} (${chosenLane.includes("frontline") ? "Frontline" : "Backline"})`
      }
    });

    this.log(`${player === "player" ? "You" : "Opponent"} cast ${cardDef.name}.`);
    this.resetPassedFlags();
    this.update();
    await this.handleGivePrio(player);
    return true;
  }

  consumeCostReduction(player, cardDef) {
    let consumed = false;
    this.gameState[player].costReductions = (this.gameState[player].costReductions || []).filter((r) => {
      if (!consumed && r.type === "shumi" && (!r.habitat || r.habitat === cardDef.habitat)) {
        consumed = true;
        return false;
      }
      return true;
    });

    // Rune of the Razorgrass Upper Ability:
    // "Whenever you summon a Shumi, the next Shumi of the same habitat you summon this turn costs 1 Yao less to summon."
    if (cardDef.type === "shumi" && this.hasRuneEffect(player, "razorgrass_upper")) {
      this.gameState[player].costReductions.push({
        type: "shumi",
        habitat: cardDef.habitat,
        amount: 1
      });
      this.log(`Rune of the Razorgrass: Next ${cardDef.habitat} Shumi this turn costs 1 Yao less!`);
    }
  }

  async playSpellCard(player, handCard, options = {}) {
    const cardDef = this.cardData[handCard.id];
    const allShumi = [...this.getAllBattlefieldShumi("player"), ...this.getAllBattlefieldShumi("opponent")];

    let target = options.target || null;
    let meta = { summaryText: cardDef.name };

    if (cardDef.id === "hasten" || cardDef.id === "prosper") {
      if (!target) {
        if (player === "player") {
          const pickedNr = await this.askPlayerTarget({
            title: cardDef.name,
            message: cardDef.text,
            legalTargets: allShumi.map((s) => ({
              type: "shumi",
              cardNr: s.cardNr,
              player: s.owner,
              label: `${s.owner === "player" ? "Friendly" : "Enemy"} ${this.cardData[s.id].name} (${this.getCurrentHp(s.owner, s)} LF)`
            })),
            optional: true
          });
          if (!pickedNr) return false;
          target = pickedNr;
        } else {
          const chosenNr =
            cardDef.id === "hasten"
              ? this.ai.chooseHastenTarget(this.gameState)
              : this.ai.chooseProsperTarget(this.gameState);
          const friendly = this.getAllBattlefieldShumi("opponent");
          const picked = chosenNr ? { cardNr: chosenNr } : friendly[0] || allShumi[0];
          if (!picked) return false;
          target = { type: "shumi", cardNr: picked.cardNr };
        }
      }
      const targetNr = typeof target === "object" ? target.cardNr : target;
      const tInfo = this.findShumiByCardNr(targetNr);
      meta.targetCardNr = targetNr;
      meta.summaryText = `${cardDef.name} → ${tInfo ? this.cardData[tInfo.card.id].name : "Target"}`;
      this.gameState[player].yaoReserve -= cardDef.yaoCost;
    } else if (cardDef.id === "ritual-of-the-vast") {
      let lane = options.lane || "frontline";
      if (this.gameState[player].frontline.length >= 5) lane = "backline";
      else if (this.gameState[player].backline.length < 5 && player === "player") {
        const pickedLane = await this.askPlayerChoice({
          type: "ritual_lane",
          title: "Ritual of the Vast",
          message: "Choose lane for the Sacrificial Spirit token (6 LF / BA: Bloom - 1):",
          options: [
            { label: "Frontline", value: "frontline" },
            { label: "Backline", value: "backline" },
            { label: "Cancel", value: null }
          ]
        });
        if (!pickedLane) return false;
        lane = pickedLane;
      }
      meta.lane = lane;
      this.gameState[player].yaoReserve -= cardDef.yaoCost;
    } else if (cardDef.id === "the-grand-harvest") {
      // Pay 6 Yao only with Stored Yao on your Shumi — prompt player which Shumi to pay from!
      const removedMap = await this.promptRemoveStoredYaoFromShumi(
        player,
        6,
        "The Grand Harvest — Pay 6 Stored Yao"
      );
      if (!removedMap) return false;
      meta.removedMap = removedMap;
      meta.summaryText = `The Grand Harvest (${Object.keys(removedMap).length} Shumi harvested)`;
    } else if (cardDef.id === "cycle-summon") {
      const friendlyShumi = this.getAllBattlefieldShumi(player);
      if (friendlyShumi.length === 0) return false;

      let bounceNr = options.bounceCardNr || null;
      if (!bounceNr) {
        if (player === "player") {
          bounceNr = await this.askPlayerTarget({
            title: "Cycle Summon — Additional Cost",
            message: "Choose a friendly Shumi to return to your hand:",
            legalTargets: friendlyShumi.map((s) => ({
              type: "shumi",
              cardNr: s.cardNr,
              player,
              label: `${this.cardData[s.id].name} (YC ${this.cardData[s.id].yaoCost})`
            })),
            optional: true
          });
          if (!bounceNr) return false;
        } else {
          bounceNr = this.ai.chooseCycleSummonBounce(this.gameState, friendlyShumi) || friendlyShumi[0].cardNr;
        }
      }

      const bNum = typeof bounceNr === "object" ? bounceNr.cardNr : bounceNr;
      const bouncedCard = this.returnShumiToHand(bNum);
      if (!bouncedCard) return false;

      this.gameState[player].yaoReserve -= cardDef.yaoCost;
      meta.returnedYaoCost = this.cardData[bouncedCard.id].yaoCost || 0;
      meta.summaryText = `Cycle Summon (returned ${this.cardData[bouncedCard.id].name}, YC ${meta.returnedYaoCost})`;
    } else if (cardDef.id === "unleash-the-wild-one") {
      const maxReserve = this.gameState[player].yaoReserve;
      if (maxReserve < 1) return false;

      let xVal = options.xValue || maxReserve;
      if (player === "player" && maxReserve > 1) {
        const opts = [];
        for (let x = 1; x <= maxReserve; x++) {
          opts.push({ label: `X = ${x} (Summon Shumi with YC ≤ ${x + 1})`, value: x });
        }
        opts.push({ label: "Cancel", value: null });
        const pickedX = await this.askPlayerChoice({
          type: "choose_x",
          title: "Unleash the Wild One",
          message: "Choose X Yao to spend:",
          options: opts
        });
        if (!pickedX) return false;
        xVal = pickedX;
      }
      xVal = Math.min(maxReserve, Math.max(1, xVal));
      this.gameState[player].yaoReserve -= xVal;
      meta.xValue = xVal;
      meta.summaryText = `Unleash the Wild One (X = ${xVal}, YC ≤ ${xVal + 1})`;
    } else if (cardDef.id === "razorgrass-shield") {
      const stack = this.gameState.gameInfo.theStack;
      const attackItem = [...stack].reverse().find((item) => item.kind === "attack" && !item.meta?.canceled);
      if (!attackItem || !attackItem.target || attackItem.target.type !== "shumi") return false;
      const attackedInfo = this.findShumiByCardNr(attackItem.target.cardNr);
      if (!attackedInfo || attackedInfo.player !== player || attackedInfo.lane !== "frontline") return false;

      // Additional cost: move attacked friendly Shumi from Frontline to Backline
      this.gameState[player].frontline = this.gameState[player].frontline.filter((c) => c.cardNr !== attackedInfo.card.cardNr);
      attackedInfo.card.where = "backline";
      this.gameState[player].backline.push(attackedInfo.card);
      this.gameState[player].yaoReserve -= cardDef.yaoCost;

      meta.attackStackId = attackItem.id;
      meta.summaryText = `Razorgrass Shield (protected ${this.cardData[attackedInfo.card.id].name})`;
    }

    this.gameState[player].hand = this.gameState[player].hand.filter((c) => c.cardNr !== handCard.cardNr);
    this.gameState.gameInfo.theStack.push({
      id: uid("stack_spell"),
      kind: "card",
      player,
      card: { ...handCard },
      target,
      meta
    });

    this.log(`${player === "player" ? "You" : "Opponent"} cast ${meta.summaryText}.`);
    this.resetPassedFlags();
    this.update();
    await this.handleGivePrio(player);
    return true;
  }

  // Activate an ability on a Shumi, Power Rune, or Crystal Burst in hand
  async activateAbility(player, sourceCard, ability, aiOptions = {}) {
    const canList = this.checkCanActivateAbilities(player, sourceCard);
    if (!canList.some((a) => a.id === ability.id)) return false;

    const allShumi = [...this.getAllBattlefieldShumi("player"), ...this.getAllBattlefieldShumi("opponent")];
    let meta = { abilityId: ability.id, summaryText: `${this.cardData[sourceCard.id].name}: ${ability.name || ability.id}` };

    // 1. Campestral Yao Crystal Burst from hand (Rule 3.3)
    if (ability.isBurst) {
      if (allShumi.length === 0) return false;
      let targetNr = aiOptions.targetCardNr || null;
      if (!targetNr) {
        if (player === "player") {
          const picked = await this.askPlayerTarget({
            title: "Campestral Yao Crystal — Burst",
            message: "Destroy this Crystal in hand: Choose target Shumi to Prosper 1:",
            legalTargets: allShumi.map((s) => ({
              type: "shumi",
              cardNr: s.cardNr,
              player: s.owner,
              label: `${s.owner === "player" ? "Friendly" : "Enemy"} ${this.cardData[s.id].name}`
            })),
            optional: true
          });
          if (!picked) return false;
          targetNr = typeof picked === "object" ? picked.cardNr : picked;
        } else {
          targetNr = this.ai.chooseProsperTarget(this.gameState);
        }
      }

      // Destroy crystal in hand -> move to restingGrounds
      this.gameState[player].hand = this.gameState[player].hand.filter((c) => c.cardNr !== sourceCard.cardNr);
      this.gameState[player].restingGrounds = [
        { ...sourceCard, where: "restingGrounds" },
        ...this.gameState[player].restingGrounds
      ];
      meta.targetCardNr = targetNr;
      const tInfo = this.findShumiByCardNr(targetNr);
      meta.summaryText = `Burst Crystal → ${tInfo ? this.cardData[tInfo.card.id].name : "Shumi"} Prospers 1`;
    }

    // 2. Maum / Gramaum Amplify Damage
    else if (ability.id === "maum_amplify" || ability.id === "gramaum_amplify") {
      const maxStored = ability.id === "maum_amplify" ? Math.min(3, sourceCard.storedYao || 0) : sourceCard.storedYao || 0;
      if (maxStored < 1 || allShumi.length === 0) return false;

      let xVal = aiOptions.xVal || 1;
      let sourceTarget = aiOptions.sourceId || null;
      let recipientTarget = aiOptions.recipientId || null;

      if (player === "player") {
        if (maxStored > 1) {
          const opts = [];
          for (let x = 1; x <= maxStored; x++) opts.push({ label: `Spend ${x} Stored Yao (+${x} Damage)`, value: x });
          opts.push({ label: "Cancel", value: null });
          const pickedX = await this.askPlayerChoice({
            type: "amplify_x",
            title: `${this.cardData[sourceCard.id].name} — Amplify Damage`,
            message: "Choose X Stored Yao to spend:",
            options: opts
          });
          if (!pickedX) return false;
          xVal = pickedX;
        }
        const pickedSrc = await this.askPlayerTarget({
          title: "Amplify Damage (Step 1/2: Damage Source)",
          message: "Select the Shumi that will deal the damage:",
          legalTargets: allShumi.map((s) => ({
            type: "shumi",
            cardNr: s.cardNr,
            player: s.owner,
            label: `${s.owner === "player" ? "Friendly" : "Enemy"} ${this.cardData[s.id].name}`
          })),
          optional: true
        });
        if (!pickedSrc) return false;
        sourceTarget = typeof pickedSrc === "object" ? pickedSrc.cardNr : pickedSrc;

        const recipientOptions = [
          ...allShumi.map((s) => ({
            type: "shumi",
            cardNr: s.cardNr,
            player: s.owner,
            label: `${s.owner === "player" ? "Friendly" : "Enemy"} ${this.cardData[s.id].name}`
          })),
          { type: "player", cardNr: "player_opponent", player: "opponent", label: `Opponent Player (${this.gameState.opponent.hp} LF)` },
          { type: "player", cardNr: "player_player", player: "player", label: `You (${this.gameState.player.hp} LF)` }
        ];
        const pickedRec = await this.askPlayerTarget({
          title: "Amplify Damage (Step 2/2: Recipient)",
          message: "Select the target that will receive the amplified damage:",
          legalTargets: recipientOptions,
          optional: true
        });
        if (!pickedRec) return false;
        recipientTarget = typeof pickedRec === "object" ? pickedRec.cardNr : pickedRec;
      } else {
        xVal = Math.min(maxStored, Math.max(1, aiOptions.xVal || maxStored));
        sourceTarget = aiOptions.sourceId || sourceCard.cardNr;
        recipientTarget = aiOptions.recipientId || "player_player";
      }

      sourceCard.storedYao -= xVal;
      meta.xVal = xVal;
      meta.sourceId = sourceTarget;
      meta.recipientId = recipientTarget;
      meta.summaryText = `${this.cardData[sourceCard.id].name}: Amplify Damage by +${xVal}`;
    }

    // 3. Supel Flight
    else if (ability.id === "supel_flight") {
      const paid = await this.promptAndPayYaoFromCardOrReserve(
        player,
        sourceCard,
        1,
        "Supel — Try to Fly",
        false
      );
      if (!paid) return false;
      meta.sourceCardNr = sourceCard.cardNr;
      meta.summaryText = `Supel gains Flight for Hop`;
    }

    // 4. Horucan Prevent Damage + Draw
    else if (ability.id === "horucan_shield") {
      if (allShumi.length === 0) return false;
      let targetNr = aiOptions.targetCardNr || null;
      if (!targetNr) {
        if (player === "player") {
          const picked = await this.askPlayerTarget({
            title: "Horucan — Sentinel Ward",
            message: "Choose target Shumi to prevent the next 1 damage dealt to it (and draw a card):",
            legalTargets: allShumi.map((s) => ({
              type: "shumi",
              cardNr: s.cardNr,
              player: s.owner,
              label: `${s.owner === "player" ? "Friendly" : "Enemy"} ${this.cardData[s.id].name}`
            })),
            optional: true
          });
          if (!picked) return false;
          targetNr = typeof picked === "object" ? picked.cardNr : picked;
        } else {
          targetNr = sourceCard.cardNr;
        }
      }
      sourceCard.storedYao -= 1;
      meta.targetCardNr = targetNr;
      meta.summaryText = `Horucan: Prevent 1 Damage & Draw 1`;
    }

    // 5. Musclyp Deploy Muspem from hand
    else if (ability.id === "musclyp_deploy") {
      let lane = aiOptions.lane || "frontline";
      if (this.gameState[player].frontline.length >= 5) lane = "backline";
      else if (this.gameState[player].backline.length < 5 && player === "player") {
        const pickedLane = await this.askPlayerChoice({
          type: "musclyp_lane",
          title: "Musclyp — Deploy Muspem",
          message: "Choose a lane to put Muspem into play from your hand:",
          options: [
            { label: "Frontline", value: "frontline" },
            { label: "Backline", value: "backline" },
            { label: "Cancel", value: null }
          ]
        });
        if (!pickedLane) return false;
        lane = pickedLane;
      }
      sourceCard.usedAbilitiesThisTurn = [...(sourceCard.usedAbilitiesThisTurn || []), ability.id];
      meta.lane = lane;
      meta.summaryText = `Musclyp: Put Muspem into play (${lane})`;
    }

    // 6. Inagnu Static Zap (1 damage to any target, once per Yao Cycle)
    else if (ability.id === "inagnu_zap") {
      const anyTargets = [
        ...allShumi.map((s) => ({
          type: "shumi",
          cardNr: s.cardNr,
          player: s.owner,
          label: `${s.owner === "player" ? "Friendly" : "Enemy"} ${this.cardData[s.id].name} (${this.getCurrentHp(s.owner, s)} LF)`
        })),
        { type: "player", cardNr: "player_opponent", player: "opponent", label: `Opponent Player (${this.gameState.opponent.hp} LF)` },
        { type: "player", cardNr: "player_player", player: "player", label: `You (${this.gameState.player.hp} LF)` }
      ];
      let chosen = aiOptions.zapTarget || null;
      if (!chosen) {
        if (player === "player") {
          chosen = await this.askPlayerTarget({
            title: "Inagnu — Static Zap",
            message: "Choose any target to deal 1 damage to:",
            legalTargets: anyTargets,
            optional: true
          });
          if (!chosen) return false;
        } else {
          chosen = anyTargets.find((t) => t.player === "player") || anyTargets[0];
        }
      }

      const paidZap = await this.promptAndPayYaoFromCardOrReserve(
        player,
        sourceCard,
        3,
        "Inagnu — Static Zap",
        false
      );
      if (!paidZap) return false;
      sourceCard.usedAbilitiesThisCycle = [...(sourceCard.usedAbilitiesThisCycle || []), ability.id];
      meta.zapTarget = chosen;
      meta.sourceCardNr = sourceCard.cardNr;
      meta.summaryText = `Inagnu: 1 damage to ${chosen.label || "target"}`;
    }

    // 7. Rune of the Fertile Field Transfer 1 Yao to friendly Shumi
    else if (ability.id === "fertile_upper_act" || ability.id === "fertile_combined_act") {
      const friendlyShumi = this.getAllBattlefieldShumi(player);
      if (friendlyShumi.length === 0 || !(sourceCard.storedYao > 0)) return false;

      let targetNr = aiOptions.targetCardNr || null;
      if (!targetNr) {
        if (player === "player") {
          const picked = await this.askPlayerTarget({
            title: "Rune of the Fertile Field",
            message: "Choose a friendly Shumi to Transfer 1 Yao onto:",
            legalTargets: friendlyShumi.map((s) => ({
              type: "shumi",
              cardNr: s.cardNr,
              player,
              label: `${this.cardData[s.id].name} (${s.storedYao || 0} Yao)`
            })),
            optional: true
          });
          if (!picked) return false;
          targetNr = typeof picked === "object" ? picked.cardNr : picked;
        } else {
          targetNr = this.ai.chooseProsperTarget(this.gameState);
        }
      }

      sourceCard.storedYao -= 1;
      sourceCard.usedThisTurn = true;
      meta.targetCardNr = targetNr;
      meta.summaryText = `Rune of the Fertile Field: Transfer 1 Yao`;
    }

    this.syncAllStats();
    this.gameState.gameInfo.theStack.push({
      id: uid("stack_ab"),
      kind: "ability",
      player,
      card: { ...sourceCard },
      ability,
      meta
    });

    this.log(`${player === "player" ? "You" : "Opponent"} activated ${meta.summaryText}.`);
    this.resetPassedFlags();
    this.update();
    await this.handleGivePrio(player);
    return true;
  }

  putTriggerOnStack(player, sourceCard, meta) {
    this.gameState.gameInfo.theStack.push({
      id: uid("stack_trig"),
      kind: "trigger",
      player,
      card: { ...sourceCard },
      meta: {
        ...meta,
        summaryText: meta.name || `${this.cardData[sourceCard.id]?.name} Trigger`
      }
    });
    this.resetPassedFlags();
    this.update();
  }

  // ==========================================
  // RESOLVING THE STACK
  // ==========================================

  async resolveStackLayer() {
    if (!this.gameState.gameInfo.theStack.length) return;
    const item = this.gameState.gameInfo.theStack.pop();
    const player = item.player;

    if (item.kind === "card") {
      const cardDef = this.cardData[item.card.id];
      if (cardDef.type === "shumi" || cardDef.type === "myth") {
        await this.resolveShumiSummon(item);
      } else {
        await this.resolveSpellEffect(item);
      }
    } else if (item.kind === "attack") {
      await this.resolveAttackOnStack(item);
    } else if (item.kind === "ability") {
      await this.resolveActivatedAbility(item);
    } else if (item.kind === "trigger") {
      await this.resolveTriggerOnStack(item);
    }

    this.syncAllStats();
    this.checkWinCondition();
    this.resetPassedFlags();
    this.assignPriority(this.gameState.gameInfo.activePlayer);
    this.update();

    if (this.gameState.gameInfo.phase === "gameOver") return;

    if (this.gameState.gameInfo.priority.player === "opponent") {
      await this.checkForAIResponse();
    } else {
      await this.passIfNoPlay("player");
    }
  }

  async resolveShumiSummon(item) {
    const { player, card, target, meta } = item;
    const cardDef = this.cardData[card.id];
    let where = target && target.includes("frontline") ? "frontline" : "backline";

    let damageMarked = 0;
    let storedYao = 0;
    let maturedFromCard = null;

    if (meta?.enteredBy === "maturing" && meta.maturingTargetCardNr) {
      const youngFound = this.findShumiByCardNr(meta.maturingTargetCardNr);
      if (youngFound) {
        where = youngFound.lane;
        damageMarked = youngFound.card.damageMarked || 0;
        storedYao = youngFound.card.storedYao || 0;
        maturedFromCard = { id: youngFound.card.id, cardNr: youngFound.card.cardNr, owner: player };
        // Remove young Shumi from the game (Rule 3.2.2.1)
        this.gameState[player][where] = this.gameState[player][where].filter((c) => c.cardNr !== youngFound.card.cardNr);
        this.gameState[player].spiritedAway.push(maturedFromCard);
      }
    }

    const newShumi = {
      ...card,
      owner: player,
      where,
      damageMarked,
      bonusMaxHp: 0,
      storedYao,
      momentum: false,
      enteredBy: meta?.enteredBy || "normal",
      maturedFromCard,
      tempKeywords: [],
      usedAbilitiesThisTurn: [],
      usedAbilitiesThisCycle: [],
      dealtDamageThisCycle: false
    };

    newShumi.maxHp = this.getMaxHp(player, newShumi);
    newShumi.currentHp = this.getCurrentHp(player, newShumi);

    if (this.gameState[player][where].length < 5) {
      this.gameState[player][where].push(newShumi);
      this.log(`${cardDef.name} entered the ${where === "frontline" ? "Frontline" : "Backline"}!`);
      await this.handleShumiETB(player, newShumi);
    } else {
      this.gameState[player].restingGrounds.unshift({ ...card, where: "restingGrounds" });
    }
  }

  async handleShumiETB(player, shumi) {
    const id = shumi.id;

    if (id === "maum" || id === "supel") {
      await this.addStoredYaoToShumi(player, shumi, 1);
    } else if (id === "horucan") {
      const amt = shumi.enteredBy === "maturing" ? 1 : 2;
      await this.addStoredYaoToShumi(player, shumi, amt);
    } else if (id === "muspem") {
      this.addYao(player, 1);
      if (this.gameState[player].yaoReserve >= 1) {
        this.gameState[player].yaoReserve -= 1;
        await this.addStoredYaoToShumi(player, shumi, 1);
      }
    } else if (id === "faele") {
      const reserve = this.gameState[player].yaoReserve;
      if (reserve > 0) {
        let transferAmt = reserve;
        if (player === "player") {
          const opts = [];
          for (let i = 0; i <= reserve; i++) {
            opts.push({ label: `Transfer ${i} Yao (+${i} LF)`, value: i });
          }
          const picked = await this.askPlayerChoice({
            type: "faele_transfer",
            title: "Faele — Transfer Yao",
            message: `Choose how much Yao from your Reserve (${reserve} available) to Transfer onto Faele:`,
            options: opts
          });
          transferAmt = picked ?? 0;
        } else {
          transferAmt = this.ai.chooseFaeleTransferAmount(this.gameState, shumi);
        }
        if (transferAmt > 0) {
          this.gameState[player].yaoReserve -= transferAmt;
          await this.addStoredYaoToShumi(player, shumi, transferAmt);
        }
      }
    } else if (id === "gramaum") {
      // Transfer any amount from all sources you control onto Gramaum
      const otherShumi = this.getAllBattlefieldShumi(player).filter((s) => s.cardNr !== shumi.cardNr && (s.storedYao || 0) > 0);
      const upperStored = this.gameState[player].upperRuneZone?.storedYao || 0;
      const reserve = this.gameState[player].yaoReserve;
      const totalAvailable = reserve + upperStored + otherShumi.reduce((sum, s) => sum + (s.storedYao || 0), 0);

      if (totalAvailable > 0) {
        if (player === "player") {
          let totalTransferred = 0;
          while (true) {
            const curReserve = this.gameState.player.yaoReserve || 0;
            const curRune = this.gameState.player.upperRuneZone?.storedYao || 0;
            const curShumi = this.getAllBattlefieldShumi("player").filter(
              (s) => s.cardNr !== shumi.cardNr && (s.storedYao || 0) > 0
            );
            const curTotal = curReserve + curRune + curShumi.reduce((sum, s) => sum + (s.storedYao || 0), 0);
            if (curTotal <= 0) break;

            const opts = [];
            if (curReserve > 0) {
              opts.push({
                label: `From Yao Reserve: Transfer 1 Yao (${curReserve} available)`,
                value: { src: "reserve", amount: 1 }
              });
              if (curReserve > 1) {
                opts.push({
                  label: `From Yao Reserve: Transfer all ${curReserve} Yao`,
                  value: { src: "reserve", amount: curReserve }
                });
              }
            }
            if (curRune > 0) {
              const runeName = this.cardData[this.gameState.player.upperRuneZone.id]?.name || "Upper Rune";
              opts.push({
                label: `From ${runeName}: Transfer 1 Stored Yao (${curRune} available)`,
                value: { src: "rune", amount: 1 }
              });
            }
            for (const s of curShumi) {
              const sName = this.cardData[s.id]?.name || "Shumi";
              const laneLbl = s.where === "frontline" ? "Frontline" : "Backline";
              opts.push({
                label: `From ${sName} [${laneLbl}]: Transfer 1 Stored Yao (${s.storedYao} available)`,
                value: { src: "shumi", cardNr: s.cardNr, amount: 1 }
              });
              if ((s.storedYao || 0) > 1) {
                opts.push({
                  label: `From ${sName} [${laneLbl}]: Transfer all ${s.storedYao} Stored Yao`,
                  value: { src: "shumi", cardNr: s.cardNr, amount: s.storedYao }
                });
              }
            }
            opts.push({
              label: `✓ Done Transferring (${totalTransferred} Yao selected)`,
              value: null
            });

            const picked = await this.askPlayerChoice({
              type: "gramaum_transfer",
              title: `Gramaum — Transfer Yao (${totalTransferred} Transferred)`,
              message: "Choose a source to transfer Yao onto Gramaum from (or click Done):",
              options: opts
            });

            if (picked === null || picked === undefined) break;

            // Backwards compatibility if a test resolves with a raw number
            if (typeof picked === "number") {
              let rem = picked;
              const rTake = Math.min(this.gameState.player.yaoReserve, rem);
              this.gameState.player.yaoReserve -= rTake;
              rem -= rTake;
              for (const s of curShumi) {
                if (rem <= 0) break;
                const sTake = Math.min(s.storedYao || 0, rem);
                s.storedYao -= sTake;
                rem -= sTake;
              }
              totalTransferred += picked - rem;
              break;
            }

            if (picked.src === "reserve") {
              const take = Math.min(this.gameState.player.yaoReserve, picked.amount);
              this.gameState.player.yaoReserve -= take;
              totalTransferred += take;
            } else if (picked.src === "rune" && this.gameState.player.upperRuneZone) {
              const take = Math.min(this.gameState.player.upperRuneZone.storedYao || 0, picked.amount);
              this.gameState.player.upperRuneZone.storedYao -= take;
              totalTransferred += take;
            } else if (picked.src === "shumi") {
              const foundS = this.findShumiByCardNr(picked.cardNr);
              if (foundS) {
                const take = Math.min(foundS.card.storedYao || 0, picked.amount);
                foundS.card.storedYao -= take;
                totalTransferred += take;
              }
            }
            this.syncAllStats();
          }

          if (totalTransferred > 0) {
            await this.addStoredYaoToShumi(player, shumi, totalTransferred);
          }
        } else {
          const amountToTake = this.ai.chooseGramaumTransferAmount(this.gameState, shumi, totalAvailable);
          let remaining = amountToTake;
          const fromRes = Math.min(this.gameState[player].yaoReserve, remaining);
          this.gameState[player].yaoReserve -= fromRes;
          remaining -= fromRes;

          if (remaining > 0 && this.gameState[player].upperRuneZone?.storedYao > 0) {
            const fromRune = Math.min(this.gameState[player].upperRuneZone.storedYao, remaining);
            this.gameState[player].upperRuneZone.storedYao -= fromRune;
            remaining -= fromRune;
          }

          for (const s of otherShumi) {
            if (remaining <= 0) break;
            let maxSafeFromS = s.storedYao || 0;
            if (s.id === "farloss" || s.id === "faele") {
              const hpWithoutYao = (this.cardData[s.id].health || 1) + (s.bonusMaxHp || 0) - (s.damageMarked || 0);
              if (hpWithoutYao <= 0) {
                const neededToLive = 1 - hpWithoutYao;
                maxSafeFromS = Math.max(0, (s.storedYao || 0) - neededToLive);
              }
            }
            const fromS = Math.min(maxSafeFromS, remaining);
            s.storedYao -= fromS;
            remaining -= fromS;
          }

          const actuallyTaken = amountToTake - remaining;
          if (actuallyTaken > 0) {
            await this.addStoredYaoToShumi(player, shumi, actuallyTaken);
          }
        }
      }
    } else if (id === "musclyp") {
      if (shumi.enteredBy === "maturing" && shumi.maturedFromCard) {
        // Return the Muspem it matured from to hand
        this.gameState[player].spiritedAway = this.gameState[player].spiritedAway.filter(
          (c) => c.cardNr !== shumi.maturedFromCard.cardNr
        );
        this.gameState[player].hand.push({
          id: shumi.maturedFromCard.id,
          cardNr: shumi.maturedFromCard.cardNr,
          owner: player,
          where: "hand"
        });
        this.log(`Musclyp returned ${this.cardData[shumi.maturedFromCard.id].name} to ${player === "player" ? "your" : "opponent's"} hand!`);
      }
    } else if (id === "caquil") {
      // Search Action Deck for a Campestral Shumi with YC 1, 2, or 3 not named Caquil
      const matches = this.gameState[player].actionDeck.filter((c) => {
        const d = this.cardData[c.id];
        return d && d.type === "shumi" && d.habitat === "campestral" && [1, 2, 3].includes(d.yaoCost) && d.id !== "caquil";
      });
      if (matches.length > 0) {
        let chosenCardNr = matches[0].cardNr;
        if (player === "player") {
          const uniqueById = [];
          const seenIds = new Set();
          matches.forEach((m) => {
            if (!seenIds.has(m.id)) {
              seenIds.add(m.id);
              uniqueById.push(m);
            }
          });
          chosenCardNr = await this.askPlayerChoice({
            type: "deck_search",
            title: "Caquil — Guiding Glow",
            message: "Search your Action Deck for a Campestral Shumi (YC 1–3, not Caquil) to put into your hand:",
            options: uniqueById.map((m) => ({
              label: `${this.cardData[m.id].name} (YC ${this.cardData[m.id].yaoCost}, ${this.cardData[m.id].health} LF)`,
              value: m.cardNr,
              cardId: m.id
            }))
          });
        } else {
          chosenCardNr = this.ai.chooseCaquilSearchTarget(this.gameState, matches);
        }
        const picked = this.gameState[player].actionDeck.find((c) => c.cardNr === chosenCardNr);
        if (picked) {
          this.gameState[player].actionDeck = this.gameState[player].actionDeck.filter((c) => c.cardNr !== picked.cardNr);
          this.gameState[player].hand.push({ ...picked, where: "hand" });
          this.log(`${player === "player" ? "You" : "Opponent"} searched for ${this.cardData[picked.id].name} with Caquil.`);
        }
      }
      this.gameState[player].actionDeck = this.shuffleDeck(this.gameState[player].actionDeck);
    } else if (id === "equuna") {
      await this.queueCardDraw(player, 1, "Equuna ETB");
    } else if (id === "campest") {
      // Transfer all Yao on all friendly sources onto Campest, then defeat all other Shumi on the Battlefield
      let gathered = this.gameState[player].yaoReserve;
      this.gameState[player].yaoReserve = 0;

      if (this.gameState[player].upperRuneZone?.storedYao > 0) {
        gathered += this.gameState[player].upperRuneZone.storedYao;
        this.gameState[player].upperRuneZone.storedYao = 0;
      }
      this.getAllBattlefieldShumi(player).forEach((s) => {
        if (s.cardNr !== shumi.cardNr && (s.storedYao || 0) > 0) {
          gathered += s.storedYao;
          s.storedYao = 0;
        }
      });
      if (gathered > 0) {
        await this.addStoredYaoToShumi(player, shumi, gathered, false);
      }

      const allOtherShumi = [
        ...this.getAllBattlefieldShumi("player"),
        ...this.getAllBattlefieldShumi("opponent")
      ].filter((s) => s.cardNr !== shumi.cardNr);

      for (const other of allOtherShumi) {
        this.defeatShumi(other.owner, other, shumi);
      }
      this.log("Campest defeated all other Shumi on the Battlefield!", "combat");
    }
  }

  async resolveSpellEffect(item) {
    const { player, card, meta } = item;
    const id = card.id;

    // Move spell card to Resting Grounds
    this.gameState[player].restingGrounds.unshift({ id: card.id, cardNr: card.cardNr, owner: player, where: "restingGrounds" });

    if (id === "hasten") {
      const found = this.findShumiByCardNr(meta.targetCardNr);
      if (found) {
        found.card.momentum = true;
        this.log(`${this.cardData[found.card.id].name} gained Momentum from Hasten!`);
      }
    } else if (id === "prosper") {
      const found = this.findShumiByCardNr(meta.targetCardNr);
      if (found) {
        await this.addStoredYaoToShumi(player, found.card, 1);
      }
      await this.queueCardDraw(player, 1, "Prosper");
    } else if (id === "ritual-of-the-vast") {
      // 1. Search Action Deck for Campest
      const campestCard = this.gameState[player].actionDeck.find((c) => c.id === "campest");
      if (campestCard) {
        this.gameState[player].actionDeck = this.gameState[player].actionDeck.filter((c) => c.cardNr !== campestCard.cardNr);
        this.gameState[player].hand.push({ ...campestCard, where: "hand" });
        this.log(`${player === "player" ? "You" : "Opponent"} searched Action Deck for Campest!`);
      }
      this.gameState[player].actionDeck = this.shuffleDeck(this.gameState[player].actionDeck);

      // 2. Create Sacrificial Spirit token (6 LF / BA: Bloom - 1)
      const lane = meta.lane && this.gameState[player][meta.lane].length < 5 ? meta.lane : this.gameState[player].frontline.length < 5 ? "frontline" : "backline";
      if (this.gameState[player][lane].length < 5) {
        const token = {
          id: "sacrificial-spirit-token",
          cardNr: Number(uid("").split("_").pop()),
          owner: player,
          where: lane,
          damageMarked: 0,
          bonusMaxHp: 0,
          storedYao: 0,
          momentum: false,
          isToken: true
        };
        token.maxHp = 6;
        token.currentHp = 6;
        this.gameState[player][lane].push(token);
        this.log(`Created a Sacrificial Spirit token (6 LF / BA: Bloom - 1) on ${lane}!`);
      }

      // 3. Each Shumi you control with a Base Attack named "Bloom" Prospers 1
      const bloomShumi = this.getAllBattlefieldShumi(player).filter((s) =>
        (this.cardData[s.id]?.baseAttacks || []).some((ba) => ba.name.toLowerCase() === "bloom")
      );
      for (const bs of bloomShumi) {
        await this.addStoredYaoToShumi(player, bs, 1);
      }
    } else if (id === "the-grand-harvest") {
      const removedMap = meta.removedMap || {};
      const affectedIds = Object.keys(removedMap).map(Number);
      let drawCount = 0;
      for (const cNr of affectedIds) {
        const found = this.findShumiByCardNr(cNr);
        if (found) {
          const amt = removedMap[cNr];
          found.card.momentum = true;
          found.card.bonusMaxHp = (found.card.bonusMaxHp || 0) + amt;
          drawCount += 1;
          this.log(`${this.cardData[found.card.id].name} gained Momentum and +${amt} LF from The Grand Harvest!`);
        }
      }
      this.syncAllStats();
      if (drawCount > 0) {
        await this.queueCardDraw(player, drawCount, "The Grand Harvest");
      }
    } else if (id === "cycle-summon") {
      const maxYc = (meta.returnedYaoCost || 0) - 1;
      const eligible = this.gameState[player].hand.filter((c) => {
        const d = this.cardData[c.id];
        return d && d.type === "shumi" && d.yaoCost <= maxYc;
      });
      const hasSpace = this.gameState[player].frontline.length < 5 || this.gameState[player].backline.length < 5;
      if (eligible.length > 0 && hasSpace) {
        await this.promptPutShumiFromHandOntoBattlefield(player, eligible, "Cycle Summon");
      }
    } else if (id === "unleash-the-wild-one") {
      const maxYc = (meta.xValue || 1) + 1;
      const eligible = this.gameState[player].hand.filter((c) => {
        const d = this.cardData[c.id];
        return d && d.type === "shumi" && d.yaoCost <= maxYc;
      });
      const hasSpace = this.gameState[player].frontline.length < 5 || this.gameState[player].backline.length < 5;
      if (eligible.length > 0 && hasSpace) {
        await this.promptPutShumiFromHandOntoBattlefield(player, eligible, "Unleash the Wild One");
      }
    } else if (id === "razorgrass-shield") {
      // Create Razorgrass Shield token on Frontline and redirect the attack to it
      if (this.gameState[player].frontline.length < 5) {
        const token = {
          id: "razorgrass-shield-token",
          cardNr: Number(uid("").split("_").pop()),
          owner: player,
          where: "frontline",
          damageMarked: 0,
          bonusMaxHp: 0,
          storedYao: 0,
          momentum: false,
          isToken: true
        };
        token.maxHp = 3;
        token.currentHp = 3;
        this.gameState[player].frontline.push(token);

        const attackItem = this.gameState.gameInfo.theStack.find((s) => s.id === meta.attackStackId);
        if (attackItem) {
          attackItem.target = {
            type: "shumi",
            cardNr: token.cardNr,
            player,
            lane: "frontline",
            label: "Razorgrass Shield Token"
          };
        }
        this.log("Summoned Razorgrass Shield token as the new target for the attack!", "combat");
      }
    }
  }

  async promptPutShumiFromHandOntoBattlefield(player, eligibleHandCards, sourceName) {
    let chosenCardNr = null;
    if (player === "player") {
      chosenCardNr = await this.askPlayerChoice({
        type: "put_shumi_into_play",
        title: sourceName,
        message: "Choose a Shumi from your hand to put onto the Battlefield:",
        options: [
          ...eligibleHandCards.map((c) => ({
            label: `${this.cardData[c.id].name} (YC ${this.cardData[c.id].yaoCost}, ${this.cardData[c.id].health} LF)`,
            value: c.cardNr,
            cardId: c.id
          })),
          { label: "Decline", value: null }
        ]
      });
    } else {
      chosenCardNr = this.ai.chooseShumiToPutIntoPlay(this.gameState, eligibleHandCards, sourceName);
    }

    if (!chosenCardNr) return;
    const handCard = this.gameState[player].hand.find((c) => c.cardNr === chosenCardNr);
    if (!handCard) return;

    const cardDef = this.cardData[handCard.id];
    const canFront = !cardDef.keywords?.includes("cannot_frontline") && this.gameState[player].frontline.length < 5;
    const canBack = this.gameState[player].backline.length < 5;

    let lane = canFront ? "frontline" : "backline";
    if (canFront && canBack) {
      if (player === "player") {
        const pickedLane = await this.askPlayerChoice({
          type: "lane_choice",
          title: `${sourceName} — Choose Lane`,
          message: `Choose a lane for ${cardDef.name}:`,
          options: [
            { label: "Frontline", value: "frontline" },
            { label: "Backline", value: "backline" }
          ]
        });
        if (pickedLane) lane = pickedLane;
      } else {
        const aiTarget = this.ai.getTargetForShumi(this.gameState, handCard);
        lane = aiTarget && aiTarget.includes("backline") ? "backline" : "frontline";
      }
    }

    this.gameState[player].hand = this.gameState[player].hand.filter((c) => c.cardNr !== handCard.cardNr);
    await this.resolveShumiSummon({
      player,
      card: handCard,
      target: lane === "frontline" ? "friendly_frontline" : "friendly_backline",
      meta: { enteredBy: "effect" }
    });
  }

  async resolveAttackOnStack(item) {
    const { player, attack, target, meta } = item;
    if (meta?.canceled) {
      this.log(`Attack (${attack.name}) was canceled and had no effect.`, "combat");
      return;
    }

    const attackerFound = this.findShumiByCardNr(meta.attackerCardNr);
    const attackerCard = attackerFound ? attackerFound.card : item.card;
    const dmg = this.calculateAttackDamage(player, attackerCard, attack, meta?.extraDamage || 0);

    // 1. Single Target Damage
    if (target) {
      if (target.type === "shumi") {
        const targetFound = this.findShumiByCardNr(target.cardNr);
        if (!targetFound) {
          this.log(`Attack target for ${attack.name} is no longer on the Battlefield.`);
          return;
        }
        if (dmg > 0) {
          this.dealDamage(attackerCard, target, dmg);
        }

        // Leppun Descend Upon splash damage: 1 damage to each other Shumi sharing a line with the attacked Shumi
        if (attack.effect?.type === "splash_damage") {
          const splashDmg = attack.effect.splash_damage.damage || 1;
          const sameLineOthers = [...this.gameState[targetFound.player][targetFound.lane]].filter(
            (s) => s.cardNr !== target.cardNr
          );
          for (const other of sameLineOthers) {
            this.dealDamage(attackerCard, { type: "shumi", cardNr: other.cardNr, player: targetFound.player }, splashDmg);
          }
        }

        // Kalflux Guidance: Target Kalfil Prospers 2
        if (attack.id === "guidance") {
          await this.addStoredYaoToShumi(player, targetFound.card, 2);
        }

        // Schnuut Jumpscare on_attack_resolve:
        // "Return Schnuut to hand, then move the attacked Shumi to the Backline (or return it to hand if already in Backline or cannot move)"
        if (attack.id === "jumpscare") {
          if (attackerFound) {
            this.returnShumiToHand(attackerCard.cardNr);
          }
          const stillThere = this.findShumiByCardNr(target.cardNr);
          if (stillThere) {
            const tOwner = stillThere.player;
            if (stillThere.lane === "frontline" && this.gameState[tOwner].backline.length < 5) {
              this.gameState[tOwner].frontline = this.gameState[tOwner].frontline.filter((c) => c.cardNr !== target.cardNr);
              stillThere.card.where = "backline";
              this.gameState[tOwner].backline.push(stillThere.card);
              this.log(`${this.cardData[stillThere.card.id].name} was pushed to the Backline by Jumpscare!`);
            } else {
              this.returnShumiToHand(target.cardNr);
            }
          }
        }
      } else if (target.type === "player") {
        if (dmg > 0) {
          this.dealDamage(attackerCard, target, dmg);
        }
      }
    }

    // 2. Campest Earthquake: 2 damage to all other Shumi
    if (attack.id === "earthquake") {
      const allOthers = [
        ...this.getAllBattlefieldShumi("player"),
        ...this.getAllBattlefieldShumi("opponent")
      ].filter((s) => s.cardNr !== attackerCard.cardNr);
      for (const s of allOthers) {
        this.dealDamage(attackerCard, { type: "shumi", cardNr: s.cardNr, player: s.owner }, dmg);
      }
    }

    // 3. Self / Attack Side Effects
    if (attack.effect) {
      const effType = attack.effect.type;
      if (effType === "recoil") {
        // Faele Flail: Recoil 2
        if (attackerFound) {
          this.dealDamage(attackerCard, { type: "shumi", cardNr: attackerCard.cardNr, player }, attack.effect.recoil.amount || 2);
        }
      } else if (effType === "prosper" && attack.effect.prosper?.object === "this") {
        // Gramaum Razorgrass Fang, Farloss Charge, Inazovis Charge
        if (attackerFound) {
          await this.addStoredYaoToShumi(player, attackerFound.card, attack.effect.prosper.amount || 1);
        }
      } else if (effType === "search_and_play") {
        // Muspem Squeak for Help: Search Action Deck for a Muspem and put onto Battlefield, shuffle
        const muspemInDeck = this.gameState[player].actionDeck.find((c) => c.id === "muspem");
        const hasSpace = this.gameState[player].frontline.length < 5 || this.gameState[player].backline.length < 5;
        if (muspemInDeck && hasSpace) {
          this.gameState[player].actionDeck = this.gameState[player].actionDeck.filter((c) => c.cardNr !== muspemInDeck.cardNr);
          const lane = this.gameState[player].frontline.length < 5 ? "friendly_frontline" : "friendly_backline";
          await this.resolveShumiSummon({
            player,
            card: muspemInDeck,
            target: lane,
            meta: { enteredBy: "effect" }
          });
        }
        this.gameState[player].actionDeck = this.shuffleDeck(this.gameState[player].actionDeck);
      } else if (effType === "search_and_put_into_hand") {
        // Kalfil Moo Innocently: Search Action Deck for a Mature Kalfil and put into hand, shuffle
        const matureKalfil = this.gameState[player].actionDeck.find(
          (c) => this.cardData[c.id]?.maturesFrom === "kalfil"
        );
        if (matureKalfil) {
          this.gameState[player].actionDeck = this.gameState[player].actionDeck.filter((c) => c.cardNr !== matureKalfil.cardNr);
          this.gameState[player].hand.push({ ...matureKalfil, where: "hand" });
          this.log(`${player === "player" ? "You" : "Opponent"} found ${this.cardData[matureKalfil.id].name} with Moo Innocently!`);
        }
        this.gameState[player].actionDeck = this.shuffleDeck(this.gameState[player].actionDeck);
      } else if (effType === "draw_card damage_self") {
        // Inagnu Tempest Cuddle: Draw a card, Inagnu deals 1 damage to you
        await this.queueCardDraw(player, 1, "Tempest Cuddle");
        this.dealDamage(attackerCard, { type: "player", player }, 1);
      }
    }
  }

  async resolveActivatedAbility(item) {
    const { player, ability, meta } = item;

    if (ability.isBurst) {
      const found = this.findShumiByCardNr(meta.targetCardNr);
      if (found) {
        await this.addStoredYaoToShumi(player, found.card, 1);
      }
    } else if (ability.id === "maum_amplify" || ability.id === "gramaum_amplify") {
      this.gameState.gameInfo.damageAmplifiers.push({
        sourceId: meta.sourceId,
        recipientId: meta.recipientId,
        amount: meta.xVal
      });
      this.log(`Next damage from selected source to target this turn is increased by +${meta.xVal}.`);
    } else if (ability.id === "supel_flight") {
      const found = this.findShumiByCardNr(meta.sourceCardNr);
      if (found) {
        found.card.tempKeywords = [
          ...(found.card.tempKeywords || []),
          { keyword: "flight", attackOnly: "hop", duration: "end_of_turn" }
        ];
        this.log("Supel gained Flight for Hop until end of turn!");
      }
    } else if (ability.id === "horucan_shield") {
      this.gameState.gameInfo.damagePreventions.push({
        targetCardNr: meta.targetCardNr,
        amount: 1
      });
      await this.queueCardDraw(player, 1, "Horucan Sentinel Ward");
    } else if (ability.id === "musclyp_deploy") {
      const muspemCard = this.gameState[player].hand.find((c) => c.id === "muspem");
      if (muspemCard && this.gameState[player][meta.lane].length < 5) {
        this.gameState[player].hand = this.gameState[player].hand.filter((c) => c.cardNr !== muspemCard.cardNr);
        await this.resolveShumiSummon({
          player,
          card: muspemCard,
          target: meta.lane === "frontline" ? "friendly_frontline" : "friendly_backline",
          meta: { enteredBy: "effect" }
        });
      }
    } else if (ability.id === "inagnu_zap") {
      const srcInfo = this.findShumiByCardNr(meta.sourceCardNr);
      const srcCard = srcInfo ? srcInfo.card : item.card;
      const zapTarget = meta.zapTarget;
      if (zapTarget) {
        if (zapTarget.type === "player" || String(zapTarget.cardNr).startsWith("player_")) {
          const targetPlayer = zapTarget.player || (zapTarget.cardNr === "player_player" ? "player" : "opponent");
          this.dealDamage(srcCard, { type: "player", player: targetPlayer }, 1);
        } else {
          const cNr = typeof zapTarget === "object" ? zapTarget.cardNr : zapTarget;
          this.dealDamage(srcCard, { type: "shumi", cardNr: cNr }, 1);
        }
      }
    } else if (ability.id === "fertile_upper_act" || ability.id === "fertile_combined_act") {
      const found = this.findShumiByCardNr(meta.targetCardNr);
      if (found) {
        await this.addStoredYaoToShumi(player, found.card, 1);
      }
    }
  }

  async resolveTriggerOnStack(item) {
    const { meta } = item;
    if (meta.effectType === "inazovis_damage") {
      const srcFound = this.findShumiByCardNr(item.card.cardNr);
      this.dealDamage(srcFound ? srcFound.card : item.card, { type: "shumi", cardNr: meta.targetCardNr }, 1);
    }
  }

  // ==========================================
  // CRYSTALS & TURN / PHASE FLOW
  // ==========================================

  playCrystal(player, cardObj) {
    this.gameState[player].hand = this.gameState[player].hand.filter((handCard) => handCard.cardNr !== cardObj.cardNr);
    const crystalCard = { ...cardObj, where: "crystalZone", owner: player };
    this.gameState[player].crystalZone.push(crystalCard);
    this.gameState[player].hasPlayedCrystal = true;
    this.log(`${player === "player" ? "You" : "Opponent"} played ${this.cardData[cardObj.id]?.name || "Yao Crystal"}.`);
  }

  playCrystalNonRegular(player, cardObj) {
    if (!cardObj) return;
    this.gameState[player].hand = this.gameState[player].hand.filter((handCard) => handCard.cardNr !== cardObj.cardNr);
    const crystalCard = { ...cardObj, where: "crystalZone", owner: player };
    this.gameState[player].crystalZone.push(crystalCard);
  }

  assignPriority(player) {
    this.setPlayable();
    this.gameState.gameInfo.priority.player = player;
  }

  assignActivePlayer(player) {
    this.gameState.gameInfo.activePlayer = player;
  }

  confirmPlayable(player) {
    const playable = ["i"];
    if (
      this.gameState.gameInfo.activePlayer === player &&
      !this.gameState.gameInfo.theStack.length &&
      this.gameState.gameInfo.phase === "actionPhase"
    ) {
      playable.push("s");
    }
    if (!this.gameState.gameInfo.theStack.length) {
      playable.push("q");
    }
    return playable;
  }

  setPlayable() {
    this.gameState.gameInfo.playable.player = this.confirmPlayable("player");
    this.gameState.gameInfo.playable.opponent = this.confirmPlayable("opponent");
  }

  resetPassedFlags() {
    this.pass("player", "passed", false);
    this.pass("opponent", "passed", false);
  }

  async startGame() {
    this.playStartingCrystals();
    this.gameState.gameInfo.startingPlayer = this.determineStartingPlayer();
    this.log(`Coin flip: ${this.gameState.gameInfo.startingPlayer === "player" ? "You go" : "Opponent goes"} first!`, "system");

    if (this.gameState.gameInfo.startingPlayer === "player") {
      this.triggerTrigger("drawHand", true);
    } else {
      await this.AI_interpreter(this.ai.drawInitialHand(this.gameState));
      this.triggerTrigger("drawHand", false);
    }
    this.update();
  }

  playStartingCrystals() {
    const playerCrystal = this.gameState.player.yaoDeck.shift();
    const opponentCrystal = this.gameState.opponent.yaoDeck.shift();
    this.playCrystalNonRegular("player", playerCrystal);
    this.playCrystalNonRegular("opponent", opponentCrystal);
  }

  async startMulligan() {
    if (this.gameState.gameInfo.startingPlayer === "player") {
      await this.AI_interpreter(this.ai.drawInitialHand(this.gameState));
    } else {
      await this.AI_interpreter(this.ai.mulligan(this.gameState));
    }
    this.triggerTrigger("mulligan");
    this.update();
  }

  async enactMulligan(unwantedCards, player = "player") {
    const redraws = [];
    const reshuffleCards = unwantedCards.map((card) => ({
      id: card.id,
      cardNr: card.cardNr,
      owner: player,
      where: "deck"
    }));

    while (reshuffleCards.length) {
      const currentReshuffle = reshuffleCards.pop();
      const deck = this.cardData[currentReshuffle.id]?.type !== "crystal" ? "actionDeck" : "yaoDeck";
      this.gameState[player].hand = this.gameState[player].hand.filter((c) => c.cardNr !== currentReshuffle.cardNr);
      this.gameState[player][deck].push(currentReshuffle);
      redraws.push(deck);
    }

    this.gameState[player].yaoDeck = this.shuffleDeck(this.gameState[player].yaoDeck);
    this.gameState[player].actionDeck = this.shuffleDeck(this.gameState[player].actionDeck);

    for (const d of redraws) {
      await this.delay(450);
      this.drawCard(player, d);
    }

    if (player === "player") {
      if (this.gameState.gameInfo.startingPlayer === "player") {
        await this.AI_interpreter(this.ai.mulligan(this.gameState));
      }
      this.startFirstTurn();
    }
  }

  startFirstTurn() {
    this.assignPriority(this.gameState.gameInfo.startingPlayer);
    this.assignActivePlayer(this.gameState.gameInfo.startingPlayer);
    this.processPhase();
  }

  async updateTurn() {
    // End of current player's turn cleanup
    for (const p of ["player", "opponent"]) {
      this.gameState[p].hasPlayedCrystal = false;
      this.gameState[p].hasUsedFreeLaneChange = false;
      this.gameState[p].costReductions = [];
      if (this.gameState[p].upperRuneZone) this.gameState[p].upperRuneZone.usedThisTurn = false;
      if (this.gameState[p].lowerRuneZone) this.gameState[p].lowerRuneZone.usedThisTurn = false;
      this.getAllBattlefieldShumi(p).forEach((s) => {
        s.usedAbilitiesThisTurn = [];
        s.tempKeywords = (s.tempKeywords || []).filter((tk) => tk.duration !== "end_of_turn");
      });
    }
    this.gameState.gameInfo.damageAmplifiers = [];

    // Check if a full Yao Cycle just finished (Rule 3.4: after the second player completes their turn)
    if (this.gameState.gameInfo.activePlayer !== this.gameState.gameInfo.startingPlayer) {
      await this.handleEndOfYaoCycle();
      this.gameState.gameInfo.turn += 1;
      this.log(`--- Yao Cycle ${this.gameState.gameInfo.turn} Begins ---`, "system");
    }

    this.gameState.gameInfo.activePlayer = this.otherPlayer(this.gameState.gameInfo.activePlayer);
    this.gameState[this.gameState.gameInfo.activePlayer].yaoReserve = 0;
  }

  async handleEndOfYaoCycle() {
    // Inagnu Trigger: "At the end of each Yao Cycle, if Inagnu has not dealt any damage this Yao Cycle, it Prospers 1."
    for (const p of ["player", "opponent"]) {
      const shumiList = this.getAllBattlefieldShumi(p);
      for (const s of shumiList) {
        if (s.id === "inagnu" && !s.dealtDamageThisCycle) {
          this.log(`${p === "player" ? "Your" : "Opponent's"} Inagnu dealt no damage this Yao Cycle and Prospers 1!`);
          await this.addStoredYaoToShumi(p, s, 1);
        }
        s.dealtDamageThisCycle = false;
        s.usedAbilitiesThisCycle = [];
      }
    }
  }

  async processPhase() {
    if (this.checkWinCondition()) return;

    const phases = ["yaoPhase", "drawPhase", "actionPhase", "endPhase"];
    let newPhase = "";

    if (this.gameState.gameInfo.phase === "preGame") {
      newPhase = phases[0];
      this.gameState.gameInfo.phase = newPhase;
      this.gameState.gameInfo.turn = 1;
    } else if (this.gameState.gameInfo.phase === "endPhase") {
      newPhase = phases[0];
      this.gameState.gameInfo.phase = newPhase;
      await this.updateTurn();
    } else {
      newPhase = phases[phases.indexOf(this.gameState.gameInfo.phase) + 1];
      this.gameState.gameInfo.phase = newPhase;
    }

    this.assignPriority(this.gameState.gameInfo.activePlayer);
    this.pass("player", "passed", false);
    this.pass("opponent", "passed", false);
    this.pass("player", "passedPhase", false);
    this.pass("opponent", "passedPhase", false);
    this.update();

    await this.initiateNewPhase(newPhase);
  }

  async initiateNewPhase(newPhase) {
    switch (newPhase) {
      case "yaoPhase":
        await this.yaoPhase(this.gameState.gameInfo.activePlayer);
        break;
      case "drawPhase":
        await this.drawPhase();
        break;
      case "actionPhase":
        await this.actionPhase();
        break;
      case "endPhase":
        await this.endPhase();
        break;
    }
  }

  pass(player, mode, bool) {
    this.gameState.gameInfo.priority[mode][player] = bool;
  }

  async handlePassPrio(player) {
    if (this.gameState.gameInfo.phase === "gameOver") return;
    this.pass(player, "passed", true);

    if (!this.checkForAllPassed()) {
      const newPrioritizer = this.otherPlayer(player);
      this.assignPriority(newPrioritizer);
      this.update();
      if (newPrioritizer === "opponent") {
        await this.checkForAIResponse();
      } else {
        await this.passIfNoPlay("player");
      }
    } else {
      if (this.isStack()) {
        await this.resolveStackLayer();
      } else {
        await this.processPhase();
      }
    }
  }

  async handleGivePrio(player) {
    if (this.gameState.gameInfo.phase === "gameOver") return;
    const newPrioritizer = this.otherPlayer(player);
    this.assignPriority(newPrioritizer);
    this.update();

    if (newPrioritizer === "opponent") {
      await this.checkForAIResponse();
    } else {
      await this.passIfNoPlay("player");
    }
  }

  checkForAllPassed() {
    let hasPlayerPassed = false;
    let hasOpponentPassed = false;
    const passPossibilities = ["passed", "passedPhase", "passedTurn"];

    passPossibilities.forEach((p) => {
      if (this.gameState.gameInfo.priority[p].player) hasPlayerPassed = true;
      if (this.gameState.gameInfo.priority[p].opponent) hasOpponentPassed = true;
    });

    return hasOpponentPassed && hasPlayerPassed;
  }

  isStack() {
    return Boolean(this.gameState.gameInfo.theStack.length);
  }

  checkIfPlayAvailable(player) {
    for (const card of this.gameState[player].hand) {
      if (this.checkCanPlay(player, this.cardData[card.id])) return true;
      if (this.checkCanActivateAbilities(player, card).length > 0) return true;
    }

    const battlefieldCards = [
      ...this.gameState[player].frontline,
      ...this.gameState[player].backline,
      ...this.gameState[player].crystalZone
    ];
    for (const card of battlefieldCards) {
      if (this.checkCanActivateAbilities(player, card).length > 0) return true;
    }

    if (this.gameState[player].upperRuneZone?.id) {
      if (this.checkCanActivateAbilities(player, this.gameState[player].upperRuneZone).length > 0) return true;
    }
    if (this.gameState[player].lowerRuneZone?.id) {
      if (this.checkCanActivateAbilities(player, this.gameState[player].lowerRuneZone).length > 0) return true;
    }

    return false;
  }

  checkCanAttack(player) {
    return this.getAllBattlefieldShumi(player).some((card) => this.getAvailableAttacks(player, card).length > 0);
  }

  determineStartingPlayer() {
    return Math.floor(Math.random() * 2) === 1 ? "player" : "opponent";
  }

  async yaoPhase(player) {
    let crystalCount = 0;
    this.gameState[player].crystalZone.forEach((card) => {
      if (this.cardData[card.id]?.crystalDefaultEffect) {
        crystalCount++;
      }
    });
    if (crystalCount > 0) {
      this.addYao(player, crystalCount);
    }
    this.restoreMomentum(player);
    this.syncAllStats();
    this.update();

    if (player === "opponent") {
      await this.checkForAIResponse();
    } else {
      await this.passIfNoPlay(player);
    }
  }

  restoreMomentum(player) {
    this.gameState[player].frontline.forEach((card) => {
      card.momentum = true;
    });
    this.gameState[player].backline.forEach((card) => {
      card.momentum = true;
    });
  }

  async drawPhase() {
    if (this.plAc) {
      this.triggerTrigger("drawPhaseDrawDecision");
      this.update();
    } else {
      await this.AI_interpreter(this.ai.drawPhaseDraw(this.gameState));
    }
  }

  async endPhase() {
    const active = this.gameState.gameInfo.activePlayer;
    if (active === "opponent") {
      await this.checkForAIResponse();
    } else {
      await this.passIfNoPlay("player");
    }
  }

  async actionPhase() {
    this.syncAllStats();
    this.update();
    if (this.gameState.gameInfo.priority.player === "opponent") {
      await this.checkForAIResponse();
    } else {
      await this.passIfNoPlayOrAttack("player");
    }
  }

  async drawPhaseDraw(deck) {
    this.drawCard(this.gameState.gameInfo.activePlayer, deck);
    this.assignPriority(this.gameState.gameInfo.activePlayer);
    this.update();
    if (this.gameState.gameInfo.activePlayer === "opponent") {
      await this.checkForAIResponse();
    } else {
      await this.passIfNoPlay("player");
    }
  }

  async passIfNoPlay(player) {
    if (this.gameState.gameInfo.priority.player !== player) return false;
    if (!this.checkIfPlayAvailable(player)) {
      await this.delay(450);
      await this.handlePassPrio(player);
      return true;
    }
    return false;
  }

  async passIfNoPlayOrAttack(player) {
    if (this.gameState.gameInfo.priority.player !== player) return false;
    const canChangeAnyLane = this.getAllBattlefieldShumi(player).some((c) => this.canChangeLane(player, c).canMove);
    if (!this.checkIfPlayAvailable(player) && !this.checkCanAttack(player) && (player === "opponent" || !canChangeAnyLane)) {
      await this.delay(450);
      await this.handlePassPrio(player);
      return true;
    }
    return false;
  }

  async drawMany(player, deck, num, delayMs = false) {
    for (let i = 0; i < num; i++) {
      this.drawCard(player, deck);
      if (delayMs) {
        await this.delay(delayMs);
      }
    }
  }

  // ==========================================
  // AI INTEGRATION
  // ==========================================

  async checkForAIResponse() {
    if (this.aiBusy || this.gameState.gameInfo.phase === "gameOver") return;
    if (this.gameState.gameInfo.priority.player !== "opponent") return;

    this.aiBusy = true;
    await this.delay(650);
    this.aiBusy = false;

    if (this.gameState.gameInfo.phase === "gameOver") return;
    if (this.gameState.gameInfo.priority.player !== "opponent") return;

    const decision = this.ai.getPlay(this.gameState);
    if (!decision || !decision.action || decision.action === "pass") {
      await this.handlePassPrio("opponent");
    } else {
      await this.AI_interpreter(decision);
    }
  }

  async AI_interpreter(AI_Response) {
    if (!AI_Response) {
      await this.handlePassPrio("opponent");
      return;
    }

    switch (AI_Response.action) {
      case "drawInitialHand":
        this.triggerTrigger("waitForAI", { waitingFor: "draw Starting Hand" });
        await this.drawMany("opponent", "actionDeck", AI_Response.actionDeck, 250);
        await this.drawMany("opponent", "yaoDeck", AI_Response.yaoDeck, 250);
        this.triggerTrigger("resetGameInfo");
        break;

      case "mulligan":
        this.triggerTrigger("waitForAI", { waitingFor: "mulligan" });
        await this.delay(700);
        await this.enactMulligan(AI_Response.mullingCards || [], "opponent");
        this.triggerTrigger("resetGameInfo");
        break;

      case "drawPhaseDraw":
        this.triggerTrigger("waitForAI", { waitingFor: "draw" });
        await this.delay(500);
        this.triggerTrigger("resetGameInfo");
        await this.drawPhaseDraw(AI_Response.deck);
        break;

      case "playCrystal":
        this.playCrystal("opponent", AI_Response.card);
        this.update();
        await this.delay(500);
        await this.checkForAIResponse();
        break;

      case "playCard": {
        const ok = await this.initiatePlayFromHand("opponent", AI_Response.card, AI_Response.options || {});
        if (!ok) {
          await this.handlePassPrio("opponent");
        }
        break;
      }

      case "activateAbility": {
        const ok = await this.activateAbility(
          "opponent",
          AI_Response.sourceCard,
          AI_Response.ability,
          AI_Response.options || {}
        );
        if (!ok) {
          await this.handlePassPrio("opponent");
        }
        break;
      }

      case "changeLane":
      case "moveToFrontline": {
        const ok = this.changeLane("opponent", AI_Response.cardNr);
        if (ok) {
          await this.delay(450);
          await this.checkForAIResponse();
        } else {
          await this.handlePassPrio("opponent");
        }
        break;
      }

      case "attack": {
        await this.declareAttack("opponent", AI_Response.cardNr, AI_Response.attackId, AI_Response.target);
        break;
      }

      default:
        await this.handlePassPrio("opponent");
        break;
    }
  }
}
