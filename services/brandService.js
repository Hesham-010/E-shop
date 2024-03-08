const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

const factory = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/uploadImageMiddleware");
const Brand = require("../models/brandModel");

// Upload single image
exports.uploadBrandImage = uploadSingleImage("image");

// Image processing
exports.resizeImage = async (req, res, next) => {
  const filename = `brand-${uuidv4()}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(600, 600)
    .toFormat("jpeg")
    .jpeg({ quality: 95 })
    .toFile(`uploads/brands/${filename}`);

  // Save image into our db
  req.body.image = filename;

  next();
};

// @desc    Get list of brands
// @route   GET /api/brands
// @access  Public
exports.getBrands = factory.getAll(Brand);

// @desc    Get specific brand by id
// @route   GET /api/brands/:id
// @access  Public
exports.getBrand = factory.getOne(Brand);

// @desc    Create brand
// @route   POST  /api/brands
// @access  Private
exports.createBrand = factory.createOne(Brand);

// @desc    Update specific brand
// @route   PUT /api/brands/:id
// @access  Private
exports.updateBrand = factory.updateOne(Brand);

// @desc    Delete specific brand
// @route   DELETE /api/brands/:id
// @access  Private
exports.deleteBrand = factory.deleteOne(Brand);
