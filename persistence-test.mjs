import {createRequire} from 'node:module';import {spawn} from 'node:child_process';import fs from 'node:fs';import path from 'node:path';import {randomBytes} from 'node:crypto';import assert from 'node:assert/strict';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),require=createRequire(new URL('./client/package.json',import.meta.url)),{io}=require('socket.io-client');
fs.mkdirSync(path.resolve(root,'../tmp'),{recursive:true});
const dir=fs.mkdtempSync(path.resolve(root,'../tmp/persistence-')),url='http://127.0.0.1:3034',room='persistence-test';let child;const sockets=[];
const token=()=>randomBytes(32).toString('hex'),host={id:'host',name:'Host'},guest={id:'guest',name:'Guest'},ht=token(),gt=token();
const event=(s,name,filter=()=>true)=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>{s.off(name,f);reject(Error('Timeout '+name))},6000);function f(d){if(filter(d)){clearTimeout(timer);s.off(name,f);resolve(d)}}s.on(name,f)});
async function start(){child=spawn(process.execPath,['server/dist/index.js'],{cwd:root,env:{...process.env,PORT:'3034',DATA_DIR:dir,CLIENT_ORIGINS:'https://table.example'},stdio:'pipe'});for(let i=0;i<60;i++){try{if((await fetch(url+'/api/health')).ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('Server startup')}
async function stop(){if(!child)return;const done=new Promise(r=>child.once('exit',r));child.kill();await done}
async function join(user,key){const s=io(url,{autoConnect:false,reconnection:false,transports:['websocket']});sockets.push(s);const table=event(s,'roomSnapshot'),cards=event(s,'cardsSnapshot');s.on('connect',()=>s.emit('userJoined',{room,user,resumeToken:key}));s.connect();return {s,table:await table,cards:await cards}}
try{
await start();let h=await join(host,ht),g=await join(guest,gt);assert.equal(h.table.user.isGm,true);assert.equal(g.table.user.isGm,false);
let ack=event(h.s,'cardsSnapshot');h.s.emit('cardsSave',{room,revision:0,cards:[{id:'notes',type:'Character/Inventory',content:'Секретная записка 123',isRevealed:true},{id:'virtue',type:'Virtue',content:'Смелость',isRevealed:true}]});assert.equal((await ack).revision,1);
ack=event(g.s,'cardsSnapshot');g.s.emit('cardsSave',{room,revision:0,cards:[{id:'guestnote',type:'Moment',content:'Записка игрока',isRevealed:true}]});await ack;
h.s.disconnect();await new Promise(r=>setTimeout(r,100));let users=await(await fetch(url+'/users?room='+room)).json();assert.equal(users.find(m=>m.id==='host').isGm,true);assert.equal(users.find(m=>m.id==='guest').isGm,false);assert.equal(users.find(m=>m.id==='host').connected,false);assert.ok(users.every(m=>!m.tokenHash&&!m.socketId));
h=await join(host,ht);assert.equal(h.table.user.isGm,true);assert.equal(h.cards.cards[0].content,'Секретная записка 123');
const bad=io(url,{autoConnect:false,transports:['websocket'],reconnection:false});sockets.push(bad);ack=event(bad,'sessionError');bad.on('connect',()=>bad.emit('userJoined',{room,user:host,resumeToken:token()}));bad.connect();await ack;bad.disconnect();
ack=event(g.s,'cardsSnapshot');h.s.emit('transferCard',{room,newUsername:'Guest',card:{id:'virtue'}});const transferred=await ack;assert.equal(transferred.cards.filter(c=>c.id==='virtue').length,1);
ack=event(g.s,'rolled');h.s.emit('roll',{room,dicePool:'Player Dice'});const rolled=await ack;assert.equal(rolled.dice.length,10);assert.ok(rolled.dice.every(n=>n>=1&&n<=6));
ack=event(g.s,'passedInitialState',d=>d.dicePools['GM Dice'].length===1);h.s.emit('dieDragEnd',{room,dieId:1,prevDicePool:'Player Dice',newDicePool:'GM Dice'});await ack;
ack=event(g.s,'lockChanged');h.s.emit('changeLock',{room,isLocked:true});await ack;
ack=event(g.s,'candleClocks');h.s.emit('candleChange',{room,index:4,isLit:true,lifetime:300});const lit=await ack;assert.ok(lit.clocks[4].startedAt);
const cors=await fetch(url+'/users?room='+room,{headers:{Origin:'https://table.example'}});assert.equal(cors.headers.get('access-control-allow-origin'),'https://table.example');
const noCors=await fetch(url+'/users?room='+room,{headers:{Origin:'https://other.example'}});assert.equal(noCors.headers.get('access-control-allow-origin'),null);
g.s.disconnect();h.s.disconnect();await stop();await start();
h=await join(host,ht);g=await join(guest,gt);assert.equal(h.table.user.isGm,true);assert.equal(g.table.user.isGm,false);assert.equal(h.table.areCardsLocked,true);assert.equal(h.table.candles[4],true);assert.equal(h.cards.cards.length,1);assert.equal(h.cards.cards[0].content,'Секретная записка 123');assert.equal(g.cards.cards.length,2);assert.equal(g.cards.cards.find(c=>c.id==='guestnote').content,'Записка игрока');
const disk=fs.readFileSync(path.join(dir,'rooms-v1.json'),'utf8');assert.ok(!disk.includes(ht));assert.ok(!disk.includes(gt));
console.log('PASS: reconnect host/player; no GM theft; token verification; private notes/cards; atomic transfer; lock/candles; CORS; disk persistence after server restart; no plaintext tokens.');
}finally{sockets.forEach(s=>s.disconnect());await stop()}
