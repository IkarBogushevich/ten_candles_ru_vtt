import express from 'express'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { createHash, randomInt } from 'crypto'
import { Server } from 'socket.io'
const app=express(),server=http.createServer(app),port=Number(process.env.PORT||3020)
const origins=(process.env.CLIENT_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)
const io=new Server(server,{cors:{origin:(o,cb)=>cb(null,!o||!origins.length||origins.includes(o)),methods:['GET','POST']},maxHttpBufferSize:200000})
app.disable('x-powered-by')
app.use((req,res,next)=>{const o=req.headers.origin;if(o&&(!origins.length||origins.includes(o))){res.setHeader('Access-Control-Allow-Origin',o);res.setHeader('Vary','Origin')}next()})
app.get('/api/health',(_req,res)=>res.json({app:'ten-candles-original',version:'1.1.0'}))
app.use(express.static(path.resolve(__dirname,'../../client/dist')))
app.get('/room/:room',(_req,res)=>res.sendFile(path.resolve(__dirname,'../../client/dist/index.html')))
type Card={id:string;type:string;content:string;isRevealed:boolean}
type Member={id:string;name:string;isGm:boolean;tokenHash:string;socketId?:string;cards:Card[];revision:number}
type Clock={startedAt:number|null;duration:number;remaining:number}
type Room={members:Member[];clocks:Clock[];dicePools:Record<string,{id:number;num:number}[]>;areCardsLocked:boolean}
const pools=['Player Dice','GM Dice','Dice Stash']
const store=path.resolve(process.env.DATA_DIR||path.resolve(__dirname,'../../data'));fs.mkdirSync(store,{recursive:true})
const saveFile=path.join(store,'rooms-v1.json')
let rooms:Record<string,Room>={}
if(fs.existsSync(saveFile)){rooms=JSON.parse(fs.readFileSync(saveFile,'utf8'));Object.values(rooms).forEach(r=>r.members.forEach(m=>{delete m.socketId}))}
function save(){fs.writeFileSync(saveFile+'.tmp',JSON.stringify(rooms));fs.renameSync(saveFile+'.tmp',saveFile)}
function fresh():Room{return {members:[],clocks:Array.from({length:10},()=>({startedAt:null,duration:12600000,remaining:1})),dicePools:{[pools[0]]:Array.from({length:10},(_,i)=>({id:i+1,num:i%6+1})),[pools[1]]:[],[pools[2]]:[{id:11,num:1}]},areCardsLocked:false}}
const digest=(s:string)=>createHash('sha256').update(s).digest('hex')
function members(r:Room){return r.members.map(m=>({id:m.id,name:m.name,isGm:m.isGm,connected:!!m.socketId}))}
function publicCards(m:Member){return m.cards.map(c=>c.type==='Brink'&&!c.isRevealed?{...c,content:''}:c)}
function peers(room:string){for(const m of rooms[room].members)io.to(room).emit('peerUserCardsUpdated',{userId:m.id,cards:publicCards(m)})}
function own(m:Member){if(m.socketId)io.to(m.socketId).emit('cardsSnapshot',{cards:m.cards,revision:m.revision})}
function table(room:string){const r=rooms[room];io.to(room).emit('passedInitialState',{dicePools:r.dicePools,candles:r.clocks.map(c=>c.startedAt!==null),areCardsLocked:r.areCardsLocked})}
function clock(room:string){io.to(room).emit('candleClocks',{clocks:rooms[room].clocks,serverNow:Date.now()})}
app.get('/users',(req,res)=>{res.setHeader('Cache-Control','no-store');res.json(rooms[String(req.query.room)]?members(rooms[String(req.query.room)]):[])})
function validCards(a:any):a is Card[]{return Array.isArray(a)&&a.length<=100&&new Set(a.map(c=>c?.id)).size===a.length&&a.every(c=>c&&typeof c.id==='string'&&c.id.length<100&&['Virtue','Vice','Brink','Moment','Character/Inventory'].includes(c.type)&&typeof c.content==='string'&&c.content.length<=20000)}
io.on('connection',socket=>{
 let count=0,start=Date.now()
 socket.use(([event,p],next)=>{if(Date.now()-start>1000){start=Date.now();count=0}if(++count>120)return
  if(event!=='userJoined'){const r=rooms[socket.data.room],m=r?.members.find(m=>m.socketId===socket.id);if(!m||!p||p.room!==socket.data.room)return;if(['updateGm','changeLock','passInitialState'].includes(event)&&!m.isGm)return;if(p.userId!==undefined&&p.userId!==m.id)return;if(p.username!==undefined)p.username=m.name;if(p.oldUsername!==undefined)p.oldUsername=m.name}next()})
 const current=()=>{const room=socket.data.room as string,r=rooms[room];return {room,r,me:r.members.find(m=>m.socketId===socket.id)!}}
 socket.on('userJoined',p=>{
  const {room,user,resumeToken}=p||{};if(socket.data.room)return
  if(typeof room!=='string'||!/^[a-zA-Z0-9_-]{1,160}$/.test(room)||!user||typeof user.id!=='string'||user.id.length>100||typeof user.name!=='string'||!user.name.trim()||user.name.length>100||typeof resumeToken!=='string'||resumeToken.length<24||resumeToken.length>200){socket.emit('sessionError',{message:'Invalid session. Reopen your room link.'});return}
  const r=rooms[room]||(rooms[room]=fresh());let m=r.members.find(m=>m.id===user.id)
  if(m&&m.tokenHash!==digest(resumeToken)){socket.emit('sessionError',{message:'This seat belongs to another session.'});return}
  if(!m){if(r.members.some(m=>m.name===user.name)||r.members.length>=20){socket.emit('sessionError',{message:'This name is already reserved in the room.'});return}m={id:user.id,name:user.name,isGm:!r.members.length,tokenHash:digest(resumeToken),cards:[],revision:0};r.members.push(m)}
  const old=m.socketId;m.socketId=socket.id;if(old&&old!==socket.id)io.sockets.sockets.get(old)?.disconnect(true)
  socket.data.room=room;socket.join(room);save()
  io.to(room).emit('usersUpdated',{updatedUsers:members(r)})
  socket.emit('roomSnapshot',{user:{id:m.id,name:m.name,isGm:m.isGm,room},dicePools:r.dicePools,candles:r.clocks.map(c=>c.startedAt!==null),areCardsLocked:r.areCardsLocked})
  clock(room);own(m);peers(room)
 })
 socket.on('passInitialState',()=>{table(current().room)})
 socket.on('cardsSave',({cards,revision})=>{const {room,me}=current();if(!validCards(cards))return;if(revision!==me.revision){own(me);return}me.cards=cards;me.revision++;save();own(me);peers(room)})
 socket.on('updatePeerUserCards',({cards,toastText})=>{const {room,me}=current();if(validCards(cards)&&JSON.stringify(cards)===JSON.stringify(me.cards)){peers(room);if(typeof toastText==='string'&&toastText.length<300)io.to(room).emit('peerUserCardsUpdated',{userId:me.id,cards:publicCards(me),toastText})}})
 socket.on('updateGm',({newGm})=>{const {room,r}=current(),next=r.members.find(m=>m.id===newGm?.id);if(!next)return;r.members.forEach(m=>m.isGm=m===next);save();io.to(room).emit('usersUpdated',{updatedUsers:members(r)})})
 socket.on('candleChange',({index,isLit,lifetime})=>{if(!Number.isInteger(index)||index<0||index>9||typeof isLit!=='boolean')return;const {room,r,me}=current(),c=r.clocks[index],now=Date.now();if(isLit){if(c.startedAt!==null)return;if(c.remaining<=0)c.remaining=1;c.duration=(Number.isFinite(lifetime)?Math.max(1,Math.min(86400,lifetime))*1000:12600000)*c.remaining;c.startedAt=now}else{if(c.startedAt!==null)c.remaining*=Math.max(0,1-(now-c.startedAt)/c.duration);c.startedAt=null}save();io.to(room).emit('candleChanged',{index,isLit,username:me.name});clock(room)})
 socket.on('roll',({dicePool})=>{const {room,r,me}=current();if(!pools.includes(dicePool)||(dicePool===pools[1]&&!me.isGm))return;const dice=r.dicePools[dicePool].map(d=>(d.num=randomInt(1,7)));save();io.to(room).emit('rolled',{dicePool,dice,username:me.name})})
 socket.on('dieDragStart',({dieId,dicePool})=>{const {room,me,r}=current();if(r.dicePools[dicePool]?.some(d=>d.id===dieId))io.to(room).emit('dieDragStarted',{dieId,dicePool,username:me.name})})
 socket.on('dieDragEnd',({dieId,prevDicePool,newDicePool})=>{const {room,r,me}=current();if(!pools.includes(prevDicePool))return;if(pools.includes(newDicePool)&&newDicePool!==prevDicePool){const index=r.dicePools[prevDicePool].findIndex(d=>d.id===dieId);if(index>=0){const [die]=r.dicePools[prevDicePool].splice(index,1);r.dicePools[newDicePool].push(die);save()}}io.to(room).emit('dieDragEnded',{dieId,prevDicePool,newDicePool,username:me.name});table(room)})
 socket.on('transferCard',({newUsername,card})=>{const {room,r,me}=current();if(r.areCardsLocked)return;const target=r.members.find(m=>m.name===newUsername),index=me.cards.findIndex(c=>c.id===card?.id);if(!target||target===me||index<0||target.cards.length>=100)return;const [actual]=me.cards.splice(index,1);target.cards.push(actual);me.revision++;target.revision++;save();if(target.socketId)io.to(target.socketId).emit('cardTransferred',{newUsername:target.name,oldUsername:me.name,card:actual});own(me);own(target);peers(room)})
 socket.on('changeLock',({isLocked})=>{if(typeof isLocked!=='boolean')return;const {room,r}=current();r.areCardsLocked=isLocked;save();io.to(room).emit('lockChanged',isLocked)})
 socket.on('revealBrink',()=>{const {room,me}=current(),c=me.cards.find(c=>c.type==='Brink');if(c){c.isRevealed=true;me.revision++;save();own(me);peers(room)}})
 socket.on('disconnect',()=>{const room=socket.data.room,r=rooms[room];if(!r)return;const m=r.members.find(m=>m.socketId===socket.id);if(!m)return;delete m.socketId;save();io.to(room).emit('usersUpdated',{updatedUsers:members(r)})})
})
setInterval(()=>{let dirty=false;for(const [room,r]of Object.entries(rooms))for(const [index,c]of r.clocks.entries())if(c.startedAt!==null&&Date.now()>=c.startedAt+c.duration){c.startedAt=null;c.remaining=0;dirty=true;io.to(room).emit('candleChanged',{index,isLit:false,username:'Timer'});clock(room)}if(dirty)save()},250).unref()
server.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`Server running on port ${port}!`))
