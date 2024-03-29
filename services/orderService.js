const stripe = require("stripe")(process.env.STRIPE_SECRET);
const asyncHandler = require("express-async-handler");

const factory = require("./handlersFactory");
const ApiError = require("../utils/apiError");
const Order = require("../models/orderModel");
const Cart = require("../models/cartModel");
const User = require("../models/userModel");
const Product = require("../models/productModel");

// @desc    Create Cash Order
// @route   POST /api/orders/cartId
// @access  Private/user
exports.createCashOrder = asyncHandler(async (req, res, next) => {
  const taxPrice = 0;
  const shippingPrice = 0;
  // 1- get cart based on cartId
  const cart = await Cart.findById(req.params.cartId);
  if (!cart) {
    return next(new ApiError(`There is no card for this id ${cartId}`, 404));
  }
  // 2- get order price depend on cart price (apply coupon or no)
  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;
  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;
  // 3- create order
  const order = await Order.create({
    user: req.user._id,
    cartItems: cart.cartItems,
    shippingAddress: req.body.shippingAddress,
    totalOrderPrice: totalOrderPrice,
  });
  // 4- after create order must be update product quantity and sold
  if (order) {
    bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: {
          _id: item.product,
        },
        update: {
          $inc: {
            quantity: -item.quantity,
            sold: +item.quantity,
          },
        },
      },
    }));
    await Product.bulkWrite(bulkOption, {});
    // 5- clear cart based on cartId
    await Cart.findByIdAndDelete(req.params.cartId);

    res.status(200).json({ status: "Success", data: order });
  }
});

exports.filterOrderForLoggedUser = asyncHandler(async (req, res, next) => {
  if (req.user.role == "user") req.filterObj = { user: req.user._id };
  next();
});

// @desc    Get All Order
// @route   GET /api/orders
// @access  Private/user
exports.getOrders = factory.getAll(Order);

// @desc    Get Specific Order for Logged user
// @route   GET /api/orders/orderId
// @access  Private/user
exports.getSpicificOrder = factory.getOne(Order);

// @desc    Update Order Paid
// @route   PUT /api/orders/orderId/pay
// @access  Private/admin
exports.updateOrderPaid = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    next(
      new ApiError(`There is no order for this id:${req.params.orderId}`, 404)
    );
  }
  order.isPaid = true;
  order.paidAt = Date.now();
  await order.save();
  res.status(200).json({ status: "Success" });
});

// @desc    Update Order Delivered
// @route   PUT /api/orders/orderId/deliver
// @access  Private/admin
exports.updateOrderDelivered = asyncHandler(async (req, res, next) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) {
    next(
      new ApiError(`There is no order for this id:${req.params.orderId}`, 404)
    );
  }
  order.isDelivered = true;
  order.deliveredAt = Date.now();
  await order.save();
  res.status(200).json({ status: "Success" });
});

// @desc    get checkout session from stripe
// @route   get /api/orders/checkout-sesion/cartId
// @access  Private/user
exports.checkoutSession = asyncHandler(async (req, res, next) => {
  const taxPrice = 0;
  const shippingPrice = 0;

  const cart = await Cart.findById(req.params.cartId);
  if (!cart) {
    return next(new ApiError(`There is no card for this id ${cartId}`, 404));
  }
  // 2- get order price depend on cart price (apply coupon or no)
  const cartPrice = cart.totalPriceAfterDiscount
    ? cart.totalPriceAfterDiscount
    : cart.totalCartPrice;
  const totalOrderPrice = cartPrice + taxPrice + shippingPrice;

  // 3- create stripe checkout session
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "egp",
          product_data: {
            name: "my product",
          },
          unit_amount: totalOrderPrice * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${req.protocol}://${req.get("host")}/orders`,
    cancel_url: `${req.protocol}://${req.get("host")}/cart`,
    customer_email: req.user.email,
    client_reference_id: req.params.cartId,
    metadata: req.body.shippingAddress,
  });

  // 4) send session to response
  res.status(200).json({ status: "success", session });
});

const creteCardOrder = asyncHandler(async (session) => {
  const cartId = session.client_reference_id;
  const shippingAddress = session.metadata;
  const orderPrice = session.amount_total / 100;

  const cart = await Cart.findById(cartId);
  const user = await User.findOne({ email: session.customer_email });

  // Create Cart
  const order = await Order.create({
    user: user._id,
    cartItems: cart.cartItems,
    shippingAddress: shippingAddress,
    totalOrderPrice: orderPrice,
    isPaid: true,
    paidAt: Date.now(),
    paymentMethodType: "card",
  });
  // after create order must be update product quantity and sold
  if (order) {
    bulkOption = cart.cartItems.map((item) => ({
      updateOne: {
        filter: {
          _id: item.product,
        },
        update: {
          $inc: {
            quantity: -item.quantity,
            sold: +item.quantity,
          },
        },
      },
    }));
    await Product.bulkWrite(bulkOption, {});
    // 5- clear cart based on cartId
    await Cart.findByIdAndDelete(cartId);
  }
});

exports.webhookCheckout = asyncHandler(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    // Create order
    creteCardOrder(event.data.object);
  }
  res.status(200).json({ status: "Success" });
});
