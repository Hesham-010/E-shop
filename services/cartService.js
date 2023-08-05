const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const Coupon = require("../models/couponModel");

// calce totalCartPrice of cart
const calceTotalCartPrice = (cart) => {
  let totalPrice = 0;
  cart.cartItems.forEach((item) => {
    totalPrice += item.quantity * item.price;
  });
  cart.totalCartPrice = totalPrice;
  cart.totalPriceAfterDiscount = undefined;
  return totalPrice;
};

// @desc    Add Product to cart
// @route   POST /api/v1/cart
// @access  Private/User
exports.addProductToCart = asyncHandler(async (req, res, next) => {
  const { productId, color } = req.body;
  const product = await Product.findById(productId);
  // 1- Get cart for Logged user
  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    // create new cart
    cart = await Cart.create({
      user: req.user._id,
      cartItems: [{ product: productId, color: color, price: product.price }],
    });
  } else {
    //if product exist in cart, update product quantity
    const productIndex = cart.cartItems.findIndex(
      (item) =>
        item.product.toString() == productId && item.color == req.body.color
    );
    if (productIndex > -1) {
      cart.cartItems[productIndex].quantity += 1;
    } else {
      //if product not exist in cart, push product in cartItems
      cart.cartItems.push({
        product: productId,
        color: color,
        price: product.price,
      });
    }
  }

  calceTotalCartPrice(cart);

  await cart.save();
  res.status(200).json({
    numberofProducts: cart.cartItems.length,
    status: "Successfully",
    data: cart,
  });
});

// @desc    Get Products form cart
// @route   Get /api/v1/cart
// @access  Private/User
exports.getLoggedUserCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(
      new ApiError(`There is no cart for this user id : ${req.user._id}`)
    );
  }
  res
    .status(200)
    .json({ numberofProducts: cart.cartItems.length, data: cart.cartItems });
});

// @desc    Delete Specific Product form cart
// @route   DELETE   /api/v1/cart/:productId
// @access  Private/User
exports.removeProductFromCart = asyncHandler(async (req, res, next) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    {
      $pull: { cartItems: { _id: req.params.itemId } },
    },
    { new: true }
  );
  calceTotalCartPrice(cart);
  await cart.save();
  res
    .status(200)
    .json({ numberofProducts: cart.cartItems.length, data: cart.cartItems });
});

// @desc    Clear Products form cart for Logged user
// @route   DELETE   /api/v1/cart
// @access  Private/User
exports.clearCart = asyncHandler(async (req, res, next) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.status(200).send();
});

// @desc    Update Specific cart item quantity
// @route   PUT   /api/v1/cart
// @access  Private/User
exports.updateCartItemQuantity = asyncHandler(async (req, res, next) => {
  const quantity = req.body.quantity;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    return next(
      new ApiError(`There is no cart for this user id: ${req.user._id}`, 404)
    );
  }
  const itemIndex = cart.cartItems.findIndex(
    (item) => item._id == req.params.itemId
  );
  if (itemIndex > -1) {
    cart.cartItems[itemIndex].quantity = quantity;
  } else {
    return next(new ApiError(`There is no item for this id: ${itemId}`, 404));
  }
  calceTotalCartPrice(cart);
  await cart.save();
  res.status(200).json({ status: "Successfully", data: cart });
});

// @desc    Apply coupon on cart
// @route   PUT   /api/v1/cart/applyCoupon
// @access  Private/User
exports.applyCoupon = asyncHandler(async (req, res, next) => {
  // get coupon based coupon name
  const coupon = await Coupon.findOne({
    name: req.body.name,
    expire: { $gt: Date.now() },
  });
  if (!coupon) {
    return next(new ApiError("Coupon is Invalid or Expired", 404));
  }
  // get logged user cart
  const cart = await Cart.findOne({ user: req.user._id });
  const totalPrice = cart.totalCartPrice;
  // calculate price after discount
  const totalPriceAfterDiscount = (
    totalPrice -
    (totalPrice * coupon.discount) / 100
  ).toFixed(2);
  cart.totalPriceAfterDiscount = totalPriceAfterDiscount;
  await cart.save();
  res.status(200).json({ status: "Successfully", data: cart });
});
