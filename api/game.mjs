import { redisStore, execute, listMembers } from '../lib/redis.mjs';
import { GameError } from '../lib/game.mjs';

export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options','nosniff');
  const send=(status,data)=>{res.statusCode=status;res.end(JSON.stringify(data));};
  try{
    const url=new URL(req.url,'http://local');
    if(req.method==='GET'&&!url.searchParams.has('room')){
      const configured=!!((process.env.UPSTASH_REDIS_REST_URL||process.env.KV_REST_API_URL)&&(process.env.UPSTASH_REDIS_REST_TOKEN||process.env.KV_REST_API_TOKEN));
      return send(configured?200:503,{app:'ten-candles-vercel',version:'1.2.0',configured});
    }
    const store=redisStore();
    if(req.method==='GET')return send(200,await listMembers(store,url.searchParams.get('room')));
    if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return send(405,{error:'Метод не поддерживается.'});}
    const origin=req.headers.origin;
    if(origin){const actual=new URL(origin);if(actual.host!==req.headers.host)throw new GameError(403,'Запрос должен прийти с адреса этого сайта.');}
    if(Number(req.headers['content-length'])>200000)throw new GameError(413,'Слишком длинная записка.');
    let body=req.body;
    if(body===undefined){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>200000)throw new GameError(413,'Слишком длинная записка.');}body=text;}
    if(typeof body==='string'||Buffer.isBuffer(body))body=JSON.parse(body.toString());
    if(!body||typeof body!=='object')throw new GameError(400,'Некорректный запрос.');
    return send(200,await execute(store,body));
  }catch(error){
    return send(error instanceof GameError?error.status:error instanceof SyntaxError?400:503,{error:error instanceof GameError?error.message:'Не удалось обработать запрос. Данные комнаты не удалены.'});
  }
}
