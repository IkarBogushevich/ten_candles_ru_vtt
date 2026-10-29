import { nanoid } from 'nanoid'
import User from 'types/User'
export function roomInPath(){return location.pathname.match(/^\/room\/([^/]+)/)?.[1]}
export function readSession(room?:string):{user:User;token:string}|undefined {
  try {const s=JSON.parse(localStorage.getItem('tenCandles_session_'+room)||'null');return s?.user?.id&&typeof s.token==='string'?s:undefined}catch{return undefined}
}
export function remember(user:User,room:string){
  const previous=readSession(room),session={user:{...user,room},token:previous?.user.id===user.id?previous.token:nanoid(48)}
  localStorage.setItem('tenCandles_session_'+room,JSON.stringify(session));localStorage.setItem('tenCandles_lastRoom',room)
  return session
}
export function resumeToken(user:User,room:string){return (readSession(room)?.user.id===user.id?readSession(room)!:remember(user,room)).token}
