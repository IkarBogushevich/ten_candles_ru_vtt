import { apiReply } from './apiReply'
type Listener = (data?: any) => void
type Credentials = {room:string;user:{id:string;name:string};resumeToken:string}

/** Same UI events as the local table, transported through stateless Vercel requests. */
export default class VercelTransport {
  connected = false
  private listeners = new Map<string,Set<Listener>>()
  private credentials?: Credentials
  private cursor = 0
  private active = false
  private epoch = 0
  private tail = Promise.resolve()
  private timer?: ReturnType<typeof setTimeout>
  private retry = 1500
  private lastError = ''

  on(name:string,listener:Listener){
    if(!this.listeners.has(name))this.listeners.set(name,new Set())
    this.listeners.get(name)!.add(listener)
    return this
  }
  off(name:string,listener?:Listener){if(listener)this.listeners.get(name)?.delete(listener);else this.listeners.delete(name);return this}
  removeAllListeners(name?:string){if(name)this.listeners.delete(name);else this.listeners.clear();return this}
  private deliver(name:string,data?:any){for(const fn of [...(this.listeners.get(name)||[])])fn(data)}
  connect(){
    if(this.connected)return this
    this.active=true;this.connected=true;this.cursor=0
    const epoch=++this.epoch
    queueMicrotask(()=>{if(this.epoch===epoch&&this.active)this.deliver('connect')})
    return this
  }
  disconnect(){this.active=false;this.connected=false;this.epoch++;clearTimeout(this.timer);this.credentials=undefined;return this}
  emit(name:string,payload:any){
    if(name==='userJoined'){
      this.credentials={room:payload.room,user:payload.user,resumeToken:payload.resumeToken}
      this.enqueue('join');return this
    }
    this.enqueue('action',{name,payload,id:crypto.randomUUID()})
    return this
  }
  private enqueue(kind:'join'|'poll'|'action',action:any={}){
    const epoch=this.epoch,credentials=this.credentials
    this.tail=this.tail.then(async()=>{
      if(!this.active||!this.connected||epoch!==this.epoch||!credentials)return
      try{
        const res=await fetch('/api/game',{
          method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',
          body:JSON.stringify({...credentials,kind,after:this.cursor,...action}),signal:AbortSignal.timeout(12000),
        })
        const reply=await apiReply(res)
        if(epoch!==this.epoch||!this.active)return
        if(!res.ok){
          const error=reply.error||'Сервер временно недоступен.'
          if(kind==='action'&&res.status<500){this.deliver('sessionError',{message:error});this.enqueue('join');return}
          throw new Error(error)
        }
        this.retry=1500;this.lastError='';this.cursor=reply.cursor
        for(const message of reply.events)this.deliver(message.name,message.data)
        if(kind==='join'||kind==='poll'){
          clearTimeout(this.timer)
          this.timer=setTimeout(()=>this.enqueue('poll'),document.hidden?10000:2000)
        }
      }catch(error){
        if(epoch!==this.epoch||!this.active)return
        this.connected=false;clearTimeout(this.timer)
        const message=error instanceof Error?error.message:'Сервер временно недоступен.'
        if(message!==this.lastError){this.lastError=message;this.deliver('sessionError',{message})}
        this.deliver('disconnect')
        this.timer=setTimeout(()=>{if(this.active)this.connect()},this.retry)
        this.retry=Math.min(this.retry*2,30000)
      }
    })
  }
}
