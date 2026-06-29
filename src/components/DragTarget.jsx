import { useState, useRef, useEffect } from 'react';

function DragTarget({ gameState, dragZoneRef, engine }){
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
        <div id='drag-cover' style={coverStyles}>
            <div id='drag-zone' style={zoneStyles} ref={dragZoneRef}>
                Drag here to play
            </div>
        </div>
    )
}

export default DragTarget