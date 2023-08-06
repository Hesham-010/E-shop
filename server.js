const cors = require("cors");
const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: "config.env" });
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const { webhookCheckout } = require("./services/orderService");
const dbConnection = require("./config/database");
const ApiError = require("./utils/apiError");
const globalError = require("./middlewares/errorMiddleware");
const { routes } = require("./Routes/index");

// database Connection
dbConnection();

// express app
const app = express();

// enable other domains to access your application
app.use(cors());
app.options("*", cors());

// compress All responses
app.use(compression());

//checkout webhook
app.post(
  "/webhook-checkout",
  express.raw({ type: "application/json" }),
  webhookCheckout
);

//middlwares
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "uploads")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message:
    "Too many requests from this IP, please try again after an 15 minutes",
});
// Apply the rate limiting middleware to all requests
app.use("/api", limiter);

//Mount Routes
routes(app);

app.all("*", (req, res, next) => {
  next(new ApiError(`can't find this route: ${req.originalUrl}`, 400));
});

//error handling middleware
app.use(globalError);

if ((process.env.NODE_ENV = "development")) {
  app.use(morgan("dev"));
  console.log(`Mode: ${process.env.NODE_ENV}....`);
}

const PORT = process.env.PORT;
const server = app.listen(PORT, () => {
  console.log(`App Running on port ${PORT}....`);
});

//Handle rejection Error Outside Express
process.on("unhandledRejection", (err) => {
  console.error(`UnhandledRejection Errors: ${err.name} | ${err.message}`);
  server.close(() => {
    console.log(`Shutting down...`);
    process.exit(1);
  });
});
