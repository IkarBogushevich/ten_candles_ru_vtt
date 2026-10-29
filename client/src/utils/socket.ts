import { io } from "socket.io-client"

export const SERVER_URL = (import.meta.env.VITE_SERVER_URL || window.location.origin).replace(/\/+$/, "")
const socket = io(SERVER_URL, { autoConnect: false })

export default socket
