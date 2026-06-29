import { useState, useRef, useEffect } from 'react';

function YaoReserve({ player, playCardLogic, allRefs, engine, setVersion, checkTargetable }){

    const state = engine.current.state;

    const styles = {
        width: "clamp(80px, 12vw, 200px)",
        aspectRatio: "750 / 1050",
        margin: "10px",
        borderRadius: "9px",
        //boxShadow: "1.5px 1.5px 5px 0.5px black inset"
    }

    const imgStyle = {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: player === "opponent" ? "rotate(180deg)" : "rotate(0deg)",
        borderRadius: "9px"
    }

    function addYao(e){
       engine.current.addYao(player, "1");
       setVersion(v=>v+1);
    }
    return(
        <div id={`${player}-yao-reserve`} style={styles} onClick={addYao} className={`${checkTargetable() ? "non-targetable" : "targetable"}`} ref={allRefs[player]['yaoReserve']}>
            <img
                src={`./src/assets/${state[player].yaoReserve}yao.png`}
                style={imgStyle}
            />
        </div>
    )
}

export default YaoReserve;