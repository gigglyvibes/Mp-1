require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const { initSocket } = require("./sockets");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[Server] Geo Micro Job Platform API running on port ${PORT} (${process.env.NODE_ENV || "development"})`);
    console.log(`[Server] API docs available at http://localhost:${PORT}/api-docs`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
    httpServer.close(() => {
      console.log("[Server] HTTP server closed.");
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

process.on("unhandledRejection", (err) => {
  console.error("[Server] Unhandled Rejection:", err);
  process.exit(1);
});

startServer();
