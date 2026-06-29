import { useState, useRef, useEffect } from 'react';
import campestral from "./../assets/campestral/cardData.js";

function TheStack({ setPreviewState, getTranscribedTarget, engine }){

    const state = engine.current.state;

    const styles = {
        border: "3px solid black",
        padding: "30px",
        margin: "10px",
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: "rgba(50, 120, 120, 0.9)",
        zIndex: "5"
    }

    const titleStyles = {
        windth: "calc(100%-10px)",
        padding: "5px",
        backgroundColor: "black",
        color: "White",
        fontSize: "20px",
        fontWeight: "bold",
        textAlign: "center"
    }

    const stackContainerStyles = {
        diplay: "flex",
        flexDirection: "column"
    }

    const stackWrapperStyles = {
        display: "flex",
        padding: "5px",
        gap: "5px"
    }

    const stackInfoStyles ={
        textAlign: "center",
        fontSize: "20px"
    }

    const imgStyles = {
        height: "clamp(120px, 20vh, 250px)",
        aspectRatio: "1035/1520"
    }
    return(
        <div id="the-stack" style={styles} hidden={!state.gameInfo.theStack.length}>
            <div style={titleStyles}>The Stack</div>
            <div id='stack-wrapper' style={stackWrapperStyles}>
            {state.gameInfo.theStack.map((el, idx)=>(
               <div key={'stack'+el.card.id+idx} style={stackContainerStyles}>
                   <img
                    src={campestral[el.card.id].src}
                    style={imgStyles}
                    onMouseEnter={()=>{setPreviewState({src: campestral[el.card.id].src})}}
                    onMouseLeave={()=>{setPreviewState({})}}
                   />
                   <div style={stackInfoStyles}>{getTranscribedTarget(el.target)}</div>
                   <div style={stackInfoStyles}>{idx}</div>
               </div>
            ))}
            </div>
        </div>
    )
}

export default TheStack;