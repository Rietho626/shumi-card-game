import { useState,  useRef, useEffect, use } from 'react'

import Game from "./Game.jsx";
import Disclaimer from "./Disclaimer.jsx";
import Menu from "./Menu.jsx";

function App() {

  const [gameRunningState, setGameRunningState] = useState(null);
  const [disclaimerState, setDisclaimerState] = useState({show: false, fade: false});
  const [menuState, setMenuState] = useState(null);

  const disclaimerRef = {
    heading: useRef({}),
    body: useRef({})
  };

  const bgRef = useRef(null);
  const headlineRef = useRef(null);

  useEffect(()=>{
    localStorage.clear();
  }, [])

    if(!disclaimerState.show && !localStorage.getItem("disclaimer")){
    setDisclaimerState({show: true, fade: false});
  }


  useEffect(()=>{
   // if((menuState || gameRunningState) || !disclaimerState.show) return;
    async function delay(time){
      return new Promise((resolve)=>{
          setTimeout(resolve, time);
      })
    }

    async function show(box, glow){
      let oldKey = null;
      for(let key in disclaimerRef[box].current){
        await delay(35);
        disclaimerRef[box].current[key].classList.remove("black");
        disclaimerRef[box].current[key].classList.add(glow);
        if(oldKey)  disclaimerRef[box].current[oldKey].classList.remove(glow);
        oldKey = key;
      }
      if(oldKey)  disclaimerRef[box].current[oldKey].classList.remove(glow);
      return;
    }

    function hide(box) {
      for(let key in disclaimerRef[box].current){
        disclaimerRef[box].current[key].classList.add("black");
      }
    }

    async function disclaimer() {
      await show("heading", "red-glow");
      await show("body", "white-glow");
      await delay(1000);
      setDisclaimerState({show: true, fade: true});
      setMenuState(true);
      await delay(1000);
      setDisclaimerState({show: false, fade: false});
      localStorage.setItem("disclaimer", "disclamed")
    }

    disclaimer();
    return(()=>{
      //setDisclaimerState(null);
    })
  }, [])


  useEffect(()=>{
    if(!menuState) return;

    const bgAnimation =  [
    {
        height: "max(1221px, 55.5vw)",
        width: "max(856px, 39vw)",
        filter: "blur(5px) brightness(1.5)",
        top: "-5%",
        opacity: "0.5"
    },
    {
        height: "max(1465px, 66.5vw)",
        top: "-15%",
        left: "20%",
        width: "max(1027px, 47vw)",
        filter: "blur(0px) brightness(1)",
        opacity: "0.7"
    },
    {
        height: "max(1221px, 55.5vw)",
        width: "max(856px, 39vw)",
        filter: "blur(5px) brightness(1.5)",
        opacity: "0.5",
        top: "-5%",
    },
  ];

  const glowAnimation = [
    {
      textShadow: "0px 0px 30px cyan"
    },
    {
      textShadow: "0px 0px 100px cyan"
    },
    {
      textShadow: "0px 0px 30px cyan"
    },
  ]


  const timing = {
      duration: 5000,
      iterations: Infinity,
      easing: "ease-in-out"
  }

  if(bgRef){
    bgRef.current.animate(bgAnimation, timing);
    headlineRef.current.animate(glowAnimation, timing)
  }

  
  }, [menuState])

  return (
    <>
      {
        gameRunningState && <Game></Game>
      }
      {
        disclaimerState.show &&
        <Disclaimer
          disclaimerRef={disclaimerRef}
          disclaimerState={disclaimerState}
        ></Disclaimer>
      }
      {
        menuState && <Menu
          setGameRunningState={setGameRunningState}
          setMenuState={setMenuState}
          bgRef={bgRef}
          headlineRef={headlineRef}
        ></Menu>
      }
    </>
  )
}

export default App
