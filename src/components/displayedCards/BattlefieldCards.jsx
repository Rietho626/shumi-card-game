import { useState,  useRef, useEffect } from 'react';
import campestral from "./../../assets/campestral/cardData.js";
//LATER: Merge campestral objects with the other habitat objects

function BattlefieldCards({ player, lane, setPreviewState, allRefs, idx, card, engine }){

   // console.log(card)

    const state = engine.current.state;
  
    const cardStyles = {
        height: "160px",
        width: "160px",
        overflow: "hidden",
        borderRadius: "5px",
        border: "3px solid black",
        position: "relative",
        boxShadow: card.momentum ? "0px 0px 4px 2px darkorange" : "",
    }

    const imgStyles = {
      height: "100%",
      width: "100%",
      objectFit: "cover"
    }

    const innerShadowStyles = {
        width: "100%",
        height: "100%",
        position: "absolute",
        boxShadow: engine.current.checkCanActivateAbilites(player, card).length ? "0px 0px 10px 2px gold inset" : "0px 0px 10px 2px black inset",
    }

    const healthStyles = {
        padding: "2px",
        border: "1px solid black",
        backgroundColor: "green",
        width: "40px",
        position: "absolute",
        borderRadius: "60%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0px 0px 10px 2px inset",
        bottom: "5px",
        left: "5px",
        display: lane === "crystalZone" ? "none" : "flex" 
    }

    return(
        <div 
         id={`${player}-${lane}-card-${idx}`} 
         style={cardStyles}
         ref={el=>allRefs[player][lane+'Cards']['current'][`${player}-${lane}-card-${idx}`] = el}
         onMouseEnter={()=>{setPreviewState({src: campestral[card.id].src})}}
         onMouseLeave={()=>{setPreviewState({})}}
         onClick={()=>{
            setPreviewState({});
            engine.checkForAttack();
         }}
        >
            <div style={innerShadowStyles}></div>
            <div className='health' style={healthStyles}>{card.currentHp}</div>
            <img src={`${import.meta.env.BASE_URL}campestral/pics/${card.id}-pic.png`}  style={imgStyles}/>

        </div>
    )
}

export default BattlefieldCards;