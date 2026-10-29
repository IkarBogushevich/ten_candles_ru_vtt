import VercelTransport from './vercelTransport'

export const SERVER_URL = window.location.origin
const socket = new VercelTransport()

export default socket
