import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { transition } from '../lib/game.mjs';
import { execute, redisStore } from '../lib/redis.mjs';

const host={id:'host',name:'Ведущий'},guest={id:'guest',name:'Игрок'};
const ht='host-private-token-'.repeat(3),gt='guest-private-token-'.repeat(3);
const room='test-'+randomUUID();
const join=(user=host,resumeToken=ht)=>({kind:'join',room,user,resumeToken,after:0});
const action=(name,payload={},user=host,resumeToken=ht)=>({...join(user,resumeToken),kind:'action',id:randomUUID(),name,payload:{room,...payload}});
function setup(){return transition(transition(null,join(),1000).state,join(guest,gt),1001).state;}
function memoryStore(){const map=new Map();return {async read(k){return map.get(k)??null},async commit(k,old,next){if((map.get(k)??null)!==old)return false;map.set(k,next);return true;}}}

test('F5 restores GM and player; spoofed token and GM actions are rejected',()=>{
  const state=setup();
  assert.equal(transition(state,join(),90000).response.events.find(e=>e.name==='roomSnapshot').data.user.isGm,true);
  assert.equal(transition(state,join(guest,gt),90001).response.events.find(e=>e.name==='roomSnapshot').data.user.isGm,false);
  assert.throws(()=>transition(state,join(host,gt)),{status:403});
  assert.throws(()=>transition(state,action('changeLock',{isLocked:true},guest,gt)),{status:403});
  assert.ok(!JSON.stringify(state).includes(ht));
});

test('private notes, revisions and transfer survive serialized storage without duplication',()=>{
  const secret='Никто другой не должен видеть текст Грани';
  let r=setup();
  r=transition(r,action('cardsSave',{revision:0,cards:[{id:'brink',type:'Brink',content:secret,isRevealed:false},{id:'note',type:'Moment',content:'Моя записка',isRevealed:true}]}),1002).state;
  const other=transition(r,join(guest,gt),1003).response;
  assert.ok(!JSON.stringify(other).includes(secret));
  assert.equal(transition(JSON.parse(JSON.stringify(r)),join(),1004).response.events.find(e=>e.name==='cardsSnapshot').data.cards[0].content,secret);
  const move=action('transferCard',{newUsername:guest.name,card:{id:'note'}});
  r=transition(r,move,1005).state;
  r=transition(r,move,1006).state;
  assert.equal(r.members[1].cards.length,1);
  assert.equal(r.members[0].cards.length,1);
  const stale=transition(r,action('cardsSave',{revision:0,cards:[]}),1007);
  assert.equal(stale.state.members[0].cards.length,1);
});

test('candle height clock pauses/resumes, late joins agree, expiration needs no running process',()=>{
  let r=setup();
  r=transition(r,action('candleChange',{index:4,isLit:true,lifetime:10}),2000).state;
  r=transition(r,action('candleChange',{index:4,isLit:false}),7000).state;
  assert.equal(r.clocks[4].remaining,0.5);
  r=transition(r,action('candleChange',{index:4,isLit:true,lifetime:10}),8000).state;
  assert.equal(r.clocks[4].duration,5000);
  const restored=transition(JSON.parse(JSON.stringify(r)),join(guest,gt),14000);
  assert.equal(restored.state.clocks[4].remaining,0);
  assert.equal(restored.state.clocks[4].startedAt,null);
});

test('server rolls actual dice, moves preserve count, player cannot roll GM dice',()=>{
  let r=setup();
  const request=action('roll',{dicePool:'Player Dice',diceCount:10000000});
  let calls=0;
  r=transition(r,request,2000,()=>{calls++;return 6}).state;
  assert.equal(calls,10);
  r=transition(r,request,2001,()=>{calls++;return 1}).state;
  assert.equal(calls,10);
  r=transition(r,action('dieDragEnd',{dieId:1,prevDicePool:'Player Dice',newDicePool:'GM Dice'}),2002).state;
  assert.equal(r.dicePools['Player Dice'].length,9);
  assert.equal(r.dicePools['GM Dice'].length,1);
  assert.throws(()=>transition(r,action('roll',{dicePool:'GM Dice'},guest,gt)),{status:403});
});

test('two Vercel instances update one room atomically, no lost notes or duplicate seats',async()=>{
  const store=memoryStore();await execute(store,join());await execute(store,join(guest,gt));
  await Promise.all([
    execute(store,action('cardsSave',{revision:0,cards:[{id:'h',type:'Moment',content:'host note'}]})),
    execute(store,action('cardsSave',{revision:0,cards:[{id:'g',type:'Moment',content:'guest note'}]},guest,gt)),
    execute(store,action('candleChange',{index:1,isLit:true,lifetime:60})),
    execute(store,action('changeLock',{isLocked:true})),
  ]);
  const r=JSON.parse(await store.read(room));
  assert.equal(r.members.length,2);assert.equal(r.members[0].cards[0].content,'host note');assert.equal(r.members[1].cards[0].content,'guest note');
  assert.equal(r.areCardsLocked,true);assert.ok(r.clocks[1].startedAt);
});

test('real Redis REST + Lua CAS, independent clients and concurrent writes', {skip:!process.env.UPSTASH_REDIS_REST_URL},async()=>{
  const env={...process.env};
  const realRoom='qa-vercel-'+randomUUID();
  const req=p=>({...p,room:realRoom,payload:p.payload?{...p.payload,room:realRoom}:undefined});
  const a=redisStore(env),b=redisStore(env);
  await execute(a,req(join()));await execute(b,req(join(guest,gt)));
  await Promise.all([
    execute(a,req(action('cardsSave',{revision:0,cards:[{id:'h',type:'Moment',content:'cloud test host'}]}))),
    execute(b,req(action('cardsSave',{revision:0,cards:[{id:'g',type:'Moment',content:'cloud test guest'}]},guest,gt))),
    execute(a,req(action('candleChange',{index:5,isLit:true,lifetime:60}))),
  ]);
  const restored=await execute(redisStore(env),req(join()));
  assert.equal(restored.events.find(e=>e.name==='cardsSnapshot').data.cards[0].content,'cloud test host');
  assert.equal(restored.events.find(e=>e.name==='roomSnapshot').data.user.isGm,true);
  const raw=JSON.parse(await b.read(realRoom));assert.equal(raw.members[1].cards[0].content,'cloud test guest');
});
