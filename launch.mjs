import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT)||3020,local='http://127.0.0.1:'+port;
const internet=process.argv.includes('--internet'),cloudflare=process.argv.includes('--cloudflare'),noOpen=process.argv.includes('--no-open');
const children=[];let shutting=false,tunnel,lastURL='',verifiedURL='',checking=false,opened=false;
function open(url){if(noOpen)return;if(process.platform==='win32')spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{windowsHide:true,stdio:'ignore'}).unref();else console.log('Откройте в браузере: '+url);}
function stop(){if(shutting)return;shutting=true;for(const p of children)p.kill();setTimeout(()=>process.exit(),300).unref();}
for(const s of ['SIGINT','SIGTERM'])process.on(s,stop);
process.on('exit',()=>{for(const p of children)try{p.kill()}catch{}});
async function health(url=local){try{const r=await fetch(url+'/api/health',{signal:AbortSignal.timeout(5000)});const data=await r.json();return r.ok&&data.app==='ten-candles-original'&&data.version==='1.1.0';}catch{return false}}
async function verify(){
 if(!lastURL||lastURL===verifiedURL||checking||shutting)return;
 checking=true;const candidate=lastURL;
 if(await health(candidate)){
  verifiedURL=candidate;fs.mkdirSync(path.join(root,'data'),{recursive:true});fs.writeFileSync(path.join(root,'data','public-url.txt'),candidate+'\n');
  console.log('\nССЫЛКА ПРОВЕРЕНА — СТОЛ ДОСТУПЕН ЧЕРЕЗ ИНТЕРНЕТ:\n'+candidate+'\n\nОткройте её, создайте комнату и отправьте приглашение друзьям.\nСсылка также в data/public-url.txt. Вход и карты сохраняются: страницу можно обновлять. Не удаляйте данные сайта и папку data.\n');
  if(!opened){opened=true;open(candidate)}
 }
 checking=false;
}
console.log('\nДЕСЯТЬ СВЕЧЕЙ — общий игровой стол\n');
if(!await health()){
 const p=spawn(process.execPath,[path.join(root,'server','dist','index.js')],{cwd:root,env:{...process.env,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe']});children.push(p);
 p.stdout.on('data',b=>process.stdout.write(b));p.stderr.on('data',b=>process.stderr.write(b));
 p.on('error',e=>{console.error(e.message);stop()});p.on('exit',code=>{if(!shutting){console.error('Сервер остановлен, код '+code);stop()}});
 let ready=false;for(let i=0;i<30;i++){if(await health()){ready=true;break}await new Promise(r=>setTimeout(r,200))}
 if(!ready){console.error('Не удалось запустить сервер. Проверьте, свободен ли порт '+port);stop()}
}else console.log('Используем уже работающий сервер этого проекта.');
if(!shutting){
 console.log('На этом компьютере: http://localhost:'+port+'\nОставьте это окно открытым. Ctrl+C — остановить.\n');
 if(!internet)open('http://localhost:'+port);
 else{
  const exe=cloudflare?(process.platform==='win32'?path.join(root,'tools','cloudflared.exe'):'cloudflared'):(process.platform==='win32'?path.join(process.env.SystemRoot||'C:\\Windows','System32','OpenSSH','ssh.exe'):'ssh');
  const args=cloudflare?['tunnel','--url',local,'--protocol','http2','--no-autoupdate']:['-T','-o','BatchMode=yes','-o','IdentityFile=none','-o','IdentityAgent=none','-o','IdentitiesOnly=yes','-o','StrictHostKeyChecking=accept-new','-o','UserKnownHostsFile=tools/ssh_known_hosts','-o','ConnectTimeout=15','-o','ServerAliveInterval=30','-o','ServerAliveCountMax=3','-o','ExitOnForwardFailure=yes','-R','80:127.0.0.1:'+port,'nokey@localhost.run','--','--output','json'];
  console.log('Открываем '+(cloudflare?'Cloudflare':'localhost.run')+' туннель. Проверяем доступность ссылки…');
  function connect(){
   if(shutting)return;tunnel=spawn(exe,args,{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});children.push(tunnel);let buffer='';
   const read=b=>{const t=b.toString(),whole=buffer+t;buffer=whole.slice(-12000);fs.writeFileSync(path.join(root,'data','tunnel-last.log'),buffer);const matches=[...whole.matchAll(/(?:https:\/\/)?([a-z0-9-]{6,}\.(?:lhr\.life|localhost\.run|trycloudflare\.com))/g)];const found=matches.at(-1)?.[1];const url=found?'https://'+found:'';if(url&&url!==lastURL){lastURL=url;console.log('Адрес выдан. Проверяем ответ игрового сервера…');verify()}if(/\bERR\b|^ssh:|^Permission denied|^Connection .*closed|HOST IDENTIFICATION HAS CHANGED/im.test(t))process.stderr.write(t.slice(0,2000));};
   tunnel.stdout.on('data',read);tunnel.stderr.on('data',read);
   tunnel.on('error',e=>console.error('Не удалось открыть туннель: '+e.message+'\nЛокальный стол работает. Попробуйте другой СТАРТ-ИНТЕРНЕТ файл.'));
   tunnel.on('exit',()=>{if(!shutting){lastURL='';verifiedURL='';console.log('Туннель разорван. Игра сохранена. Повторяем подключение через 5 секунд…');setTimeout(connect,5000).unref()}});
  }
  connect();setInterval(verify,3000).unref();
  setTimeout(()=>{if(!verifiedURL&&!shutting)console.log('Публичная ссылка пока не подтверждена. Проверьте сеть/VPN или используйте резервный запуск. Локальная игра: http://localhost:'+port)},45000).unref();
 }
 setInterval(()=>{},60000);
}

