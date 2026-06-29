import { useState, useRef, useEffect } from 'react';

function PlayScreen({ gameState, cancelPlayRef, playCardState }){
    const coverStyles = {
        zIndex: '1',
        position: 'fixed',
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(100,150,190,0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }

    const zoneStyles = {
        zIndex: '1',
        position: 'fixed',
        width: "50%",
        height: "50%",
        backgroundColor: "rgba(0,255,255,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "100px",
        border: "1px dashed black"
    }

    return(
        <div id='play-screen' style={coverStyles}>
        </div>
    )
} 

export default PlayScreen