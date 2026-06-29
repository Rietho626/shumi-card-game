import { useState,  useRef, useEffect } from 'react';
import campestral from "./../../assets/campestral/cardData.js";
//LATER: Merge campestral objects with the other habitat objects
function HandCard({ player, setPreviewState, dragLogic, card, idx, playCardLogic, allRefs, engine, checkTargetable, mulligan }){

    const state = engine.current.state;

    const styles = {
        width: "clamp(80px, 12vw, 200px)",
        aspectRatio: "1035 / 1520",
        margin: "10px",
        overflow: "hidden",
        borderRadius: "11px",
        cursor: "pointer",
        boxShadow: engine.current.checkCanPlay(player, campestral[card.id]) ? "0px 0px 5px 2px gold" : ""
    }

    const dragStyles = {
        position: "fixed",
        left: dragLogic.dragState.x ?? "",
        top: dragLogic.dragState.y ?? "",
        pointerEvents: "none",
        zIndex: "3"
    }

    const imgStyle = {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    }
    function chooseForMulligan(){
        if(mulligan.mulliganState.cards.some(el=>el.cardNr === card.cardNr)){
            mulligan.setMulliganState(prev=>({
                cards: prev.cards.filter(el=>el.cardNr !== card.cardNr)
            }))
            allRefs[player]['handCards']['current'][`${player}-hand-card-${idx}`].classList.remove('mulligan');

        }else{
            if(mulligan.mulliganState.cards.length < 3){
                mulligan.setMulliganState(prev=>({
                    cards: [...prev.cards, {...card, ref: allRefs[player]['handCards']['current'][`${player}-hand-card-${idx}`]}]
                }))
            }
        }
    }


    return(
     
        <div 
            id={`${player}-hand-card-${idx}`} 
            className={`${checkTargetable('handCard') ? "non-targetable" : "targetable"}`}
            style={idx === 'dragged'
            ? {...styles, ...dragStyles}
            : styles}
            ref={el=>{
                allRefs[player]['handCards']['current'][`${player}-hand-card-${idx}`] = el
            }}
            onMouseEnter={()=>{setPreviewState({src: campestral[card.id].src})}}
            onMouseLeave={()=>{setPreviewState({})}}
            onClick={()=>{
                if(mulligan.mulliganState.cards && player === 'player') chooseForMulligan();
            }}
            onMouseDown={(e)=>{
                setPreviewState({});
                if(player === 'player' && engine.current.checkCanPlay(player, campestral[card.id]))dragLogic.handleStartDrag(card, allRefs[player]['handCards']['current'][`${player}-hand-card-${idx}`], e)
            }}
        >
            <img
                src={campestral[card.id].src}
                style={imgStyle}
                draggable='false'
                
            />
        </div>

    )
}

export default HandCard;