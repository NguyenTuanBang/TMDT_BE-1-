import express from "express";  
import authController from "../controllers/authController.js";
import productController from "../controllers/product.Controller.js";
import e from "express";

const router = express.Router();

router.get('/', authController.protect, authController.restrictTo("admin", "seller"), productController.getAllAdmin);
router.patch("/change-product-status", authController.protect, authController.restrictTo("admin", "seller"), productController.changeProductStatus);

export default router;