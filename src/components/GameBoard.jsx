import { useState,  useRef, useEffect } from 'react'

import Battlefield from "./Battlefield.jsx";
import Deck from "./Deck.jsx";
import AwayZone from "./AwayZone.jsx";
import YaoReserve from "./YaoReserve.jsx";
import RuneZone from "./RuneZone.jsx";
import Hand from "./Hand.jsx";
import Player from "./Player.jsx";

function GameBoard({ allRefs, player, setPreviewState, dragLogic, playCardLogic, engine, setVersion, mulligan }){

    const state = engine.current.state;

    function checkTargetable(type = false){
        switch(type){
            case 'handCard':
                if(mulligan.mulliganState.cards){
                    return false;
                }
            break;
        }
        return state.gameInfo.priority.player !== player || playCardLogic.playCardState.card
    }


    const boardWrapperStyles = {
        height: "100%",
        width: "100%",
        backgroundColor: player === "player" ? `${checkTargetable() ? "#4f4f4f" : "darkgrey"}` : `${checkTargetable()? "#4f4f4f" : "grey"}`,
        display: "flex",
        flexDirection: "row"
    }

    const battlefieldWrapperStyles = {
        height: "100%",
        minWidth: "61%",
    }

    const yaoReserveWrapperStyles = {
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column"
    }

    const dualZonesStyles = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-around",
    }

    const runeZoneWrapperStyles = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-around",
        marginRight: "5%",
        marginLeft: "1%",
    }
    return(
        <div id={`${player}-board-wrapper`} style={boardWrapperStyles} > 
            <div id={`${player}-battlefield-wrapper`} style={battlefieldWrapperStyles}>
                <Battlefield
                    allRefs={allRefs}
                    player={player}
                    lane={player === 'player' ?  'frontline' : 'crystalZone'}
                    setPreviewState={setPreviewState}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                />

                <Battlefield
                    allRefs={allRefs}
                    player={player}
                    lane={'backline'}
                    setPreviewState={setPreviewState}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                />

                <Battlefield
                    allRefs={allRefs}
                    player={player}
                    lane={player === 'player' ? 'crystalZone' : 'frontline'}
                    setPreviewState={setPreviewState}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                />
            </div>
            <div id={`${player}-yao-reserve-life-wrapper`} style={yaoReserveWrapperStyles}>
                <Player
                    allRefs={allRefs}
                    player={player}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                    checkTargetable={checkTargetable}
                />
                <YaoReserve
                    allRefs={allRefs}
                    player={player}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                    checkTargetable={checkTargetable}
                />
            </div>
             <div id={`${player}-rune-zones-wrapper`} style={runeZoneWrapperStyles}>
                <RuneZone
                    allRefs={allRefs}
                    player={player}
                    zoneType={'upperRuneZone'}
                    setPreviewState={setPreviewState}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                    checkTargetable={checkTargetable}
                />

                <RuneZone
                    allRefs={allRefs}
                    player={player}
                    zoneType={'lowerRuneZone'}
                    setPreviewState={setPreviewState}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                    checkTargetable={checkTargetable}
                />
            </div>
            <div id={`${player}-deck-zones-wrapper`} style={dualZonesStyles}>

                <Deck
                    allRefs={allRefs}
                    player={player}
                    deckType={'yaoDeck'}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                    checkTargetable={checkTargetable}
                />

                <Deck
                    allRefs={allRefs}
                    player={player}
                    deckType={'actionDeck'}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                    checkTargetable={checkTargetable}
                />
            </div>
            <div id={`${player}-away-zones-wrapper`} style={dualZonesStyles}>
                <AwayZone
                    allRefs={allRefs}
                    player={player}
                    zoneType={player === 'player' ? 'restingGrounds' : 'spiritedAway'}
                    setPreviewState={setPreviewState}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                    checkTargetable={checkTargetable}
                />

                <AwayZone
                    allRefs={allRefs}
                    player={player}
                    zoneType={player === 'player' ? 'spiritedAway' : 'restingGrounds'}
                    setPreviewState={setPreviewState}
                    playCardLogic={playCardLogic}
                    engine={engine}
                    setVersion={setVersion}
                    checkTargetable={checkTargetable}
                />
            </div>
            <Hand
                allRefs={allRefs}
                player={player}
                setPreviewState={setPreviewState}
                dragLogic={dragLogic}
                playCardLogic={playCardLogic}
                engine={engine}
                setVersion={setVersion}
                checkTargetable={checkTargetable}
                mulligan={mulligan}
            />
        </div>
    )
}

export default GameBoard;