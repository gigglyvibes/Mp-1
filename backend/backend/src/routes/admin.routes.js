const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const adminController = require("../controllers/admin.controller");
const contactController = require("../controllers/contact.controller");
const { USER_ROLES } = require("../config/constants");

router.use(protect, authorize(USER_ROLES.ADMIN));

router.get("/dashboard", adminController.getDashboard);
router.get("/users", adminController.listUsers);
router.patch("/users/:id/verify", adminController.verifyDocuments);
router.patch("/users/:id/suspend", adminController.suspendUser);
router.patch("/users/:id/unsuspend", adminController.unsuspendUser);
router.get("/jobs", adminController.listAllJobs);
router.delete("/jobs/:id", adminController.removeJob);
router.get("/contact-messages", contactController.listContactMessages);
router.patch("/contact-messages/:id/read", contactController.markContactMessageRead);

module.exports = router;
