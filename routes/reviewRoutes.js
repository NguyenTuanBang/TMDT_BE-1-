// const express = require("express");
// const uploadReviews = require("../middlewares/uploadReviews");
// const authController = require("../controllers/authController");
// const reviewController = require("../controllers/reviewController");

import express from "express";
import uploadReviews from "../middlewares/uploadReviews.js";
import authController from "../controllers/authController.js";
import reviewController from "../controllers/reviewController.js";

const router = express.Router();

router.route("/:productId").get(reviewController.getReviewsByProduct);

router
  .route("/")
  .post(
    authController.protect,
    uploadReviews.array("images", 5),
    reviewController.createReview
  );

export default router;
