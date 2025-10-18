import Review from "../models/ReviewModel.js";
import catchAsync from "../utils/catchAsync.js";

export const createReview = catchAsync(async (req, res) => {
  const user = req.user.id;
  const { review, rating } = req.body;
  const imageUrls = req.files ? req.files.map((file) => file.path) : [];

  const newReview = await Review.create({
    review,
    rating,
    images: imageUrls,
    user,
  });

  res.status(201).json({
    status: "success",
    data: newReview,
  });
});

export const getReviews = catchAsync(async (req, res) => {
  const reviews = await Review.find()
    .populate("user", "username avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: reviews,
  });
});
