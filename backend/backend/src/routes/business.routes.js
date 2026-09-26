const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const businessController = require("../controllers/business.controller");
const { USER_ROLES } = require("../config/constants");

router.get("/profile", protect, authorize(USER_ROLES.BUSINESS), businessController.getProfile);
router.patch(
  "/profile",
  protect,
  authorize(USER_ROLES.BUSINESS),
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  businessController.updateProfile
);
router.get("/analytics", protect, authorize(USER_ROLES.BUSINESS), businessController.getAnalytics);
router.get("/:id", businessController.getBusinessById);

module.exports = router;
