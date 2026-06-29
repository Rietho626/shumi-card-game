import { useState, useRef, useEffect } from 'react';
import BattlefieldCards from './displayedCards/BattlefieldCards.jsx';

function Battlefield({ player, lane, setPreviewState, playCardLogic, allRefs, engine, setVersion }){

    const state = engine.current.state;

    const styles = {
        width: "max(60vw, 60%)",
        height: "30%",
        margin: "10px",
        boxShadow: "1px 1px 5px 1px black",
        borderRadius: "2px",
        backgroundColor: "grey",
        display: "flex",
        gap: "20px",
        alignItems: "center",
        padding: "0px 10px"
    };
    return(
          <div id={player+lane} style={styles} className={`${playCardLogic.playCardState.card || state.gameInfo.priority.player !== player ? "non-targetable" : "targetable"}`} ref={allRefs[player][lane]}>
            {
                state[player][lane].map((card, idx)=>(
                     <BattlefieldCards
                        allRefs={allRefs}
                        player={player}
                        lane={lane}
                        setPreviewState={setPreviewState}
                        card={card}
                        key={card.id + idx} 
                        idx={idx}
                        engine={engine}
                        setVersion={setVersion}
                    />
                ))
            }
        </div>
      
    )
}

export default Battlefield;