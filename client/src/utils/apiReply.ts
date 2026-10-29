export async function apiReply(response: Response) {
  const type=response.headers.get('content-type')||''
  if(!type.includes('application/json')) {
    throw new Error('Игровой API не развёрнут. В Vercel выберите Root Directory «.» вместо «client» и выполните Redeploy.')
  }
  const text=await response.text()
  if(!text.trim())throw new Error(`Сервер вернул пустой ответ (HTTP ${response.status}). Проверьте Functions в Vercel.`)
  try{return JSON.parse(text)}catch{throw new Error('Сервер вернул некорректный ответ. Проверьте журнал Functions в Vercel.')}
}
