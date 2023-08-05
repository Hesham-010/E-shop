const express = require("express");
const authService = require("../services/authService");
const {
  addProductToWishlist,
  deleteProductFromWishlist,
  getListOfProductsFromWishlist,
} = require("../services/wishListService");

const router = express.Router();

router.use(authService.protect, authService.allowedTO("user"));

router.route("/").post(addProductToWishlist).get(getListOfProductsFromWishlist);

router.route("/:productId").delete(deleteProductFromWishlist);

module.exports = router;
