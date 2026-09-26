const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { createJobValidator } = require("../validators/job.validator");
const jobController = require("../controllers/job.controller");
const { USER_ROLES } = require("../config/constants");

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job creation, discovery, and lifecycle management
 */

router.get("/", jobController.listJobs);
router.get("/nearby", jobController.nearbyJobs);
router.get("/business/my-jobs", protect, authorize(USER_ROLES.BUSINESS), jobController.myJobs);
router.get("/:id", jobController.getJobById);

router.post(
  "/",
  protect,
  authorize(USER_ROLES.BUSINESS),
  upload.array("images", 5),
  createJobValidator,
  validate,
  jobController.createJob
);

router.patch("/:id", protect, authorize(USER_ROLES.BUSINESS), jobController.updateJob);
router.patch("/:id/publish", protect, authorize(USER_ROLES.BUSINESS), jobController.publishJob);
router.patch("/:id/cancel", protect, authorize(USER_ROLES.BUSINESS), jobController.cancelJob);

module.exports = router;
