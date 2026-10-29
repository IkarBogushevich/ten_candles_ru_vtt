export default interface User {
  id: string
  name: string
  isGm: boolean
  room?: string
  connected?: boolean
}
