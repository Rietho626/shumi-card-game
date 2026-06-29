import { useState, useRef, useEffect } from 'react';

function Player({ player, playCardLogic, allRefs, engine, setVersion, checkTargetable }){

    const state = engine.current.state;

    const styles = {
        width: "clamp(80px, 12vw, 200px)",
        height: "clamp(80px, 12vw, 200px)",
        margin: "10px",
        borderRadius: "5px",
        boxShadow: "1.5px 1.5px 5px 0.5px black inset",
        backgroundColor: "grey",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "40px",
        position: "relative"

    }

    const healthBarStyles = {
        height: `${state[player].hp/30*100}%`,
        width: "100%",
        backgroundColor: state[player].hp > 15 ? "green" : state[player].hp > 5 ? "orange" : "red",
        position: "absolute",
        zIndex: "0",
        [`${player === 'player' ? "bottom" : "top"}`]: "0",
        transition: "height 0.4s ease"
    }

    const lifePointsStyle = {
        zIndex: "1"
    }

    function changeLife(){
        engine.current.changeLife(player, "-1");
        setVersion(v=>v+1);
    }


    return(
        
        <div id={`${player}-player-token`} style={styles} onClick={changeLife} className={`${checkTargetable() ? "non-targetable" : "targetable"}`} ref={allRefs[player]['player']}>
            <div style={lifePointsStyle}>{state[player].hp}</div>
            <div style={healthBarStyles}>

            </div>
        </div>
    )
}

export default Player;