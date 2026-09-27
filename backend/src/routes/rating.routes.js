const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { authorize } = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { createRatingValidator } = require("../validators/rating.validator");
const ratingController = require("../controllers/rating.controller");
const { USER_ROLES } = require("../config/constants");

router.post(
  "/:applicationId",
  protect,
  authorize(USER_ROLES.BUSINESS),
  createRatingValidator,
  validate,
  ratingController.rateStudent
);

router.post(
  "/business/:applicationId",
  protect,
  authorize(USER_ROLES.STUDENT),
  createRatingValidator,
  validate,
  ratingController.rateBusiness
);

router.get(
  "/application/:applicationId",
  protect,
  ratingController.getApplicationRatings
);

router.get(
  "/student/:studentId",
  protect,
  ratingController.getStudentRatings
);

module.exports = router;
