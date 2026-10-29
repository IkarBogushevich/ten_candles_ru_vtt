import { GameError, transition, validRoom, members } from './game.mjs';

const CAS=`if ARGV[1] == '0' then
 if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
else
 if redis.call('GET', KEYS[1]) ~= ARGV[2] then return 0 end
end
redis.call('SET', KEYS[1], ARGV[3])
return 1`;

export function redisStore(env=process.env, fetcher=fetch) {
  const url=(env.UPSTASH_REDIS_REST_URL||env.KV_REST_API_URL||'').replace(/\/+$/,'');
  const token=env.UPSTASH_REDIS_REST_TOKEN||env.KV_REST_API_TOKEN;
  if(!url||!token) throw new GameError(503,'Подключите Redis к проекту в Vercel Storage и выполните Redeploy.');
  async function command(args){
    const res=await fetcher(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(8000)});
    if(!res.ok) throw new GameError(503,'Хранилище комнаты временно недоступно. Сохранения в браузере остаются на месте.');
    const reply=await res.json();
    if(reply.error) throw new GameError(503,'Хранилище отклонило запрос. Проверьте подключение Redis в Vercel.');
    return reply.result;
  }
  const key=room=>`tencandles:room:v2:${room}`;
  return {
    async read(room){return command(['GET',key(room)]);},
    async commit(room,old,next){return Number(await command(['EVAL',CAS,1,key(room),old===null?'0':'1',old||'',next]))===1;},
  };
}
export async function execute(store,request,options={}) {
  if(!validRoom(request.room)) throw new GameError(400,'Некорректная ссылка комнаты.');
  for(let retry=0;retry<10;retry++){
    const old=await store.read(request.room),state=old===null?null:JSON.parse(old);
    const result=transition(state,request,options.now?.()??Date.now(),options.roll);
    if(!result.dirty||await store.commit(request.room,old,JSON.stringify(result.state))) return result.response;
    await new Promise(resolve=>setTimeout(resolve,5+Math.random()*20));
  }
  throw new GameError(409,'Комната обновляется другим участником. Повторите действие.');
}
export async function listMembers(store,room){
  if(!validRoom(room))throw new GameError(400,'Некорректная ссылка комнаты.');
  const raw=await store.read(room);
  return members(raw===null?null:JSON.parse(raw),Date.now());
}
