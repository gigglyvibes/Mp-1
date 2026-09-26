/**
 * Seeds the database with job categories.
 * Run with: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Category = require("../models/Category");
const categories = require("./categories");

(async () => {
  try {
    await connectDB();
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log(`[Seed] Inserted ${categories.length} categories`);
    process.exit(0);
  } catch (err) {
    console.error("[Seed] Failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
})();
