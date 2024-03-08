const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

// @desc    Add product to wishlist
// @route   POST  /api/wishList
// @access  Private/user
exports.addProductToWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { wishList: req.body.productId },
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "Success",
    message: "this product added to your wishlist",
    data: user.wishList,
  });
});

// @desc    Delete product from wishlist
// @route   delete  /api/wishList/:id
// @access  Private/user
exports.deleteProductFromWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { wishList: req.params.productId },
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "Success",
    message: "this product removed from your wishlist",
    data: user.wishList,
  });
});

// @desc    Get List of products from wishlist
// @route   Get  /api/wishList
// @access  Private/user
exports.getListOfProductsFromWishlist = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("wishList");
  res.status(200).json({
    status: "Success",
    resulte: user.wishList.length,
    data: user.wishList,
  });
});
