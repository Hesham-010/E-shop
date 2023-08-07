const crypto = require("crypto");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const sanitiseUser = require("../utils/sanitiseUser");
const createToken = require("../utils/createToken");
const sendEmail = require("../utils/sendEmail");
const ApiError = require("../utils/apiError");
const User = require("../models/userModel");

//@desc      Signup
//@route     post   /api/v1/auth/signup
//@access    public
exports.signup = asyncHandler(async (req, res, next) => {
  //1- Create user
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  //2- generate token
  const token = createToken(user._id);

  res.status(201).json({ data: sanitiseUser(user), token });
});

//@desc      Login
//@route     post   /api/v1/auth/login
//@access    public
exports.login = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return next(new ApiError("Incorrect email or password", 401));
  }
  const token = createToken(user._id);

  res.status(200).json({ data: sanitiseUser(user), token });
});

exports.protect = asyncHandler(async (req, res, next) => {
  // 1- check if token exist
  let token;
  if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new ApiError(
        "You Are not login, please login to get access this route",
        401
      )
    );
  }

  // 2- verify token (no change happen , expired token)
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

  // 3- check if user exist
  const currentUser = await User.findById(decoded.userId);
  if (!currentUser) {
    return next(
      new ApiError(
        "The user that belong to this token does no longer exist",
        401
      )
    );
  }
  if (!currentUser.active) {
    return next(new ApiError("This Acount is not active", 401));
  }
  if (currentUser.passwordChangedAt) {
    // 4- check if user change his password after token created
    const passChangedTimeStamp = parseInt(
      currentUser.passwordChangedAt.getTime() / 1000,
      10
    );
    if (passChangedTimeStamp > decoded.iat) {
      return next(
        new ApiError(
          "User recently changed his password. please login again..",
          401
        )
      );
    }
  }
  req.user = currentUser;
  next();
});

//@desc      Authorization
exports.allowedTO = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ApiError("You are not allow to access this route", 403));
    }
    next();
  });

//@desc      forgot password
//@route     POST   /api/v1/auth/forgotPassword
//@access    public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1- get user by email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with this email ${req.body.email}`, 404)
    );
  }

  // 2- if user exist, generate hash reset random 6 degits and save it in db
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  user.passwordResetCode = hashedResetCode;
  user.passwordResetExpiration = Date.now() + 10 * (60 * 1000);
  user.passwordResetVerified = false;

  await user.save();

  // 3- send the reset code via email
  const message = `Hi ${user.name}, \n We received a request to reset the password on your E-commerce acount. \n ${resetCode} \n Enter this code to complete the reset.`;
  try {
    await sendEmail({
      email: user.email,
      subject: "your reset code valid for 10 min ",
      message: message,
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpiration = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    return next(new ApiError(`There is an error in sending email`, 500));
  }
  res
    .status(200)
    .json({ status: "Success", message: "Reset code send to email" });
});

//@desc      Verify Password Reset Code
//@route     POST   /api/v1/auth/verifyResetCode
//@access    public
exports.verifyPasswordResetCode = asyncHandler(async (req, res, next) => {
  // 1- Get user based on reset code
  const hashedResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpiration: { $gt: Date.now() },
  });
  if (!user) {
    return next(new ApiError("Reset Code Invalid"));
  }

  // 2- when rest code is valid
  user.passwordResetVerified = true;
  await user.save();
  res.status(200).json({ status: "Success" });
});

//@desc      Reset Password
//@route     POST   /api/v1/auth/resetPassword
//@access    public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // 1- get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new ApiError(`There is no user with this email ${req.body.email}`, 404)
    );
  }
  // 2- check if reset code verified or No
  if (!user.passwordResetVerified) {
    return next(new ApiError(`Rest code not verified`, 400));
  }
  user.password = req.body.newPassword;
  user.passwordResetCode = undefined;
  user.passwordResetExpiration = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  const token = createToken(user._id);
  res.status(200).json({ token });
});
