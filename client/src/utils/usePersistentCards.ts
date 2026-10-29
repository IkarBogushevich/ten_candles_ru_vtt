import { useEffect, useRef, useState } from 'react'
import Card from 'types/Card'
import socket from './socket'
export default function usePersistentCards(room:string|undefined,id:string|undefined){
  const key='tenCandles_cards_'+room+'_'+id
  function cache(){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
  const [cards,setCards]=useState<Card[]>(()=>cache()?.cards||[])
  const ready=useRef(false),revision=useRef(0),flight=useRef<Card[]|null>(null),pending=useRef<Card[]|null>(null),applied=useRef<string|null>(JSON.stringify(cards))
  const latest=useRef(cards);latest.current=cards
  function store(value:Card[],dirty:boolean){localStorage.setItem(key,JSON.stringify({cards:value,revision:revision.current,dirty}))}
  function flush(){if(!ready.current||flight.current||!pending.current||!socket.connected)return;flight.current=pending.current;pending.current=null;socket.emit('cardsSave',{room,cards:flight.current,revision:revision.current})}
  useEffect(()=>{
    function onConnect(){ready.current=false;flight.current=null}
    function snapshot(data:{cards:Card[];revision:number}){
      if(!ready.current){
        const backup=cache();revision.current=data.revision;ready.current=true
        if(backup?.dirty&&backup.revision===data.revision){pending.current=backup.cards;applied.current=JSON.stringify(backup.cards);setCards(backup.cards);flush();return}
        if(backup?.dirty&&JSON.stringify(backup.cards)!==JSON.stringify(data.cards))localStorage.setItem(key+'_recovery',JSON.stringify(backup))
      }
      revision.current=data.revision;flight.current=null
      if(pending.current){store(pending.current,true);flush();return}
      applied.current=JSON.stringify(data.cards);store(data.cards,false);setCards(data.cards)
    }
    socket.on('connect',onConnect);socket.on('cardsSnapshot',snapshot)
    return()=>{socket.off('connect',onConnect);socket.off('cardsSnapshot',snapshot)}
  },[room,id])
  useEffect(()=>{
    const serialized=JSON.stringify(cards)
    if(serialized===applied.current)return
    applied.current=serialized;pending.current=cards;store(cards,true);flush()
  },[cards])
  return [cards,setCards] as const
}
