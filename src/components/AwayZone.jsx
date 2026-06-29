import { useState, useRef, useEffect } from 'react';
import campestral from '../assets/campestral/cardData';

function AwayZone({ player, zoneType, setPreviewState, playCardLogic, allRefs, engine, setVersion, checkTargetable }){

    const state = engine.current.state;

    const [statusDisplay, setStatusDisplay] = useState({});

    const styles = {
        width: "clamp(80px, 12vw, 200px)",
        aspectRatio: "750 / 1050",
        margin: "10px",
        borderRadius: "9px",
        boxShadow: "1.5px 1.5px 5px 0.5px black inset",
        backgroundColor: "grey"
    }
   
    const imgStyle = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: state[player][zoneType][0] ? "block" : "none"
    }

    const statusStyles = {
        position: "absolute",
        backgroundColor: "black",
        color: "white",
        alignItems: "center",
        justifyContent: "center",
        display: statusDisplay.top ? "flex" : "none",
        top: statusDisplay.top ?? "auto",
        left: statusDisplay.left ?? "auto",
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
        
        <div id={`${player}-${zoneType}`} style={styles} 
            ref={allRefs[player][zoneType]}
            onMouseEnter={handleShowStatus}
            onMouseLeave={handleHideStatus}
            className={`${checkTargetable() ? "non-targetable" : "targetable"}`}
        >

            <div id={`${player}-${zoneType}-status`} style={statusStyles}>
                {zoneType === "restingGrounds" ? "Resting Grounds" : "Spirited Away"}<br/>
                Cards contained: {state[player][zoneType].length}
            </div>

            <img
                src={state[player][zoneType][0] 
                        ? campestral[state[player][zoneType][0].id].src
                        : null
                    }
                style={imgStyle}
                onMouseEnter={()=>{
                    setPreviewState({
                        src: state[player][zoneType][0] 
                            ? campestral[gameState[player][zoneType][0].id].src
                            : null})
                }}
                onMouseLeave={()=>{
                    setPreviewState({});
                }}
            />

        </div>
    )
}

export default AwayZone;