import { useState, useRef, useEffect } from 'react';
import campestral from "./../assets/campestral/cardData.js";

function RuneZone({ player, zoneType, setPreviewState, playCardLogic, allRefs, engine, setVersion, checkTargetable }){

    const state = engine.current.state;

    const styles = {
        width: "clamp(80px, 12vw, 200px)",
        aspectRatio: "1030 / 1520",
        margin: "10px",
        borderRadius: "11px",
        boxShadow: "1.5px 1.5px 5px 0.5px black inset",
        backgroundColor: "grey"
    }

    const imgStyle = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "11px",
        display: state[player][zoneType].id ? "block" : "none"
    }

    return(
        
        <div id={`${player}-${zoneType}`} style={styles} className={`${checkTargetable() ? "non-targetable" : "targetable"}`} ref={allRefs[player][zoneType]}>
            <img
             src={campestral[state[player][zoneType].id ?? "no-rune"].src}
             style={imgStyle}
             onMouseEnter={()=>{setPreviewState({src: campestral[state[player][zoneType].id ?? "no-rune"].src})}}
             onMouseLeave={()=>{setPreviewState({})}}
            />
        </div>
    )
}

export default RuneZone;