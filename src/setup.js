const setup = {
   player: {
        actionDeck: [],
        yaoDeck: [],
        upperRuneZone: {id: "rune-of-the-fertile-field"},
        lowerRuneZone: {}
   },
   opponent:{
        actionDeck: ["maum", "maum", "maum", "gramaum", "gramaum", "gramaum", "sendris", "sendris", "sendris", "caquil", "caquil", "caquil", "campest", "horucan", "horucan", "supel", "supel", "supel", "leppun", "leppun", "inagnu", "inagnu", "inagnu", "inazovis", "inazovis", "equuna", "equuna", "equuna"],
        yaoDeck: ["standard-crystal"],
        upperRuneZone: {},
        lowerRuneZone: {}
   }
}

const playerActionDeckCards = ["cycle-summon","cycle-summon","cycle-summon","maum", "maum", "maum", "gramaum", "gramaum", "gramaum", "sendris", "sendris", "sendris", "caquil", "caquil", "caquil", "campest", "horucan", "horucan", "supel", "supel", "supel", "leppun", "leppun", "inagnu", "inagnu", "inagnu", "inazovis", "inazovis", "equuna", "equuna", "equuna"];
const playerYaoDeckCards = ("campestral-yao-crystal"+".campestral-yao-crystal".repeat(20)).split(".")

export default function getSetup(player){
    setup[player].actionDeck = playerActionDeckCards.map((card,idx)=>{ 
        return {id:card, cardNr: idx}
    })
    setup[player].yaoDeck = playerYaoDeckCards.map((card,idx)=>{ 
        return {id:card, cardNr: idx+playerActionDeckCards.length}
    })
    return setup[player];
}