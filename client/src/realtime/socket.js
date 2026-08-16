import { io } from "socket.io-client";
import { getToken } from "../utils/auth";

let socket = null;

function socketUrl() {
  const explicit = process.env.REACT_APP_SOCKET_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const api = (
    process.env.REACT_APP_API_URL || "http://localhost:5000/api"
  ).replace(/\/$/, "");
  return api.replace(/\/api\/?$/, "") || "http://localhost:5000";
}

/**
 * Singleton Socket.io client — connects when token is present.
 */
export function getNotificationSocket() {
  const token = getToken();
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  if (socket?.connected && socket.auth?.token === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(socketUrl(), {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 8,
  });

  return socket;
}

export function disconnectNotificationSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
