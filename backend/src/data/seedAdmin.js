/**
 * Seeds the permanent Admin user into MongoDB.
 * Run with: node backend/src/data/seedAdmin.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const seedAdminUser = async () => {
  try {
    await connectDB();
    const adminEmail = "admin@nearpin.com";
    const existing = await User.findOne({ email: adminEmail });

    if (existing) {
      console.log(`[Admin Seed] Admin user (${adminEmail}) already exists.`);
      process.exit(0);
    }

    await User.create({
      name: "NearPin Administrator",
      email: adminEmail,
      phone: "9876543210",
      password: "Admin@NearPin2026!",
      role: "admin",
      isEmailVerified: true,
      isPhoneVerified: true,
      verificationStatus: "verified",
      permissions: ["all"],
    });

    console.log(`[Admin Seed] Successfully created permanent Admin (${adminEmail}).`);
    process.exit(0);
  } catch (err) {
    console.error("[Admin Seed] Error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seedAdminUser();
