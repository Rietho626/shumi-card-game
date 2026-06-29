import { useState,  useRef, useEffect, use } from 'react'

import HandCard from './components/displayedCards/HandCards.jsx';
import GameBoard from "./components/GameBoard.jsx";
import GameInfo from "./components/GameInfo.jsx";
import DragTarget from "./components/DragTarget.jsx"
import getSetup from "./setup.js";
import PreviewModal from "./components/PreviewModal.jsx";
import PlayScreen from "./components/PlayScreen.jsx";
import campestral from './assets/campestral/cardData.js';
import TheStack from './components/TheStack.jsx';
import GameEngine from './gameLogic.js';

//LATER: Merge campestral cards with other habitats

function Game() {

  const [version, setVersion] = useState(0);
  const engine = useRef(new GameEngine(getSetup('player'), getSetup('opponent'), ()=>{setVersion(v=>v+1)}));
  

  const state = engine.current.state;

  const [previewState, setPreviewState] = useState({});
  const [dragState, setDragState] = useState({});
  const [playCardState, setPlayCardState] = useState({});
  const [gameInfoState, setGameInfoState] = useState({});
  const [mulliganState, setMulliganState] = useState({});


  const dragZoneRef = useRef(null);
  const cancelPlayRef = useRef(null);

  const allRefs = {
    player:{
      frontline: useRef(null),
      backline: useRef(null),
      crystalZone: useRef(null),
      actionDeck: useRef(null),
      upperRuneZone: useRef(null),
      lowerRuneZone: useRef(null),
      yaoDeck: useRef(null),
      yaoReserve: useRef(null),
      spiritedAway: useRef(null),
      restingGrounds: useRef(null),
      yaoReserve: useRef(null),
      hand: useRef(null),
      player: useRef(null),
      handCards: useRef({}),
      restingGroundsCards: useRef({}),
      spiritedAwayCards: useRef({}),
      frontlineCards: useRef({}),
      backlineCards: useRef({}),
      crystalZoneCards: useRef({})
    },
    opponent:{
      frontline: useRef(null),
      backline: useRef(null),
      crystalZone: useRef(null),
      actionDeck: useRef(null),
      upperRuneZone: useRef(null),
      lowerRuneZone: useRef(null),
      yaoDeck: useRef(null),
      yaoReserve: useRef(null),
      spiritedAway: useRef(null),
      restingGrounds: useRef(null),
      yaoReserve: useRef(null),
      hand: useRef(null),
      player: useRef(null),
      handCards: useRef({}),
      restingGroundsCards: useRef({}),
      spiritedAwayCards: useRef({}),
      frontlineCards: useRef({}),
      backlineCards: useRef({}),
      crystalZoneCards: useRef({})
    }
  }

  useEffect(()=>{
    const triggers = [];
    triggers.push({
      name: "drawDecision",
      callback: ()=>{
        setGameInfoState({msg: "Choose where to draw from", action: "draw"});
        engine.current.assignPriority("");
      }
    })
    triggers.push({
      name: "resetGameInfo",
      callback: ()=>{
        setGameInfoState({});
      }
    })
    triggers.push({
      name: "drawPhaseDrawDecision",
      callback: ()=>{
        setGameInfoState({msg: "Choose where to draw from", action: "drawPhaseDraw"});
        engine.current.assignPriority("");
      }
    })
    triggers.push({
      name: "drawHand",
      callback: (isStartingPlayer)=>{
        setGameInfoState({msg: "Choose where to draw from", action: "drawHand", drawn: 0, max: isStartingPlayer ? 6 : 7});
      }
    })
    triggers.push({
      name: "mulligan",
      callback: ()=>{
        setGameInfoState({msg: "Choose cards to redraw", action: "mulligan"});
        setMulliganState({cards: []});
      }
    })
     triggers.push({
      name: "waitForAI",
      callback: (waitingFor)=>{
        setGameInfoState({msg: `Waiting for Opponent to ${waitingFor.waitingFor}`, action: "wait"});
      }
    })
    engine.current.enableTriggers(triggers)
    if(!state.gameInfo.started){
      state.gameInfo.started = true;
      engine.current.startGame();
    }
  }, [])

  const transcriptMap = new Map([
    ["friendly_frontline", "Frontline"],
    ["friendly_backline", "Backline"],
    ["friendly_battlefield", "Battlefield"],
    ["friendly_crystalZone", "Crystal Zone"]
  ])

  function getTargetRef(key){
    switch(key){
      case "friendly_frontline":
        return [allRefs.player.frontline.current];
      case "friendly_backline": 
        return [allRefs.player.backline.current];
      case "friendly_crystalZone":
        return [allRefs.player.crystalZone.current];
      case "friendly_battlefield":
        return [allRefs.player.frontline.current, allRefs.player.backline.current, allRefs.player.crystalZone];
      case "friend":
        return [
          Object.values(allRefs.player.frontlineCards.current),
          Object.values(allRefs.player.backlineCards.current),
          allRefs.player.player.current
        ];
      case "friendly_shumi":
        return [
          Object.values(allRefs.player.frontlineCards.current),
          Object.values(allRefs.player.backlineCards.current),
        ];
      case "enemy_frontline":
        return [allRefs.opponent.frontline.current];
      case "enemy_backline": 
        return [allRefs.opponent.backline.current];
      case "enemy_crystalZone":
        return [allRefs.opponent.crystalZone];
      case "enemy_battlefield":
        return [allRefs.opponent.frontline.current, allRefs.opponent.backline.current, allRefs.opponent.crystalZone];
      case "enemy":
        return [
          Object.values(allRefs.opponent.frontlineCards.current),
          Object.values(allRefs.opponent.backlineCards.current),
          allRefs.opponent.player.current
        ];
      case "enemy_shumi":
        return [
          Object.values(allRefs.opponent.frontlineCards.current),
          Object.values(allRefs.opponent.backlineCards.current),
        ];
      default:
        return [];
    }
  }

  function getTranscribedTarget(name){
    return transcriptMap.get(name);
  }
  //START MULLIGAN LOGIC

  useEffect(()=>{
    if(!mulliganState.cards) return;
    mulliganState.cards.forEach(card=>{
      card.ref.classList.add('mulligan');
    })

  }, [mulliganState.cards])

  //START DRAG TO PLAY LOGIC

  function isInsideRect(posX,posY,rect){
    const { x, y, width, height} = rect;
    return (
      posY > y &&
      posX > x &&
      posX < x + width &&
      posY < y + height
    )
  }

  function handleStartDrag(card, cardRef, e){
  cardRef.style.visibility = 'hidden';

    setDragState({
      x: e.clientX-100,
      y: e.clientY-139,
      card: card,
      active: true,
      cardElement: cardRef
    });      
  }

  //old logic, maybe refractor if necessary

  useEffect(()=>{
    if(!dragState.active) return;

    function handleDrag(e){
      setDragState(prev=>({
          ...prev,
          x: e.clientX-100,
          y: e.clientY-139,
      }))
    }

    function handleCeaseDrag(e){
      dragState.cardElement.style.visibility = 'visible';
      const dragZoneRect = dragZoneRef.current.getBoundingClientRect();
      if(isInsideRect(e.clientX, e.clientY, dragZoneRect)){
            initiatePlay(dragState.card, dragState.cardElement, 'player');
        }
      setDragState({});
  }


    const dragListener = window.addEventListener("mousemove", handleDrag);
    const ceaseDragListener = window.addEventListener("mouseup", handleCeaseDrag);

    return ()=>{
        window.removeEventListener("mousemove", handleDrag);
        window.removeEventListener("mouseup", handleCeaseDrag);
    }
    
  }, [dragState.active])

  //START ON PLAY CARD LOGIC


  useEffect(()=>{
    if(!playCardState.card) return;

    //merge campestral blah blubb
    setGameInfoState({msg: engine.current.getPlayText(campestral[playCardState.card.id]), action: "play"});

    const legalTargets = engine.current.getLegalTargetsOnPlay('player', campestral[playCardState.card.id]);
    const legalTargetRefs = [];

    function putOnStack(lt){

      if(campestral[playCardState.card.id].type === "crystal"){
        engine.current.playCrystal('player', playCardState.card, lt);
      }else{
        engine.current.putPlayedCardOnStack('player', playCardState.card, lt);
      }
      setVersion(v=>v+1);
      //stack();
      setGameInfoState({});
      setPlayCardState({});
    }

    function cancelPlay(){
      playCardState.cardRef.classList.remove('currently-playing-card')
      setGameInfoState({});
      setPlayCardState({});
    }

    if(!legalTargets){
      window.alert("No legal targets!")
      setPlayCardState({});
      return;
    }
    if(legalTargets === "no-targets"){
      stackCard(card, player);
      setPlayCardState({});
      return;
    }
    legalTargets.forEach(lt=>{
      getTargetRef(lt).forEach(reference=>{
        const targetCb = () => putOnStack(lt);
        legalTargetRefs.push({reference, targetCb});
        reference.addEventListener("click", targetCb);
        reference.classList.remove('non-targetable');
        reference.classList.add('legal-target');
      })
    })
    
    cancelPlayRef.current.classList.remove('hidden');
    cancelPlayRef.current.addEventListener("click", cancelPlay);

    playCardState.cardRef.classList.add('currently-playing-card')

    return ()=>{
      legalTargetRefs.forEach(ltr=>{
        ltr.reference.removeEventListener("click", ltr.targetCb);
        ltr.reference.classList.remove('legal-target');
      })
      if(cancelPlayRef.current){
        cancelPlayRef.current.removeEventListener("click", cancelPlay);
        cancelPlayRef.current.classList.remove('hidden');
      }
    }

  }, [playCardState.card])


  function initiatePlay(card, cardRef, player){
    setPlayCardState({
      card: card,
      cardRef: cardRef,
      player: player 
    });
  }

  function stack(){
    const stack = state.gameInfo.theStack;
    const lastActor = stack[stack.length-1].player;
    const prio = lastActor === "player" ? "opponent" : "player";
    engine.current.assignPriority(prio);
  }





  return (
    <>
      <div id="game">
        <GameBoard
          allRefs={allRefs}
          setPreviewState={setPreviewState}
          dragLogic={{dragState, setDragState}}
          playCardLogic={{ cancelPlayRef, playCardState }}
          player={'opponent'}
          engine={engine}
          setVersion={setVersion}
          mulligan={{mulliganState, setMulliganState}}
        />
        <GameInfo
          allRefs={allRefs}
          cancelPlayRef={cancelPlayRef}
          playCardState={playCardState}
          gameInfoState={gameInfoState}
          engine={engine}
          setVersion={setVersion}
          setGameInfoState={setGameInfoState}
          mulligan={{mulliganState, setMulliganState}}
        />
        <GameBoard
          allRefs={allRefs}
          setPreviewState={setPreviewState}
          dragLogic={{dragState, setDragState, handleStartDrag }}
          playCardLogic={{ cancelPlayRef, playCardState }}
          player={'player'}
          engine={engine}
          setVersion={setVersion}
          mulligan={{mulliganState, setMulliganState}}
        />
        <PreviewModal
          previewState={previewState}
          engine={engine}
          setVersion={setVersion}
        />
        {
          dragState.card && 
          <HandCard
            allRefs={allRefs}
            player={'player'}
            setPreviewState={setPreviewState}
            dragLogic={{dragState, setDragState, handleStartDrag }}
            playCardLogic={{ cancelPlayRef, playCardState }}
            card={dragState.card}
            idx={'dragged'}
            engine={engine}
            setVersion={setVersion}
            checkTargetable={()=>false}
          />
        }
        {
          dragState.card &&
          <DragTarget 
            dragZoneRef={dragZoneRef}
            engine={engine}
            setVersion={setVersion}
          />
        }
        {
          Boolean(state.gameInfo.theStack.length) &&
          <TheStack
            setPreviewState={setPreviewState}
            getTranscribedTarget={getTranscribedTarget}
            engine={engine}
            setVersion={setVersion}
          />
        }
      </div>
    </>
  )
}

export default Game
