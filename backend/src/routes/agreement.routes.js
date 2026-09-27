const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { signAgreementValidator } = require("../validators/agreement.validator");
const agreementController = require("../controllers/agreement.controller");
const { USER_ROLES } = require("../config/constants");

router.post("/:applicationId", protect, authorize(USER_ROLES.BUSINESS), agreementController.createAgreement);
router.get("/application/:applicationId", protect, agreementController.getAgreementByApplication);
router.get("/:id", protect, agreementController.getAgreement);
router.patch(
  "/:id/sign",
  protect,
  authorize(USER_ROLES.STUDENT, USER_ROLES.BUSINESS),
  signAgreementValidator,
  validate,
  agreementController.signAgreement
);

module.exports = router;
