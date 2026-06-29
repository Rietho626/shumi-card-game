
import { useState,  useRef, useEffect, use } from 'react'

function Menu({ setMenuState, setGameRunningState, bgRef, headlineRef }){


    const menuStyles ={
        position: "fixed",
        height: "100vh",
        width: "100vw",
        margin: "0px",
        padding: "0px",
        boder: "0px",
        backgroundColor: "black",
    }

    const contentWrapperStyles = {
        display: "flex",
        width: "90vw",
        height: "90vh",
        margin: "auto",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
    };

    const clickHereStyle = {
        fontSize: "2rem",
        textAlign: "center"
    }

    const headlineStyles = {
        color: "cyan",
        width: "50%",
        fontSize: "7rem",
        margin: "50px"
    }

    const startButtonStyles = {
        textAlign: "center",
        border: "4px solid white",
        width: "10%",
        margin: "auto",
        color: "white"
    }

    const bg1Styles = {
        backgroundImage: "url(./src/assets/bg.png)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        position: "fixed",
        height: "max(1221px, 55.5vw)",
        width: "max(856px, 39vw)",
        margin: "auto",
        padding: "0px",
        boder: "0px",
        zIndex: "-2",
        transform: "rotate(45deg)",
        top: "-5%",
        left: "25%"
    }

    
    const bg2Styles = {
        backgroundImage: "url(./src/assets/bg.png)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        position: "fixed",
        height: "max(1221px, 55.5vw)",
        width: "max(856px, 39vw)",
        margin: "auto",
        padding: "0px",
        boder: "0px",
        zIndex: "-1",
        transform: "rotate(45deg)",
        filter: "blur(5px) brightness(1.5)",
        opacity: "0.5",
        top: "-5%",
        left: "25%"
    }



    function startGame(){
        setMenuState(false);
        setGameRunningState(true);
    }
    return (
        <div id="menu" style={menuStyles}>
            <div id="bg1" style={bg1Styles}>

            </div>
            <div id="bg2" ref={bgRef} style={bg2Styles}>

            </div>
            <div id="content-wrapper" style={contentWrapperStyles}>
                <div id="menu-headline" ref={headlineRef} style={headlineStyles} onClick={()=>{startGame()}}>
                    SHUMI
                    <div id="click-here" style={clickHereStyle}>click here</div>
                </div>
            </div>
        </div>
    )
}

export default Menu;