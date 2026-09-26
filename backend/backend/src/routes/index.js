const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const studentRoutes = require("./student.routes");
const businessRoutes = require("./business.routes");
const jobRoutes = require("./job.routes");
const applicationRoutes = require("./application.routes");
const agreementRoutes = require("./agreement.routes");
const paymentRoutes = require("./payment.routes");
const ratingRoutes = require("./rating.routes");
const notificationRoutes = require("./notification.routes");
const adminRoutes = require("./admin.routes");
const categoryRoutes = require("./category.routes");
const contactRoutes = require("./contact.routes");

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/businesses", businessRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/agreements", agreementRoutes);
router.use("/payments", paymentRoutes);
router.use("/ratings", ratingRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);
router.use("/categories", categoryRoutes);
router.use("/contact", contactRoutes);

module.exports = router;
