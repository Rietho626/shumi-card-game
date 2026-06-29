import { useState, useRef, useEffect } from 'react';

function Deck({ gameState, player, deckType, setGameState, playCardLogic, allRefs, engine, setVersion, checkTargetable }){

    const state = engine.current.state;

    const [statusDisplay, setStatusDisplay] = useState({});

    const deckStyles = {
        width: "clamp(80px, 12vw, 180px)",
        aspectRatio: "2 / 3",
        //border: "1px solid black",
        margin: "10px",
        borderRadius: "9px"
    }

    const statusStyles = {
        position: "absolute",
        backgroundColor: "black",
        color: "white",
        alignItems: "center",
        justifyContent: "center",
        display: statusDisplay.top ? "flex" : "none",
        top: statusDisplay.top ?? "auto",
        left: statusDisplay.left ?? "auto"
    }


    function handleShowStatus(e){
        const rect = e.currentTarget.getBoundingClientRect();
        setStatusDisplay({
            top: rect.top,
            left: rect.left
        });
    }

    function handleHideStatus(e){
        setStatusDisplay({})
    }

    return(
        <div id={player+deckType} 
         ref={allRefs[player][deckType]}
         className={`${checkTargetable() ? "non-targetable" : "targetable"}`}
         onMouseEnter={handleShowStatus}
         onMouseLeave={handleHideStatus}
         onClick={()=>{
            engine.current.drawCard(player, deckType);
            setVersion(v=>v+1);
         }}>
            <img src={state[player][deckType].length > 0 ? "./src/assets/card-bg.png" : ""} style={deckStyles}/>
            <div id={`${player}-${deckType}-status`} style={statusStyles}>
                {deckType === "actionDeck" ? "Action Deck" : "Yao Deck"}<br/>
                Cards left: {state[player][deckType].length}
            </div>
        </div>
    )
}

export default Deck;