const { Server } = require("socket.io");
const { verifyToken } = require("../utils/generateToken");
const User = require("../models/User");

let io = null;

/**
 * Maps a userId to their connected socket ids (a user may have multiple
 * open tabs/devices). Used to target real-time notification delivery.
 */
const userSocketMap = new Map();

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
    },
  });

  // Authenticate socket connections via JWT passed in the handshake.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication token missing"));
      const decoded = verifyToken(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("isActive isSuspended");
      if (!user) return next(new Error("User no longer exists"));
      if (user.isSuspended || !user.isActive) return next(new Error("Account is inactive"));
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket;
    if (!userSocketMap.has(userId)) userSocketMap.set(userId, new Set());
    userSocketMap.get(userId).add(socket.id);

    socket.join(`user:${userId}`);
    console.log(`[Socket.io] User ${userId} connected (${socket.id})`);

    socket.on("disconnect", () => {
      userSocketMap.get(userId)?.delete(socket.id);
      if (userSocketMap.get(userId)?.size === 0) userSocketMap.delete(userId);
      console.log(`[Socket.io] User ${userId} disconnected (${socket.id})`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error("Socket.io has not been initialized.");
  return io;
};

/**
 * Emits a notification event to every socket belonging to a specific user.
 */
const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

module.exports = { initSocket, getIO, emitToUser };
