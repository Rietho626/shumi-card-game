export class AI {
  constructor(engine, cardData) {
    this.engine = engine;
    this.cardData = cardData;
  }

  // ==========================================
  // PRE-GAME & DRAW PHASE DECISIONS
  // ==========================================

  drawInitialHand() {
    // 5 Action cards + 1 Yao Crystal guarantees a smooth 2-Yao Turn 1 or 3-Yao Turn 2 curve
    return {
      action: "drawInitialHand",
      actionDeck: 5,
      yaoDeck: 1
    };
  }

  mulligan(gameState) {
    const hand = gameState.opponent.hand || [];
    const crystalsInHand = hand.filter((c) => this.cardData[c.id]?.type === "crystal");
    const actionCardsInHand = hand.filter((c) => this.cardData[c.id]?.type !== "crystal");

    const Stage1IdsInHand = new Set(
      actionCardsInHand
        .filter((c) => this.cardData[c.id]?.type === "shumi" && this.cardData[c.id]?.stage === 1)
        .map((c) => c.id)
    );

    const mullingCards = [];

    // Keep at most 2 Crystals in opening hand; ship any 3rd+ Crystal
    if (crystalsInHand.length > 2) {
      mullingCards.push(...crystalsInHand.slice(2));
    }

    // Evaluate Action cards in opening hand:
    // Keep Stage 1 Shumi (YC 1-3), Caquil, Ritual of the Vast, Unleash the Wild One, or Stage 2s whose Stage 1 is already in hand.
    // Ship expensive Stage 2s without their pre-evolution, Campest (searchable via Ritual), The Grand Harvest (dead early), or duplicate clunky spells.
    let keptEarlyPlays = 0;
    for (const card of actionCardsInHand) {
      const def = this.cardData[card.id];
      if (!def) continue;

      if (def.type === "shumi" && def.stage === 1 && (def.yaoCost || 0) <= 3) {
        keptEarlyPlays++;
        continue;
      }

      if (def.id === "campest" || def.id === "the-grand-harvest") {
        mullingCards.push(card);
        continue;
      }

      if (def.type === "shumi" && def.stage === 2) {
        const hasPreEvo = def.maturesFrom && Stage1IdsInHand.has(def.maturesFrom);
        if (!hasPreEvo && (def.yaoCost || 0) >= 3) {
          mullingCards.push(card);
          continue;
        }
      }

      // Situational reactive spells are bad if we have no early creatures
      if (
        (def.id === "hasten" || def.id === "cycle-summon" || def.id === "razorgrass-shield") &&
        Stage1IdsInHand.size === 0
      ) {
        mullingCards.push(card);
      }
    }

    // If we somehow have 0 early plays at all, ship everything except 1 Crystal to dig for Stage 1 Shumi
    if (keptEarlyPlays === 0 && Stage1IdsInHand.size === 0) {
      for (const card of actionCardsInHand) {
        if (!mullingCards.some((m) => m.cardNr === card.cardNr)) {
          mullingCards.push(card);
        }
      }
    }

    return {
      action: "mulligan",
      mullingCards
    };
  }

  drawPhaseDraw(gameState) {
    return {
      action: "drawPhaseDraw",
      deck: this.chooseDeckToDraw(gameState)
    };
  }

  chooseDeckToDraw(gameState) {
    const opp = gameState.opponent;
    if (opp.yaoDeck.length === 0) return "actionDeck";
    if (opp.actionDeck.length === 0) return "yaoDeck";

    const crystalsOnField = opp.crystalZone.length;
    const crystalsInHand = opp.hand.filter((c) => this.cardData[c.id]?.type === "crystal").length;
    const actionCardsInHand = opp.hand.filter((c) => this.cardData[c.id]?.type !== "crystal");
    const totalCrystals = crystalsOnField + crystalsInHand;

    // Highest cost card in hand (excluding Campest/Grand Harvest which don't use Reserve Yao)
    const maxHandCost = actionCardsInHand.reduce((max, c) => {
      const d = this.cardData[c.id];
      if (!d || d.payOnlyWithStoredYao || d.id === "campest" || d.yaoCost === "x") return max;
      return Math.max(max, Number(d.yaoCost) || 0);
    }, 0);

    // If we have no Crystal in hand to play this turn and fewer than 4 Crystals on field, draw Yao if we need the ramp
    if (crystalsInHand === 0) {
      if (crystalsOnField < 3) return "yaoDeck";
      if (crystalsOnField < 5 && maxHandCost > crystalsOnField && actionCardsInHand.length >= 2) {
        return "yaoDeck";
      }
      // Also if we have Inazovis or Razorgrass Lower Rune on board and plenty of Action cards, a Crystal can be played or Bursted!
      const hasInazovis = this.engine.getAllBattlefieldShumi("opponent").some((s) => s.id === "inazovis");
      const hasRazorLower = this.engine.hasRuneEffect("opponent", "razorgrass_lower");
      if ((hasInazovis || hasRazorLower) && actionCardsInHand.length >= 4 && crystalsOnField < 6) {
        return "yaoDeck";
      }
    }

    // If we are completely out of Action cards, always draw Action Deck
    if (actionCardsInHand.length === 0) return "actionDeck";

    // Default to Action Deck once we have enough Yao sources (4-5+)
    if (totalCrystals >= 5) return "actionDeck";

    return "actionDeck";
  }

  // ==========================================
  // MAIN AI PRIORITY DECISION ENGINE
  // ==========================================

  getPlay(gameState) {
    const info = gameState.gameInfo;
    if (info.priority.player !== "opponent") {
      return { action: "pass" };
    }

    // 1. STACK RESPONSES (Interceptions & Quickcast Abilities while Stack is non-empty)
    if (info.theStack.length > 0) {
      const stackResponse = this.getStackResponse(gameState);
      if (stackResponse) return stackResponse;
      return { action: "pass" };
    }

    // 2. OPPONENT'S TURN END PHASE (Ambush with Unleash the Wild One or Inagnu Zap before our turn starts)
    if (info.activePlayer === "player") {
      if (info.phase === "endPhase") {
        const endTurnPlay = this.getOpponentEndPhasePlay(gameState);
        if (endTurnPlay) return endTurnPlay;
      }
      return { action: "pass" };
    }

    // 3. AI'S OWN TURN — ACTION PHASE
    if (info.activePlayer === "opponent" && info.phase === "actionPhase") {
      return this.getActionPhasePlay(gameState);
    }

    // 4. AI'S END PHASE — Spend leftover Yao on Instant/Quickcast value before Yao Reserve resets
    if (info.activePlayer === "opponent" && info.phase === "endPhase") {
      const leftoverPlay = this.getEndOfOwnTurnPlay(gameState);
      if (leftoverPlay) return leftoverPlay;
    }

    return { action: "pass" };
  }

  // ==========================================
  // 1. STACK RESPONSE LOGIC (DEFENSE & AMPLIFY)
  // ==========================================

  getStackResponse(gameState) {
    const stack = gameState.gameInfo.theStack;
    const topItem = stack[stack.length - 1];
    if (!topItem) return null;

    // A) Responding to a Player Attack against AI's Shumi or AI Player
    if (topItem.kind === "attack" && topItem.player === "player" && !topItem.meta?.canceled) {
      const attackerFound = this.engine.findShumiByCardNr(topItem.meta?.attackerCardNr);
      const attackerCard = attackerFound ? attackerFound.card : topItem.card;
      const incomingDmg = this.engine.calculateAttackDamage(
        "player",
        attackerCard,
        topItem.attack,
        topItem.meta?.extraDamage || 0
      );

      // Case 1: Attack targets a friendly (AI) Shumi
      if (topItem.target?.type === "shumi") {
        const targetFound = this.engine.findShumiByCardNr(topItem.target.cardNr);
        if (targetFound && targetFound.player === "opponent") {
          const targetShumi = targetFound.card;
          const currentHp = this.engine.getCurrentHp("opponent", targetShumi);
          const alreadyPrevented = (gameState.gameInfo.damagePreventions || [])
            .filter((p) => p.targetCardNr === targetShumi.cardNr)
            .reduce((sum, p) => sum + p.amount, 0);
          const netDmg = Math.max(0, incomingDmg - alreadyPrevented);
          const isLethalToShumi = netDmg >= currentHp;
          const shumiValue = this.evaluateShumiValue("opponent", targetShumi);

          // Option 1A: Horucan Sentinel Ward (Prevent 1 damage + Draw a card!)
          // Great if preventing 1 damage saves the Shumi, or if Horucan itself is dying anyway so we cash in its Stored Yao for a card draw
          const horucans = this.engine.getAllBattlefieldShumi("opponent").filter((s) => {
            const abList = this.engine.checkCanActivateAbilities("opponent", s);
            return abList.some((a) => a.id === "horucan_shield");
          });
          if (horucans.length > 0 && netDmg > 0) {
            const savesShumi = netDmg === currentHp;
            const horucanIsDying = isLethalToShumi && targetShumi.id === "horucan";
            const highValueHit = shumiValue >= 6 && (horucans[0].storedYao || 0) >= 1;
            if (savesShumi || horucanIsDying || highValueHit) {
              const horucan = horucans[0];
              const ab = this.cardData[horucan.id].abilities.find((a) => a.id === "horucan_shield");
              return {
                action: "activateAbility",
                sourceCard: horucan,
                ability: ab,
                options: { targetCardNr: targetShumi.cardNr }
              };
            }
          }

          // Option 1B: Razorgrass Shield (1 Yao Interception: Move attacked Frontline Shumi to Backline, summon 0/3 Shield Token to soak attack)
          const shieldCard = gameState.opponent.hand.find(
            (c) => c.id === "razorgrass-shield" && this.engine.checkCanPlay("opponent", c)
          );
          if (shieldCard && (isLethalToShumi || incomingDmg >= 2) && !targetShumi.isToken) {
            return {
              action: "playCard",
              card: shieldCard,
              options: {}
            };
          }

          // Option 1C: Cycle Summon (2 Yao Interception: Return doomed Shumi to hand, put a cheaper Shumi from hand into play!)
          const cycleCard = gameState.opponent.hand.find(
            (c) => c.id === "cycle-summon" && this.engine.checkCanPlay("opponent", c)
          );
          if (cycleCard && isLethalToShumi && !targetShumi.isToken && shumiValue >= 4) {
            return {
              action: "playCard",
              card: cycleCard,
              options: { bounceCardNr: targetShumi.cardNr }
            };
          }

          // Option 1D: If target is Faele or Farloss (+1 LF per Stored Yao) and 1 Yao away from surviving, Burst a Crystal or cast Prosper!
          if (
            (targetShumi.id === "faele" || targetShumi.id === "farloss") &&
            netDmg === currentHp
          ) {
            const prosperCard = gameState.opponent.hand.find(
              (c) => c.id === "prosper" && this.engine.checkCanPlay("opponent", c)
            );
            if (prosperCard) {
              return {
                action: "playCard",
                card: prosperCard,
                options: { target: { type: "shumi", cardNr: targetShumi.cardNr } }
              };
            }
            const burstCrystal = this.findBurstableCrystal(gameState, true);
            if (burstCrystal) {
              const ab = this.cardData[burstCrystal.id].abilities.find((a) => a.isBurst);
              return {
                action: "activateAbility",
                sourceCard: burstCrystal,
                ability: ab,
                options: { targetCardNr: targetShumi.cardNr }
              };
            }
          }
        }
      }

      // Case 2: Attack targets AI Player directly for lethal or heavy damage — check if Inagnu can snipe a 1-LF attacker!
      if (attackerFound && this.engine.getCurrentHp("player", attackerCard) === 1) {
        const inagnus = this.engine.getAllBattlefieldShumi("opponent").filter((s) =>
          this.engine.checkCanActivateAbilities("opponent", s).some((a) => a.id === "inagnu_zap")
        );
        if (inagnus.length > 0 && (incomingDmg >= 2 || incomingDmg >= gameState.opponent.hp)) {
          const inagnu = inagnus[0];
          const ab = this.cardData[inagnu.id].abilities.find((a) => a.id === "inagnu_zap");
          return {
            action: "activateAbility",
            sourceCard: inagnu,
            ability: ab,
            options: {
              zapTarget: {
                type: "shumi",
                cardNr: attackerCard.cardNr,
                player: "player",
                label: this.cardData[attackerCard.id]?.name
              }
            }
          };
        }
      }
    }

    // B) Amplifying AI's OWN Attack on the Stack using Maum / Gramaum Amplify Damage
    if (topItem.kind === "attack" && topItem.player === "opponent" && !topItem.meta?.canceled) {
      const attackerFound = this.engine.findShumiByCardNr(topItem.meta?.attackerCardNr);
      if (attackerFound && topItem.target) {
        const attackerCard = attackerFound.card;
        const baseDmg = this.engine.calculateAttackDamage(
          "opponent",
          attackerCard,
          topItem.attack,
          topItem.meta?.extraDamage || 0
        );
        const existingAmp = (gameState.gameInfo.damageAmplifiers || [])
          .filter(
            (amp) =>
              amp.sourceId === attackerCard.cardNr &&
              (amp.recipientId === topItem.target.cardNr ||
                (topItem.target.type === "player" && amp.recipientId === `player_${topItem.target.player}`))
          )
          .reduce((sum, a) => sum + a.amount, 0);

        const currentProjectedDmg = baseDmg + existingAmp;

        // Find Maum or Gramaum that can activate Amplify
        const amplifiers = this.engine.getAllBattlefieldShumi("opponent").filter((s) =>
          this.engine
            .checkCanActivateAbilities("opponent", s)
            .some((a) => a.id === "maum_amplify" || a.id === "gramaum_amplify")
        );

        if (amplifiers.length > 0 && currentProjectedDmg > 0) {
          const ampShumi = amplifiers[0];
          const ab = this.cardData[ampShumi.id].abilities.find(
            (a) => a.id === "maum_amplify" || a.id === "gramaum_amplify"
          );
          const maxSpend = ab.id === "maum_amplify" ? Math.min(3, ampShumi.storedYao || 0) : ampShumi.storedYao || 0;

          if (topItem.target.type === "shumi") {
            const enemyFound = this.engine.findShumiByCardNr(topItem.target.cardNr);
            if (enemyFound) {
              const enemyHp = this.engine.getCurrentHp("player", enemyFound.card);
              const deficit = enemyHp - currentProjectedDmg;
              // Spend exact Yao needed to turn a non-lethal hit into a lethal kill on an enemy Shumi!
              if (deficit > 0 && deficit <= maxSpend) {
                return {
                  action: "activateAbility",
                  sourceCard: ampShumi,
                  ability: ab,
                  options: {
                    xVal: deficit,
                    sourceId: attackerCard.cardNr,
                    recipientId: enemyFound.card.cardNr
                  }
                };
              }
            }
          } else if (topItem.target.type === "player" && topItem.target.player === "player") {
            const playerHp = gameState.player.hp;
            const deficit = playerHp - currentProjectedDmg;
            // Spend to achieve immediate lethal on Player, or dump excess Maum Yao when Player is low!
            if ((deficit > 0 && deficit <= maxSpend) || (playerHp <= 8 && maxSpend >= 2 && existingAmp === 0)) {
              const spend = deficit > 0 && deficit <= maxSpend ? deficit : Math.min(maxSpend, 2);
              return {
                action: "activateAbility",
                sourceCard: ampShumi,
                ability: ab,
                options: {
                  xVal: spend,
                  sourceId: attackerCard.cardNr,
                  recipientId: "player_player"
                }
              };
            }
          }
        }
      }
    }

    return null;
  }

  // ==========================================
  // 2. END-OF-OPPONENT-TURN INSTANT PLAYS
  // ==========================================

  getOpponentEndPhasePlay(gameState) {
    // 1. Cast Unleash the Wild One at the end of Player's turn so the summoned Shumi gets Momentum immediately on AI's turn!
    const unleashCard = gameState.opponent.hand.find(
      (c) => c.id === "unleash-the-wild-one" && this.engine.checkCanPlay("opponent", c)
    );
    if (unleashCard) {
      const xVal = this.chooseUnleashX(gameState);
      if (xVal >= 1) {
        return {
          action: "playCard",
          card: unleashCard,
          options: { xValue: xVal }
        };
      }
    }

    // 2. Cast Prosper at end of Player's turn if we have spare Yao
    const prosperCard = gameState.opponent.hand.find(
      (c) => c.id === "prosper" && this.engine.checkCanPlay("opponent", c)
    );
    if (prosperCard && this.engine.getAllBattlefieldShumi("opponent").length > 0) {
      const targetNr = this.chooseProsperTarget(gameState);
      if (targetNr) {
        return {
          action: "playCard",
          card: prosperCard,
          options: { target: { type: "shumi", cardNr: targetNr } }
        };
      }
    }

    // 3. Activate Inagnu Static Zap if we have 3+ Yao and either Inagnu already dealt damage this cycle or it kills a 1-HP enemy / player
    const zapPlay = this.findBestInagnuZap(gameState, true);
    if (zapPlay) return zapPlay;

    return null;
  }

  getEndOfOwnTurnPlay(gameState) {
    // Before our turn ends and Yao Reserve resets to 0, spend leftover Yao on Prosper or Inagnu Zap
    const prosperCard = gameState.opponent.hand.find(
      (c) => c.id === "prosper" && this.engine.checkCanPlay("opponent", c)
    );
    if (prosperCard && this.engine.getAllBattlefieldShumi("opponent").length > 0) {
      const targetNr = this.chooseProsperTarget(gameState);
      if (targetNr) {
        return {
          action: "playCard",
          card: prosperCard,
          options: { target: { type: "shumi", cardNr: targetNr } }
        };
      }
    }

    const zapPlay = this.findBestInagnuZap(gameState, false);
    if (zapPlay) return zapPlay;

    return null;
  }

  // ==========================================
  // 3. FULL ACTION PHASE TACTICAL SEQUENCING
  // ==========================================

  getActionPhasePlay(gameState) {
    const opp = gameState.opponent;

    // STEP 1: Play a Yao Crystal from hand if we haven't played one this turn
    // (Unless holding exactly 1 Crystal when we already have >= 6 Crystals and Inazovis/Razorgrass Rune prefers Bursting it)
    if (!opp.hasPlayedCrystal) {
      const crystalsInHand = opp.hand.filter((c) => this.cardData[c.id]?.type === "crystal");
      if (crystalsInHand.length > 0) {
        const shouldSaveForBurst =
          crystalsInHand.length === 1 &&
          opp.crystalZone.length >= 6 &&
          (this.engine.getAllBattlefieldShumi("opponent").some((s) => s.id === "inazovis") ||
            this.engine.hasRuneEffect("opponent", "razorgrass_lower"));
        if (!shouldSaveForBurst) {
          return {
            action: "playCrystal",
            card: crystalsInHand[0]
          };
        }
      }
    }

    // STEP 2: Activate zero-cost value abilities before combat (Rune of the Fertile Field Transfer, Musclyp free Muspem deploy)
    if (opp.upperRuneZone?.id) {
      const runeAbilities = this.engine.checkCanActivateAbilities("opponent", opp.upperRuneZone);
      const fertileAct = runeAbilities.find(
        (a) => a.id === "fertile_upper_act" || a.id === "fertile_combined_act"
      );
      if (fertileAct && this.engine.getAllBattlefieldShumi("opponent").length > 0) {
        const targetNr = this.chooseProsperTarget(gameState);
        if (targetNr) {
          return {
            action: "activateAbility",
            sourceCard: opp.upperRuneZone,
            ability: fertileAct,
            options: { targetCardNr: targetNr }
          };
        }
      }
    }

    for (const shumi of this.engine.getAllBattlefieldShumi("opponent")) {
      const abList = this.engine.checkCanActivateAbilities("opponent", shumi);
      const musclypDeploy = abList.find((a) => a.id === "musclyp_deploy");
      if (musclypDeploy) {
        const lane = opp.frontline.length < 3 ? "frontline" : "backline";
        return {
          action: "activateAbility",
          sourceCard: shumi,
          ability: musclypDeploy,
          options: { lane }
        };
      }
    }

    // STEP 3: Pre-combat Lane Repositioning (Rule 2.3)
    // If AI hasn't used its 1 free lane change this turn, check if a Backline Shumi with Momentum can move to Frontline to attack!
    if (!opp.hasUsedFreeLaneChange && opp.frontline.length < 5) {
      const backlineReady = opp.backline
        .filter((s) => {
          const def = this.cardData[s.id];
          if (!s.momentum || def?.keywords?.includes("cannot_frontline")) return false;
          // Don't move Kalflux to Frontline if it wants to stay safe or use Guidance from Backline
          if (s.id === "kalflux" && opp.frontline.length > 0) return false;
          return (def?.baseAttacks || []).length > 0 || (def?.specialAttacks || []).length > 0;
        })
        .sort((a, b) => this.getMaxAttackPotential("opponent", b) - this.getMaxAttackPotential("opponent", a));

      if (backlineReady.length > 0) {
        const candidate = backlineReady[0];
        if (this.engine.canChangeLane("opponent", candidate).canMove) {
          return {
            action: "moveToFrontline",
            cardNr: candidate.cardNr
          };
        }
      }
    }

    // STEP 4: Check if Supel on Frontline should activate Flight ("supel_flight") to bypass enemy Frontline blockers and snipe a 1-HP backliner or low-HP player
    for (const shumi of opp.frontline) {
      if (shumi.id === "supel" && shumi.momentum && gameState.player.frontline.length > 0) {
        const abList = this.engine.checkCanActivateAbilities("opponent", shumi);
        const flightAb = abList.find((a) => a.id === "supel_flight");
        if (flightAb) {
          const canSnipeBackline = gameState.player.backline.some(
            (b) => this.engine.getCurrentHp("player", b) === 1
          );
          const canLethalPlayer = gameState.player.hp <= 1;
          const badFrontlineTrades = gameState.player.frontline.every(
            (f) => this.engine.getCurrentHp("player", f) > 2
          );
          if (canSnipeBackline || canLethalPlayer || (badFrontlineTrades && opp.yaoReserve >= 3)) {
            return {
              action: "activateAbility",
              sourceCard: shumi,
              ability: flightAb,
              options: {}
            };
          }
        }
      }
    }

    // STEP 5: Cast Hasten BEFORE/DURING combat if we have a high-impact Frontline Shumi without Momentum (e.g. newly summoned/matured powerhouse)
    const hastenCard = opp.hand.find((c) => c.id === "hasten" && this.engine.checkCanPlay("opponent", c));
    if (hastenCard) {
      const hastenTargetNr = this.chooseHastenTarget(gameState, true);
      if (hastenTargetNr) {
        return {
          action: "playCard",
          card: hastenCard,
          options: { target: { type: "shumi", cardNr: hastenTargetNr } }
        };
      }
    }

    // STEP 6: Execute the Best Available Combat Attack!
    // (Attacking BEFORE Maturing or casting The Grand Harvest is critical because Stage 1 Shumi can attack first and then Mature or be refreshed by Grand Harvest!)
    const bestAttack = this.findBestAttack(gameState);
    if (bestAttack) {
      return bestAttack;
    }

    // STEP 7: Cast "The Grand Harvest" AFTER our Shumi with Stored Yao have attacked (since it gives them Momentum again + bonus LF + draws cards!)
    const grandHarvestCard = opp.hand.find(
      (c) => c.id === "the-grand-harvest" && this.engine.checkCanPlay("opponent", c)
    );
    if (grandHarvestCard) {
      const friendlyWithYao = this.engine
        .getAllBattlefieldShumi("opponent")
        .filter((s) => (s.storedYao || 0) > 0);
      const exhaustedCount = friendlyWithYao.filter((s) => !s.momentum).length;
      if (exhaustedCount >= 1 || friendlyWithYao.length >= 2) {
        return {
          action: "playCard",
          card: grandHarvestCard,
          options: {}
        };
      }
    }

    // STEP 8: Summon "Campest" (Myth) if playable and the board wipe is favorable!
    const campestCard = opp.hand.find((c) => c.id === "campest" && this.engine.checkCanPlay("opponent", c));
    if (campestCard) {
      const playerBoardVal = this.engine
        .getAllBattlefieldShumi("player")
        .reduce((sum, s) => sum + this.evaluateShumiValue("player", s), 0);
      const oppBoardVal = this.engine
        .getAllBattlefieldShumi("opponent")
        .reduce((sum, s) => sum + this.evaluateShumiValue("opponent", s), 0);
      // Since all AI Shumi have already attacked in Step 6, wiping the board for a 10+ LF Myth is almost always awesome
      if (playerBoardVal >= oppBoardVal - 6 || opp.frontline.every((s) => !s.momentum)) {
        return {
          action: "playCard",
          card: campestCard,
          options: { summonMode: "normal", targetLane: "friendly_frontline" }
        };
      }
    }

    // STEP 9: Mature Stage 2 Shumi from hand (after Stage 1s have already attacked!)
    const maturePlay = this.findBestMaturingPlay(gameState);
    if (maturePlay) {
      return maturePlay;
    }

    // STEP 10: Cast "Ritual of the Vast" (creates a 6 LF Frontline blocker with Bloom, searches Campest, and Prospers all Bloom Shumi!)
    const ritualCard = opp.hand.find(
      (c) => c.id === "ritual-of-the-vast" && this.engine.checkCanPlay("opponent", c)
    );
    if (ritualCard) {
      const lane = opp.frontline.length < 5 ? "frontline" : "backline";
      return {
        action: "playCard",
        card: ritualCard,
        options: { lane }
      };
    }

    // STEP 11: Summon the best normal Shumi from hand (prioritizing curve & synergy)
    const summonPlay = this.findBestNormalSummon(gameState);
    if (summonPlay) {
      return summonPlay;
    }

    // STEP 12: Cast "Prosper" if we have a Shumi on board (cycles a card + adds 1 Stored Yao)
    const prosperCard = opp.hand.find((c) => c.id === "prosper" && this.engine.checkCanPlay("opponent", c));
    if (prosperCard && this.engine.getAllBattlefieldShumi("opponent").length > 0) {
      const targetNr = this.chooseProsperTarget(gameState);
      if (targetNr) {
        return {
          action: "playCard",
          card: prosperCard,
          options: { target: { type: "shumi", cardNr: targetNr } }
        };
      }
    }

    // STEP 13: Cast "Hasten" on a newly summoned/matured Frontline Shumi so it can attack immediately!
    if (hastenCard) {
      const hastenTargetNr = this.chooseHastenTarget(gameState, false);
      if (hastenTargetNr) {
        return {
          action: "playCard",
          card: hastenCard,
          options: { target: { type: "shumi", cardNr: hastenTargetNr } }
        };
      }
    }

    // STEP 14: Burst extra Yao Crystal from hand if advantageous!
    // (Triggers Inazovis 1 damage, Razorgrass Lower Rune draw, Farloss +1/+1, or helps reach Maturing / Campest threshold)
    const burstCrystal = this.findBurstableCrystal(gameState, false);
    if (burstCrystal) {
      const ab = this.cardData[burstCrystal.id]?.abilities?.find((a) => a.isBurst);
      const targetNr = this.chooseProsperTarget(gameState);
      if (ab && targetNr) {
        return {
          action: "activateAbility",
          sourceCard: burstCrystal,
          ability: ab,
          options: { targetCardNr: targetNr }
        };
      }
    }

    // STEP 15: Post-combat tactical lane retreat
    // If we still have our free lane change and a fragile/damaged value Shumi (like Inagnu, Caquil, or 1-HP Shumi) is exposed on Frontline while another Frontline blocker exists, move it to Backline
    if (!opp.hasUsedFreeLaneChange && opp.frontline.length >= 2 && opp.backline.length < 5) {
      const retreatCandidate = opp.frontline.find(
        (s) =>
          !s.momentum &&
          (s.id === "inagnu" ||
            s.id === "caquil" ||
            (this.engine.getCurrentHp("opponent", s) === 1 && !s.isToken))
      );
      if (retreatCandidate && this.engine.canChangeLane("opponent", retreatCandidate).canMove) {
        return {
          action: "changeLane",
          cardNr: retreatCandidate.cardNr
        };
      }
    }

    return { action: "pass" };
  }

  // ==========================================
  // COMBAT EVALUATION & TARGETING
  // ==========================================

  findBestAttack(gameState) {
    const attackers = this.engine.getAllBattlefieldShumi("opponent");
    let bestOption = null;
    let bestScore = -999;

    for (const shumi of attackers) {
      const availableAttacks = this.engine.getAvailableAttacks("opponent", shumi);
      for (const attack of availableAttacks) {
        const legalTargets = this.engine.getLegalTargetsForAttack("opponent", shumi, attack);

        if (!legalTargets || legalTargets.length === 0) {
          // Non-targeted attack (e.g. Campest Earthquake, Muspem Squeak for Help, Kalfil Moo Innocently, Inagnu Tempest Cuddle, or Bloom)
          const score = this.scoreUntargetedAttack(gameState, shumi, attack);
          if (score > bestScore) {
            bestScore = score;
            bestOption = {
              action: "attack",
              cardNr: shumi.cardNr,
              attackId: attack.id,
              target: null
            };
          }
        } else {
          for (const target of legalTargets) {
            const score = this.scoreTargetedAttack(gameState, shumi, attack, target);
            if (score > bestScore) {
              bestScore = score;
              bestOption = {
                action: "attack",
                cardNr: shumi.cardNr,
                attackId: attack.id,
                target
              };
            }
          }
        }
      }
    }

    // Only declare an attack if its tactical score is positive
    if (bestOption && bestScore > 0) {
      return bestOption;
    }
    return null;
  }

  scoreUntargetedAttack(gameState, shumi, attack) {
    const opp = gameState.opponent;

    // 1. Bloom (0 dmg, Prosper 1)
    if (attack.name?.toLowerCase() === "bloom" || attack.id?.includes("bloom")) {
      return 35;
    }

    // 2. Muspem — Squeak for Help (Cost 1 Yao: Search Action Deck for a Muspem and put it onto Battlefield!)
    if (attack.id === "squeak_for_help") {
      const hasMuspemInDeck = opp.actionDeck.some((c) => c.id === "muspem");
      const hasSpace = opp.frontline.length < 5 || opp.backline.length < 5;
      if (hasMuspemInDeck && hasSpace) return 95;
      return -50;
    }

    // 3. Kalfil — Moo Innocently (Search Action Deck for Mature Kalfil -> Kalflux!)
    if (attack.id === "moo_innocently") {
      const hasKalfluxInDeck = opp.actionDeck.some((c) => this.cardData[c.id]?.maturesFrom === "kalfil");
      const alreadyHasKalfluxInHand = opp.hand.some((c) => c.id === "kalflux");
      if (hasKalfluxInDeck && !alreadyHasKalfluxInHand) return 85;
      if (hasKalfluxInDeck) return 45;
      return -20;
    }

    // 4. Inagnu — Tempest Cuddle (Draw 1 card, take 1 self-damage, marks Inagnu as having dealt damage this cycle)
    if (attack.id === "tempest_cuddle") {
      if (opp.hp <= 4) return -100; // Too risky at low HP
      const handCount = opp.hand.filter((c) => this.cardData[c.id]?.type !== "crystal").length;
      // Remember Inagnu Prospers 1 at end of cycle if it deals NO damage; only use Tempest Cuddle if low on cards
      if (handCount <= 2 && opp.hp >= 10) return 40;
      return -10;
    }

    // 5. Campest — Earthquake (Costs 2 Stored Yao: 2 damage to all other Shumi)
    if (attack.id === "earthquake") {
      const dmg = this.engine.calculateAttackDamage("opponent", shumi, attack);
      let score = 0;
      for (const enemy of this.engine.getAllBattlefieldShumi("player")) {
        const hp = this.engine.getCurrentHp("player", enemy);
        const val = this.evaluateShumiValue("player", enemy);
        score += dmg >= hp ? val * 12 + 25 : dmg * 8;
      }
      for (const ally of this.engine.getAllBattlefieldShumi("opponent")) {
        if (ally.cardNr === shumi.cardNr) continue;
        const hp = this.engine.getCurrentHp("opponent", ally);
        const val = this.evaluateShumiValue("opponent", ally);
        score -= dmg >= hp ? val * 12 + 20 : dmg * 6;
      }
      return score;
    }

    return 15;
  }

  scoreTargetedAttack(gameState, shumi, attack, target) {
    // Special case: Kalflux "Guidance" targets a friendly Kalfil to make it Prosper 2
    if (attack.id === "guidance") {
      return 65;
    }

    const dmg = this.engine.calculateAttackDamage("opponent", shumi, attack);
    const yaoCost = attack.yaoCost || 0;
    let score = 0;

    // Account for attack side-effects
    if (attack.effect?.type === "prosper") {
      const amt = attack.effect.prosper?.amount || 1;
      score += amt * 18;
      // Extra synergy if Inazovis or Farloss is on board
      if (shumi.id === "inazovis" || shumi.id === "farloss") score += 15;
    }

    if (attack.effect?.type === "recoil") {
      const recoil = attack.effect.recoil?.amount || 2;
      const myHp = this.engine.getCurrentHp("opponent", shumi);
      if (recoil >= myHp) {
        score -= 45; // Self-KO from recoil unless it wins the game or kills a massive threat
      } else {
        score -= recoil * 6;
      }
    }

    // Schnuut Jumpscare (0 dmg, bounces Schnuut to hand and pushes enemy Frontliner to Backline or bounces to hand!)
    if (attack.id === "jumpscare") {
      if (target.type !== "shumi") return -50;
      const enemyFound = this.engine.findShumiByCardNr(target.cardNr);
      if (!enemyFound) return -50;
      const enemyVal = this.evaluateShumiValue("player", enemyFound.card);
      const enemyHp = this.engine.getCurrentHp("player", enemyFound.card);
      // Great against tanky Frontline blockers or buffed Shumi with lots of Stored Yao!
      if (enemyHp >= 4 || (enemyFound.card.storedYao || 0) >= 2) {
        return 55 + enemyVal * 5;
      }
      return -10;
    }

    // Target is the Player
    if (target.type === "player") {
      if (dmg <= 0 && !attack.effect) return -50;
      const playerHp = gameState.player.hp;
      if (dmg >= playerHp) {
        return 10000; // Immediate Lethal Win!
      }
      score += dmg * 14 - yaoCost * 5;
      // Bonus pressure when player is low
      if (playerHp - dmg <= 5) score += 25;
      return score;
    }

    // Target is an enemy Shumi
    if (target.type === "shumi") {
      const enemyFound = this.engine.findShumiByCardNr(target.cardNr);
      if (!enemyFound) return -100;
      const enemyCard = enemyFound.card;
      const enemyHp = this.engine.getCurrentHp("player", enemyCard);
      const enemyVal = this.evaluateShumiValue("player", enemyCard);

      if (dmg >= enemyHp) {
        // Lethal kill on enemy Shumi!
        score += 45 + enemyVal * 10;
        // Prefer exact-damage kills rather than wasting 5 damage on a 1-HP token
        const overkill = dmg - enemyHp;
        score -= overkill * 4;

        // Sendris Trigger: "Whenever Sendris defeats a Shumi, it Prospers 2."
        if (shumi.id === "sendris") {
          score += 35;
        }
      } else {
        // Chip damage on enemy Shumi
        score += dmg * 9 + enemyVal * 2;
      }

      // Leppun "Descend Upon" splash damage bonus (1 damage to all other enemy Shumi in the same lane!)
      if (attack.effect?.type === "splash_damage") {
        const othersInLane = gameState.player[enemyFound.lane].filter((s) => s.cardNr !== enemyCard.cardNr);
        for (const other of othersInLane) {
          const otherHp = this.engine.getCurrentHp("player", other);
          const otherVal = this.evaluateShumiValue("player", other);
          score += otherHp === 1 ? 40 + otherVal * 8 : 14;
        }
      }

      score -= yaoCost * 5;
      return score;
    }

    return score;
  }

  // ==========================================
  // SUMMONING & MATURING EVALUATION
  // ==========================================

  findBestMaturingPlay(gameState) {
    const opp = gameState.opponent;
    const candidates = [];

    for (const card of opp.hand) {
      const def = this.cardData[card.id];
      if (!def || def.type !== "shumi" || def.stage !== 2) continue;
      const targets = this.engine.getMaturingTargets("opponent", def);
      if (targets.length === 0) continue;

      for (const young of targets) {
        let score = 50 + (def.yaoCost || 2) * 10;

        // Strongly prefer maturing a Stage 1 Shumi that has ALREADY spent its Momentum this turn!
        if (!young.momentum) score += 25;
        else score -= 15;

        // Special Maturing synergies:
        // 1. Musclyp returns the Muspem it matured from to hand AND can deploy it again for free!
        if (def.id === "musclyp") score += 40;
        // 2. Equuna draws a card on ETB and its attack bounces any Shumi to hand!
        if (def.id === "equuna") score += 35;
        // 3. Gramaum / Farloss / Sendris / Leppun / Kalflux / Inazovis are major upgrades
        if (def.id === "farloss" || def.id === "sendris" || def.id === "inazovis") score += 25;
        if (def.id === "gramaum" && opp.yaoReserve + (young.storedYao || 0) >= 3) score += 30;

        candidates.push({ card, young, score });
      }
    }

    if (candidates.length === 0) return null;
    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    return {
      action: "playCard",
      card: best.card,
      options: {
        summonMode: "maturing",
        maturingTargetCardNr: best.young.cardNr
      }
    };
  }

  findBestNormalSummon(gameState) {
    const opp = gameState.opponent;
    const playableShumi = opp.hand.filter((c) => {
      const def = this.cardData[c.id];
      return def && def.type === "shumi" && this.engine.canSummonNormally("opponent", def);
    });

    if (playableShumi.length === 0) return null;

    const scored = playableShumi.map((card) => {
      const def = this.cardData[card.id];
      const effCost = this.engine.getEffectiveSummonCost("opponent", def, null);
      let score = (def.yaoCost || 1) * 12 + (def.health || 1) * 4;

      // Bonus if we have a cost reduction active from Rune of the Razorgrass
      if (effCost < (def.yaoCost || 0)) score += 20;

      // Stage 1 setup and ETB synergies:
      if (def.id === "caquil") score += 35; // Tutor a Campestral Shumi from deck!
      if (def.id === "muspem") score += 30; // Refunds 1 Yao into Stored Yao immediately!
      if (def.id === "maum" || def.id === "supel") score += 22; // Enters with 1 Stored Yao
      if (def.id === "horucan") score += 28; // Enters with 2 Stored Yao when summoned normally!
      if (def.id === "inagnu") score += 26; // End-of-cycle Prosper engine + 6 LF body
      if (def.id === "faele") {
        const leftoverYao = opp.yaoReserve - effCost;
        score += leftoverYao * 14; // Faele converts leftover Yao into +LF and Stored Yao!
      }

      // Bonus if we hold the Stage 2 evolution in hand!
      const hasStage2InHand = opp.hand.some((h) => this.cardData[h.id]?.maturesFrom === def.id);
      if (hasStage2InHand) score += 28;

      // Slight penalty for raw-summoning a Stage 2 that prefers Maturing (like Musclyp), unless we have plenty of Yao
      if (def.stage === 2 && def.id === "musclyp") score -= 18;

      const targetLane = this.getTargetForShumi(gameState, card);
      return { card, score, targetLane };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];

    return {
      action: "playCard",
      card: best.card,
      options: {
        summonMode: "normal",
        targetLane: best.targetLane
      }
    };
  }

  getTargetForShumi(gameState, handCard) {
    const opp = gameState.opponent;
    const def = this.cardData[handCard.id] || handCard;
    const canFront = !def.keywords?.includes("cannot_frontline") && opp.frontline.length < 5;
    const canBack = opp.backline.length < 5;

    if (!canFront) return "friendly_backline";
    if (!canBack) return "friendly_frontline";

    // Always keep Frontline populated with at least 1-2 blockers so enemy Frontliners cannot hit AI Player directly!
    if (opp.frontline.length === 0) return "friendly_frontline";

    // Utility / Engine Shumi that prefer Backline protection if Frontline already has a blocker:
    if (def.id === "kalflux" || def.id === "inagnu" || def.id === "caquil") {
      if (opp.frontline.length >= 1) return "friendly_backline";
    }

    // If we haven't used our free lane move yet and Backline has room, summoning onto Backline is fine only for utility Shumi;
    // combat Shumi want to be on the Frontline ready to block and attack next turn!
    if (opp.frontline.length < 4) {
      return "friendly_frontline";
    }
    return "friendly_backline";
  }

  // ==========================================
  // HELPER & SUB-DECISION METHODS CALLED BY ENGINE
  // ==========================================

  evaluateShumiValue(player, shumi) {
    if (!shumi) return 0;
    const def = this.cardData[shumi.id];
    if (!def) return 1;
    if (shumi.isToken) return 2;

    let val = (def.yaoCost || 1) * 1.5 + (shumi.storedYao || 0) * 1.2;
    if (def.stage === 2) val += 2.5;
    if (def.type === "myth") val += 8;
    if (shumi.id === "inazovis" || shumi.id === "farloss" || shumi.id === "sendris" || shumi.id === "gramaum") {
      val += 2;
    }
    return val;
  }

  getMaxAttackPotential(player, shumi) {
    const def = this.cardData[shumi.id];
    if (!def) return 0;
    const allAttacks = [...(def.baseAttacks || []), ...(def.specialAttacks || [])];
    let maxD = 0;
    for (const a of allAttacks) {
      const d = this.engine.calculateAttackDamage(player, shumi, a);
      if (d > maxD) maxD = d;
    }
    return maxD;
  }

  findBurstableCrystal(gameState, emergency = false) {
    const opp = gameState.opponent;
    const crystals = opp.hand.filter((c) => {
      const abList = this.engine.checkCanActivateAbilities("opponent", c);
      return abList.some((a) => a.isBurst);
    });
    if (crystals.length === 0) return null;
    if (emergency) return crystals[0];

    const friendly = this.engine.getAllBattlefieldShumi("opponent");
    if (friendly.length === 0) return null;

    // Burst if we have >= 4 Crystals in play (or >= 2 Crystals in hand) AND a strong payoff on board
    const hasExtraCrystal = opp.crystalZone.length >= 4 || crystals.length >= 2;
    if (!hasExtraCrystal) return null;

    const hasInazovis = friendly.some((s) => s.id === "inazovis");
    const hasRazorLower = this.engine.hasRuneEffect("opponent", "razorgrass_lower");
    const hasFarlossOrFaele = friendly.some((s) => s.id === "farloss" || s.id === "faele");
    const totalStored = friendly.reduce((sum, s) => sum + (s.storedYao || 0), 0);
    const needsYaoForGrandHarvestOrCampest =
      (opp.hand.some((c) => c.id === "the-grand-harvest") && totalStored === 5) ||
      (opp.hand.some((c) => c.id === "campest") && totalStored === 9);

    if (hasInazovis || hasRazorLower || hasFarlossOrFaele || needsYaoForGrandHarvestOrCampest) {
      return crystals[0];
    }
    return null;
  }

  findBestInagnuZap(gameState, endOfEnemyTurn = false) {
    const inagnus = this.engine.getAllBattlefieldShumi("opponent").filter((s) =>
      this.engine.checkCanActivateAbilities("opponent", s).some((a) => a.id === "inagnu_zap")
    );
    if (inagnus.length === 0) return null;

    const inagnu = inagnus[0];
    const ab = this.cardData[inagnu.id].abilities.find((a) => a.id === "inagnu_zap");

    // 1. Immediate lethal on Player!
    if (gameState.player.hp <= 1) {
      return {
        action: "activateAbility",
        sourceCard: inagnu,
        ability: ab,
        options: {
          zapTarget: { type: "player", cardNr: "player_player", player: "player", label: "You" }
        }
      };
    }

    // 2. Snipe an enemy Shumi with 1 LF remaining!
    const oneHpEnemy = this.engine
      .getAllBattlefieldShumi("player")
      .filter((s) => this.engine.getCurrentHp("player", s) === 1)
      .sort((a, b) => this.evaluateShumiValue("player", b) - this.evaluateShumiValue("player", a))[0];

    if (oneHpEnemy) {
      return {
        action: "activateAbility",
        sourceCard: inagnu,
        ability: ab,
        options: {
          zapTarget: {
            type: "shumi",
            cardNr: oneHpEnemy.cardNr,
            player: "player",
            label: this.cardData[oneHpEnemy.id]?.name
          }
        }
      };
    }

    // 3. If Inagnu ALREADY dealt damage this Yao Cycle (so it won't get its peaceful Prosper 1 trigger anyway) and we're about to lose our Yao Reserve, zap an enemy Shumi or Player
    if (inagnu.dealtDamageThisCycle || endOfEnemyTurn) {
      const bestEnemy = this.engine
        .getAllBattlefieldShumi("player")
        .sort((a, b) => this.engine.getCurrentHp("player", a) - this.engine.getCurrentHp("player", b))[0];
      if (bestEnemy) {
        return {
          action: "activateAbility",
          sourceCard: inagnu,
          ability: ab,
          options: {
            zapTarget: {
              type: "shumi",
              cardNr: bestEnemy.cardNr,
              player: "player",
              label: this.cardData[bestEnemy.id]?.name
            }
          }
        };
      }
    }

    return null;
  }

  // Called by gameLogic when AI needs to pick a Shumi to Prosper or receive Fertile Field Yao
  chooseProsperTarget(gameState) {
    const friendly = this.engine.getAllBattlefieldShumi("opponent");
    if (friendly.length === 0) return null;

    const scored = friendly.map((s) => {
      let score = 10;
      // 1. If we hold a Stage 2 in hand that matures from `s` and `s` needs more Yao to mature cleanly
      const hasEvoInHand = gameState.opponent.hand.some((h) => this.cardData[h.id]?.maturesFrom === s.id);
      if (hasEvoInHand) score += 35;

      // 2. Farloss & Faele gain +1 LF per Stored Yao!
      if (s.id === "farloss" || s.id === "faele") score += 30;

      // 3. Inazovis, Sendris, Gramaum, Maum, Horucan actively weaponize Stored Yao
      if (s.id === "inazovis" || s.id === "gramaum" || s.id === "sendris") score += 25;
      if (s.id === "horucan" || s.id === "maum") score += 18;
      if (s.id === "campest") score += 28;

      if (s.isToken) score -= 20;
      return { cardNr: s.cardNr, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].cardNr;
  }

  // Called by gameLogic when AI casts Hasten
  chooseHastenTarget(gameState, requireHighImpact = false) {
    const candidates = gameState.opponent.frontline.filter((s) => !s.momentum);
    if (candidates.length === 0) return null;

    const scored = candidates.map((s) => {
      const maxDmg = this.getMaxAttackPotential("opponent", s);
      let score = maxDmg * 15;
      if (s.id === "campest") score += 80;
      if (s.id === "equuna") score += 55;
      if (s.id === "sendris" || s.id === "gramaum" || s.id === "farloss" || s.id === "leppun") score += 35;
      if (s.id === "muspem" || s.id === "kalfil") score += 25;
      return { cardNr: s.cardNr, score, maxDmg };
    });

    scored.sort((a, b) => b.score - a.score);
    if (requireHighImpact && scored[0].score < 45) return null;
    return scored[0].cardNr;
  }

  // Called by gameLogic when Rune of the Fertile Field Lower/Combined ability triggers on a Shumi gaining Stored Yao
  chooseFertileFieldRedirect(gameState, defaultTargetShumi, amount) {
    const friendly = this.engine.getAllBattlefieldShumi("opponent");
    if (friendly.length <= 1) return defaultTargetShumi.cardNr;

    // Keep Yao on Faele/Farloss if they are being summoned or buffed, or redirect to our best Yao sink
    if (defaultTargetShumi.id === "faele" || defaultTargetShumi.id === "farloss" || defaultTargetShumi.id === "campest") {
      return defaultTargetShumi.cardNr;
    }
    return this.chooseProsperTarget(gameState) || defaultTargetShumi.cardNr;
  }

  // Called by gameLogic when Inazovis triggers ("Whenever one of your Shumi Prospers, deal 1 damage to target Shumi")
  chooseInazovisTarget(gameState, allShumi) {
    const enemies = allShumi.filter((s) => s.owner === "player");
    if (enemies.length > 0) {
      // Prioritize killing a 1-LF enemy Shumi, otherwise hit the highest-value/lowest-HP enemy Shumi
      const sorted = [...enemies].sort((a, b) => {
        const hpA = this.engine.getCurrentHp("player", a);
        const hpB = this.engine.getCurrentHp("player", b);
        if (hpA === 1 && hpB !== 1) return -1;
        if (hpB === 1 && hpA !== 1) return 1;
        const valDiff = this.evaluateShumiValue("player", b) - this.evaluateShumiValue("player", a);
        if (Math.abs(valDiff) > 1) return valDiff;
        return hpA - hpB;
      });
      return sorted[0].cardNr;
    }

    // Mandatory trigger fallback if no enemy Shumi exist: pick our highest-HP friendly Shumi
    const friendlies = [...allShumi].sort(
      (a, b) => this.engine.getCurrentHp("opponent", b) - this.engine.getCurrentHp("opponent", a)
    );
    return friendlies[0]?.cardNr;
  }

  // Called by gameLogic when Equuna attacks ("Return target Shumi to its owner's hand")
  chooseEquunaBounceTarget(gameState, allShumi) {
    const enemies = allShumi.filter((s) => s.owner === "player");
    if (enemies.length > 0) {
      // Prioritize bouncing tokens (they vanish permanently!), Stage 2 Shumi, or Shumi with lots of Stored Yao
      const sorted = [...enemies].sort((a, b) => {
        const scoreB =
          this.evaluateShumiValue("player", b) + (b.isToken ? 5 : 0) + (b.storedYao || 0) * 2;
        const scoreA =
          this.evaluateShumiValue("player", a) + (a.isToken ? 5 : 0) + (a.storedYao || 0) * 2;
        return scoreB - scoreA;
      });
      return sorted[0].cardNr;
    }
    return allShumi[0]?.cardNr;
  }

  // Called by gameLogic when Faele enters the Battlefield
  chooseFaeleTransferAmount(gameState) {
    const reserve = gameState.opponent.yaoReserve;
    if (reserve <= 0) return 0;

    // Check if we have another playable card in hand this turn; if not, dump all remaining Yao Reserve onto Faele!
    const otherPlayable = gameState.opponent.hand.filter((c) => {
      const d = this.cardData[c.id];
      return d && d.type !== "crystal" && (d.yaoCost || 0) <= reserve;
    });
    if (otherPlayable.length === 0) return reserve;

    // Otherwise leave enough Yao for 1 cheap play if reserve is large, or put at least 2 Yao onto Faele so it survives
    return Math.max(Math.min(reserve, 2), reserve - 2);
  }

  // Called by gameLogic when Gramaum enters the Battlefield
  chooseGramaumTransferAmount(gameState, shumi, totalAvailable) {
    const reserve = gameState.opponent.yaoReserve;
    const upperStored = gameState.opponent.upperRuneZone?.storedYao || 0;
    // Take all leftover Reserve Yao + Rune Yao + up to 2 excess Yao from utility Shumi
    return Math.min(totalAvailable, reserve + upperStored + 2);
  }

  // Called by gameLogic when Caquil enters the Battlefield ("Search Action Deck for a Campestral Shumi with YC 1, 2, or 3 not named Caquil")
  chooseCaquilSearchTarget(gameState, matches) {
    if (!matches || matches.length === 0) return null;
    const opp = gameState.opponent;

    const scored = matches.map((m) => {
      const def = this.cardData[m.id];
      let score = (def.yaoCost || 1) * 10;

      // 1. If we have a Stage 1 on the battlefield and its Stage 2 is in the deck (YC <= 3 like Farloss, Sendris, Leppun, Musclyp, Inazovis, Kalflux), grab the Stage 2!
      const hasPreEvoOnBoard =
        def.stage === 2 &&
        this.engine.getAllBattlefieldShumi("opponent").some((s) => s.id === def.maturesFrom);
      if (hasPreEvoOnBoard) score += 60;

      // 2. If we hold a Stage 2 in hand and need its Stage 1 pre-evolution, grab the Stage 1!
      const hasStage2InHand =
        def.stage === 1 && opp.hand.some((h) => this.cardData[h.id]?.maturesFrom === def.id);
      if (hasStage2InHand) score += 50;

      // 3. Otherwise prefer strong curve plays (Muspem, Maum, Horucan, Inagnu)
      if (def.id === "muspem" || def.id === "horucan" || def.id === "inagnu" || def.id === "maum") {
        score += 20;
      }

      return { cardNr: m.cardNr, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].cardNr;
  }

  // Called by gameLogic when AI casts Cycle Summon without a pre-specified bounce target
  chooseCycleSummonBounce(gameState, friendlyShumi) {
    if (!friendlyShumi || friendlyShumi.length === 0) return null;
    // Prefer bouncing a heavily damaged Shumi or a Shumi with a strong ETB (Caquil, Equuna)
    const sorted = [...friendlyShumi].sort((a, b) => {
      const scoreA = (a.damageMarked || 0) * 10 + (a.id === "caquil" || a.id === "equuna" ? 25 : 0);
      const scoreB = (b.damageMarked || 0) * 10 + (b.id === "caquil" || b.id === "equuna" ? 25 : 0);
      return scoreB - scoreA;
    });
    return sorted[0].cardNr;
  }

  // Called by AI when deciding X for Unleash the Wild One
  chooseUnleashX(gameState) {
    const opp = gameState.opponent;
    const maxReserve = opp.yaoReserve;
    if (maxReserve < 1) return 0;

    const handShumi = opp.hand.filter((c) => {
      const d = this.cardData[c.id];
      return d && d.type === "shumi" && (d.yaoCost || 0) <= maxReserve + 1;
    });
    if (handShumi.length === 0) return 0;

    // Pick the highest-value Shumi we can cheat into play and spend the exact X needed (YC - 1, min 1)
    handShumi.sort((a, b) => (this.cardData[b.id]?.yaoCost || 0) - (this.cardData[a.id]?.yaoCost || 0));
    const bestDef = this.cardData[handShumi[0].id];
    const neededX = Math.max(1, (bestDef.yaoCost || 1) - 1);
    return Math.min(maxReserve, neededX);
  }

  // Called by gameLogic when Cycle Summon or Unleash the Wild One puts a Shumi from hand onto the Battlefield
  chooseShumiToPutIntoPlay(gameState, eligibleHandCards) {
    if (!eligibleHandCards || eligibleHandCards.length === 0) return null;
    const scored = eligibleHandCards.map((c) => {
      const def = this.cardData[c.id];
      let score = (def?.yaoCost || 1) * 15 + (def?.health || 1) * 5;
      if (def?.id === "equuna" || def?.id === "caquil" || def?.id === "horucan") score += 25;
      return { cardNr: c.cardNr, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored[0].cardNr;
  }
}

export default function AIinstance(engine) {
  return new AI(engine, engine.cardData);
}


