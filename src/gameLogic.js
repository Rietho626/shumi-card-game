import { getCardData } from "./assets/campestral/cardData.js";
import AIinstance from "./versusAi.js";


export default class GameEngine{
    constructor(playerSetup, opponentSetup, rerender){
        this.rerender = rerender;
        this.cardData = getCardData();
        this.ai = AIinstance();
        this.triggers = {};
        this.gameState = {
            player: {
                actionDeck: this.shuffleDeck(playerSetup.actionDeck),
                yaoDeck: this.shuffleDeck(playerSetup.yaoDeck),
                hand: [],
                restingGrounds: [],
                spiritedAway: [],
                frontline: [],
                backline: [],
                crystalZone: [],
                yaoReserve: 0,
                upperRuneZone: playerSetup.upperRuneZone,
                lowerRuneZone: playerSetup.lowerRuneZone,
                hp: 30,
                hasPlayedCrystal: false,
                drawing: false

            },
            opponent:{
                actionDeck: this.shuffleDeck(opponentSetup.actionDeck),
                yaoDeck: this.shuffleDeck(opponentSetup.yaoDeck),
                hand: [],
                restingGrounds: [],
                spiritedAway: [],
                frontline: [],
                backline: [],
                crystalZone: [],
                yaoReserve: 0,
                upperRuneZone: opponentSetup.upperRuneZone,
                lowerRuneZone: opponentSetup.lowerRuneZone,
                hp: 30,
                hasPlayedCrystal: false,
                drawing: false

            },
            gameInfo:{
                started: false,
                turn: 0,
                playingCard: null,
                theStack: [], // {player: player, card: {}}
                activePlayer: null,
                startingPlayer: null,
                priority: {
                    player: "", 
                    passed:{
                        player: false,
                        opponent: false
                    }, 
                    passedPhase:{
                        player: false,
                        opponent: false,
                    },
                    passedTurn:{
                        player: false,
                        opponent: false
                    }    
                }, //player, opponent
                phase: "preGame", //  //yaoPhase // drawPhase // actionPhase // endPhase
                playable: {
                    player: [],
                    opponent: []
                }
            }
        }
    }

    update(){
        this.rerender();
    }

    get state(){
        return this.gameState;
    }

    get plAc(){
        return this.gameState.gameInfo.activePlayer === "player";
    }

    enableTriggers(triggers){
        triggers.forEach(trigger=>{
            this.triggers[trigger.name] = [];
            this.triggers[trigger.name].push(trigger.callback);
        })
    }

    triggerTrigger(trigger, payload){
        this.triggers[trigger]?.forEach(callback=>{
            callback(payload);
        });
    }

    shuffleDeck(passedDeck){
        //if this causes perfomance issues, replace with method not using shift
        const shuffled = [];
        const deck = [...passedDeck];
        while(deck.length > 0){
            const rndNum = Math.floor(Math.random()*deck.length);
            let rndCard = deck[rndNum];
            let firstCard = deck[0];
            deck[rndNum] = firstCard;
            deck[0] = rndCard;
            shuffled.push(deck.shift());
        }
        return shuffled;
    }

    drawCard(player, deckType){
        if(this.gameState[player][deckType].length > 0){
            const firstCard = this.gameState[player][deckType][0];
            this.gameState[player][deckType] = this.gameState[player][deckType].slice(1);
            this.gameState[player].hand = [...this.gameState[player].hand, firstCard];
        }
    }

    checkCanPlay(player, cardObj){
        return (this.gameState.gameInfo.priority.player === player
             && this.gameState.gameInfo.playable[player].includes(cardObj.speed)
             && (this.gameState[player].yaoReserve >= cardObj.yaoCost || cardObj.type === "crystal")
             && this.getLegalTargetsOnPlay(player, cardObj))
             && (cardObj.type !== "crystal" || !this.gameState[player].hasPlayedCrystal);
    }

    checkCanActivateAbilites(player, card){
        const cardObj = this.cardData[card.id];
        const abi = [];
        let canPlay = [];
        if(!cardObj.abilities?.length){
            if(cardObj.type !== "power-rune"){
                return [];
            }else{
                const runeAbilityType = getRuneType(player, cardObj) + "ability";
                cardObj[runeAbilityType].forEach(a=>{
                    if(a.trigger.type === "activated"){
                        abi.push(a);
                    }
                })
            }
        }else{
            cardObj.abilities.forEach(a=>{
                if(a.trigger.type === "activated"){
                    abi.push(a);
                }
            })
        }
        abi.forEach(a=>{
            if(this.checkWhere(card).includes(a.where) 
                && this.areActivationConditionsMet(player, card) 
                && a.cost.every(c=>this.isCostPayable(player, card, c))
                && this.gameState.gameInfo.playable[player].includes(a.speed)
            ){
                canPlay.push(a);
            }
        })
        return canPlay;
    }

    checkCanUseAttack(player, card){
        const cardObj = this.cardData[card.id];
        //get attacks and verify usability
    }

    checkWhere(card){
        //this needs to be a check, once the battlefield shumi objects are up to date
        return ["battlefield", "frontline", "backline", "crystalZone", "hand", "restingGrounds", "spiritedAway"];
    }
       
    

    getRuneType(player, cardObj){
        const upperRune = this.cardData[this.gameState[player].upperRuneZone?.id];
        const lowerRune = this.cardData[this.gameState[player].lowerRuneZone?.id];
        if(upperRune === cardObj && lowerRune){
            return "upper";
        }else if(lowerRune === cardObj){
            return "lower";
        }else if(upperRune === cardObj && !lowerRune){
            return "combined";
        }else{
            console.log("Wrong Rune Detected!");
            return undefined;
        }
    }


    getTargetsOnPlay(player, card){
        const targets = [];
        if(card.type === "shumi"){
            targets.push('friendly_frontline');
            targets.push('friendly_backline')
        }else if(card.type === "crystal"){
            targets.push('friendly_crystalZone');
        }else if(card.type === "quickspell" || card.type === "spell" || card.type === "interception"){
            if(card.target){
                targets.push(card.target)
            }else{
                targets.push('no-target')
            }
        }
        return targets;
    }


    checkPlayTargetLegality(player, card, target){
        switch(target){
            case "friendly_frontline":
                if(card.type === "shumi"){
                    return this.gameState[player]['frontline'].length < 5
                }else{
                    return this.arePlayConditionsMet();
                }
            case "friendly_backline": 
                if(card.type === "shumi"){
                    return this.gameState[player]['backline'].length < 5
                }else{
                    return this.arePlayConditionsMet();
                }
            case "friendly_crystalZone":
                if(card.type === "crystal"){
                    return true;
                }
        }
    }

    getLegalTargetsOnPlay(player, card){
        const targets = this.getTargetsOnPlay(player, card);
        const legalTargets = [];
        if(targets.includes('no-target')){
            return "no-targets";
        }
        if(!targets.length){
            return false;
        }
        targets.forEach(t=>{
            if(this.checkPlayTargetLegality(player, card, t)) legalTargets.push(t)
        })
        return legalTargets;
    }

    arePlayConditionsMet(player, card, target){
     return true;
    }

    areActivationConditionsMet(player, card){
        return true;
    }

    isCostPayable(player, card, cost){
        const cardObj = this.cardData[card.id];
        if(cost.yao){
            if(cost.yao === "x"){
                if(!cost.minX) return true;
                return cost.minX <= this.gameState[player].yaoReserve
            }else{
                return cost.yao <= this.gameState[player].yaoReserve
            }
        }else if(cost.storedYao){
            const stored = cost.stored === "this" ? card.storedYao : this.getBattlefieldStats("storedYao", card.stored);
            if(cost.storedYao === "x"){
                if(!cost.minX) return true;
                return cost.minX <= stored;
            }else{
                return cost.storedYao <= stored;
            }
        }
        //add future activation costs
    }

    getPlayText(card){
      return card.type === "shumi" || card.type === "crystal" ? `Choose lane for ${card.name}!` : `Choose targets for ${card.name}!`
    }

    changeLife(player, amount){
        this.gameState[player].hp  += Number(amount);
    }

    putPlayedCardOnStack(player, card, lt){
        this.gameState[player]['hand'] = this.gameState[player]['hand'].filter(handCard=>handCard.cardNr !== card.cardNr);
        this.gameState[player]['yaoReserve'] -= this.cardData[card.id].yaoCost;
        this.gameState.gameInfo.theStack =  [...this.gameState.gameInfo.theStack, {card:{...card}, player: player, target: lt}];
        this.handleGivePrio(player);
    }

    addYao(player, amount){
        this.gameState[player].yaoReserve += Number(amount);
    }

    assignPriority(player){
        this.setPlayable();
        this.gameState.gameInfo.priority.player = player;
    }

    assignActivePlayer(player){
         this.gameState.gameInfo.activePlayer = player;
    }

    confirmPlayable(player){
        const playable = ["i"];
        if(this.gameState.gameInfo.activePlayer === player
            && !this.gameState.gameInfo.theStack.length
            && this.gameState.gameInfo.phase === "actionPhase")  playable.push("s");
        if(!this.gameState.gameInfo.theStack.length) playable.push("q");
        return playable;
    }
    
    setPlayable(){
        this.gameState.gameInfo.playable.player = this.confirmPlayable('player');
        this.gameState.gameInfo.playable.opponent = this.confirmPlayable('opponent');
    }

    updateTurn(){
        this.resetCrystalPlayed('player');
        this.resetCrystalPlayed('opponent');
        if(this.gameState.gameInfo.activePlayer !== this.gameState.gameInfo.startingPlayer) this.gameState.gameInfo.turn++;
        this.gameState.gameInfo.activePlayer = this.gameState.gameInfo.activePlayer === "player" ? "opponent" : "player";
        this.gameState[this.gameState.gameInfo.activePlayer].yaoReserve = 0;
        console.log(this.gameState)
    }

    resetCrystalPlayed(player){
        this.gameState[player].hasPlayedCrystal = false;
    }

    async startGame(){
        this.playStartingCrystals();
        this.gameState.gameInfo.startingPlayer = this.determineStartingPlayer();
        if(this.gameState.gameInfo.startingPlayer === 'player'){
            this.triggerTrigger('drawHand', (this.gameState.gameInfo.startingPlayer === 'player'))
        }else{
            await this.AI_interpreter(this.ai.drawInitialHand(this.gameState))
            this.triggerTrigger('drawHand', (this.gameState.gameInfo.startingPlayer === 'player'))
        }
    }

    playStartingCrystals(){
        const playerCrystal = this.gameState.player.yaoDeck.shift();
        const opponentCrystal = this.gameState.opponent.yaoDeck.shift();
        this.playCrystalNonRegular('player', playerCrystal, 'friendly_crystalZone');
        this.playCrystalNonRegular('opponent', opponentCrystal, 'enemy_crystalZone');

    }

    async startMulligan(){
        if(this.gameState.gameInfo.startingPlayer === 'player'){
            await this.AI_interpreter(this.ai.drawInitialHand(this.gameState))
        }else{
            await this.AI_interpreter(this.ai.mulligan(this.gameState));
        }
        this.triggerTrigger('mulligan');
    }

    async enactMulligan(unwantedCards, player = 'player'){
        const redraws = []

        const reshuffleCards = unwantedCards.map((card)=>{
           return {
                id: card.id,
                cardNr: card.cardNr
            }
         })
        while(reshuffleCards.length){
            const currentReshuffle = reshuffleCards[reshuffleCards.length-1];
            const deck = this.cardData[currentReshuffle.id].type !== "crystal" ? "actionDeck" : "yaoDeck";
            this.gameState[player].hand = this.gameState[player].hand.filter(c=>c.cardNr !== currentReshuffle.cardNr);
            this.gameState[player][deck].push(reshuffleCards.pop());
            redraws.push(deck);
        }
        this.gameState[player].yaoDeck = this.shuffleDeck(this.gameState[player].yaoDeck);
        this.gameState[player].actionDeck = this.shuffleDeck(this.gameState[player].actionDeck); 
        for(let d of redraws){
            await this.delay(1000);
            this.drawCard(player, d);
            this.update();
        }
        if(player === 'player'){
            if(this.gameState.gameInfo.startingPlayer === 'player'){
                await this.AI_interpreter(this.ai.mulligan(this.gameState));
                this.startFirstTurn();
            }else{
                this.startFirstTurn();
            }
        }
    }

    startFirstTurn(){
        this.assignPriority(this.gameState.gameInfo.startingPlayer);
        this.assignActivePlayer(this.gameState.gameInfo.startingPlayer);
        this.processPhase();
    }
    async processPhase(){
        const phases = ["yaoPhase", "drawPhase", "actionPhase", "endPhase"];
        let newPhase = "";
        if(this.gameState.gameInfo.phase === "preGame"){
            newPhase = phases[0];
            this.gameState.gameInfo.phase = newPhase;
            this.gameState.gameInfo.turn++;
        }else if(this.gameState.gameInfo.phase === "endPhase"){
            newPhase = phases[0];
            this.gameState.gameInfo.phase = newPhase;
            this.updateTurn();
        }else{
            newPhase = phases[phases.indexOf(this.gameState.gameInfo.phase)+1];
            this.gameState.gameInfo.phase = newPhase;
        }
        this.assignPriority(this.gameState.gameInfo.activePlayer);
        this.pass('player', 'passed', false);
        this.pass('opponent', 'passed', false);
        this.pass('player', 'passedPhase', false);
        this.pass('opponent', 'passedPhase', false);
        this.initiateNewPhase(newPhase);
        this.update();
       
    }

    initiateNewPhase(newPhase){
        
        switch(newPhase){
            case "yaoPhase":
                this.yaoPhase(this.gameState.gameInfo.activePlayer);
            break;
            case "drawPhase":
                this.drawPhase();
            break;
            case "endPhase":
                this.endPhase();
            break;
            case "actionPhase":
                this.actionPhase();
            break;
        }
    }

    pass(player, mode, bool){
        //mode must be "passed" / "passedPhase" / "passedTurn"
        this.gameState.gameInfo.priority[mode][player] = bool;
    }

    async handlePassPrio(player){
        this.pass(player, 'passed', true);
        if(!this.checkForAllPassed()){
            const newPrioritizer = player === "player" ? "opponent" : "player"
            this.assignPriority(newPrioritizer);
            this.update();
            this.passIfNoPlay(newPrioritizer);
        }else{
            if(this.isStack()){
                this.resolveStackLayer();
                
            }else{
                this.processPhase();
            }
        }
    }

    async handleGivePrio(player){
        if(!this.checkForAllPassed()){
            const newPrioritizer = player === "player" ? "opponent" : "player"
            this.assignPriority(newPrioritizer);
            this.update();
            this.passIfNoPlay(newPrioritizer);
        }else{
            //await input
        }
    }

    checkForAllPassed(){
        let hasPlayerPassed = false;
        let hasOpponentPassed = false;
        const passPossibilities = ['passed', 'passedPhase', 'passedTurn']

        passPossibilities.forEach(p=>{
            if(this.gameState.gameInfo.priority[p]['player']) hasPlayerPassed = true;
            if(this.gameState.gameInfo.priority[p]['opponent']) hasOpponentPassed = true;
        })

        return hasOpponentPassed && hasPlayerPassed;
    }

    isStack(){
        return Boolean(this.gameState.gameInfo.theStack.length);
    }

    getAllEffects(player, mode){
        //mode can be trigger, activated, continuous
        const effectCards = [...this.gameState[player].frontline, ...this.gameState[player].backline, ...this.gameState[player].crystalZone, ...this.gameState[player].restingGrounds, ...this.gameState[player].spiritedAway];
        const upperRuneZone = this.gameState[player].upperRuneZone;
        const lowerRuneZone = this.gameState[player].lowerRuneZone ?? "";
        //think about it
    }

    checkIfPlayAvailable(player){
        const playableHandCards = [];
        let activatableEffects = [];
        const effectCards = [...this.gameState[player].frontline, ...this.gameState[player].backline, ...this.gameState[player].crystalZone, ...this.gameState[player].restingGrounds, ...this.gameState[player].spiritedAway];
        this.gameState[player].hand.forEach(card=>{
            if(this.checkCanPlay(player, this.cardData[card.id])) playableHandCards.push(card);
            activatableEffects = [...activatableEffects, ...this.checkCanActivateAbilites(player, card)];
        })

        effectCards.forEach(card=>{
            activatableEffects = [...activatableEffects, ...this.checkCanActivateAbilites(player, card)];
        })
        return Boolean(playableHandCards.length) || Boolean(activatableEffects.length);
    }


    resolveStackLayer(){
        const lastOnStack = this.gameState.gameInfo.theStack[this.gameState.gameInfo.theStack.length-1];
        this.gameState.gameInfo.theStack.pop();
        const target = lastOnStack.target;
        const player = lastOnStack.player;
        if(lastOnStack.card){
            if(this.cardData[lastOnStack.card.id].type === "shumi"){
                this.resolveShumi(target, player, lastOnStack.card);
                this.update();
            }
        }

        if(!this.gameState.gameInfo.theStack.length){
            console.log(this.gameState.gameInfo.priority);
            this.checkForAIResponse();
        }
    }

    resolveShumi(target, player, card){
        const where = target.includes('frontline') ? 'frontline' : 'backline';
        this.gameState[player][where].push(
            {
                ...card,
                currentHp: this.cardData[card.id].health,
                momentum: false,
                where: where
            });
    }
    
    playCrystal(player, cardObj, target){
        this.gameState[player]['hand'] = this.gameState[player]['hand'].filter(handCard=>handCard.cardNr !== cardObj.cardNr);
        this.gameState[player].crystalZone.push(cardObj);
        this.gameState[player].hasPlayedCrystal = true;
    }

    playCrystalNonRegular(player, cardObj, target){
        this.gameState[player]['hand'] = this.gameState[player]['hand'].filter(handCard=>handCard.cardNr !== cardObj.cardNr);
        this.gameState[player].crystalZone.push(cardObj);
    }

    delay(time){
        return new Promise(resolve=>{
            setTimeout(resolve, time);
        })
    }

    checkForTrigger(){

    }

    checkCanAttack(player){
        let canAttack = false;
        [...this.gameState[player].frontline, ...this.gameState[player].backline].forEach(card=>{
            if(card.momentum) canAttack = true;
        })
        console.log(canAttack);
        return canAttack;
    }

    determineStartingPlayer(){
        return Math.floor(Math.random()*2) === 1 ? "player" : "opponent";
    }

    async yaoPhase(player){
        let crystalCount = 0;
        this.gameState[player].crystalZone.forEach(card=>{
            if(this.cardData[card.id].crystalDefaultEffect){
                crystalCount++;
            }
        })
        this.gameState[player].yaoReserve += crystalCount;
        this.restoreMomentum(player);
        await this.passIfNoPlay(player);
    }

    
    restoreMomentum(player){
         this.gameState[player].frontline.forEach(card=>{
            card.momentum = true;
        })
        this.gameState[player].backline.forEach(card=>{
            card.momentum = true;
        })
    }

    async drawPhase(){
        if(this.plAc){
            this.triggerTrigger('drawPhaseDrawDecision');
        }else{
           await this.AI_interpreter(this.ai.drawPhaseDraw(this.gameState));
        }
    }

    endPhase(){
        this.passIfNoPlay(this.gameState.gameInfo.activePlayer);
    }

    async checkForAIResponse(){
        if(this.gameState.gameInfo.priority.player === "opponent"){
            if(this.gameState.gameInfo.phase === "actionPhase" && this.gameState.gameInfo.activePlayer === "opponent"){
                if(await this.passIfNoPlayOrAttack('opponent')){
                    return;
                }else{
                    await this.AI_interpreter(this.ai.getPlay(this.gameState));
                }
            }else{
                if(await this.passIfNoPlay('opponent')){
                    return;
                }else{
                    await this.AI_interpreter(this.ai.getPlay(this.gameState));
                }
            }
        }
    }

    async actionPhase(){
        if(this.gameState.gameInfo.activePlayer === 'opponent'){
            this.checkForAIResponse();
        }else{
            console.log(this.checkIfPlayAvailable('player'));
        }
    }

    drawPhaseDraw(deck){
        this.drawCard(this.gameState.gameInfo.activePlayer, deck);
        this.assignPriority(this.gameState.gameInfo.activePlayer);
        this.passIfNoPlay(this.gameState.gameInfo.activePlayer)
    }

    async passIfNoPlay(player){
            if(!this.checkIfPlayAvailable(player)){
            await this.delay(1800);
            this.handlePassPrio(player);
            return;
        }
    }

    async passIfNoPlayOrAttack(player){
            if(!this.checkIfPlayAvailable(player) && !this.checkCanAttack(player)){
            console.log("in pass if no play", this.checkCanAttack(player))
            await this.delay(1800);
            this.handlePassPrio(player);
            return true;
        }
    }


    async drawMany(player, deck, num, delay = false){
        for(let i = 0; i < num; i++){
            this.drawCard(player, deck);
            if(delay){
                await this.delay(delay);
                this.update();
            }
        }
    }

    checkBattlefieldStats(stat, fields){
        return 4;
    }

    //Attacking Logic

    canAttack(player, card){
        if(this.gameState.gameInfo.phase === "actionPhase" 
            && this.gameState.gameInfo.activePlayer === player
            && this.gameState.gameInfo.playable[player].includes("s")
            && this.gameState.gameInfo.priority.player === player
            && card.momentum === true
        ){
            const cardObj = this.cardData[card.id];
            if(cardObj.range === "m"){
                if(card.where!== "frontline"){
                    return {canAttack: false, reason: "m_shumi_on_backline"};
                }else{
                    return {canAttack: true} // in the future replace this with a check of legal targets 
                }
            }else if(cardObj.range === "r"){
                return {canAttack: true};
            }
        }else{
            return {canAttack: false, reason: "basic_condition_not_fulfilled"}
        }
    }

    checkAttacks(player, card){
        if(!this.canAttack(player, card).canAttack) return [];
         
    }

    //AI

    async AI_interpreter(AI_Response){
        switch(AI_Response.action){
            case "drawInitialHand":
                this.triggerTrigger('waitForAI', {waitingFor: "draw Starting Hand"});
                await this.drawMany('opponent', 'actionDeck', AI_Response.actionDeck, 500);
                await this.drawMany('opponent', 'yaoDeck', AI_Response.yaoDeck, 500);
            break;
            case "mulligan":
                this.triggerTrigger('waitForAI', {waitingFor: "mulligan"});
                await this.delay(1500);
                this.update();
                await this.enactMulligan(AI_Response.mullingCards, 'opponent')
                this.triggerTrigger('resetGameInfo');
            break;
            case "drawPhaseDraw":
                this.triggerTrigger('waitForAI', {waitingFor: "draw"});
                this.update();
                await this.delay(1000);
                this.drawPhaseDraw(AI_Response.deck);
                this.triggerTrigger('resetGameInfo');
            break;
            case "playCrystal":
                await this.delay(1000);
                this.playCrystal('opponent', AI_Response.card, 'enemy_crystalZone');
                await this.delay(1000);
                this.actionPhase();
            break;
            case "playShumi":
                this.putPlayedCardOnStack('opponent', AI_Response.card, AI_Response.target);
            break;
            case undefined:
                this.handlePassPrio('opponent');
                console.log('something did NOT line up!');
            break;
        }
    }


}