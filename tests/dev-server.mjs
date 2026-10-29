import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import handler from '../api/game.mjs';
if(process.env.TEN_CANDLES_QA_ENV)Object.assign(process.env,JSON.parse(fs.readFileSync(process.env.TEN_CANDLES_QA_ENV,'utf8')));
const root=fileURLToPath(new URL('../client/dist/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.ico':'image/x-icon','.ttf':'font/ttf','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://local');
  if(url.pathname==='/api/game')return handler(req,res);
  let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(file!==path.resolve(root)&&!file.startsWith(root)) {res.statusCode=403;return res.end();}
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT||3050),'127.0.0.1',()=>console.log('Vercel handler preview:',process.env.PORT||3050));
