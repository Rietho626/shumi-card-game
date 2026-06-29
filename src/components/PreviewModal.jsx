import { useState, useRef, useEffect } from 'react';

function PreviewModal({ previewState }){
    const styles = {
        border: "3px solid black",
        padding: "30px",
        margin: "10px",
        position: "fixed",
        top: "20px",
        left: "20px",
        backgroundColor: "rgba(50, 120, 120, 0.9)",
        zIndex: "5"
    }

    const imgStyles = {
        height: "clamp(200px, 50vh, 700px)",
        aspectRatio: "1035/1520"
    }
    return(
        <div id="card-preview" style={styles} hidden={!previewState.src}>
            <img src={previewState.src ?? null} style={imgStyles} />
        </div>
    )
}

export default PreviewModal;