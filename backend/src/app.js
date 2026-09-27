const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("./middlewares/sanitize.middleware");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const { apiLimiter } = require("./middlewares/rateLimiter.middleware");

const app = express();

// ---------- Security & core middleware ----------
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(compression());
app.use(mongoSanitize());
app.use(xss());

if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use("/api/v1", apiLimiter);

// ---------- API Documentation ----------
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ---------- Health check ----------
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Geo Micro Job Platform API is running.", timestamp: new Date() });
});

// ---------- Routes ----------
app.use("/api/v1", routes);

// ---------- 404 + Error handling ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;
