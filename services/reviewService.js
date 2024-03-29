const factory = require("./handlersFactory");
const Review = require("../models/reviewModel");

exports.setProductIdAndUserIdToBody = (req, res, next) => {
  // Nested route (Create)
  if (!req.body.product) req.body.product = req.params.productId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

exports.createFilterObj = (req, res, next) => {
  let filterObject = {};
  if (req.params.productId) filterObject = { product: req.params.productId };
  req.filterObj = filterObject;
  next();
};
// @desc    Get list of reviews
// @route   GET /api/reviews
// @access  Public
exports.getReviews = factory.getAll(Review);

// @desc    Get specific review by id
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = factory.getOne(Review);

// @desc    Create review
// @route   POST  /api/reviews
// @access  Private/protect/user
exports.createReview = factory.createOne(Review);

// @desc    Update specific review
// @route   PUT /api/reviews/:id
// @access  Private/protect/user
exports.updateReview = factory.updateOne(Review);

// @desc    Delete specific review
// @route   DELETE /api/reviews/:id
// @access  Private/protect/user-admin
exports.deleteReview = factory.deleteOne(Review);
