const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const paymentController = require("../controllers/payment.controller");
const { USER_ROLES } = require("../config/constants");

router.post("/:agreementId", protect, authorize(USER_ROLES.BUSINESS), paymentController.initPaymentConfirmation);
router.patch(
  "/:id/confirm",
  protect,
  authorize(USER_ROLES.STUDENT, USER_ROLES.BUSINESS),
  paymentController.confirmPayment
);

module.exports = router;
