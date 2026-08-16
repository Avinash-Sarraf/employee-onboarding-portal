const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "employee-onboarding-secret";

let io = null;

function userRoom(userId) {
  return `user:${String(userId)}`;
}

function pushUserEvent(userId, eventName, payload) {
  if (!io || !userId || !eventName) return;
  io.to(userRoom(userId)).emit(eventName, payload);
}

function pushNotification(userId, payload) {
  pushUserEvent(userId, "notification:new", payload);
}

function pushChatMessage(userId, payload) {
  pushUserEvent(userId, "chat:message", payload);
}

function initRealtime(httpServer) {
  const { Server } = require("socket.io");

  const origin =
    process.env.CLIENT_ORIGIN ||
    process.env.CORS_ORIGIN ||
    "http://localhost:3000";

  io = new Server(httpServer, {
    cors: {
      origin: [origin, "http://localhost:3000", "http://127.0.0.1:3000"],
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const id = decoded.id != null ? String(decoded.id) : null;
      const role =
        decoded.role === "hr" || decoded.role === "employee"
          ? decoded.role
          : null;
      if (!id || !role) {
        return next(new Error("Invalid token"));
      }
      socket.userId = id;
      socket.userRole = role;
      socket.join(userRoom(id));
      next();
    } catch {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.emit("connected", { userId: socket.userId });
  });

  return io;
}

module.exports = { initRealtime, pushNotification, pushChatMessage };
