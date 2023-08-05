const express = require("express");
const authService = require("../services/authService");
const {
  addAddress,
  deleteAddress,
  getListOfAddresses,
} = require("../services/addressService");

const router = express.Router();

router.use(authService.protect, authService.allowedTO("user"));

router.route("/").post(addAddress).get(getListOfAddresses);

router.route("/:addressId").delete(deleteAddress);

module.exports = router;
