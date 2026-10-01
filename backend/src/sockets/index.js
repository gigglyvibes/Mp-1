const { Server } = require("socket.io");
const { verifyToken } = require("../utils/generateToken");
const User = require("../models/User");

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
      if (!token) {
        return next(new Error("Authentication token required for Socket.io"));
      }

      const decoded = verifyToken(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.id) {
        return next(new Error("Invalid socket authentication token"));
      }

      const user = await User.findById(decoded.id).select("_id role isSuspended");
      if (!user || user.isSuspended) {
        return next(new Error("User unauthorized or suspended"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Socket authentication failed: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();
    // Join personal user room for targeted notifications
    socket.join(`user:${userId}`);

    // If student, join student room
    if (socket.user.role === "student") {
      socket.join("role:student");
    }

    socket.on("disconnect", () => {
      socket.leave(`user:${userId}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

module.exports = { initSocket, getIO };
