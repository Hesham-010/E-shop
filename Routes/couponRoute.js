const express = require("express");

const authService = require("../services/authService");

const {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} = require("../services/couponService");

const router = express.Router();

router.use(authService.protect, authService.allowedTO("admin"));

router.route("/").get(getCoupons).post(createCoupon);

router.route("/:id").get(getCoupon).put(updateCoupon).delete(deleteCoupon);

module.exports = router;
