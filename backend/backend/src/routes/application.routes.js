const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const applicationController = require("../controllers/application.controller");
const { USER_ROLES } = require("../config/constants");

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Job application flow between Students and Businesses
 */

router.post("/:jobId", protect, authorize(USER_ROLES.STUDENT), applicationController.applyToJob);
router.get("/job/:jobId", protect, authorize(USER_ROLES.BUSINESS), applicationController.getApplicantsForJob);
router.get("/my-applications", protect, authorize(USER_ROLES.STUDENT), applicationController.getMyApplications);
router.get("/completion-requests", protect, authorize(USER_ROLES.BUSINESS), applicationController.getCompletionRequests);
router.patch("/:id/respond", protect, authorize(USER_ROLES.BUSINESS), applicationController.respondToApplication);
router.patch("/:id/complete", protect, authorize(USER_ROLES.STUDENT), applicationController.requestWorkCompletion);
router.patch("/:id/approve-completion", protect, authorize(USER_ROLES.BUSINESS), applicationController.approveWorkCompletion);
router.patch("/:id/withdraw", protect, authorize(USER_ROLES.STUDENT), applicationController.withdrawApplication);

module.exports = router;
