import { createHash, randomInt } from 'node:crypto';

export class GameError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new GameError(status, message); };
export const POOLS = ['Player Dice', 'GM Dice', 'Dice Stash'];
const TYPES = ['Virtue', 'Vice', 'Brink', 'Moment', 'Character/Inventory'];
const hash = token => createHash('sha256').update(token).digest('hex');
export function validRoom(name) { return typeof name === 'string' && /^[a-zA-Z0-9_-]{1,160}$/.test(name); }
function fresh(now) {
  return { schema: 2, created: now, seq: 0, events: [], receipts: [], members: [],
    clocks: Array.from({length:10}, () => ({startedAt:null, duration:12600000, remaining:1})),
    dicePools: { [POOLS[0]]:Array.from({length:10},(_,i)=>({id:i+1,num:i%6+1})), [POOLS[1]]:[], [POOLS[2]]:[{id:11,num:1}] },
    areCardsLocked: false };
}
export function members(room, now) {
  return room ? room.members.map(m => ({id:m.id, name:m.name, isGm:m.isGm, connected:now-m.seen<45000})) : [];
}
function peerCards(m) { return m.cards.map(c => c.type==='Brink' && !c.isRevealed ? {...c,content:''} : c); }
function event(r, name, data, target=null) {
  r.events.push({seq:++r.seq,name,data:structuredClone(data),target});
  r.events = r.events.slice(-160);
  while(r.events.length>1 && JSON.stringify(r.events).length>250000)r.events.shift();
}
function own(r,m) { event(r,'cardsSnapshot',{cards:m.cards,revision:m.revision},m.id); }
function peers(r) { for (const m of r.members) event(r,'peerUserCardsUpdated',{userId:m.id,cards:peerCards(m)}); }
function table(r) { return {dicePools:r.dicePools,candles:r.clocks.map(c=>c.startedAt!==null),areCardsLocked:r.areCardsLocked}; }
function full(r,m,room,now) {
  return [
    {name:'usersUpdated',data:{updatedUsers:members(r,now)}},
    {name:'roomSnapshot',data:{user:{id:m.id,name:m.name,isGm:m.isGm,room},...table(r)}},
    {name:'candleClocks',data:{clocks:r.clocks,serverNow:now}},
    {name:'cardsSnapshot',data:{cards:m.cards,revision:m.revision}},
    ...r.members.map(u=>({name:'peerUserCardsUpdated',data:{userId:u.id,cards:peerCards(u)}})),
  ];
}
function cards(value) {
  if (!Array.isArray(value) || value.length>60 || JSON.stringify(value).length>80000 || new Set(value.map(c=>c?.id)).size!==value.length ||
    !value.every(c=>c && typeof c.id==='string' && c.id.length<100 && TYPES.includes(c.type) && typeof c.content==='string' && c.content.length<=12000)) {
    fail(400,'Некорректная карта или слишком длинная записка.');
  }
  return value.map(c=>({id:c.id,type:c.type,content:c.content,isRevealed:!!c.isRevealed}));
}

/** Pure room transition. Redis commits the returned state with compare-and-set. */
export function transition(stored, request, now=Date.now(), roll=()=>randomInt(1,7)) {
  const {room,kind,user,resumeToken}=request;
  if(!validRoom(room)) fail(400,'Некорректная ссылка комнаты.');
  if(!user || typeof user.id!=='string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(user.id) || typeof resumeToken!=='string' || resumeToken.length<24 || resumeToken.length>200) fail(401,'Не удалось восстановить личный ключ.');
  if(!['join','poll','action'].includes(kind)) fail(400,'Неизвестный запрос.');
  if(!stored && kind!=='join') fail(404,'Комната не найдена.');
  const r=stored ? structuredClone(stored) : fresh(now);
  let dirty=!stored, me=r.members.find(m=>m.id===user.id);
  if(me && me.tokenHash!==hash(resumeToken)) fail(403,'Личный ключ не подходит к этому месту.');
  if(!me) {
    if(kind!=='join') fail(401,'Сначала войдите в комнату.');
    if(typeof user.name!=='string' || !user.name.trim() || user.name.length>100) fail(400,'Введите имя до 100 символов.');
    if(r.members.some(m=>m.name===user.name)) fail(409,'Это имя уже занято в комнате.');
    if(r.members.length>=20) fail(409,'В комнате уже 20 участников.');
    me={id:user.id,name:user.name,isGm:r.members.length===0,tokenHash:hash(resumeToken),cards:[],revision:0,seen:now};
    r.members.push(me);dirty=true;
  }
  if(now-me.seen>15000 || kind==='join') { me.seen=now;dirty=true; }
  // Timers use persisted deadlines, never a setInterval in a Function instance.
  let burnt=false;
  r.clocks.forEach((c,index)=>{
    if(c.startedAt!==null && now>=c.startedAt+c.duration) {
      c.startedAt=null;c.remaining=0;burnt=true;
      event(r,'candleChanged',{index,isLit:false,username:'Timer'});
    }
  });
  if(burnt){dirty=true;event(r,'candleClocks',{clocks:r.clocks,serverNow:now});}
  if(kind==='join') event(r,'usersUpdated',{updatedUsers:members(r,now)});
  const after=Number.isSafeInteger(request.after) && request.after>=0 ? request.after : 0;
  if(kind==='action') {
    const {id,name,payload:p={}}=request;
    if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(id)) fail(400,'Некорректный номер действия.');
    if(!r.receipts.some(x=>x.id===id && x.user===me.id)) {
      if(p.room!==room) fail(403,'Действие адресовано другой комнате.');
      if(['updateGm','changeLock','passInitialState'].includes(name)&&!me.isGm) fail(403,'Это действие доступно только ведущему.');
      if(p.userId!==undefined && p.userId!==me.id) fail(403,'Нельзя менять чужие карты.');
      const rate=me.rate||{at:now,count:0};
      if(now-rate.at>=1000){rate.at=now;rate.count=0;}
      if(++rate.count>40) fail(429,'Слишком много действий. Подождите секунду.');
      me.rate=rate;
      switch(name) {
        case 'cardsSave': {
          const next=cards(p.cards);
          if(p.revision!==me.revision){own(r,me);break;}
          me.cards=next;me.revision++;own(r,me);peers(r);break;
        }
        case 'updatePeerUserCards': {
          if(typeof p.toastText==='string' && p.toastText.length<300 && JSON.stringify(cards(p.cards))===JSON.stringify(me.cards))
            event(r,'peerUserCardsUpdated',{userId:me.id,cards:peerCards(me),toastText:p.toastText});
          break;
        }
        case 'updateGm': {
          const target=r.members.find(m=>m.id===p.newGm?.id);
          if(!target) fail(400,'Участник не найден.');
          r.members.forEach(m=>m.isGm=m===target);
          event(r,'usersUpdated',{updatedUsers:members(r,now)});break;
        }
        case 'candleChange': {
          if(!Number.isInteger(p.index)||p.index<0||p.index>9||typeof p.isLit!=='boolean') fail(400,'Некорректная свеча.');
          const c=r.clocks[p.index];
          if(p.isLit){
            if(c.startedAt!==null) break;
            if(c.remaining<=0)c.remaining=1;
            c.duration=(Number.isFinite(p.lifetime)?Math.max(1,Math.min(86400,p.lifetime))*1000:12600000)*c.remaining;
            c.startedAt=now;
          }else{
            if(c.startedAt!==null)c.remaining*=Math.max(0,1-(now-c.startedAt)/c.duration);
            c.startedAt=null;
          }
          event(r,'candleChanged',{index:p.index,isLit:p.isLit,username:me.name});
          event(r,'candleClocks',{clocks:r.clocks,serverNow:now});break;
        }
        case 'roll': {
          if(!POOLS.includes(p.dicePool)) fail(400,'Неизвестный пул костей.');
          if(p.dicePool===POOLS[1]&&!me.isGm) fail(403,'Кости ведущего бросает ведущий.');
          const dice=r.dicePools[p.dicePool].map(d=>(d.num=roll()));
          event(r,'rolled',{dicePool:p.dicePool,dice,username:me.name});break;
        }
        case 'dieDragStart':
          if(r.dicePools[p.dicePool]?.some(d=>d.id===p.dieId)) event(r,'dieDragStarted',{dieId:p.dieId,dicePool:p.dicePool,username:me.name});
          break;
        case 'dieDragEnd': {
          if(!POOLS.includes(p.prevDicePool)) fail(400,'Неизвестный пул костей.');
          if(POOLS.includes(p.newDicePool)&&p.newDicePool!==p.prevDicePool){
            const i=r.dicePools[p.prevDicePool].findIndex(d=>d.id===p.dieId);
            if(i>=0){const [die]=r.dicePools[p.prevDicePool].splice(i,1);r.dicePools[p.newDicePool].push(die);}
          }
          event(r,'dieDragEnded',{dieId:p.dieId,prevDicePool:p.prevDicePool,newDicePool:p.newDicePool,username:me.name});
          event(r,'passedInitialState',table(r));break;
        }
        case 'transferCard': {
          if(r.areCardsLocked) fail(409,'Стопки карт заблокированы.');
          const target=r.members.find(m=>m.name===p.newUsername),i=me.cards.findIndex(c=>c.id===p.card?.id);
          if(!target||target===me||i<0||target.cards.length>=60) fail(409,'Не удалось передать карту.');
          const [card]=me.cards.splice(i,1);target.cards.push(card);me.revision++;target.revision++;
          event(r,'cardTransferred',{newUsername:target.name,oldUsername:me.name,card},target.id);
          own(r,me);own(r,target);peers(r);break;
        }
        case 'changeLock':
          if(typeof p.isLocked!=='boolean') fail(400,'Некорректное действие.');
          r.areCardsLocked=p.isLocked;event(r,'lockChanged',p.isLocked);break;
        case 'revealBrink': {
          const card=me.cards.find(c=>c.type==='Brink');
          if(card){card.isRevealed=true;me.revision++;own(r,me);peers(r);}break;
        }
        case 'passInitialState': event(r,'passedInitialState',table(r));break;
        default: fail(400,'Неизвестное игровое действие.');
      }
      r.receipts.push({id,user:me.id});r.receipts=r.receipts.slice(-200);dirty=true;
    }
  }
  const lostHistory=after>r.seq || (r.events.length && after<r.events[0].seq-1);
  const response={cursor:r.seq,events:kind==='join'||lostHistory ? full(r,me,room,now) : r.events.filter(e=>e.seq>after&&(!e.target||e.target===me.id)).map(({name,data})=>({name,data}))};
  // Structured cloning breaks references from old event payloads to current cards.
  return {state:r,dirty:dirty||kind==='join',response:structuredClone(response)};
}
