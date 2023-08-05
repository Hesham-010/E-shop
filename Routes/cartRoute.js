const express = require("express");

const authService = require("../services/authService");

const {
  addProductToCart,
  getLoggedUserCart,
  removeProductFromCart,
  clearCart,
  updateCartItemQuantity,
  applyCoupon,
} = require("../services/cartService");

const router = express.Router();

router.use(authService.protect, authService.allowedTO("user"));

router
  .route("/")
  .get(getLoggedUserCart)
  .post(addProductToCart)
  .delete(clearCart);

router.route("/applyCoupon").put(applyCoupon);

router
  .route("/:itemId")
  .delete(removeProductFromCart)
  .put(updateCartItemQuantity);

module.exports = router;
