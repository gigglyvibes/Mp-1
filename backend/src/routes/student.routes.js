const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const studentController = require("../controllers/student.controller");
const { USER_ROLES } = require("../config/constants");

router.get("/profile", protect, authorize(USER_ROLES.STUDENT), studentController.getProfile);
router.patch(
  "/profile",
  protect,
  authorize(USER_ROLES.STUDENT),
  upload.fields([{ name: "profilePicture", maxCount: 1 }]),
  studentController.updateProfile
);
router.get("/:id", studentController.getStudentById);

module.exports = router;
