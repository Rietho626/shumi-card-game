import { useState, useRef, useEffect } from 'react';
import HandCard from "./displayedCards/HandCards.jsx";

function Hand({ player, setPreviewState, dragLogic, playCardLogic, allRefs, engine, checkTargetable, mulligan }){

    const state = engine.current.state;

    const [expansion, setExpansion] = useState(false)

    const styles = {
        position: "absolute",
        minWidth: "1100px",
        minHeight: "200px",
        height: "auto",
        bottom: player === 'player' ? "0" : "",
        top: player === "opponent" ? "0" : "",
        transform: `translateY(${player === 'player' ? "150px" : "-150px"}) rotate(${player === 'player' ? "0deg" : "180deg"})`,
        left: "10%",
        backgroundColor: checkTargetable() ? "#4f4f4f" : "rgba(96, 103, 112, 0.7)",
        border: "1px solid black",
        boxShadow: "1px 1px 2px 0.5px black",
        transition: "0.5s",
        display: "flex",
        zIndex: "1"
    }
    return(
        <div
         id={`${player}-hand`} 
         ref={allRefs[player]['hand']}
         className={`${expansion ? `${player}-expanded` : ''}`}
         style={styles}
         onMouseEnter={()=>{setExpansion(true); }}
         onMouseLeave={()=>{setExpansion(false); }}
        >
        {state[player]['hand'].map((card, idx)=>(
            <HandCard
                allRefs={allRefs}
                player={player}
                setPreviewState={setPreviewState}
                dragLogic={dragLogic}
                playCardLogic={playCardLogic}
                card={card}
                idx={idx}
                key={card.id+idx}
                engine={engine}
                checkTargetable={checkTargetable}
                mulligan={mulligan}
            />
        ))}
        </div>
    )
}

export default Hand;