const asyncHandler = require("express-async-handler");

const User = require("../models/userModel");

// @desc    Add address to user addresses
// @route   POST  /api/addresses
// @access  Private/user
exports.addAddress = async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: { addresses: req.body },
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "Success",
    message: "this address added to your address list",
    data: user.addresses,
  });
};

// @desc    Delete address from user addresses
// @route   delete  /api/address/:id
// @access  Private/user
exports.deleteAddress = async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: { addresses: { _id: req.params.addressId } },
    },
    {
      new: true,
    }
  );
  res.status(200).json({
    status: "Success",
    message: "this address removed from your address list",
    data: user.addresses,
  });
};

// @desc    Get List of addresses
// @route   Get  /api/wishList
// @access  Private/user
exports.getListOfAddresses = async (req, res, next) => {
  const user = await User.findById(req.user._id);
  res.status(200).json({
    status: "Success",
    resulte: user.addresses.length,
    data: user.addresses,
  });
};
