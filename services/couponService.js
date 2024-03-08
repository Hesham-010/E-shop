const asyncHandler = require("express-async-handler");

const factory = require("./handlersFactory");
const Coupon = require("../models/couponModel");

// @desc    Get list of coupons
// @route   GET /api/coupons
// @access  Private/Admin
exports.getCoupons = factory.getAll(Coupon);

// @desc    Get specific coupon by id
// @route   GET /api/coupons/:id
// @access  Private/Admin
exports.getCoupon = factory.getOne(Coupon);

// @desc    Create coupon
// @route   POST  /api/coupons
// @access  Private/Admin
exports.createCoupon = factory.createOne(Coupon);

// @desc    Update specific coupon
// @route   PUT /api/coupons/:id
// @access  Private/Admin
exports.updateCoupon = factory.updateOne(Coupon);

// @desc    Delete specific coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
exports.deleteCoupon = factory.deleteOne(Coupon);
