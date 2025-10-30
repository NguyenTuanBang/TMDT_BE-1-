// const Review = require("../models/ReviewModel");
// const catchAsync = require("../utils/catchAsync");
// const ProductModel = require("../models/ProductModel");

import Review from "../models/ReviewModel.js";
import catchAsync from "../utils/catchAsync.js";
import ProductModel from "../models/ProductModel.js";

const createReview = catchAsync(async (req, res) => {
  const user = req.user.id;
  const { review, rating, productId } = req.body;
  const imageUrls = req.files ? req.files.map((file) => file.path) : [];

  const newReview = await Review.create({
    review,
    rating,
    images: imageUrls,
    user,
    product: productId,
  });

  const product = await ProductModel.findById(productId);
  if (product) {
    const reviews = await Review.find({ product: productId });
    const totalRating = reviews.length;
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalRating;

    console.log(totalRating);
    console.log(averageRating);

    product.countRating = totalRating;
    product.rating = averageRating;
    await product.save();
  }

  res.status(201).json({
    status: "success",
    data: newReview,
  });
});

const getReviewsByProduct = catchAsync(async (req, res) => {
  const { productId } = req.params;
  if (!productId) {
    return res.status(400).json({
      status: "fail",
      message: "Product ID is required",
    });
  }

  const reviews = await Review.find({ product: productId })
    .populate("user", "username avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: reviews,
  });
});

const ReviewController = {
  createReview,
  getReviewsByProduct,
};

export default ReviewController;