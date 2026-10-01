const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const paymentController = require("../controllers/payment.controller");
const { USER_ROLES } = require("../config/constants");

router.get("/agreement/:agreementId", protect, authorize(USER_ROLES.BUSINESS, USER_ROLES.STUDENT, USER_ROLES.ADMIN), paymentController.getPaymentConfirmation);
router.post("/:agreementId", protect, authorize(USER_ROLES.BUSINESS, USER_ROLES.STUDENT, USER_ROLES.ADMIN), paymentController.initPaymentConfirmation);
router.patch(
  "/:id/confirm",
  protect,
  authorize(USER_ROLES.STUDENT, USER_ROLES.BUSINESS),
  paymentController.confirmPayment
);
router.patch(
  "/:id/dispute",
  protect,
  authorize(USER_ROLES.STUDENT, USER_ROLES.BUSINESS),
  paymentController.disputePayment
);
router.get(
  "/admin/disputed",
  protect,
  authorize(USER_ROLES.ADMIN),
  paymentController.listDisputedPayments
);

module.exports = router;
