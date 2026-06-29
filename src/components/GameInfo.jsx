import { useState, useRef, useEffect } from 'react';

function GameInfo({ cancelPlayRef, playCardState, gameInfoState, allRefs, engine, setVersion, setGameInfoState, mulligan }){

    const state = engine.current.state;

    const gameInfoStyles = {
        width: "70%",
        color: "white",
        backgroundColor: "black",
        display: "flex",
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-evenly",
        alignItems: "center"
    };

    const wrapperStyles = {
        display: "flex",
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-evenly",
    }

    const infoDivStyles = {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "22px"
    }

    const buttonStyles = {
        height: "50%",
        width: "auto",
        backgroundColor: "black",
        border: "1px solid white",
        padding: "10px",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        fontSize: "22px",
        borderRadius: "5px",
        boxShadow: "0px 0px 3px 1px white"
    }

    const phases= {
        yaoPhase: "Yao Phase",
        drawPhase: "Draw Phase",
        actionPhase: "Action Phase",
        endPhase: "End Phase"
    }

    const drawChoiceContainerStyles = {
        display: "flex",
        gap: "10px"
    }

    function drawFrom(deck){
        engine.current.drawCard('player', deck);
        setGameInfoState({});
    }
    function drawPhaseDrawFrom(deck){
        engine.current.drawPhaseDraw(deck);
        setGameInfoState({});
    }
    function drawHandFrom(deck){
        engine.current.drawCard('player', deck);
        setGameInfoState((prev)=>({
            ...prev,
            drawn: prev.drawn + 1
        }));
        if(gameInfoState.drawn + 1 === gameInfoState.max){
            setGameInfoState({})
            engine.current.startMulligan();
        }
    }

    function confirmMulligan(){
        engine.current.enactMulligan(mulligan.mulliganState.cards);
        mulligan.setMulliganState({});
        setGameInfoState({});
    }

    return(
        <div id="game-info" style={gameInfoStyles}>
            {
                playCardState.card && 
                <div id='cancel-play-box'>
                    <div id='cancel-play-button' style={buttonStyles} ref={cancelPlayRef} className='hidden game-info-button'>
                        Cancel Play
                    </div>
                </div>
            }
            {!gameInfoState.action && <div id='game-info-wrapper' style={wrapperStyles}>
                <div id="turn-display" style={infoDivStyles}>
                    Turn: {state.gameInfo.turn}
                </div>
                <div id="active-info" style={infoDivStyles}>
                    {state.gameInfo.activePlayer ?? "Game not in Progress"}
                </div>
                <div id="phase-info" style={infoDivStyles}>
                    {state.gameInfo.phase == "preGame" ? "" : phases[state.gameInfo.phase]}
                </div>
                <div style={buttonStyles} className='game-info-button'>
                    Don't respond this phase
                </div>
                <div style={buttonStyles} className='game-info-button' onClick={()=>{engine.current.handlePassPrio('player')}}>
                    Pass priority
                </div>
            </div>}
            {
                gameInfoState.msg &&
                <div style={infoDivStyles}>
                    {gameInfoState.msg + 
                     (gameInfoState.action === "drawHand" ? ` (${gameInfoState.drawn}/${gameInfoState.max})` : "") + 
                     (gameInfoState.action === "mulligan" ? ` (${mulligan.mulliganState.cards?.length}/3)` : "")}
                </div>
            }
            {
                gameInfoState.action === "draw" &&
                <div style={drawChoiceContainerStyles}>
                    <div style={buttonStyles} className='game-info-button' onClick={()=>{drawFrom('actionDeck')}}>
                    Draw from Action Deck
                   </div>
                   <div style={buttonStyles} className='game-info-button' onClick={()=>{drawFrom('yaoDeck')}}>
                    Draw from Yao Deck
                  </div>
                </div>
    
            }
            {
                gameInfoState.action === "drawPhaseDraw" &&
                <div style={drawChoiceContainerStyles}>
                    <div style={buttonStyles} className='game-info-button' onClick={()=>{drawPhaseDrawFrom('actionDeck')}}>
                    Draw from Action Deck
                   </div>
                   <div style={buttonStyles} className='game-info-button' onClick={()=>{drawPhaseDrawFrom('yaoDeck')}}>
                    Draw from Yao Deck
                  </div>
                </div>
    
            }
            {
                gameInfoState.action === "drawHand" &&
                <div style={drawChoiceContainerStyles}>
                    <div style={buttonStyles} className='game-info-button' onClick={()=>{drawHandFrom('actionDeck')}}>
                    Draw from Action Deck
                   </div>
                   <div style={buttonStyles} className='game-info-button' onClick={()=>{drawHandFrom('yaoDeck')}}>
                    Draw from Yao Deck
                  </div>
                </div>
    
            }
             {
                gameInfoState.action === "mulligan" &&
                <div style={drawChoiceContainerStyles}>
                   <div style={buttonStyles} className='game-info-button' onClick={()=>{confirmMulligan()}}>
                    Confirm Mulligan
                  </div>
                </div>
    
            }
        </div>
    )
}

export default GameInfo;