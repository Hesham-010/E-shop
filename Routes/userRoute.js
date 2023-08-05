const express = require("express");

const authService = require("../services/authService");

const {
  getUserValidator,
  createUserValidator,
  updateUserValidator,
  deleteUserValidator,
  changeUserPasswordValidator,
  updateLoggedUserDataValidator,
} = require("../utils/validators/userValidator");

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadUserImage,
  resizeImage,
  changeUserPassword,
  getLoggedUserData,
  updateLoggedUserPassword,
  updateLoggedUserData,
  deleteLoggedUser,
} = require("../services/userService");
const { route } = require("./subCategoryRoute");

const router = express.Router();

router.use(authService.protect);

// Logged User
router.get("/getMe", getLoggedUserData, getUser);
router.put(
  "/UpdateMyPassword",
  changeUserPasswordValidator,
  updateLoggedUserPassword
);
router.put(
  "/UpdateMyData",
  updateLoggedUserDataValidator,
  updateLoggedUserData
);
router.delete("/deleteMy", deleteLoggedUser);

//Admin
router.use(authService.allowedTO("admin"));

router.put(
  "/changePassword/:id",
  changeUserPasswordValidator,
  changeUserPassword
);

router
  .route("/")
  .get(getUsers)
  .post(uploadUserImage, resizeImage, createUserValidator, createUser);

router
  .route("/:id")
  .get(getUserValidator, getUser)
  .put(uploadUserImage, resizeImage, updateUserValidator, updateUser)
  .delete(deleteUser, deleteUserValidator);

module.exports = router;
