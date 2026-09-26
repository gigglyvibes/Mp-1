const mongoose = require("mongoose");

/**
 * Establishes connection to MongoDB using Mongoose.
 * Exits process on failure since the app cannot function without a DB connection.
 */
console.log("MONGO_URI loaded:", !!process.env.MONGO_URI);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== "production",
    });

    console.log(`[MongoDB] Connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error(`[MongoDB] Connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected");
    });
  } catch (error) {
    console.error(`[MongoDB] Failed to connect: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
