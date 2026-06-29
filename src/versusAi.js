import campestral from "./assets/campestral/cardData.js";

export default function AIinstance(){
    return new AI();
}

class AI{

    constructor(){
        this.cardData = campestral;
    }

    drawInitialHand(state){
        if(state.gameInfo.startingPlayer === 'opponent'){
            return {action: "drawInitialHand", actionDeck: 4, yaoDeck: 2}
        }else{
            return {action: "drawInitialHand", actionDeck: 5, yaoDeck: 2}
        }
    }

    mulligan(state){
        let mullingCards = [];
        let costs = [];
        const hand = state.opponent.hand;
        hand.forEach(card=>{
            if(this.cardData[card.id].type !== "crystal" && this.cardData[card.id].yaoCost){
                costs.push({...card, cost: this.cardData[card.id].yaoCost});
            }
        })
        costs.sort((a, b)=>{
           return b.cost - a.cost;
        })
        console.log(costs)
        for(let i = 0; i < 3; i++){
            if(costs.length){
                if(costs[i].cost > 3 || !costs.some(el=>el.cost < 3)){
                    const shipcard = costs[i];
                    delete shipcard.cost;
                    mullingCards = [...mullingCards, shipcard];
                }
            }
        }
        return {action: "mulligan", mullingCards: mullingCards};
    }

    hasInHand(state, type){
        return state.opponent.hand.some(card=>this.cardData[card.id].type === type);
    }

    hasOtherThanInHand(state, type){
        return state.opponent.hand.some(card=>this.cardData[card.id].type !== type);
    }

    checkGameState(state){

        const hasCardsMoreExpensiveThanCurrentCrystals = state.opponent.hand.some(card=>this.cardData[card.id].cost >= state.opponent.crystalZone.length);

        return {
            hasShumiInHand: this.hasInHand(state, 'shumi'),
            hasCrystalInHand : this.hasInHand(state, 'crystal'),
            hasSpellInHand : this.hasInHand(state, 'spell'),
            hasQuickcastInHand : this.hasInHand(state, 'quickcast'),
            hasInterceptionInHand : this.hasInHand(state, 'interception'),
            hasCardsInHand : Boolean(state.opponent.hand.length),
            hasCardsMoreExpensive : hasCardsMoreExpensiveThanCurrentCrystals,
            hasNonCrystalsInHand : this.hasOtherThanInHand(state, 'crystal')
        }


    }

    drawPhaseDraw(state){
        const decision = {action: "drawPhaseDraw", deck: ""};
        const gameAnalysis = this.checkGameState(state);
        if(!gameAnalysis.hasCardsInHand){
            decision.deck = state.opponent.crystalZone.length > 2 ? "actionDeck" : "yaoDeck";
        }else{
            if(!gameAnalysis.hasCrystalInHand){
                decision.deck = (!gameAnalysis.hasCardsMoreExpensive && state.opponent.crystalZone.length > 2 ) ? "actionDeck" : "yaoDeck";
            }else{
                decision.deck = "actionDeck";
            }
        }
        return decision;
    }

    getPlay(state){
        switch(state.gameInfo.phase){
            case "actionPhase":
                const crystal = this.checkCrystalPlayability(state);
                if(crystal) return {action: "playCrystal", card: crystal};
                const shumi = this.checkShumiPlayability(state);
                if(shumi.length) return {action: "playShumi", card: shumi[0], target: this.getTargetForShumi(state, shumi[0])};
            break;
            default: 
                return {};
            break;
        }
        return {};
    }

    checkCrystalPlayability(state){
        if(!state.opponent.hasPlayedCrystal){
            const crystal = state.opponent.hand.find(card=>this.cardData[card.id].type === "crystal");
            return crystal;
        }else{
            return false;
        }
    }

    checkShumiPlayability(state){
        const playableShumi = state.opponent.hand.filter(card=>{
            return this.cardData[card.id].type === "shumi" && this.cardData[card.id].yaoCost <= state.opponent.yaoReserve;
        });
        if(state.opponent.frontline.length < 5 || state.opponent.backline.length < 5){
            return playableShumi.sort((a,b)=>b.cost - a.cost);
        }else{
            return [];
        }
        
        
    }

    getTargetForShumi(state, card){
        const range = this.cardData[card.id].range;
        if(range === "r"){
            return state.opponent.backline.length < 5 ? "enemy_backline" : "enemy_frontline";
        }else if(range === "m"){
            return state.opponent.backline.length < 5 ? "enemy_frontline" : "enemy_backline";
        }
    }

}