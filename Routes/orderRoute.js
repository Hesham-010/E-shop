const express = require("express");

const authService = require("../services/authService");

const {
  createCashOrder,
  getOrders,
  filterOrderForLoggedUser,
  getSpicificOrder,
  updateOrderPaid,
  updateOrderDelivered,
  checkoutSession,
} = require("../services/orderService");

const router = express.Router();

router.use(authService.protect);

router.get(
  "/checkout-session/:cartId",
  authService.allowedTO("user"),
  checkoutSession
);

router.route("/:cartId").post(authService.allowedTO("user"), createCashOrder);

router
  .route("/")
  .get(
    authService.allowedTO("user", "admin"),
    filterOrderForLoggedUser,
    getOrders
  );

router.route("/:id").get(getSpicificOrder);

router
  .route("/:orderId/pay")
  .put(authService.allowedTO("admin"), updateOrderPaid);
router
  .route("/:orderId/deliver")
  .put(authService.allowedTO("admin"), updateOrderDelivered);

module.exports = router;
