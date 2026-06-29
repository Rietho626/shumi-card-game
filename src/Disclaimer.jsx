import { useState,  useRef, useEffect, use } from 'react'

function Disclaimer({ disclaimerRef, disclaimerState }) {

    const disclaimerStyles = {
        position: "fixed",
        height: "100vh",
        width: "100vw",
        margin: "0px",
        padding: "0px",
        boder: "0px",
        backgroundColor: "black",
        opacity: disclaimerState.fade ? "0" : "1",
        transition: "opacity 1s",
        zIndex: "2"
    };

    const contentWrapperStyles = {
        display: "flex",
        width: "90%",
        height: "90%",
        margin: "auto",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
    };

    const disclaimerHeadingStyles = {
        textAlign: "center",
        color: "red",
        fontSize: "5rem",
        fontWeight: "bold",
        marginBottom: "40px"
    };

    const disclaimerBodyStyles ={
        textAlign: "center",
        color: "white",
        fontSize: "2rem"
    };

    const headingContent = "DISCLAIMER";
    const heading = headingContent.split("");

    const bodyContent = "WORK IN PROGNESS|DO NOT EXPECT ANYTHING|AI ART IS USED TO EMULATE FINISHED DESIGN"
    const body = bodyContent.split("");

  return (
    <>
        <div id="disclaimer" style={disclaimerStyles}>
            <div id="content-wrapper" style={contentWrapperStyles}>
                <div id="disclaimer-heading" style={disclaimerHeadingStyles}>
                    {heading.map((letter, idx)=>{
                        return <span className='black d-head' key={letter+idx+"head"} ref={el=>{disclaimerRef.heading.current[`${letter}-${idx}-head`] = el}}>{letter}</span>
                    })}
                </div>
                <div id="disclaimer-body" style={disclaimerBodyStyles}>
                    {body.map((letter, idx)=>{
                       return letter !== "|" ? <span className='black d-body' ref={el=>{disclaimerRef.body.current[`${letter}-${idx}-body`] = el}} key={letter+idx+"body"}>{letter}</span> : <span key={"break"+idx+"body"}><br></br><br></br></span>
                    })}
                </div>
            </div>
        </div>
    </>
  )
}

export default Disclaimer
